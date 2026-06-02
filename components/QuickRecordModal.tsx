'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { FAMILY_ID } from '@/lib/constants';
import type { CareTask } from '@/lib/types';

interface QuickRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (t: Omit<CareTask, 'id'>) => void;
}

const TYPES: { label: string; emoji: string; value: CareTask['type'] }[] = [
  { label: '用藥', emoji: '💊', value: '用藥' },
  { label: '飲食', emoji: '🍽️', value: '飲食' },
  { label: '血壓', emoji: '🩺', value: '血壓' },
  { label: '其他', emoji: '📝', value: '其他' },
];

const PLACEHOLDERS: Record<CareTask['type'], string> = {
  用藥: '胃藥、降血壓藥、止痛藥',
  飲食: '午餐吃半碗粥、喝水',
  血壓: '142/88',
  其他: '回診、跌倒、復健、抽血',
};

export function QuickRecordModal({ isOpen, onClose, onSubmit }: QuickRecordModalProps) {
  const [type, setType] = useState<CareTask['type']>('用藥');
  const [time, setTime] = useState('08:00');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    // Build display content
    const prefix = type === '血壓' ? '量血壓' : type === '其他' ? '' : type;
    const content = [prefix, detail].filter(Boolean).join(' ') || type;
    const summary = `阿嬤 ${time} ${content}`;

    // Insert directly into care_records (confirmed=true so it appears in today's summary)
    const { error: dbError } = await supabase.from('care_records').insert({
      family_id: FAMILY_ID,
      received_at: new Date().toISOString(),
      original_message: summary,
      display_message: summary,
      record_summary: summary,
      reply_message: '已新增快速紀錄',
      source: 'app',
      contains_tag: false,
      confirmed: true,
    });

    setLoading(false);

    if (dbError) {
      setError('送出失敗，請再試一次');
      return;
    }

    // Also notify parent for tasks table (legacy, non-blocking)
    onSubmit({ time, title: content, type, completed: true });

    // Reset and close
    setDetail('');
    setType('用藥');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-white rounded-t-[32px] p-8 shadow-2xl"
      >
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />
        <h3 className="text-xl font-bold text-slate-800 mb-6">快速記錄照顧事項</h3>

        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">選擇類型</p>
            <div className="grid grid-cols-4 gap-3">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all',
                    type === t.value
                      ? 'bg-primary-50 border-primary-500 ring-2 ring-primary-500/10'
                      : 'bg-white border-slate-100'
                  )}
                >
                  <span className="text-xl leading-none">{t.emoji}</span>
                  <span className="text-[10px] font-bold text-slate-600">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">執行時間</p>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">備註內容</p>
              <input
                type="text"
                placeholder={PLACEHOLDERS[type]}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center -mt-2">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary-500 text-white rounded-2xl py-4 font-bold shadow-lg shadow-primary-200 mt-4 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {loading ? '送出中...' : '送出紀錄'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
