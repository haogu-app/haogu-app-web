'use client';

import { useState } from 'react';
import { Smartphone, Copy, Check, MessageCircle, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

const HAOGU_URL = 'https://haogu-app-web.vercel.app';

const INSTALL_STEPS = {
  iphone: [
    '用 Safari 開啟好顧網址',
    '點選下方「分享」按鈕',
    '選擇「加入主畫面」',
    '點選「新增」',
  ],
  android: [
    '用 Chrome 開啟好顧網址',
    '點選右上角「⋮」',
    '選擇「加入主畫面」或「安裝應用程式」',
    '點選「新增」或「安裝」',
  ],
};

const COMING_SOON_ROWS = [
  '🎤 語音紀錄 · 📷 拍照判讀 · 🔔 任務提醒',
  '👨‍👩‍👧‍👦 工作分配 · ⏱️ 照顧時數統計',
];

export function SettingsView() {
  const [urlCopied, setUrlCopied] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleCopyUrl = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : HAOGU_URL;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2500);
  };

  return (
    <div className="space-y-6 pt-6 pb-24">

      {/* 好顧是什麼 */}
      <div className="px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/haogu-what.png"
          alt="好顧是什麼"
          className="w-full rounded-2xl object-contain"
        />
      </div>

      {/* 即將推出功能 */}
      <div className="px-6">
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-5 space-y-4">
          <p className="text-[16px] font-bold text-slate-700">即將推出功能</p>
          <div className="space-y-2.5">
            {COMING_SOON_ROWS.map((row) => (
              <p key={row} className="text-[16px] text-slate-500 leading-relaxed">{row}</p>
            ))}
          </div>
        </div>
      </div>

      {/* 聯絡區塊 */}
      <div className="px-6">
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-5 text-center space-y-3">
          <p className="text-base font-bold text-slate-700">有更多想法？</p>
          <a
            href="https://lin.ee/N4yUobv"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500 text-white text-[16px] font-bold active:scale-[0.98] transition-transform"
          >
            <MessageCircle size={16} />
            快來跟我們聯絡！
          </a>
        </div>
      </div>

      {/* 進階玩法（預設收合） */}
      <div className="px-6">
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <button
            onClick={() => setIsAdvancedOpen((v) => !v)}
            className="w-full p-5 flex items-center gap-3 text-left active:bg-slate-50 transition-colors"
          >
            <div className="bg-primary-50 p-2 rounded-xl text-primary-500 shrink-0">
              <Smartphone size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-bold text-slate-700">進階玩法</p>
              <p className="text-[14px] text-slate-400 mt-0.5">像 App 一樣快速打開好顧</p>
            </div>
            <ChevronDown
              size={20}
              className={cn(
                'text-slate-400 transition-transform duration-200 shrink-0',
                isAdvancedOpen && 'rotate-180',
              )}
            />
          </button>

          <AnimatePresence initial={false}>
            {isAdvancedOpen && (
              <motion.div
                key="advanced-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="border-t border-slate-50 px-5 pb-5 pt-4 space-y-5">
                  <div>
                    <p className="text-[15px] font-bold text-slate-500 mb-2.5 flex items-center gap-1.5">
                      <span className="text-base">🍎</span> iPhone / Safari
                    </p>
                    <ol className="space-y-2.5">
                      {INSTALL_STEPS.iphone.map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[15px] text-slate-600">
                          <span className="bg-slate-100 text-slate-500 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="border-t border-slate-50" />

                  <div>
                    <p className="text-[15px] font-bold text-slate-500 mb-2.5 flex items-center gap-1.5">
                      <span className="text-base">🤖</span> Android / Chrome
                    </p>
                    <ol className="space-y-2.5">
                      {INSTALL_STEPS.android.map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[15px] text-slate-600">
                          <span className="bg-slate-100 text-slate-500 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {urlCopied ? (
                    <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-50 border border-green-100 text-[16px] font-medium text-green-700">
                      <Check size={15} />
                      已複製好顧網址
                    </div>
                  ) : (
                    <button
                      onClick={handleCopyUrl}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary-50 border border-primary-100 text-[16px] font-bold text-primary-600 active:scale-[0.98] transition-transform"
                    >
                      <Copy size={15} />
                      複製好顧網址
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
