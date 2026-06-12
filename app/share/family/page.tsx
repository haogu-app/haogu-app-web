'use client';

import { useState, useEffect } from 'react';
import { Heart, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FAMILY_ID } from '@/lib/constants';
import type { CareRecordRow } from '@/lib/types';

const TYPE_BADGE: Record<string, string> = {
  用藥: 'bg-green-50 text-green-600',
  回診: 'bg-blue-50 text-blue-600',
  飲食: 'bg-orange-50 text-orange-600',
  生理數據: 'bg-red-50 text-red-600',
};

function detectType(r: CareRecordRow): string {
  const text = [r.original_message, r.display_message, r.record_summary].join(' ');
  if (text.includes('藥')) return '用藥';
  if (text.includes('診')) return '回診';
  if (text.includes('食') || text.includes('餐')) return '飲食';
  return '生理數據';
}

function toTW(d: Date): Date {
  return new Date(d.getTime() + 8 * 60 * 60 * 1000);
}

function formatRecordTime(receivedAt: string): string {
  const tw = toTW(new Date(receivedAt));
  const twNow = toTW(new Date());
  const hh = String(tw.getUTCHours()).padStart(2, '0');
  const mm = String(tw.getUTCMinutes()).padStart(2, '0');
  const timeStr = `${hh}:${mm}`;
  if (tw.getUTCFullYear() === twNow.getUTCFullYear() &&
      tw.getUTCMonth() === twNow.getUTCMonth() &&
      tw.getUTCDate() === twNow.getUTCDate()) return timeStr;
  const mo = String(tw.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(tw.getUTCDate()).padStart(2, '0');
  return `${mo}/${dd} ${timeStr}`;
}

export default function FamilySharePage() {
  const [records, setRecords] = useState<CareRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('care_records')
        .select('*')
        .eq('family_id', FAMILY_ID)
        .eq('confirmed', true)
        .order('received_at', { ascending: false })
        .limit(20);

      setRecords((data ?? []) as CareRecordRow[]);
      setUpdatedAt(
        new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
      );
      setLoading(false);
    };
    load();
  }, []);

  const now = new Date();

  const twNow = toTW(now);
  const todayRecords = records
    .filter((r) => {
      const tw = toTW(new Date(r.received_at));
      return tw.getUTCFullYear() === twNow.getUTCFullYear() &&
             tw.getUTCMonth() === twNow.getUTCMonth() &&
             tw.getUTCDate() === twNow.getUTCDate();
    })
    .sort((a, b) => a.received_at.localeCompare(b.received_at));

  const monthCount = records.filter((r) => {
    const tw = toTW(new Date(r.received_at));
    return tw.getUTCFullYear() === twNow.getUTCFullYear() && tw.getUTCMonth() === twNow.getUTCMonth();
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-md mx-auto px-6 py-8 space-y-6 pb-16">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Heart size={14} className="text-primary-500" fill="currentColor" />
              <span className="text-[11px] font-bold text-primary-500 tracking-widest uppercase">好顧</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">阿嬤近況</h1>
            <p className="text-xs text-slate-400 mt-0.5">家庭照顧同步紀錄</p>
          </div>
          <div className="bg-white border border-slate-100 px-3 py-2 rounded-2xl shadow-sm text-right">
            <p className="text-[10px] text-slate-400 mb-0.5">更新時間</p>
            <p className="text-sm font-bold text-slate-700">{updatedAt}</p>
          </div>
        </div>

        {/* ── Today Summary ──────────────────────────────── */}
        <div className="bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl p-5 text-white shadow-lg shadow-primary-200/60">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={17} className="text-primary-100" />
            <h2 className="font-bold text-sm tracking-wide">今日照顧摘要</h2>
            <span className="ml-auto text-[10px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full font-semibold">
              {todayRecords.length} 筆
            </span>
          </div>

          {todayRecords.length > 0 ? (
            <div className="space-y-2">
              {todayRecords.map((r) => {
                const tw = toTW(new Date(r.received_at));
                const hh = String(tw.getUTCHours()).padStart(2, '0');
                const mm = String(tw.getUTCMinutes()).padStart(2, '0');
                return (
                  <div key={r.id} className="flex items-start gap-2.5 bg-white/10 rounded-xl p-3">
                    <span className="text-[11px] font-bold text-primary-100 whitespace-nowrap pt-0.5 tabular-nums">
                      {hh}:{mm}
                    </span>
                    <p className="text-sm text-white/90 leading-relaxed">
                      {r.record_summary || r.display_message}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-primary-100/60 text-center py-4">今日尚無照顧紀錄</p>
          )}
        </div>

        {/* ── Recent Records ─────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">最近照顧紀錄</h3>
            <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
              最多 20 筆
            </span>
          </div>

          {records.length > 0 ? (
            <div className="space-y-3">
              {records.map((r) => {
                const type = detectType(r);
                return (
                  <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-500 tabular-nums">
                        {formatRecordTime(r.received_at)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${TYPE_BADGE[type] ?? ''}`}>
                        {type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {r.record_summary || r.display_message}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
              <Users size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">尚無已確認照顧紀錄</p>
            </div>
          )}
        </div>

        {/* ── Monthly Stats ──────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary-500" />
            <h3 className="font-bold text-slate-700 text-sm">本月照顧投入統計</h3>
          </div>
          <div className="bg-primary-50 border border-primary-100/60 rounded-2xl p-4 text-center">
            <p className="text-4xl font-bold text-primary-600 tabular-nums">{monthCount}</p>
            <p className="text-xs text-primary-500 mt-1.5 font-medium">本月已確認照顧紀錄（筆）</p>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-300">由 好顧 · HaoGu 提供家庭照顧同步服務</p>
        </div>

      </div>
    </div>
  );
}
