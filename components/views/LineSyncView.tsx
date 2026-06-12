'use client';

import { useRef, useState } from 'react';
import { MessageCircle, ChevronRight, Clock } from 'lucide-react';
import { Header } from '@/components/Header';
import { cleanDisplayMessage, formatTime, utcToTaiwanHHMM, cn, detectSubject, detectCategory, cleanSummaryText, extractEventTime } from '@/lib/utils';
import type { RawLineSync, CareTask } from '@/lib/types';

const TYPES: { label: string; emoji: string; value: CareTask['type'] }[] = [
  { label: '用藥', emoji: '💊', value: '用藥' },
  { label: '飲食', emoji: '🍽️', value: '飲食' },
  { label: '血壓', emoji: '🩺', value: '血壓' },
  { label: '其他', emoji: '📝', value: '其他' },
];

function toCareType(category: string): CareTask['type'] {
  if (category === '用藥') return '用藥';
  if (category === '量測') return '血壓';
  if (category === '飲食') return '飲食';
  return '其他';
}

// ─── Detail / edit form ───────────────────────────────────────────────────────

interface PendingRecordFormProps {
  sync: RawLineSync;
  onBack: () => void;
  onConfirm: (summary: string) => void;
  onDelete: () => void;
}

function PendingRecordForm({ sync, onBack, onConfirm, onDelete }: PendingRecordFormProps) {
  const raw = sync.recordSummary || sync['AI整理結果'] || sync.displayMessage || '';
  const detectedSubject = detectSubject(raw);
  const timeSource = sync.originalMessage || sync['原始訊息'] || sync.displayMessage || raw;
  const detectedTime = extractEventTime(timeSource) ?? utcToTaiwanHHMM(sync.receivedAt || sync['收到時間']);

  const [subject, setSubject] = useState(detectedSubject === '家人' ? '' : detectedSubject);
  const [time, setTime] = useState(detectedTime);
  const [type, setType] = useState<CareTask['type']>(toCareType(detectCategory(raw)));
  const [detail, setDetail] = useState(cleanSummaryText(raw, detectedSubject));
  const timeRef = useRef<HTMLInputElement>(null);

  const displayTxt = sync.displayMessage || cleanDisplayMessage(sync.originalMessage || sync['原始訊息']);

  const missing: string[] = [];
  if (!time) missing.push('執行時間');
  if (!subject.trim()) missing.push('照顧對象');

  const buildSummary = () => `${subject} ${time} ${detail || type}`.trim();

  return (
    <div className="space-y-6 pb-24">
      <Header title="補充並確認" showBack onBack={onBack} />

      <div className="px-6 space-y-5">
        {/* 原始訊息 */}
        <div className="bg-primary-50/40 border border-primary-100/60 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-primary-600 mb-2">
            <MessageCircle size={14} />
            <span className="text-[10px] font-bold tracking-tight uppercase">原始訊息</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{displayTxt}</p>
        </div>

        {/* 照顧對象 + 執行時間 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">照顧對象</p>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="阿嬤"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">執行時間</p>
            {/* Entire row clickable to open time picker */}
            <div
              onClick={() => { try { timeRef.current?.showPicker(); } catch { timeRef.current?.focus(); } }}
              className={cn(
                'w-full bg-slate-50 border rounded-xl px-4 py-3 flex items-center gap-2 cursor-pointer',
                !time ? 'border-red-200' : 'border-slate-100',
              )}
            >
              <input
                ref={timeRef}
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={cn(
                  'flex-1 bg-transparent text-sm focus:outline-none min-w-0 cursor-pointer',
                  !time ? 'text-slate-400' : 'text-slate-800',
                )}
              />
              <Clock size={15} className="text-slate-400 shrink-0 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 類型 */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">類型</p>
          <div className="grid grid-cols-4 gap-3">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all',
                  type === t.value
                    ? 'bg-primary-50 border-primary-500 ring-2 ring-primary-500/10'
                    : 'bg-white border-slate-100',
                )}
              >
                <span className="text-xl leading-none">{t.emoji}</span>
                <span className="text-[10px] font-bold text-slate-600">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 備註內容 */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">備註內容</p>
          <input
            type="text"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="輸入備註內容"
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {/* 缺少欄位提示 */}
        {missing.length > 0 && (
          <p className="text-xs text-red-500 font-medium">缺少：{missing.join('、')}</p>
        )}

        {/* 操作按鈕 */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => { if (!time) return; onConfirm(buildSummary()); }}
            className="flex-1 py-4 rounded-2xl text-sm font-bold bg-primary-500 text-white shadow-md shadow-primary-100 active:scale-95 transition-transform"
          >
            儲存並確認
          </button>
          <button
            onClick={onDelete}
            className="py-4 px-5 rounded-2xl text-sm font-bold bg-red-50 text-red-500 border border-red-100 active:scale-95 transition-transform"
          >
            刪除紀錄
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

interface LineSyncViewProps {
  onBack: () => void;
  lineSyncs: RawLineSync[];
  onConfirm: (idx: number, summary: string) => void;
  onDelete: (idx: number) => void;
}

export function LineSyncView({ onBack, lineSyncs, onConfirm, onDelete }: LineSyncViewProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  if (selectedIdx !== null) {
    const sync = lineSyncs[selectedIdx];
    if (!sync) {
      setSelectedIdx(null);
      return null;
    }

    return (
      <PendingRecordForm
        key={sync._dbId ?? selectedIdx}
        sync={sync}
        onBack={() => setSelectedIdx(null)}
        onConfirm={(summary) => {
          onConfirm(selectedIdx, summary);
          setSelectedIdx(null);
          showToast('已完成補充');
        }}
        onDelete={() => {
          onDelete(selectedIdx);
          setSelectedIdx(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <Header title="待確認紀錄" showBack onBack={onBack} />

      {toast && (
        <div className="px-6">
          <div className="bg-green-500 text-white text-sm font-bold px-4 py-3 rounded-2xl text-center shadow-md shadow-green-200/60">
            ✓ {toast}
          </div>
        </div>
      )}

      <div className="px-6 space-y-[18px]">
        <h3 className="text-[15px] font-bold text-slate-400 tracking-wider uppercase">
          待確認的同步訊息 ({lineSyncs.length} 筆)
        </h3>

        {lineSyncs.map((sync, index) => {
          const displayTxt =
            sync.displayMessage || cleanDisplayMessage(sync.originalMessage || sync['原始訊息']);
          return (
            <div
              key={sync._dbId ?? index}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* 原始訊息 — 點擊進入編輯 */}
              <button
                onClick={() => setSelectedIdx(index)}
                className="w-full text-left px-5 pt-5 pb-3 active:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-primary-500">
                    <MessageCircle size={18} />
                    <span className="text-[16px] font-semibold">原始訊息</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </div>
                <p className="text-[18px] text-slate-700 leading-relaxed font-medium">{displayTxt}</p>
              </button>

              {/* LINE 紀錄時間 + 操作按鈕 */}
              <div className="flex items-center justify-between px-5 pb-5 pt-3 border-t border-slate-50">
                <div>
                  <p className="text-[15px] text-slate-400">LINE 紀錄時間</p>
                  <p className="text-[17px] font-bold text-slate-700">
                    {formatTime(sync.receivedAt || sync['收到時間'])}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDelete(index)}
                    className="text-[15px] font-semibold bg-red-50 text-red-400 border border-red-100 px-4 py-3 rounded-xl min-h-[48px] flex items-center active:scale-95 transition-transform"
                  >
                    刪除
                  </button>
                  <button
                    onClick={() => setSelectedIdx(index)}
                    className="text-[16px] font-semibold bg-primary-100 text-primary-700 px-4 py-3 rounded-xl min-h-[48px] flex items-center active:scale-95 transition-transform"
                  >
                    編輯
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {lineSyncs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100/50">
            <p className="text-[16px] text-slate-500 font-semibold">目前沒有需要補充的紀錄</p>
          </div>
        )}
      </div>
    </div>
  );
}
