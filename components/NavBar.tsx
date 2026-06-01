'use client';

import { Home, History, CheckCircle2, Settings as SettingsIcon, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { View } from '@/lib/types';

interface NavBarProps {
  currentView: View;
  setView: (v: View) => void;
  onQuickRecord: () => void;
}

export function NavBar({ currentView, setView, onQuickRecord }: NavBarProps) {
  const items = [
    { id: 'dashboard', label: '首頁', icon: Home },
    { id: 'records', label: '紀錄', icon: History },
    { id: 'spacer', label: '', icon: null },
    { id: 'tasks', label: '任務', icon: CheckCircle2 },
    { id: 'settings', label: '設定', icon: SettingsIcon },
  ];

  return (
    <div
      id="bottom-nav"
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 pb-6 pt-2 flex justify-between items-center z-50"
    >
      {items.map((item) =>
        item.id === 'spacer' ? (
          <div key="quick-record-trigger" className="relative -top-6">
            <button
              onClick={onQuickRecord}
              className="bg-primary-500 text-white w-14 h-14 rounded-full shadow-lg shadow-primary-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border-4 border-white"
            >
              <Plus size={28} />
            </button>
            <span className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] font-medium text-primary-500 whitespace-nowrap">
              快速記錄
            </span>
          </div>
        ) : (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => setView(item.id as View)}
            className={cn(
              'flex flex-col items-center gap-1 min-w-[60px] transition-colors',
              currentView === item.id ? 'text-primary-500' : 'text-slate-400'
            )}
          >
            {item.icon && <item.icon size={22} />}
            <span className="text-[10px] font-medium">{item.label}</span>
            {currentView === item.id && (
              <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-primary-500 mt-0.5" />
            )}
          </button>
        )
      )}
    </div>
  );
}
