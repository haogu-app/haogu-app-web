'use client';

import Image from 'next/image';
import { Bell, ChevronRight } from 'lucide-react';

interface HeaderProps {
  title: string;
  showLogo?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, showLogo, showBack, onBack }: HeaderProps) {
  return (
    <div className={`sticky top-0 bg-neutral-50/80 backdrop-blur-md z-40 px-6 flex items-center justify-between ${showLogo ? 'py-3' : 'py-4'}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {showBack && (
          <button onClick={onBack} className="p-1 -ml-2 text-slate-600 shrink-0">
            <ChevronRight className="rotate-180" size={24} />
          </button>
        )}
        {showLogo ? (
          <Image
            src="/haogu-logo.jpg"
            alt="好顧"
            width={280}
            height={112}
            className="h-14 w-auto object-contain object-left"
            priority
          />
        ) : (
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        )}
      </div>
      <button className="p-2 bg-white rounded-full shadow-sm text-primary-500 border border-primary-100 shrink-0 ml-4">
        <Bell size={20} />
      </button>
    </div>
  );
}
