'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Share2, TrendingUp, ChevronRight, Copy, Check } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { Header } from '@/components/Header';
import { formatTime, cleanDisplayMessage, detectSubject, detectCategory, cleanSummaryText, extractEventTime } from '@/lib/utils';
import { LINE_OA_URL } from '@/lib/constants';
import type { RawLineSync, View } from '@/lib/types';

const TEMPLATE = '#好顧 阿嬤晚上9點吃胃藥';

const SUBJECT_EMOJI: Record<string, string> = {
  阿嬤: '👵', 阿公: '👴', 爸爸: '👨', 媽媽: '👩', 奶奶: '👵', 爺爺: '👴', 家人: '👤',
};
const CATEGORY_EMOJI: Record<string, string> = {
  用藥: '💊', 量測: '📊', 飲食: '🍱', 就醫: '🏥', 清潔: '🛁', 狀態: '💬', 其他: '📝',
};

interface DashboardViewProps {
  setView: (v: View) => void;
  lineSyncs: RawLineSync[];
  confirmedRecords: RawLineSync[];
}

export function DashboardView({ setView, lineSyncs, confirmedRecords }: DashboardViewProps) {
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
    if (localStorage.getItem('onboarding_completed') === 'true') {
      setOnboardingDone(true);
    }
  }, []);

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
    .sort((a, b) => {
      const key = (r: RawLineSync) => {
        const src = r.originalMessage || r['原始訊息'] || r.displayMessage || r.recordSummary || '';
        return extractEventTime(src) ?? formatTime(r.receivedAt || r['收到時間'] || '', true);
      };
      return key(b).localeCompare(key(a)); // newest first
    });

  // Group today's records by subject → category
  type CareEntry = { time: string; regTime: string; text: string };
  const grouped = new Map<string, Map<string, CareEntry[]>>();
  for (const r of todayRecords) {
    const raw = r.recordSummary || r['AI整理結果'] || r.displayMessage || '';
    const subject = detectSubject(raw);
    const category = detectCategory(raw);
    const text = cleanSummaryText(raw, subject);
    const timeSource = r.originalMessage || r['原始訊息'] || r.displayMessage || raw;
    const regTime = formatTime(r.receivedAt || r['收到時間'] || '', true);
    const time = extractEventTime(timeSource) ?? regTime;
    if (!grouped.has(subject)) grouped.set(subject, new Map());
    const catMap = grouped.get(subject)!;
    if (!catMap.has(category)) catMap.set(category, []);
    catMap.get(category)!.push({ time, regTime, text });
  }

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

  const buildShareText = (): string => {
    const url = 'https://haogu-app-web.vercel.app';
    if (todayRecords.length === 0) return `今日尚無已確認照顧紀錄。\n\n查看好顧：\n${url}`;
    const lines: string[] = ['今日照顧摘要：'];
    for (const [subject, catMap] of grouped) {
      lines.push('');
      lines.push(`${SUBJECT_EMOJI[subject] ?? '👤'} ${subject}`);
      for (const [category, entries] of catMap) {
        lines.push(`${CATEGORY_EMOJI[category] ?? '📝'} ${category}`);
        for (const { time, text } of entries) lines.push(`  ${time} ${text}`);
      }
    }
    lines.push('', url);
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

      {/* Tagline */}
      <div className="px-6 -mt-2">
        <p className="text-sm text-slate-500 text-center leading-relaxed">
          用 LINE 記錄長輩近況，AI 自動整理成家人看得懂的照顧摘要
        </p>
      </div>

      {/* Onboarding Card */}
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
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
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

      {/* LINE Sync */}
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
                <h3 className="font-bold text-slate-700">待確認紀錄</h3>
                {lineSyncs.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {lineSyncs.length} 筆待確認
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">從 LINE 收到的新紀錄會出現在這裡</p>
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
              <div className="text-center py-3 space-y-1">
                <p className="text-xs text-slate-500 font-medium">尚無待確認紀錄</p>
                <p className="text-[11px] text-slate-400">
                  請到 LINE 傳送：
                  <span className="font-mono text-primary-500 ml-1">#好顧 阿嬤晚上9點吃胃藥</span>
                </p>
              </div>
            )}
          </div>
        </button>

        {lineSyncs.length === 0 && (
          <div className="flex gap-2 mt-3">
            <a
              href={LINE_OA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-center bg-green-500 text-white hover:bg-green-600 active:scale-95 transition-all"
            >
              前往 LINE 記錄
            </a>
            <button
              onClick={handleCopyTemplate}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                copied ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '已複製！' : '複製記錄格式'}
            </button>
          </div>
        )}
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

          <div className="space-y-3 max-h-[260px] overflow-y-auto no-scrollbar">
            {todayRecords.length === 0 ? (
              <div className="text-center py-4 space-y-1">
                <p className="text-sm text-primary-100/70">今日尚無已確認照顧紀錄</p>
                <p className="text-xs text-primary-100/50">完成確認後，這裡會自動產生今日摘要</p>
              </div>
            ) : (
              Array.from(grouped.entries()).map(([subject, catMap]) => (
                <div key={subject}>
                  <p className="text-sm font-bold text-white mb-2">
                    {SUBJECT_EMOJI[subject] ?? '👤'} {subject}
                  </p>
                  {Array.from(catMap.entries()).map(([category, entries]) => (
                    <div key={category} className="ml-1 mb-2 last:mb-0">
                      <p className="text-[11px] font-semibold text-primary-100 mb-1">
                        {CATEGORY_EMOJI[category] ?? '📝'} {category}
                      </p>
                      <div className="space-y-1 ml-1">
                        {entries.map((entry, i) => (
                          <div key={i} className="bg-white/10 rounded-lg px-2.5 py-1.5">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[10px] text-primary-100/80 font-mono tabular-nums shrink-0">
                                {entry.time}
                              </span>
                              <span className="text-xs text-white/90 leading-relaxed">{entry.text}</span>
                            </div>
                            {entry.regTime !== entry.time && (
                              <p className="text-[9px] text-primary-100/40 mt-0.5 tabular-nums">
                                登記：{entry.regTime}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleShareConfirmed}
            className="w-full mt-4 bg-white/20 backdrop-blur-sm border border-white/30 py-2.5 rounded-xl flex items-center justify-center gap-2 text-white text-sm font-bold hover:bg-white/30 active:scale-95 transition-all"
          >
            {shareCopied ? (
              <>
                <Check size={16} />
                已複製照顧摘要，請貼到 LINE 傳給家人
              </>
            ) : (
              <>
                <Share2 size={16} />
                {isMobile ? '分享到 LINE' : '複製 LINE 分享文字'}
              </>
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
