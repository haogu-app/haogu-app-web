import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RawLineSync } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(rawTime: unknown, onlyTime = false): string {
  if (rawTime === null || rawTime === undefined || rawTime === '') return '無';

  const value = String(rawTime);
  let date: Date | null = null;

  if (/^\d+$/.test(value)) {
    const d = new Date(Number(value));
    if (!isNaN(d.getTime())) date = d;
  } else {
    const d = new Date(value);
    if (!isNaN(d.getTime())) date = d;
  }

  if (date) {
    try {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      if (onlyTime) return `${hours}:${minutes}`;

      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) return `今天 ${hours}:${minutes}`;

      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}/${day} ${hours}:${minutes}`;
    } catch (_) {
      // fallback below
    }
  }

  return value;
}

export function cleanDisplayMessage(text: unknown): string {
  return String(text || '')
    .replace(/#好顧/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Care summary classification ─────────────────────────────────────────────

const CARE_SUBJECTS = ['阿嬤', '阿公', '爸爸', '媽媽'] as const;

/** Detect the care subject from a record summary string. */
export function detectSubject(text: string): string {
  return CARE_SUBJECTS.find((s) => text.includes(s)) ?? '家人';
}

const CARE_CATEGORIES: { name: string; keywords: string[] }[] = [
  { name: '用藥', keywords: ['藥', '服藥', '吃藥', '用藥', '血壓藥', '胃藥'] },
  { name: '量測', keywords: ['血壓', '血糖', '體溫', '量測'] },
  { name: '飲食', keywords: ['吃飯', '喝水', '飲食', '稀飯', '便當', '食慾'] },
  { name: '就醫', keywords: ['回診', '醫院', '診所', '看醫生', '掛號'] },
  { name: '清潔', keywords: ['洗澡', '洗頭', '換衣', '清潔'] },
  { name: '狀態', keywords: ['睡', '精神', '情緒', '疼痛', '不舒服'] },
];

/** Detect the care category from a record summary string. */
export function detectCategory(text: string): string {
  return CARE_CATEGORIES.find(({ keywords }) => keywords.some((k) => text.includes(k)))?.name ?? '其他';
}

/**
 * Extract an event time (HH:MM) from Chinese care record text.
 * Handles period prefixes: 早上/上午 (am), 下午/晚上/夜裡 (pm), 中午 (noon).
 * Returns null when no time pattern is found.
 *
 * Examples:
 *   "晚上17點吃胃藥"  → "17:00"
 *   "晚上9點"         → "21:00"
 *   "下午3點30分"     → "15:30"
 *   "早上8點"         → "08:00"
 */
export function extractEventTime(text: string): string | null {
  const m = text.match(
    /(早上|上午|清晨|凌晨|中午|下午|晚上|夜裡)?\s*(\d+)\s*[點時](?:\s*(\d+)\s*分?)?/,
  );
  if (!m) return null;
  const [, period = '', hourStr, minStr] = m;
  let h = parseInt(hourStr, 10);
  const min = minStr ? parseInt(minStr, 10) : 0;
  // Convert to 24-hour: pm periods add 12 only when hour < 12
  if (['下午', '晚上', '夜裡', '中午'].includes(period) && h < 12) h += 12;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/**
 * Strip subject name, time expressions, and leading action verbs to produce a
 * short display label. Falls back to the original text if the result is too short.
 */
export function cleanSummaryText(text: string, subject: string): string {
  let t = text;
  if (subject !== '家人') t = t.replaceAll(subject, '');
  // Remove time patterns like 晚上17點, 早上8點, 下午3:30
  t = t.replace(/(?:早上|下午|晚上|凌晨|上午)\s*\d+\s*(?:點|時)(?:\d+分?)?/g, '');
  t = t.replace(/\d+\s*(?:點|時)(?:\d+分?)?/g, '');
  // Remove common leading action verbs before medicine/food names
  t = t.replace(/^(?:服用|吃了|喝了|吃|喝)\s*/g, '');
  // Clean stray punctuation
  t = t.replace(/^\s*[，。、：:]/g, '').trim();
  return t.length >= 2 ? t : text;
}

// ─────────────────────────────────────────────────────────────────────────────

export function getRecordSummary(sync: RawLineSync): string {
  if (!sync) return '';
  if (sync.recordSummary) return cleanDisplayMessage(sync.recordSummary);

  const rawResult = sync['AI整理結果'] || '';
  const resultStr = typeof rawResult === 'string' ? rawResult : String(rawResult);
  const originalMsg = String(sync.displayMessage || sync.originalMessage || sync['原始訊息'] || '');

  if (!resultStr) return cleanDisplayMessage(originalMsg);

  try {
    const parsed = JSON.parse(resultStr);
    if (parsed && typeof parsed === 'object') {
      return cleanDisplayMessage(parsed.record_summary || parsed.summary || parsed.result || originalMsg);
    }
  } catch (_) {
    // not valid JSON
  }

  if (resultStr.includes('"record_summary":')) {
    const match = resultStr.match(/"record_summary"\s*:\s*"([^"]+)"/);
    if (match?.[1]) return cleanDisplayMessage(match[1]);
  }

  return cleanDisplayMessage(resultStr || originalMsg);
}
