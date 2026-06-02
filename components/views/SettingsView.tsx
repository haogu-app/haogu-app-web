'use client';

import { useState } from 'react';
import { MessageCircle, ShieldCheck, Pencil } from 'lucide-react';
import { Header } from '@/components/Header';
import { AnimatePresence, motion } from 'motion/react';

interface SettingsViewProps {
  careTargetName: string;
  onUpdateCareTarget: (name: string) => Promise<void>;
}

function EditCareTargetModal({
  current,
  onSave,
  onClose,
}: {
  current: string;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(current);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) return;
    setLoading(true);
    await onSave(value.trim());
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-white rounded-t-[32px] p-8 shadow-2xl"
      >
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />
        <h3 className="text-xl font-bold text-slate-800 mb-6">修改照顧對象</h3>

        <div className="space-y-5">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />

          <button
            onClick={handleSave}
            disabled={!value.trim() || loading}
            className="w-full bg-primary-500 text-white rounded-2xl py-4 font-bold shadow-lg shadow-primary-200 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {loading ? '儲存中...' : '儲存'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function SettingsView({ careTargetName, onUpdateCareTarget }: SettingsViewProps) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className="space-y-6 pb-24">
      <Header title="設定" />

      {/* 照顧對象 */}
      <div className="px-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4">照顧對象</h3>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-slate-800">{careTargetName}</p>
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-primary-500 bg-primary-50 px-3 py-2 rounded-xl active:scale-95 transition-transform"
            >
              <Pencil size={13} />
              修改
            </button>
          </div>
        </div>
      </div>

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

      <AnimatePresence>
        {showEdit && (
          <EditCareTargetModal
            current={careTargetName}
            onSave={onUpdateCareTarget}
            onClose={() => setShowEdit(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
