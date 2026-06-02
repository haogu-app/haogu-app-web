'use client';

import { useState } from 'react';
import { MessageCircle, ShieldCheck, ArrowRight, ChevronRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { cleanDisplayMessage, formatTime, cn, detectSubject, detectCategory, cleanSummaryText, extractEventTime } from '@/lib/utils';
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
  const detectedTime = extractEventTime(timeSource) ?? '';

  const [subject, setSubject] = useState(detectedSubject === '家人' ? '' : detectedSubject);
  const [time, setTime] = useState(detectedTime);
  const [type, setType] = useState<CareTask['type']>(toCareType(detectCategory(raw)));
  const [detail, setDetail] = useState(cleanSummaryText(raw, detectedSubject));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const displayTxt = sync.displayMessage || cleanDisplayMessage(sync.originalMessage || sync['原始訊息']);

  const missing: string[] = [];
  if (!time) missing.push('執行時間');
  if (!subject.trim()) missing.push('照顧對象');

  const buildSummary = () => `${subject} ${time} ${detail || type}`.trim();

  if (confirmDelete) {
    return (
      <div className="space-y-6 pb-24">
        <Header title="確認刪除" showBack onBack={() => setConfirmDelete(false)} />
        <div className="px-6 space-y-4">
          <p className="text-sm text-slate-600 text-center py-6">確定要刪除這筆待確認紀錄嗎？</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600"
            >
              取消
            </button>
            <button
              onClick={onDelete}
              className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold"
            >
              確認刪除
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={cn(
                'w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2',
                !time ? 'border-red-200 focus:ring-red-500/20' : 'border-slate-100 focus:ring-primary-500/20',
              )}
            />
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
            onClick={() => onConfirm(buildSummary())}
            className="flex-1 py-4 rounded-2xl text-sm font-bold bg-primary-500 text-white shadow-md shadow-primary-100 active:scale-95 transition-transform"
          >
            儲存並確認
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="py-4 px-5 rounded-2xl text-sm font-bold bg-red-50 text-red-500 border border-red-100 active:scale-95 transition-transform"
          >
            刪除
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
          showToast('已確認紀錄，並加入今日照顧摘要');
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

      <div className="px-6">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg text-green-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-green-800">已連接家庭群組</p>
              <p className="text-xs text-green-600">Supabase Realtime 即時同步中</p>
            </div>
          </div>
          <div className="bg-green-500 w-2 h-2 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="px-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
          待確認的同步訊息 ({lineSyncs.length} 筆)
        </h3>

        {lineSyncs.map((sync, index) => {
          const displayTxt =
            sync.displayMessage || cleanDisplayMessage(sync.originalMessage || sync['原始訊息']);
          const sumTxt =
            sync.recordSummary ||
            (sync['AI整理結果'] ? cleanDisplayMessage(sync['AI整理結果']) : '解析進行中...');
          return (
            <button
              key={sync._dbId ?? index}
              onClick={() => setSelectedIdx(index)}
              className="w-full text-left bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden active:scale-[0.99] transition-transform"
            >
              <div className="p-4 border-b border-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-primary-500">
                    <MessageCircle size={16} />
                    <span className="text-[10px] font-bold tracking-tight">原始訊息</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium line-clamp-2">{displayTxt}</p>
              </div>
              <div className="p-4 bg-primary-50/30">
                <div className="flex items-center gap-2 text-primary-600 mb-2">
                  <ArrowRight size={16} />
                  <span className="text-[10px] font-bold tracking-tight uppercase">自動整理結果</span>
                </div>
                <p className="text-xs font-bold text-slate-700 leading-relaxed line-clamp-2">{sumTxt}</p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">取得時間</p>
                    <p className="text-xs font-bold text-slate-700">
                      {formatTime(sync.receivedAt || sync['收到時間'])}
                    </p>
                  </div>
                  <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">
                    點擊補充並確認
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {lineSyncs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100/50">
            <p className="text-slate-400 text-sm font-semibold">目前無待確認的 LINE 同步訊息 ✨</p>
            <p className="text-slate-300 text-xs mt-1">Supabase Realtime 持續監聽中</p>
          </div>
        )}
      </div>
    </div>
  );
}
