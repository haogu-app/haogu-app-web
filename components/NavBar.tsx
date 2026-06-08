'use client';

import Image from 'next/image';
import { Home, Plus } from 'lucide-react';
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
      data-testid="bottom-navigation"
      className="bg-white border-t border-slate-100 pb-6 pt-2 grid grid-cols-3 place-items-center fixed bottom-0 left-0 right-0 z-50 w-full"
    >
      <button
        id="nav-dashboard"
        onClick={() => setView('dashboard')}
        className={cn(
          'flex flex-col items-center gap-1 min-w-[60px] transition-colors',
          currentView === 'dashboard' ? 'text-primary-500' : 'text-slate-400',
        )}
      >
        <Home size={24} />
        <span className="text-[13px] font-medium">首頁</span>
        {currentView === 'dashboard' && (
          <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-primary-500 mt-0.5" />
        )}
      </button>

      <div className="relative flex flex-col items-center gap-1 min-w-[60px]">
        <button
          onClick={onQuickRecord}
          className="absolute -top-8 bg-primary-500 text-white w-14 h-14 rounded-full shadow-lg shadow-primary-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border-4 border-white"
        >
          <Plus size={28} />
        </button>
        <div className="h-[24px] w-6" aria-hidden />
        <span className="text-[13px] font-medium text-primary-500">快速紀錄</span>
      </div>

      <button
        id="nav-settings"
        onClick={() => setView('settings')}
        className="flex flex-col items-center gap-1 min-w-[60px]"
      >
        <Image src="/haogu-logo.png" alt="關於好顧" width={36} height={36} className="opacity-100" />
        <span className={cn(
          'text-[13px] font-medium transition-colors',
          currentView === 'settings' ? 'text-primary-500' : 'text-slate-400',
        )}>關於好顧</span>
        {currentView === 'settings' && (
          <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-primary-500 mt-0.5" />
        )}
      </button>
    </div>
  );
}
