'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { detectSubject, detectCategory, cleanSummaryText, extractEventTime, formatTime } from '@/lib/utils';
import type { RawLineSync, CareTask } from '@/lib/types';

interface EditRecordModalProps {
  record: RawLineSync;
  onClose: () => void;
  onDeleted?: (dbId: string) => void;
  onSaved?: (dbId: string, summary: string) => void;
}

const TYPES: { label: string; emoji: string; value: CareTask['type'] }[] = [
  { label: '用藥', emoji: '💊', value: '用藥' },
  { label: '飲食', emoji: '🍽️', value: '飲食' },
  { label: '血壓', emoji: '🩺', value: '血壓' },
  { label: '其他', emoji: '📝', value: '其他' },
];

function formatDisplayTime(isoOrHHMM: string): string {
  if (!isoOrHHMM) return '—';
  let hours: number, minutes: number;
  if (isoOrHHMM.includes('T') || (isoOrHHMM.includes('-') && isoOrHHMM.includes(':'))) {
    const d = new Date(isoOrHHMM);
    if (isNaN(d.getTime())) return '—';
    hours = d.getHours();
    minutes = d.getMinutes();
  } else if (isoOrHHMM.includes(':')) {
    const parts = isoOrHHMM.split(':').map(Number);
    hours = parts[0];
    minutes = parts[1];
  } else {
    return '—';
  }
  const meridiem = hours < 12 ? '上午' : '下午';
  const h12 = hours % 12 || 12;
  return `${meridiem} ${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function toCareType(category: string): CareTask['type'] {
  if (category === '用藥') return '用藥';
  if (category === '量測') return '血壓';
  if (category === '飲食') return '飲食';
  return '其他';
}

export function EditRecordModal({ record, onClose, onDeleted, onSaved }: EditRecordModalProps) {
  // Verify ID is present on mount — visible in browser DevTools console
  console.log('[EditRecord] opened with _dbId:', record._dbId, '| raw record:', record);

  const raw = record.recordSummary || record['AI整理結果'] || record.displayMessage || '';
  const detectedSubject = detectSubject(raw);
  const timeSource = record.originalMessage || record['原始訊息'] || record.displayMessage || raw;
  const detectedTime = extractEventTime(timeSource) ?? formatTime(record.receivedAt || record['收到時間'] || '', true);

  const [subject, setSubject] = useState(detectedSubject === '家人' ? '阿嬤' : detectedSubject);
  const [time, setTime] = useState(detectedTime === '無' ? '08:00' : detectedTime);
  const [type, setType] = useState<CareTask['type']>(toCareType(detectCategory(raw)));
  const [detail, setDetail] = useState(cleanSummaryText(raw, detectedSubject));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Format: "照顧對象 時間 備註" — type is NOT part of the summary text
  const buildSummary = () => `${subject} ${time} ${detail || type}`.trim();

  const handleUpdate = async () => {
    if (!record._dbId) {
      console.error('[EditRecord] Missing _dbId, aborting update');
      setError('無法更新：缺少紀錄 ID');
      return;
    }
    setLoading(true);
    setError('');
    const summary = buildSummary();
    console.log('[EditRecord] Updating', record._dbId, '→', summary);

    const { error: dbError } = await supabase
      .from('care_records')
      .update({
        original_message: summary,
        display_message: summary,
        record_summary: summary,
        confirmed: true,
      })
      .eq('id', record._dbId);

    setLoading(false);
    if (dbError) {
      console.error('[EditRecord] Update failed:', dbError);
      setError('更新失敗，請稍後再試');
      return;
    }
    console.log('[EditRecord] Update success');
    if (onSaved && record._dbId) {
      onSaved(record._dbId, buildSummary());
    } else {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!record._dbId) {
      console.error('[EditRecord] Missing _dbId, aborting delete');
      setError('無法刪除：缺少紀錄 ID');
      return;
    }
    setLoading(true);
    setError('');
    console.log('[EditRecord] Deleting', record._dbId);

    const { error: dbError } = await supabase
      .from('care_records')
      .delete()
      .eq('id', record._dbId);

    setLoading(false);
    if (dbError) {
      console.error('[EditRecord] Delete failed:', dbError);
      setError('刪除失敗，請稍後再試');
      return;
    }
    console.log('[EditRecord] Delete success');
    if (onDeleted && record._dbId) {
      onDeleted(record._dbId);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-white rounded-t-[32px] p-8 shadow-2xl"
      >
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800">編輯照顧紀錄</h3>
          <button onClick={() => setConfirmDelete(true)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
            <Trash2 size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {confirmDelete ? (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-sm text-slate-600 text-center py-4">確定要刪除這筆照顧紀錄嗎？</p>
              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold disabled:opacity-60"
                >
                  {loading ? '刪除中...' : '確認刪除'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
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
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">登記時間</p>
                <p className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-400">
                  {formatDisplayTime(record.receivedAt || record['收到時間'] || '')}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">類型</p>
                <div className="grid grid-cols-4 gap-3">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all',
                        type === t.value ? 'bg-primary-50 border-primary-500 ring-2 ring-primary-500/10' : 'bg-white border-slate-100'
                      )}
                    >
                      <span className="text-xl leading-none">{t.emoji}</span>
                      <span className="text-[10px] font-bold text-slate-600">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

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

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <button
                onClick={handleUpdate}
                disabled={loading}
                className="w-full bg-primary-500 text-white rounded-2xl py-4 font-bold shadow-lg shadow-primary-200 active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                {loading ? '儲存中...' : '儲存變更'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
