'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Share2, ChevronRight, Check, ChevronDown } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { EditRecordModal } from '@/components/EditRecordModal';
import { Header } from '@/components/Header';
import { formatTime, cleanDisplayMessage, detectSubject, cleanSummaryText, extractEventTime, detectCategory } from '@/lib/utils';
import type { RawLineSync, View } from '@/lib/types';

function categoryIcon(raw: string): string {
  const cat = detectCategory(raw);
  if (cat === '用藥') return '💊';
  if (cat === '量測') return '🩺';
  if (cat === '飲食') return '🍽️';
  return '📝';
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
  const [lineCardOpen, setLineCardOpen] = useState(false);
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

  const todayRecords = confirmedRecords
    .filter((r) => {
      const d = new Date(r.receivedAt || r['收到時間'] || '');
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    })
    .sort((a, b) => {
      const key = (r: RawLineSync) => {
        const src = r.originalMessage || r['原始訊息'] || r.displayMessage || r.recordSummary || '';
        return extractEventTime(src) ?? formatTime(r.receivedAt || r['收到時間'] || '', true);
      };
      return key(b).localeCompare(key(a));
    });

  type SummaryItem = { time: string; text: string; icon: string; record: RawLineSync };
  const allItems: SummaryItem[] = todayRecords
    .map((r) => {
      const raw = r.recordSummary || r['AI整理結果'] || r.displayMessage || '';
      const subject = detectSubject(raw);
      const text = cleanSummaryText(raw, subject);
      const timeSource = r.originalMessage || r['原始訊息'] || r.displayMessage || raw;
      const time = extractEventTime(timeSource) ?? formatTime(r.receivedAt || r['收到時間'] || '', true);
      const icon = categoryIcon(raw);
      return { time, text, icon, record: r };
    })
    .filter((item) => item.text.length >= 2);

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
      <div className="px-6 -mt-1">
        <p className="text-sm text-slate-500 text-center leading-relaxed">
          LINE 記錄長輩近況，AI 整理給家人看
        </p>
      </div>

      {/* Today Summary — first visible block */}
      <div className="px-6">
        <div className="bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl p-6 text-white shadow-lg shadow-primary-200">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-2xl font-bold">今天照顧摘要</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px]">
              {todayDateStr}
            </div>
          </div>

          <div className="space-y-1.5 max-h-[280px] overflow-y-auto no-scrollbar">
            {allItems.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-primary-100/80 font-medium">還沒有今日紀錄</p>
              </div>
            ) : (
              allItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setEditRecord(item.record)}
                  className="w-full flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2 text-left hover:bg-white/20 active:scale-[0.99] transition-all"
                >
                  <span className="text-sm font-mono tabular-nums text-primary-100/80 shrink-0 w-12">
                    {item.time}
                  </span>
                  <span className="text-sm font-bold text-white flex-1">{item.text}</span>
                  <span className="text-base shrink-0">{item.icon}</span>
                </button>
              ))
            )}
          </div>

          {allItems.length > 0 && (shareToast ? (
            <div className="mt-4 py-2.5 rounded-xl text-center text-sm font-medium text-white/70 bg-white/10 border border-white/20">
              {shareToast}
            </div>
          ) : (
            <button
              onClick={handleShareConfirmed}
              className="w-full mt-4 bg-white/20 backdrop-blur-sm border border-white/30 py-2.5 rounded-xl flex items-center justify-center gap-2 text-white text-sm font-bold hover:bg-white/30 active:scale-95 transition-all"
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

      {/* First-step onboarding — show until the family has at least two confirmed records */}
      {!isHomeDataLoading && confirmedRecords.length < 2 && (
        <div className="px-6">
          <div className="bg-white border border-green-100 rounded-2xl p-5 shadow-sm space-y-3">
            <p className="font-bold text-slate-700 text-sm">開始使用好顧</p>
            <ol className="space-y-1.5">
              {['加入好顧 LINE', '傳送一筆照顧紀錄', '回來看今天摘要'].map((step, i) => (
                <li key={i} className="flex items-center gap-2.5 text-xs text-slate-600">
                  <span className="bg-green-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
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
              className="flex items-center justify-center gap-2 w-full bg-green-500 text-white rounded-xl py-3 text-sm font-bold active:scale-[0.98] transition-transform"
            >
              <MessageCircle size={16} />
              加入好顧 LINE
            </a>
          </div>
        </div>
      )}

      {/* LINE sync card — collapsible */}
      <div className="px-6">
        <div className="bg-white border border-primary-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Header row — always visible, tapping toggles expand */}
          <button
            onClick={() => {
              if (lineSyncs.length > 0) {
                onOpenLineSync();
              } else {
                setLineCardOpen((o) => !o);
              }
            }}
            className="w-full p-4 flex items-center gap-4 text-left hover:bg-slate-50/60 transition-colors"
          >
            <div className="bg-green-100 p-3 rounded-xl flex items-center justify-center shrink-0">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="#16a34a" aria-label="LINE">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-700">如何用 LINE 記錄？</h3>
                {lineSyncs.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0">
                    {lineSyncs.length} 筆待補充
                  </span>
                )}
              </div>
              {!lineCardOpen && lineSyncs.length === 0 && (
                <p className="text-xs text-slate-400 mt-0.5">點開查看傳送格式</p>
              )}
            </div>
            {lineSyncs.length > 0 ? (
              <ChevronRight className="text-slate-300 shrink-0" size={20} />
            ) : (
              <ChevronDown
                className={`text-slate-300 shrink-0 transition-transform duration-200 ${lineCardOpen ? 'rotate-180' : ''}`}
                size={20}
              />
            )}
          </button>

          {/* Expandable body */}
          {lineCardOpen && lineSyncs.length === 0 && (
            <div className="px-4 pb-4 space-y-3 border-t border-slate-50">
              <p className="text-xs text-slate-500 font-mono pt-3">#好顧 媽媽晚上9點吃胃藥</p>
              <a
                href="https://lin.ee/N4yUobv"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-2 w-full bg-green-500 text-white rounded-xl py-2.5 text-sm font-bold active:scale-[0.98] transition-transform"
              >
                <MessageCircle size={15} />
                加入好顧 LINE
              </a>
            </div>
          )}

          {/* Pending records list when syncs exist */}
          {lineSyncs.length > 0 && (
            <div className="border-t border-slate-50 px-4 pb-4 pt-2 space-y-2">
              <p className="text-xs text-slate-500 font-mono">#好顧 媽媽晚上9點吃胃藥</p>
              {lineSyncs.slice(0, 3).map((sync, index) => {
                const displayTxt =
                  sync.displayMessage || cleanDisplayMessage(sync.originalMessage || sync['原始訊息']);
                return (
                  <div
                    key={index}
                    className="flex justify-between items-start text-xs bg-slate-50/60 p-2.5 rounded-xl border border-slate-100/50"
                  >
                    <p className="text-slate-600 font-medium leading-relaxed truncate max-w-[220px] pr-2" title={displayTxt}>
                      {displayTxt}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-xs">
                      {formatTime(sync.receivedAt || sync['收到時間'])}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
