'use client';

import { useState } from 'react';
import { Smartphone, Copy, Check, MessageCircle } from 'lucide-react';

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

const COMING_SOON = [
  { emoji: '🎤', title: '語音紀錄', desc: '直接說話，AI 自動整理成照顧紀錄' },
  { emoji: '📷', title: '拍照判讀', desc: '拍攝藥袋、回診單、檢查報告，自動擷取重點' },
  { emoji: '👨‍👩‍👧‍👦', title: '工作分配', desc: '建立待協助事項，家人可認領任務' },
  { emoji: '⏱️', title: '照顧時數統計', desc: '自動統計照顧投入時間' },
  { emoji: '🔔', title: '任務提醒', desc: '回診、吃藥、待辦事項提醒' },
];

export function SettingsView() {
  const [urlCopied, setUrlCopied] = useState(false);

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

      {/* 加入主畫面教學 */}
      <div className="px-6">
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="bg-primary-50 p-2 rounded-xl text-primary-500 shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">把好顧加入手機主畫面</p>
              <p className="text-xs text-slate-400 mt-0.5">像 App 一樣快速打開好顧，不用每次找網址。</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 mb-2.5 flex items-center gap-1.5">
              <span className="text-base">🍎</span> iPhone / Safari
            </p>
            <ol className="space-y-2">
              {INSTALL_STEPS.iphone.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                  <span className="bg-slate-100 text-slate-500 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="border-t border-slate-50" />

          <div>
            <p className="text-xs font-bold text-slate-500 mb-2.5 flex items-center gap-1.5">
              <span className="text-base">🤖</span> Android / Chrome
            </p>
            <ol className="space-y-2">
              {INSTALL_STEPS.android.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                  <span className="bg-slate-100 text-slate-500 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {urlCopied ? (
            <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-50 border border-green-100 text-sm font-medium text-green-700">
              <Check size={15} />
              已複製好顧網址
            </div>
          ) : (
            <button
              onClick={handleCopyUrl}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary-50 border border-primary-100 text-sm font-bold text-primary-600 active:scale-[0.98] transition-transform"
            >
              <Copy size={15} />
              複製好顧網址
            </button>
          )}
        </div>
      </div>

      {/* 即將推出功能 */}
      <div className="px-6">
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-5 space-y-4">
          <p className="text-sm font-bold text-slate-700">即將推出功能</p>
          <div className="space-y-3">
            {COMING_SOON.map(({ emoji, title, desc }) => (
              <div key={title} className="flex items-start gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                <span className="text-xl shrink-0 mt-0.5">{emoji}</span>
                <div>
                  <p className="text-xs font-bold text-slate-700">{title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
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
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500 text-white text-sm font-bold active:scale-[0.98] transition-transform"
          >
            <MessageCircle size={16} />
            快來跟我們聯絡！
          </a>
        </div>
      </div>
    </div>
  );
}
