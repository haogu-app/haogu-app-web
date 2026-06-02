'use client';

import { useState } from 'react';
import { Pill, HeartPulse, Stethoscope, Utensils } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { CareTask } from '@/lib/types';

interface QuickRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (t: Omit<CareTask, 'id'>) => void;
}

export function QuickRecordModal({ isOpen, onClose, onSubmit }: QuickRecordModalProps) {
  const [type, setType] = useState<CareTask['type']>('用藥');
  const [time, setTime] = useState('08:00');
  const [detail, setDetail] = useState('');

  const types = [
    { label: '量血壓', value: '血壓' as const, icon: HeartPulse, color: 'text-red-500' },
    { label: '回診', value: '回診' as const, icon: Stethoscope, color: 'text-blue-500' },
    { label: '用藥記錄', value: '用藥' as const, icon: Pill, color: 'text-green-500' },
    { label: '飲食紀錄', value: '飲食' as const, icon: Utensils, color: 'text-orange-500' },
  ];

  if (!isOpen) return null;

  const handleSubmit = () => {
    const title =
      type === '血壓'
        ? `測量血壓 ${detail}`
        : type === '回診'
          ? `陪同回診 ${detail}`
          : type === '用藥'
            ? `用藥記錄 ${detail}`
            : `飲食紀錄 ${detail}`;
    onSubmit({ time, title, type, completed: true });
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
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6"></div>
        <h3 className="text-xl font-bold text-slate-800 mb-6">快速記錄照顧事項</h3>

        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">選擇類型</p>
            <div className="grid grid-cols-4 gap-3">
              {types.map((t) => (
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
                  <t.icon size={20} className={t.color} />
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
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">備註細節</p>
              <input
                type="text"
                placeholder="例如：142/88"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-primary-500 text-white rounded-2xl py-4 font-bold shadow-lg shadow-primary-200 mt-4 active:scale-[0.98] transition-transform"
          >
            送出紀錄
          </button>
        </div>
      </motion.div>
    </div>
  );
}
