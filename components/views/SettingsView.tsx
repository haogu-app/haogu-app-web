'use client';

import { useState } from 'react';
import { MessageCircle, ShieldCheck, Smartphone, ChevronDown, Copy, Check } from 'lucide-react';
import { Header } from '@/components/Header';

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

export function SettingsView() {
  const [installOpen, setInstallOpen] = useState(false);
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
    <div className="space-y-6 pb-24">
      <Header title="設定" />

      {/* LINE 同步設定 */}
      <div className="px-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
          <h3 className="font-bold text-slate-700">LINE 同步設定</h3>

          <a
            href="https://lin.ee/N4yUobv"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition-transform"
          >
            <div className="bg-green-100 p-2 rounded-xl text-green-600 shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-700">好顧 LINE 官方帳號</p>
              <p className="text-xs text-slate-400 mt-0.5">ID：@418xupmk</p>
              <p className="text-xs text-green-600 font-medium mt-1">點擊加入好友</p>
            </div>
          </a>
        </div>
      </div>

      {/* 三步驟 */}
      <div className="px-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-6">使用步驟</h3>
          <div className="space-y-8 relative before:content-[''] before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-[2px] before:border-l-2 before:border-dashed before:border-slate-100">
            {[
              {
                title: '加入好顧 LINE 官方帳號',
                desc: '點擊上方按鈕或搜尋 @418xupmk 加入好友',
              },
              {
                title: '傳送照顧紀錄',
                desc: '例如：#好顧 阿嬤晚上9點吃胃藥',
              },
              {
                title: '回到 APP 查看摘要',
                desc: 'AI 自動整理後出現在首頁今日照顧摘要',
              },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-4 relative z-10">
                <div className="bg-primary-500 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-sm shadow-primary-200 shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{step.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 加入主畫面教學 — 可展開卡片 */}
      <div className="px-6">
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <button
            onClick={() => setInstallOpen((o) => !o)}
            className="w-full p-5 flex items-center gap-3 text-left hover:bg-slate-50/60 transition-colors"
          >
            <div className="bg-primary-50 p-2 rounded-xl text-primary-500 shrink-0">
              <Smartphone size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-700">把好顧加入手機主畫面</p>
              <p className="text-xs text-slate-400 mt-0.5">像 App 一樣快速打開好顧，不用每次找網址。</p>
            </div>
            <ChevronDown
              className={`text-slate-300 shrink-0 transition-transform duration-200 ${installOpen ? 'rotate-180' : ''}`}
              size={20}
            />
          </button>

          {installOpen && (
            <div className="border-t border-slate-50 px-5 pb-5 pt-4 space-y-5">
              {/* iPhone */}
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

              {/* Android */}
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

              {/* Copy URL button */}
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
          )}
        </div>
      </div>

      {/* 安全與隱私 */}
      <div className="px-6">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <h4 className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-2">
            <ShieldCheck size={16} /> 安全與隱私說明
          </h4>
          <ul className="space-y-2 text-[10px] text-slate-400 leading-relaxed font-medium">
            <li>• 好顧只整理使用者主動傳送的照顧紀錄</li>
            <li>• 不會讀取 LINE 歷史對話</li>
            <li>• 不會自動讀取家人私人訊息</li>
            <li>• 使用者可自行刪除不需要的紀錄</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
