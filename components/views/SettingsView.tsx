'use client';

import { MessageCircle, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/Header';

export function SettingsView() {
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
