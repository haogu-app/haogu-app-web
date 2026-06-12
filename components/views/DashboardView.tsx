'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Share2, Check } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { EditRecordModal } from '@/components/EditRecordModal';
import { Header } from '@/components/Header';
import { formatTime, cleanDisplayMessage, detectSubject, cleanSummaryText, extractEventTime, detectCategory, cn } from '@/lib/utils';
import type { RawLineSync, View } from '@/lib/types';

function categoryIcon(raw: string): string {
  const cat = detectCategory(raw);
  if (cat === '用藥') return '💊';
  if (cat === '量測') return '🩺';
  if (cat === '飲食') return '🍽️';
  return '📝';
}

function getMissingLabels(sync: RawLineSync): string[] {
  const src = sync.originalMessage || sync['原始訊息'] || sync.displayMessage || '';
  const missing: string[] = [];
  if (!extractEventTime(src)) missing.push('缺少時間');
  if (detectSubject(src) === '家人') missing.push('缺對象');
  if (detectCategory(src) === '其他') missing.push('類別不明');
  return missing.length > 0 ? missing : ['資訊不完整'];
}

interface DashboardViewProps {
  setView: (v: View) => void;
  lineSyncs: RawLineSync[];
  confirmedRecords: RawLineSync[];
  onQuickRecord: () => void;
  onRecordDeleted: (dbId: string) => void;
  onRecordSaved: (dbId: string, summary: string) => void;
  careTargetName: string;
  isLoading: boolean;
  onOpenLineSync: () => void;
}

export function DashboardView({ setView, lineSyncs, confirmedRecords, onQuickRecord, onRecordDeleted, onRecordSaved, careTargetName, isLoading, onOpenLineSync }: DashboardViewProps) {
  const [shareCopied, setShareCopied] = useState(false);
  const [shareToast, setShareToast] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [editRecord, setEditRecord] = useState<RawLineSync | null>(null);
  // Gate all conditional content behind this flag.
  // It starts true and only flips false AFTER the render where isLoading becomes false,
  // guaranteeing data is populated before any empty-state or onboarding logic runs.
  const [isHomeDataLoading, setIsHomeDataLoading] = useState(true);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!isLoading) setIsHomeDataLoading(false);
  }, [isLoading]);

  const now = new Date();
  // Shift both sides to UTC+8 so date boundaries match Taiwan calendar.
  const twNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);

  // Make sends received_at as a raw Unix timestamp that PostgreSQL misinterprets,
  // landing in 1970 (too old) or year 58415 (too far future). Fall back to
  // created_at when received_at is outside the plausible range 2020–2100.
  function effectiveAt(r: RawLineSync): string {
    const t = r.receivedAt || r['收到時間'] || '';
    if (t) {
      const y = new Date(t).getFullYear();
      if (y >= 2020 && y <= 2100) return t;
    }
    return r._createdAt || t;
  }

  const todayRecords = confirmedRecords
    .filter((r) => {
      const t = effectiveAt(r);
      if (!t) return false;
      const twD = new Date(new Date(t).getTime() + 8 * 60 * 60 * 1000);
      return (
        twD.getUTCFullYear() === twNow.getUTCFullYear() &&
        twD.getUTCMonth() === twNow.getUTCMonth() &&
        twD.getUTCDate() === twNow.getUTCDate()
      );
    })
    .sort((a, b) => {
      const key = (r: RawLineSync) => {
        const src = r.originalMessage || r['原始訊息'] || r.displayMessage || r.recordSummary || '';
        return extractEventTime(src) ?? formatTime(effectiveAt(r), true);
      };
      return key(b).localeCompare(key(a));
    });

  const CATEGORY_PREFIXES = ['用藥', '量測', '飲食', '就醫', '清潔', '狀態', '其他'];
  const stripCategoryPrefix = (t: string) =>
    CATEGORY_PREFIXES.reduce((s, c) => s.replace(new RegExp(`^${c}\\s*`), ''), t).trim();

  type SummaryItem = { time: string; text: string; icon: string; record: RawLineSync };
  const allItems: SummaryItem[] = todayRecords
    .map((r) => {
      const raw = r.recordSummary || r['AI整理結果'] || r.displayMessage || '';
      const subject = detectSubject(raw);
      const text = stripCategoryPrefix(cleanSummaryText(raw, subject));
      const eventSrc = r.originalMessage || r['原始訊息'] || r.displayMessage || r.recordSummary || '';
      const time = extractEventTime(eventSrc) ?? formatTime(effectiveAt(r), true);
      const icon = categoryIcon(raw);
      return { time, text, icon, record: r };
    })
    .filter((item) => item.text.length >= 2);

  // Index of the most recently *confirmed* record (by _confirmedAt, falling back to _createdAt)
  const newestIdx = allItems.length === 0 ? -1 : allItems.reduce((best, item, idx) => {
    const getTs = (r: RawLineSync) => r._confirmedAt ?? r._createdAt ?? r.receivedAt ?? '';
    return getTs(item.record) > getTs(allItems[best].record) ? idx : best;
  }, 0);

  const buildShareText = (): string => {
    const url = 'https://haogu-app-web.vercel.app';
    if (allItems.length === 0) return `今日尚無已確認照顧紀錄。\n\n查看好顧：\n${url}`;
    const lines: string[] = ['【好顧】今日照顧摘要', ''];
    for (const { time, text } of allItems) lines.push(`${time} ${text}`);
    lines.push('', '查看好顧：', url);
    return lines.join('\n');
  };

  const handleShareConfirmed = async () => {
    if (allItems.length === 0) {
      setShareToast('目前尚無今日照顧紀錄');
      setTimeout(() => setShareToast(''), 2500);
      return;
    }
    const text = buildShareText();
    if (isMobile) {
      window.open(`https://line.me/R/share?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    }
  };

  const todayDateStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div className="space-y-4 pb-20">
      <Header title="好顧" showLogo />

      {/* Tagline */}
      <div className="px-6 -mt-2 text-center">
        <p className="text-[16px] text-slate-500 leading-relaxed">
          開頭輸入 <span className="font-bold text-slate-700">好顧</span> LINE 幫你整理照顧紀錄
        </p>
      </div>

      {/* Today Summary */}
      <div className="px-6">
        <div className="bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl p-6 text-white shadow-lg shadow-primary-200">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-[28px] font-bold leading-tight">今天照顧摘要</h2>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[14px]">
              {todayDateStr}
            </div>
          </div>

          <div className="space-y-1.5 max-h-[280px] overflow-y-auto no-scrollbar">
            {allItems.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-[17px] text-primary-100/80 font-medium">還沒有今日紀錄</p>
              </div>
            ) : (
              allItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setEditRecord(item.record)}
                  className={cn(
                    'w-full flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2 text-left hover:bg-white/20 active:scale-[0.99] transition-all',
                    i === newestIdx && 'border-2 border-accent-500',
                  )}
                >
                  <span className="text-[14px] font-mono tabular-nums text-primary-100/80 shrink-0 w-12">
                    {item.time}
                  </span>
                  <span className="text-[16px] font-bold text-white flex-1">{item.text}</span>
                  {i === newestIdx && (
                    <span className="text-[11px] font-bold bg-accent-100 text-slate-700 px-2 py-0.5 rounded-full leading-none shrink-0">
                      最新
                    </span>
                  )}
                  <span className="text-base shrink-0">{item.icon}</span>
                </button>
              ))
            )}
          </div>

          {allItems.length > 0 && (shareToast ? (
            <div className="mt-4 py-3 rounded-xl text-center text-[16px] font-medium text-white/70 bg-white/10 border border-white/20">
              {shareToast}
            </div>
          ) : (
            <button
              onClick={handleShareConfirmed}
              className="w-full mt-4 bg-white/20 backdrop-blur-sm border border-white/30 py-3 rounded-xl flex items-center justify-center gap-2 text-white text-[16px] font-bold hover:bg-white/30 active:scale-95 transition-all"
            >
              {shareCopied ? (
                <><Check size={16} />已複製照顧摘要，請貼到 LINE 傳給家人</>
              ) : (
                <><Share2 size={16} />分享今天摘要給家人</>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Onboarding — show until the family has at least two confirmed records */}
      {!isHomeDataLoading && confirmedRecords.length < 2 && (
        <div className="px-6">
          <div className="bg-white border border-green-100 rounded-2xl p-5 shadow-sm space-y-3">
            <p className="font-bold text-slate-700 text-[16px]">開始使用好顧</p>
            <ol className="space-y-2">
              {['加入好顧 LINE', '傳送一筆照顧紀錄', '回來看今天摘要'].map((step, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[14px] text-slate-600">
                  <span className="bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <a
              href="https://lin.ee/N4yUobv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 text-white rounded-xl py-3 text-[16px] font-bold active:scale-[0.98] transition-transform"
            >
              <MessageCircle size={16} />
              加入好顧 LINE
            </a>
          </div>
        </div>
      )}

      {/* Pending items card — only shown when there are lineSyncs to handle */}
      {!isHomeDataLoading && lineSyncs.length > 0 && (
        <div className="px-6">
          <div className="bg-white border border-amber-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Header — clickable, opens line sync */}
            <button
              onClick={onOpenLineSync}
              className="w-full p-4 flex items-center gap-4 text-left hover:bg-amber-50/50 active:bg-amber-50 transition-colors cursor-pointer"
            >
              <div className="bg-green-100 p-3 rounded-xl flex items-center justify-center shrink-0">
                <svg width={24} height={24} viewBox="0 0 24 24" fill="#16a34a" aria-label="LINE">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-700 text-[20px]">待處理事項</h3>
                  <span className="bg-red-500 text-white text-[12px] px-1.5 py-0.5 rounded-full font-bold shrink-0">
                    {lineSyncs.length} 筆需補充
                  </span>
                </div>
                <p className="text-[15px] text-slate-400 mt-0.5">補充 LINE 紀錄缺少的資訊</p>
              </div>
            </button>

            <div className="border-t border-slate-50 px-4 pb-3 pt-2 space-y-1.5">
              {lineSyncs.slice(0, 5).map((sync, index) => {
                const displayTxt =
                  sync.displayMessage || cleanDisplayMessage(sync.originalMessage || sync['原始訊息']);
                const missing = getMissingLabels(sync);
                return (
                  <button
                    key={index}
                    onClick={onOpenLineSync}
                    className="w-full flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 min-h-[48px] cursor-pointer text-left hover:bg-slate-100 active:scale-[0.99] transition-all"
                  >
                    <p className="text-[15px] text-slate-600 flex-1 truncate">{displayTxt}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      {missing.slice(0, 2).map((m) => (
                        <span key={m} className="text-[13px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          {m}
                        </span>
                      ))}
                    </div>
                    <span className="shrink-0 px-3 py-2 rounded-lg bg-primary-500 text-white text-[15px] font-bold">
                      編輯
                    </span>
                  </button>
                );
              })}
              {lineSyncs.length > 5 && (
                <button
                  onClick={onOpenLineSync}
                  className="w-full py-2 text-[14px] text-slate-400 text-center hover:text-slate-600 transition-colors"
                >
                  還有 {lineSyncs.length - 5} 筆… 點此查看全部
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {editRecord && (
          <EditRecordModal
            record={editRecord}
            onClose={() => setEditRecord(null)}
            onDeleted={(dbId) => { onRecordDeleted(dbId); setEditRecord(null); }}
            onSaved={(dbId, summary) => { onRecordSaved(dbId, summary); setEditRecord(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
