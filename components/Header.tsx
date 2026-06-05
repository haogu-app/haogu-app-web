'use client';

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

interface HeaderProps {
  title: string;
  showLogo?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, showLogo, showBack, onBack }: HeaderProps) {
  if (showLogo) {
    return (
      <div className="sticky top-0 bg-neutral-50/80 backdrop-blur-md z-40 py-3 flex justify-center">
        <Image
          src="/haogu-icon.png"
          alt="好顧"
          width={315}
          height={68}
          priority
        />
      </div>
    );
  }

  return (
    <div className="sticky top-0 bg-neutral-50/80 backdrop-blur-md z-40 px-6 py-4 flex items-center gap-3">
      {showBack && (
        <button onClick={onBack} className="p-1 -ml-2 text-slate-600 shrink-0">
          <ChevronRight className="rotate-180" size={24} />
        </button>
      )}
      <h1 className="text-[24px] font-bold text-slate-800">{title}</h1>
    </div>
  );
}
