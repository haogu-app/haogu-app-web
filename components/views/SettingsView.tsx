'use client';

import { MessageCircle, ShieldCheck, Bell, Users, UserPlus } from 'lucide-react';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';
import { FAMILY_MEMBERS } from '@/lib/constants';

interface SettingsViewProps {
  showDebug: boolean;
  setShowDebug: (val: boolean) => void;
}

export function SettingsView({ showDebug, setShowDebug }: SettingsViewProps) {
  return (
    <div className="space-y-6 pb-24">
      <Header title="設定與家人管理" />

      {/* Member List */}
      <div className="px-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-700">家庭成員</h3>
            <button className="flex items-center gap-1 text-primary-500 text-xs font-medium">
              <UserPlus size={14} /> 邀請成員
            </button>
          </div>
          <div className="space-y-5">
            {FAMILY_MEMBERS.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border-2 border-white shadow-sm">
                    {member.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{member.name}</p>
                    <p className="text-[10px] text-slate-400">{member.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'text-[10px] font-bold',
                      member.status === '線上'
                        ? 'text-green-500'
                        : member.status === '未加入'
                          ? 'text-slate-300'
                          : 'text-slate-400'
                    )}
                  >
                    {member.status}
                  </p>
                  <p className="text-[10px] text-slate-300">
                    {member.lastSeen !== '-' ? `最近查看: ${member.lastSeen}` : '尚未加入'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Setup Flow */}
      <div className="px-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-6">LINE 同步三步驟</h3>
          <div className="space-y-8 relative before:content-[''] before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-[2px] before:border-l-2 before:border-dashed before:border-slate-100">
            {[
              { title: '邀請官方帳號', desc: '搜尋 @haogu 邀請加入家庭群組' },
              { title: '輸入指定指令', desc: '在群組中輸入 #好顧 + 照顧內容' },
              { title: '系統自動同步', desc: 'APP 會自動解析並整理成紀錄' },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-4 relative z-10">
                <div className="bg-primary-500 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-sm shadow-primary-200">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{step.title}</p>
                  <p className="text-xs text-slate-400 mt-1 italic">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connected Groups */}
      <div className="px-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg text-green-600">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 italic">王家照顧群</p>
              <p className="text-[10px] text-green-500">同步連結中...</p>
            </div>
          </div>
          <button className="text-xs font-bold text-red-400">解除綁定</button>
        </div>
      </div>

      {/* Safety Rules */}
      <div className="px-6">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <h4 className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-2">
            <ShieldCheck size={16} /> 安全與私隱說明
          </h4>
          <ul className="space-y-2 text-[10px] text-slate-400 leading-relaxed font-medium">
            <li>
              • 只同步含有 <span className="text-primary-500">#好顧</span> 字樣的訊息
            </li>
            <li>• 不會讀取與記錄歷史對話</li>
            <li>• 不會主動在群組發言，僅被動接收指令</li>
            <li>• 所有同步紀錄均需家屬手動確認後生效</li>
          </ul>
        </div>
      </div>

      {/* Toggles */}
      <div className="px-6 space-y-2">
        <div className="bg-white border border-slate-50 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600">同步成功通知</span>
          </div>
          <div className="w-10 h-6 bg-primary-500 rounded-full flex items-center justify-end px-1">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
        </div>
        <div className="bg-white border border-slate-50 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 text-slate-400">
            <Users size={18} />
            <span className="text-sm font-medium text-slate-600">家人查看通知</span>
          </div>
          <div className="w-10 h-6 bg-slate-200 rounded-full flex items-center px-1">
            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
          </div>
        </div>

        {/* Debug Toggle */}
        <div
          role="button"
          tabIndex={0}
          className="bg-amber-50/40 border border-amber-100/50 p-4 rounded-xl flex items-center justify-between shadow-sm cursor-pointer hover:bg-amber-50 transition active:scale-[0.99]"
          onClick={() => setShowDebug(!showDebug)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setShowDebug(!showDebug);
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-base select-none">🛠️</span>
            <div className="text-left">
              <span className="text-sm font-bold text-amber-800 block">開發測試除錯面板 (Debug)</span>
              <span className="text-[10px] text-amber-600 block mt-0.5 leading-tight">
                用於連線排錯與監控 API 請求狀態
              </span>
            </div>
          </div>
          <div
            className={cn(
              'w-10 h-6 rounded-full flex items-center px-1 transition-colors',
              showDebug ? 'bg-amber-600 justify-end' : 'bg-slate-200 justify-start'
            )}
          >
            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
