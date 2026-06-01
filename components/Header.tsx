'use client';

import { Bell, ChevronRight } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, showBack, onBack }: HeaderProps) {
  return (
    <div className="sticky top-0 bg-neutral-50/80 backdrop-blur-md z-40 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={onBack} className="p-1 -ml-2 text-slate-600">
            <ChevronRight className="rotate-180" size={24} />
          </button>
        )}
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      </div>
      <button className="p-2 bg-white rounded-full shadow-sm text-primary-500 border border-primary-100">
        <Bell size={20} />
      </button>
    </div>
  );
}
