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
