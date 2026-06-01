'use client';

import { useState } from 'react';
import { MessageCircle, ShieldCheck, ArrowRight, ChevronRight, ChevronLeft, Clock, FileText } from 'lucide-react';
import { Header } from '@/components/Header';
import { cleanDisplayMessage, formatTime, getRecordSummary } from '@/lib/utils';
import type { RawLineSync } from '@/lib/types';

interface LineSyncViewProps {
  onBack: () => void;
  lineSyncs: RawLineSync[];
  onConfirm: (idx: number) => void;
  onDelete: (idx: number) => void;
}

export function LineSyncView({ onBack, lineSyncs, onConfirm, onDelete }: LineSyncViewProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (selectedIdx !== null) {
    const sync = lineSyncs[selectedIdx];
    if (!sync) {
      setSelectedIdx(null);
      return null;
    }

    const displayTxt =
      sync.displayMessage || cleanDisplayMessage(sync.originalMessage || sync['原始訊息']);
    const sumTxt =
      sync.recordSummary ||
      (sync['AI整理結果'] ? cleanDisplayMessage(sync['AI整理結果']) : '解析進行中...');
    const timeStr = formatTime(sync.receivedAt || sync['收到時間']);

    return (
      <div className="space-y-6 pb-24">
        <Header title="確認紀錄" showBack onBack={() => setSelectedIdx(null)} />

        <div className="px-6 space-y-4">
          {/* 取得時間 */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="bg-slate-50 p-2 rounded-lg text-slate-400">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold mb-0.5">取得時間</p>
              <p className="text-sm font-bold text-slate-700">{timeStr}</p>
            </div>
          </div>

          {/* 原始訊息 */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-primary-500 mb-3">
              <MessageCircle size={16} />
              <span className="text-[10px] font-bold tracking-tight uppercase">原始訊息</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{displayTxt}</p>
          </div>

          {/* 整理結果 */}
          <div className="bg-primary-50/40 border border-primary-100/60 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-primary-600 mb-3">
              <FileText size={16} />
              <span className="text-[10px] font-bold tracking-tight uppercase">自動整理結果</span>
            </div>
            <p className="text-sm font-bold text-slate-700 leading-relaxed">{sumTxt}</p>
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                onConfirm(selectedIdx);
                setSelectedIdx(null);
              }}
              className="flex-1 py-4 rounded-2xl text-sm font-bold bg-primary-500 text-white shadow-md shadow-primary-100 active:scale-95 transition-transform"
            >
              確認紀錄
            </button>
            <button
              onClick={() => {
                onDelete(selectedIdx);
                setSelectedIdx(null);
              }}
              className="flex-1 py-4 rounded-2xl text-sm font-bold bg-red-50 text-red-500 border border-red-100 active:scale-95 transition-transform"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <Header title="LINE 同步紀錄" showBack onBack={onBack} />

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
                    點擊確認或刪除
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
