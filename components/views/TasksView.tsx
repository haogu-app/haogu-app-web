'use client';

import { CheckCircle2, Users, Bell, Plus } from 'lucide-react';
import { Header } from '@/components/Header';
import { cn, formatTime, getRecordSummary } from '@/lib/utils';
import type { RawLineSync } from '@/lib/types';

interface TasksViewProps {
  lineSyncs: RawLineSync[];
}

export function TasksView({ lineSyncs }: TasksViewProps) {
  const handleRemind = (member: string, title: string) => {
    const text = `【好顧提醒】請 ${member} 記得： ${title}！我們都很關心進度喔～`;
    const encoded = encodeURIComponent(text);
    window.open(`https://line.me/R/msg/text/?${encoded}`, '_blank');
  };

  const members = ['大女兒', '二兒子', '姑姑'];
  const dynamicTasks = lineSyncs.map((item, idx) => ({
    id: `task-${idx}`,
    member: members[idx % members.length],
    title: getRecordSummary(item),
    time: formatTime(item.receivedAt || item['收到時間'] || '08:00'),
    completed: idx % 2 === 0,
  }));

  const myTasks = dynamicTasks.filter((t) => t.member === '大女兒');
  const otherTasks = dynamicTasks.filter((t) => t.member !== '大女兒');

  return (
    <div className="space-y-6 pb-24">
      <Header title="照顧任務分配" />

      <div className="px-6">
        <div className="bg-primary-50 border border-primary-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-primary-700 mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} />
            我的今日任務
          </h3>
          <div className="space-y-3">
            {myTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-primary-100 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {task.completed ? (
                    <div className="bg-primary-500 text-white p-1 rounded-full">
                      <Plus className="rotate-45" size={12} />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-primary-200"></div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{task.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{task.time}</p>
                  </div>
                </div>
                {task.completed && <span className="text-[10px] text-primary-500 font-bold">已完成</span>}
              </div>
            ))}
            {myTasks.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-4">今日暫無屬於我的指派任務</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 px-2">
          <Users size={18} className="text-slate-400" />
          其他家人的分擔
        </h3>
        <div className="space-y-3">
          {otherTasks.map((task) => (
            <div key={task.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-white shadow-xs">
                    {task.member[0]}
                  </div>
                  <span className="text-xs font-bold text-slate-600">{task.member}</span>
                </div>
                <span className="text-[10px] text-slate-300 font-medium">{task.time}</span>
              </div>
              <p className="text-sm font-medium text-slate-700 mb-3 ml-1 leading-relaxed">{task.title}</p>
              <div className="flex justify-between items-center bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-2xl border-t border-slate-50">
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    task.completed ? 'bg-green-100 text-green-600' : 'bg-accent-100 text-accent-600'
                  )}
                >
                  {task.completed ? '已完成' : '執行中'}
                </span>
                {!task.completed && (
                  <button
                    onClick={() => handleRemind(task.member, task.title)}
                    className="flex items-center gap-1.5 text-primary-500 text-[10px] font-bold bg-white px-3 py-1.5 rounded-lg border border-primary-100 shadow-sm hover:bg-primary-50 transition-colors"
                  >
                    <Bell size={12} /> 一鍵提醒
                  </button>
                )}
              </div>
            </div>
          ))}
          {otherTasks.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-4">其他成員今日暫無任務分配</p>
          )}
        </div>
      </div>
    </div>
  );
}
