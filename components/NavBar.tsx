'use client';

import { Home, Settings as SettingsIcon, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { View } from '@/lib/types';

interface NavBarProps {
  currentView: View;
  setView: (v: View) => void;
  onQuickRecord: () => void;
}

export function NavBar({ currentView, setView, onQuickRecord }: NavBarProps) {
  return (
    <div
      id="bottom-nav"
      className="fixed bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[480px] bg-white border-t border-slate-100 pb-6 pt-2 grid grid-cols-3 place-items-center z-50"
    >
      <button
        id="nav-dashboard"
        onClick={() => setView('dashboard')}
        className={cn(
          'flex flex-col items-center gap-1 min-w-[60px] transition-colors',
          currentView === 'dashboard' ? 'text-primary-500' : 'text-slate-400',
        )}
      >
        <Home size={22} />
        <span className="text-[10px] font-medium">首頁</span>
        {currentView === 'dashboard' && (
          <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-primary-500 mt-0.5" />
        )}
      </button>

      <div className="relative -top-6">
        <button
          onClick={onQuickRecord}
          className="bg-primary-500 text-white w-14 h-14 rounded-full shadow-lg shadow-primary-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border-4 border-white"
        >
          <Plus size={28} />
        </button>
        <span className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] font-medium text-primary-500 whitespace-nowrap">
          快速紀錄
        </span>
      </div>

      <button
        id="nav-settings"
        onClick={() => setView('settings')}
        className={cn(
          'flex flex-col items-center gap-1 min-w-[60px] transition-colors',
          currentView === 'settings' ? 'text-primary-500' : 'text-slate-400',
        )}
      >
        <SettingsIcon size={22} />
        <span className="text-[10px] font-medium">設定</span>
        {currentView === 'settings' && (
          <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-primary-500 mt-0.5" />
        )}
      </button>
    </div>
  );
}
