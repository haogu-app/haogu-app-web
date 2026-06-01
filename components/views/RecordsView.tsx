'use client';

import { useState } from 'react';
import { Pill, HeartPulse, Stethoscope, Utensils, Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { cn, formatTime, getRecordSummary } from '@/lib/utils';
import type { RawLineSync } from '@/lib/types';

interface RecordsViewProps {
  records: RawLineSync[];
}

type RecordType = '用藥' | '回診' | '生理數據' | '飲食';

const ICON_MAP = {
  回診: Stethoscope,
  飲食: Utensils,
  生理數據: HeartPulse,
  用藥: Pill,
} as const;

const COLOR_MAP = {
  回診: 'text-blue-500',
  飲食: 'text-orange-500',
  生理數據: 'text-red-500',
  用藥: 'text-green-500',
} as const;

const TAG_MAP = {
  回診: 'bg-blue-50 text-blue-600',
  用藥: 'bg-green-50 text-green-600',
  飲食: 'bg-orange-50 text-orange-600',
  生理數據: 'bg-red-50 text-red-600',
} as const;

export function RecordsView({ records }: RecordsViewProps) {
  const [activeTab, setActiveTab] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const tabs = ['全部', '用藥', '回診', '生理數據', '飲食'];

  const allRecords = records.map((item) => {
    const summary = getRecordSummary(item);
    const rawTime = item.receivedAt || item['收到時間'] || '08:00';
    const displayTime = formatTime(rawTime);
    const originalMsg = String(item.originalMessage || item['原始訊息'] || '');

    let typeStr: RecordType = '生理數據';
    if (originalMsg.includes('藥')) typeStr = '用藥';
    else if (originalMsg.includes('診')) typeStr = '回診';
    else if (originalMsg.includes('餐') || originalMsg.includes('食')) typeStr = '飲食';

    return {
      time: displayTime,
      title: summary,
      type: typeStr,
      icon: ICON_MAP[typeStr] || HeartPulse,
      source: 'LINE 同步',
      color: COLOR_MAP[typeStr] || 'text-primary-500',
      tagClass: TAG_MAP[typeStr] || 'bg-red-50 text-red-600',
      raw: item,
    };
  });

  const filteredRecords = allRecords.filter((item) => {
    const matchesTab = activeTab === '全部' || item.type === activeTab;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.raw['原始訊息'] || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-0 pb-24">
      <Header title="照顧紀錄" />

      {/* Tabs */}
      <div className="overflow-x-auto no-scrollbar px-6 py-4 flex gap-2 sticky top-[60px] bg-neutral-50/80 backdrop-blur-md z-30">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              activeTab === tab
                ? 'bg-primary-500 text-white shadow-md shadow-primary-100'
                : 'bg-white text-slate-500 border border-slate-100'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-6 space-y-6 pt-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="搜尋紀錄..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm w-full"
            />
          </div>
        </div>

        {/* Timeline */}
        {filteredRecords.length > 0 ? (
          <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
            {filteredRecords.map((item, idx) => (
              <div key={idx} className="relative">
                <div
                  className={cn(
                    'absolute -left-[19px] top-1 w-4 h-4 rounded-full border-4 border-neutral-50 bg-white shadow-sm ring-2 ring-primary-100',
                    idx === 0 && 'ring-primary-500'
                  )}
                ></div>
                <div className="bg-white border border-slate-50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <item.icon size={16} className={item.color} />
                      <span className="text-xs font-bold text-slate-400">{item.time}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-50 rounded-full text-slate-400 italic">
                      {item.source}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 leading-relaxed">{item.title}</h4>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md', item.tagClass)}>
                      {item.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100/50">
            <p className="text-slate-400 text-sm font-semibold">目前無已確認的照顧紀錄 🍃</p>
            <p className="text-slate-300 text-xs mt-1">確認 LINE 同步紀錄後將顯示於此</p>
          </div>
        )}
      </div>
    </div>
  );
}
