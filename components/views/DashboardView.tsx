'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Share2, ChevronRight, Check, Plus } from 'lucide-react';
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
}

export function DashboardView({ setView, lineSyncs, confirmedRecords, onQuickRecord, onRecordDeleted, onRecordSaved }: DashboardViewProps) {
  const [shareCopied, setShareCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editRecord, setEditRecord] = useState<RawLineSync | null>(null);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
  }, []);

  const now = new Date();

  // Today's confirmed records, newest event time first
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

  // Flat summary items — skip entries with no meaningful text
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
    <div className="space-y-6 pb-20">
      <Header title="好顧" showLogo />

      {/* Tagline */}
      <div className="px-6 -mt-2">
        <p className="text-sm text-slate-500 text-center leading-relaxed">
          LINE 記錄長輩近況，AI 整理給家人看
        </p>
      </div>

      {/* LINE sync card */}
      <div className="px-6">
        <button
          onClick={() => setView('lineSync')}
          className="w-full bg-white border border-primary-100 rounded-2xl p-4 flex flex-col gap-3 text-left shadow-sm hover:border-primary-300 transition-colors"
        >
          <div className="flex items-center gap-4 w-full">
            <div className="bg-green-100 p-3 rounded-xl text-green-600">
              <MessageCircle size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700">待確認紀錄</h3>
                {lineSyncs.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {lineSyncs.length} 筆待確認
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">從 LINE 收到的新紀錄會出現在這裡</p>
            </div>
            <ChevronRight className="text-slate-300" size={20} />
          </div>

          <div className="border-t border-slate-50 pt-2 w-full space-y-2">
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
            {lineSyncs.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-3">尚無待確認紀錄</p>
            )}
          </div>
        </button>

      </div>

      {/* Quick Record CTA */}
      <div className="px-6">
        <button
          onClick={onQuickRecord}
          className="w-full h-12 rounded-2xl bg-primary-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-primary-200 hover:bg-primary-600 active:scale-95 transition-all"
        >
          <Plus size={18} />
          快速記錄
        </button>
      </div>

      {/* Today Summary */}
      <div className="px-6">
        <div className="bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl p-6 text-white shadow-lg shadow-primary-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">今天照顧摘要</h2>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px]">
                {todayDateStr}
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-[10px] px-2 py-0.5 rounded-lg font-medium text-primary-50">
                對象：家庭眷屬
              </div>
            </div>
          </div>

          <div className="space-y-1.5 max-h-[280px] overflow-y-auto no-scrollbar">
            {allItems.length === 0 ? (
              <div className="text-center py-4 space-y-1">
                <p className="text-sm text-primary-100/70">今日尚無已確認照顧紀錄</p>
                <p className="text-xs text-primary-100/50">完成確認後，這裡會自動產生今日摘要</p>
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

          <button
            onClick={handleShareConfirmed}
            className="w-full mt-4 bg-white/20 backdrop-blur-sm border border-white/30 py-2.5 rounded-xl flex items-center justify-center gap-2 text-white text-sm font-bold hover:bg-white/30 active:scale-95 transition-all"
          >
            {shareCopied ? (
              <><Check size={16} />已複製照顧摘要，請貼到 LINE 傳給家人</>
            ) : (
              <><Share2 size={16} />一鍵分享到 LINE</>
            )}
          </button>
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
