'use client';

import { CheckCircle2, Clock, MessageCircle, Share2, TrendingUp, ChevronRight } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { Header } from '@/components/Header';
import { formatTime, cleanDisplayMessage } from '@/lib/utils';
import type { CareTask, RawLineSync, View } from '@/lib/types';

interface DashboardViewProps {
  setView: (v: View) => void;
  tasks: CareTask[];
  lineSyncs: RawLineSync[];
  confirmedRecords: RawLineSync[];
}

export function DashboardView({ setView, tasks, lineSyncs, confirmedRecords }: DashboardViewProps) {
  const handleShareConfirmed = () => {
    const now = new Date();
    const todayRecords = confirmedRecords
      .filter((r) => {
        const d = new Date(r.receivedAt || r['收到時間'] || '');
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      })
      .sort((a, b) => (a.receivedAt || '').localeCompare(b.receivedAt || ''));

    const familyUrl = 'https://haogu-app-web.vercel.app/share/family';
    let text: string;
    if (todayRecords.length === 0) {
      text = `今日尚無已確認照顧紀錄。\n\n查看家人近況頁：\n${familyUrl}`;
    } else {
      const lines = todayRecords
        .map((r, i) => {
          const time = formatTime(r.receivedAt || r['收到時間'] || '', true);
          const summary = r.recordSummary || r['AI整理結果'] || r.displayMessage || '';
          return `${i + 1}. ${time} ${summary}`;
        })
        .join('\n');
      text = `今日照顧摘要：\n${lines}\n\n查看完整照顧紀錄：\n${familyUrl}`;
    }

    window.open(`https://line.me/R/share?text=${encodeURIComponent(text)}`, '_blank');
  };

  const dynamicStats = [
    {
      name: '陪診',
      hours: lineSyncs.filter((s) => s['原始訊息']?.includes('診')).length * 3 || 2,
      color: '#4a7c59',
    },
    {
      name: '日常照護',
      hours:
        lineSyncs.filter((s) => s['原始訊息']?.includes('食') || s['原始訊息']?.includes('餐')).length * 5 || 4,
      color: '#6b9080',
    },
    {
      name: '用藥管理',
      hours: lineSyncs.filter((s) => s['原始訊息']?.includes('藥')).length * 2 || 1,
      color: '#8ebbb0',
    },
    { name: '聯絡採買', hours: lineSyncs.length || 1, color: '#ff9f1c' },
  ];

  const totalHours = dynamicStats.reduce((sum, item) => sum + item.hours, 0);
  const estimatedValue = (totalHours * 300).toLocaleString();
  const todayDateStr = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div className="space-y-6 pb-20">
      <Header title="好顧" showLogo />

      {/* LINE Sync Notification */}
      <div className="px-6">
        <button
          onClick={() => setView('lineSync')}
          className="w-full bg-white border border-primary-100 rounded-2xl p-4 flex flex-col gap-3 text-left shadow-sm hover:border-primary-300 transition-colors"
        >
          <div className="flex items-center gap-4 w-full">
            <div className="bg-green-100 p-3 rounded-xl text-green-600">
              <MessageCircle size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700">LINE 最新同步</h3>
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {lineSyncs.length} 筆待確認
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">按此前往確認或修改</p>
            </div>
            <ChevronRight className="text-slate-300" size={20} />
          </div>

          <div className="border-t border-slate-50 pt-2 w-full space-y-2">
            {lineSyncs.slice(0, 3).map((sync, index) => {
              const displayTxt =
                sync.displayMessage || cleanDisplayMessage(sync.originalMessage || sync['原始訊息']);
              return (
                <div
                  key={index}
                  className="flex justify-between items-start text-xs bg-slate-50/60 p-2.5 rounded-xl border border-slate-100/50"
                >
                  <p
                    className="text-slate-600 font-medium leading-relaxed truncate max-w-[220px] pr-2"
                    title={displayTxt}
                  >
                    {displayTxt}
                  </p>
                  <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-xs">
                    {formatTime(sync.receivedAt || sync['收到時間'])}
                  </span>
                </div>
              );
            })}
            {lineSyncs.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-2">
                已從家庭 LINE 群組自動整理...
              </p>
            )}
          </div>
        </button>
      </div>

      {/* Today Summary */}
      <div className="px-6">
        <div className="bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl p-6 text-white shadow-lg shadow-primary-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-primary-100 text-sm mb-1">今天照顧摘要</p>
              <h2 className="text-2xl font-bold">照顧摘要動態</h2>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px]">
                {todayDateStr}
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-[10px] px-2 py-0.5 rounded-lg font-medium text-primary-50">
                對象：家庭眷屬
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto no-scrollbar">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                {task.completed ? (
                  <CheckCircle2 size={18} className="text-primary-100" />
                ) : (
                  <Clock size={18} className="text-accent-100" />
                )}
                <div className="flex-1">
                  <span className="text-sm font-medium leading-relaxed">{task.title}</span>
                  <p className="text-[10px] text-primary-100/70">{task.time}</p>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-center py-4 text-sm text-primary-100/50">今日尚無重點照顧摘要紀錄</p>
            )}
          </div>

          <button
            onClick={handleShareConfirmed}
            className="w-full mt-4 bg-white/20 backdrop-blur-sm border border-white/30 py-2.5 rounded-xl flex items-center justify-center gap-2 text-white text-sm font-bold hover:bg-white/30 active:scale-95 transition-all"
          >
            <Share2 size={16} />
            分享到 LINE
          </button>
        </div>
      </div>

      {/* Stats Summary Card */}
      <div className="px-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-500" />
              <h3 className="font-bold text-slate-700">照顧投入統計</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">本月累計</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 mb-1">投入時間</p>
              <div className="flex items-end gap-1">
                <span className="text-xl font-bold text-primary-500">{totalHours}</span>
                <span className="text-[10px] text-slate-400 pb-0.5">小時</span>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 mb-1">估算價值</p>
              <div className="flex items-end gap-1">
                <span className="text-xl font-bold text-slate-800">{estimatedValue}</span>
                <span className="text-[10px] text-slate-400 pb-0.5">NT$</span>
              </div>
            </div>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicStats}>
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} barSize={24}>
                  {dynamicStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 italic">✨ 你的付出很有價值</p>
            <div className="text-[10px] text-slate-300">($300/hr)</div>
          </div>
        </div>
      </div>

    </div>
  );
}
