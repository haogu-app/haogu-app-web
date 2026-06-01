'use client';

import { cn } from '@/lib/utils';
import type { RawLineSync } from '@/lib/types';

interface DebugPanelProps {
  apiStatus: 'LOADING' | 'SUCCESS' | 'ERROR';
  apiErrorDetails: {
    status?: number | string;
    message?: string;
    responseText?: string;
    scriptUrl?: string;
    callbackTriggered?: boolean;
    timeoutHappened?: boolean;
  } | null;
  lineSyncs: RawLineSync[];
}

export function DebugPanel({ apiStatus, apiErrorDetails, lineSyncs }: DebugPanelProps) {
  return (
    <div className="bg-slate-900 text-slate-100 p-4 font-mono text-[11px] border-b border-slate-800 space-y-1.5 shadow-inner">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-400 font-mono">DEBUG PANEL (JSONP)</span>
        <span
          className={cn(
            'px-2 py-0.5 rounded text-[10px] font-bold',
            apiStatus === 'SUCCESS'
              ? 'bg-green-500 text-neutral-900'
              : apiStatus === 'ERROR'
                ? 'bg-red-500 text-white'
                : 'bg-amber-500 text-neutral-900'
          )}
        >
          {apiStatus === 'SUCCESS' ? '● 成功載入' : apiStatus === 'ERROR' ? '● 載入失敗' : '● 載入中...'}
        </span>
      </div>

      {apiStatus === 'ERROR' && apiErrorDetails ? (
        <div className="bg-red-950/80 border border-red-900/50 rounded-lg p-2.5 text-red-200 text-[10px] space-y-1.5">
          <div className="font-bold text-red-400 text-[11px] flex gap-1 items-center">
            ⚠️ 存取 API 發生故障 (JSONP)
          </div>
          <div className="grid grid-cols-1 gap-1">
            <div>
              資料讀取狀態:{' '}
              <span className="font-bold text-white bg-red-950 px-1 py-0.5 rounded">ERROR</span>
            </div>
            <div className="break-all">
              載入完整 URL:{' '}
              <span className="text-white select-all font-semibold font-mono">
                {apiErrorDetails.scriptUrl || 'N/A'}
              </span>
            </div>
            <div>
              是否觸發 Callback:{' '}
              <span className="font-bold text-white">
                {apiErrorDetails.callbackTriggered ? '是 (YES)' : '否 (NO)'}
              </span>
            </div>
            <div>
              10 秒 Timeout 是否發生:{' '}
              <span className="font-bold text-white">
                {apiErrorDetails.timeoutHappened ? '是 (YES)' : '否 (NO)'}
              </span>
            </div>
            <div>
              目前資料筆數: <span className="font-bold text-white">{lineSyncs.length} 筆</span>
            </div>
            <div>
              錯誤碼/類型:{' '}
              <span className="font-bold text-white bg-red-900 px-1 py-0.5 rounded">
                {apiErrorDetails.status || 'N/A'}
              </span>
            </div>
            <div className="break-all">
              錯誤訊息: <span className="text-white">{apiErrorDetails.message || 'N/A'}</span>
            </div>
          </div>
          <div className="border-t border-red-900/40 pt-1.5">
            <span className="text-red-400 font-semibold block mb-1">錯誤詳情:</span>
            <pre className="p-2 bg-black/40 rounded-md overflow-x-auto whitespace-pre-wrap max-h-32 text-slate-200 font-mono text-[9px] leading-tight break-all border border-red-900/30">
              {apiErrorDetails.responseText || '(無特別詳情)'}
            </pre>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div>
              資料讀取狀態: <span className="font-bold text-green-400">SUCCESS</span>
            </div>
            <div>
              資料筆數: <span className="font-bold text-white">{lineSyncs.length} 筆</span>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-1.5 text-slate-300">
            <span className="text-slate-400 font-medium">最新一筆 originalMessage:</span>
            <p className="text-white truncate" title={lineSyncs[0]?.originalMessage || '無'}>
              {lineSyncs[0]?.originalMessage || '無'}
            </p>
          </div>
          <div className="text-slate-300">
            <span className="text-slate-400 font-medium">最新一筆 recordSummary:</span>
            <p className="text-white truncate" title={lineSyncs[0]?.recordSummary || '無'}>
              {lineSyncs[0]?.recordSummary || '無'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
