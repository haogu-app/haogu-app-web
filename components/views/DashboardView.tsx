'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Share2, TrendingUp, Copy, Check } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { Header } from '@/components/Header';
import { formatTime, cleanDisplayMessage, detectSubject, detectCategory, cleanSummaryText, extractEventTime } from '@/lib/utils';
import { LINE_OA_URL } from '@/lib/constants';
import type { RawLineSync, View } from '@/lib/types';

const TEMPLATE = '#好顧 阿嬤晚上9點吃胃藥';

interface DashboardViewProps {
  setView: (v: View) => void;
  lineSyncs: RawLineSync[];
  confirmedRecords: RawLineSync[];
}

type CareItem = { time: string; regTime: string; text: string; hasEventTime: boolean };
type TimeGroup = { time: string; items: CareItem[] };

function groupByTime(items: CareItem[]): TimeGroup[] {
  const map = new Map<string, CareItem[]>();
  for (const item of items) {
    if (!map.has(item.time)) map.set(item.time, []);
    map.get(item.time)!.push(item);
  }
  return Array.from(map.entries()).map(([time, its]) => ({ time, items: its }));
}

export function DashboardView({ setView, lineSyncs, confirmedRecords }: DashboardViewProps) {
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
    if (localStorage.getItem('onboarding_completed') === 'true') setOnboardingDone(true);
  }, []);

  const now = new Date();
  const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // ── Today's confirmed records ────────────────────────────────────────────
  const todayRecords = confirmedRecords.filter((r) => {
    const d = new Date(r.receivedAt || r['收到時間'] || '');
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  });

  // ── Stats ────────────────────────────────────────────────────────────────
  const medicationCount = todayRecords.filter((r) => {
    const raw = r.recordSummary || r['AI整理結果'] || r.displayMessage || '';
    return detectCategory(raw) === '用藥';
  }).length;

  // ── Flat care items ──────────────────────────────────────────────────────
  const allItems: CareItem[] = todayRecords.map((r) => {
    const raw = r.recordSummary || r['AI整理結果'] || r.displayMessage || '';
    const timeSource = r.originalMessage || r['原始訊息'] || r.displayMessage || raw;
    const regTime = formatTime(r.receivedAt || r['收到時間'] || '', true);
    const eventTime = extractEventTime(timeSource);
    const time = eventTime ?? regTime;
    const subject = detectSubject(raw);
    const text = cleanSummaryText(raw, subject);
    return { time, regTime, text, hasEventTime: !!eventTime };
  });

  // upcoming: event time in future — sort ascending (nearest first)
  const upcoming = allItems
    .filter((i) => i.hasEventTime && i.time > nowHHMM)
    .sort((a, b) => a.time.localeCompare(b.time));

  // completed: no event time OR event time in past — sort descending (latest first)
  const completed = allItems
    .filter((i) => !i.hasEventTime || i.time <= nowHHMM)
    .sort((a, b) => b.time.localeCompare(a.time));

  const nextReminder = upcoming.length > 0 ? upcoming[0].time : null;
  const upcomingGroups = groupByTime(upcoming);
  const completedGroups = groupByTime(completed);

  // ── Onboarding ───────────────────────────────────────────────────────────
  const showOnboarding = !onboardingDone && confirmedRecords.length === 0;

  const handleDismissOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setOnboardingDone(true);
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(TEMPLATE);
    } catch {
      const el = document.createElement('textarea');
      el.value = TEMPLATE;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Share text ───────────────────────────────────────────────────────────
  const buildShareText = (): string => {
    const url = 'https://haogu-app-web.vercel.app';
    if (allItems.length === 0) return `今日尚無已確認照顧紀錄。\n\n查看好顧：\n${url}`;
    const lines: string[] = ['【好顧】今日照顧摘要'];
    if (upcoming.length > 0) {
      lines.push('', '即將到來：');
      upcomingGroups.forEach(({ time, items }) =>
        items.forEach((it) => lines.push(`${time} ${it.text}`)),
      );
    }
    if (completed.length > 0) {
      lines.push('', '已完成：');
      completedGroups.forEach(({ time, items }) =>
        items.forEach((it) => lines.push(`${time} ${it.text}`)),
      );
    }
    lines.push('', '查看好顧：', url);
    return lines.join('\n');
  };

  const handleShareConfirmed = async () => {
    const text = buildShareText();
    if (isMobile) {
      window.open(`https://line.me/R/share?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    }
  };

  // ── Stats card (unchanged) ───────────────────────────────────────────────
  const dynamicStats = [
    { name: '陪診',    hours: lineSyncs.filter((s) => s['原始訊息']?.includes('診')).length * 3 || 2, color: '#4a7c59' },
    { name: '日常照護', hours: lineSyncs.filter((s) => s['原始訊息']?.includes('食') || s['原始訊息']?.includes('餐')).length * 5 || 4, color: '#6b9080' },
    { name: '用藥管理', hours: lineSyncs.filter((s) => s['原始訊息']?.includes('藥')).length * 2 || 1, color: '#8ebbb0' },
    { name: '聯絡採買', hours: lineSyncs.length || 1, color: '#ff9f1c' },
  ];
  const totalHours = dynamicStats.reduce((s, i) => s + i.hours, 0);
  const estimatedValue = (totalHours * 300).toLocaleString();
  const todayDateStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // ── Time-group renderer ──────────────────────────────────────────────────
  const renderGroups = (groups: TimeGroup[]) =>
    groups.map(({ time, items }) => (
      <div key={time} className="bg-white/10 rounded-xl px-3 py-2.5">
        {items.length === 1 ? (
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-bold text-white leading-snug flex-1 min-w-0">
              {time} {items[0].text}
            </span>
            {items[0].regTime !== time && (
              <span className="text-[9px] text-primary-100/50 tabular-nums whitespace-nowrap shrink-0 pt-0.5">
                登記於 {items[0].regTime}
              </span>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm font-bold text-white mb-1.5">{time}</p>
            <div className="space-y-1">
              {items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3">
                  <span className="text-sm text-white/90 flex-1 min-w-0">· {item.text}</span>
                  {item.regTime !== time && (
                    <span className="text-[9px] text-primary-100/50 tabular-nums whitespace-nowrap shrink-0">
                      登記於 {item.regTime}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    ));

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-20">
      <Header title="好顧" showLogo />

      {/* Tagline */}
      <div className="px-6 -mt-2">
        <p className="text-sm text-slate-500 text-center leading-relaxed">
          用 LINE 記錄長輩近況，AI 自動整理成家人看得懂的照顧摘要
        </p>
      </div>

      {/* Three-stat bar */}
      <div className="px-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 text-center border border-slate-100 shadow-sm">
            <p className="text-2xl font-bold text-primary-500 tabular-nums">{medicationCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">已完成用藥</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center border border-slate-100 shadow-sm">
            <p className={`text-2xl font-bold tabular-nums ${lineSyncs.length > 0 ? 'text-red-500' : 'text-slate-300'}`}>
              {lineSyncs.length}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">待確認紀錄</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center border border-slate-100 shadow-sm">
            <p className="text-xl font-bold text-slate-700 tabular-nums">{nextReminder ?? '無'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">下次提醒</p>
          </div>
        </div>
      </div>

      {/* Onboarding card */}
      {showOnboarding && (
        <div className="px-6">
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-primary-700 text-sm">開始使用好顧</h3>
            <ol className="space-y-2.5">
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-primary-500 font-bold shrink-0">1.</span>
                <span>
                  在 LINE 傳送：
                  <span className="inline-block bg-white border border-primary-200 text-primary-700 font-mono text-xs px-2 py-0.5 rounded-lg ml-1 whitespace-nowrap">
                    #好顧 阿嬤晚上9點吃胃藥
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-primary-500 font-bold shrink-0">2.</span>
                <span>好顧會自動整理成照顧紀錄</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-primary-500 font-bold shrink-0">3.</span>
                <span>確認後可一鍵分享給家人</span>
              </li>
            </ol>
            <a
              href={LINE_OA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600 active:scale-95 transition-all"
            >
              前往 LINE 記錄
            </a>
            <button
              onClick={handleCopyTemplate}
              className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all ${
                copied ? 'bg-green-500 text-white' : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '已複製，可貼到 LINE 使用' : '複製記錄格式'}
            </button>
            <button
              onClick={handleDismissOnboarding}
              className="w-full pt-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              我知道了，不再顯示
            </button>
          </div>
        </div>
      )}

      {/* Compact pending notification */}
      {lineSyncs.length > 0 && (
        <div className="px-6">
          <button
            onClick={() => setView('lineSync')}
            className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between hover:bg-amber-100 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <MessageCircle size={16} className="text-amber-500 shrink-0" />
              <span className="text-sm font-bold text-amber-700">
                有 {lineSyncs.length} 筆 LINE 紀錄待確認
              </span>
            </div>
            <span className="text-xs font-bold text-amber-600 whitespace-nowrap">立即查看 →</span>
          </button>
        </div>
      )}

      {/* Today Summary */}
      <div className="px-6">
        <div className="bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl p-5 text-white shadow-lg shadow-primary-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-primary-100 text-xs mb-0.5">今天照顧摘要</p>
              <h2 className="text-xl font-bold">照顧摘要動態</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px]">
              {todayDateStr}
            </div>
          </div>

          {allItems.length === 0 ? (
            <div className="text-center py-4 space-y-1">
              <p className="text-sm text-primary-100/70">今日尚無已確認照顧紀錄</p>
              <p className="text-xs text-primary-100/50">完成確認後，這裡會自動產生今日摘要</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[320px] overflow-y-auto no-scrollbar">
              {upcoming.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-primary-200 uppercase tracking-wider mb-2">即將到來</p>
                  <div className="space-y-1.5">{renderGroups(upcomingGroups)}</div>
                </div>
              )}
              {completed.length > 0 && (
                <div>
                  {upcoming.length > 0 && <div className="border-t border-white/10 pt-3" />}
                  <p className="text-[10px] font-bold text-primary-200 uppercase tracking-wider mb-2">已完成</p>
                  <div className="space-y-1.5">{renderGroups(completedGroups)}</div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleShareConfirmed}
            className="w-full mt-4 bg-white/20 backdrop-blur-sm border border-white/30 py-2.5 rounded-xl flex items-center justify-center gap-2 text-white text-sm font-bold hover:bg-white/30 active:scale-95 transition-all"
          >
            {shareCopied ? (
              <><Check size={16} />已複製照顧摘要，請貼到 LINE 傳給家人</>
            ) : (
              <><Share2 size={16} />{isMobile ? '分享到 LINE' : '複製 LINE 分享文字'}</>
            )}
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
