'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CareTargetSetupScreenProps {
  onComplete: (name: string) => Promise<void>;
}

export function CareTargetSetupScreen({ onComplete }: CareTargetSetupScreenProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onComplete(name.trim());
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 bg-neutral-50">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <Image src="/haogu-icon.png" alt="好顧" width={160} height={34} priority />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">請先建立照顧對象</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            請輸入目前主要照顧的長輩姓名
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              照顧對象姓名
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="例如：阿嬤、媽媽、王伯伯"
              autoFocus
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className="w-full bg-primary-500 text-white rounded-2xl py-4 font-bold text-base shadow-lg shadow-primary-200 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading ? '儲存中...' : '開始使用'}
          </button>
        </div>
      </div>
    </div>
  );
}
