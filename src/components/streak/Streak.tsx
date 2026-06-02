import React from 'react';
import { Flame, Target, Clock, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../store';
import { useAuthStore } from '../../lib/auth';
import { Card, SectionHeader, ProgressBar, StatCard } from '../shared';
import { computeWeeklyScore, getLast7Days, format, addDays } from '../../utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function StreakAndScore() {
  const { goals, sessions } = useAppStore();
  const { user, updateProfile } = useAuthStore();

  const dailyTargetValue = user?.dailyTargetValue || 3;
  const dailyTargetType  = user?.dailyTargetType  || 'goals';
  const streak           = user?.streak     || 0;
  const bestStreak       = user?.bestStreak || 0;

  const weeklyScore = computeWeeklyScore(goals, sessions, dailyTargetValue);

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d         = format(addDays(new Date(), -(29 - i)), 'yyyy-MM-dd');
    const completed = goals.filter(g => g.completedAt?.startsWith(d)).length;
    const mins      = sessions.filter(s => s.startTime?.startsWith(d) && s.mode === 'focus')
                              .reduce((a: number, s: any) => a + (s.duration || 0), 0);
    const met = dailyTargetType === 'goals' ? completed >= dailyTargetValue : mins >= dailyTargetValue;
    return { date: d, day: format(addDays(new Date(), -(29 - i)), 'EEE'), completed, mins, met };
  });

  const streakDays   = last30Days.filter(d => d.met).length;
  const totalMinutes = sessions.filter((s: any) => s.mode === 'focus').reduce((a: number, s: any) => a + (s.duration || 0), 0);
  const totalGoals   = goals.filter(g => g.status === 'completed').length;
  const last7        = last30Days.slice(-7);

  // Best hour analysis
  const hourCounts: Record<number, { total: number; count: number }> = {};
  sessions.forEach((s: any) => {
    const h = new Date(s.startTime).getHours();
    if (!hourCounts[h]) hourCounts[h] = { total: 0, count: 0 };
    hourCounts[h].total += s.focusRating || 3;
    hourCounts[h].count++;
  });
  const bestHour = Object.entries(hourCounts)
    .map(([h, v]) => ({ hour: Number(h), avg: v.total / v.count }))
    .sort((a, b) => b.avg - a.avg)[0];
  const bestWindow = bestHour
    ? `${bestHour.hour < 12 ? bestHour.hour || 12 : bestHour.hour - 12 || 12}${bestHour.hour < 12 ? 'am' : 'pm'}`
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Streak & Score" subtitle="Track your consistency over time" icon={<Flame size={20} />} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Current Streak" value={`${streak}d`}         icon={<Flame size={20} />}    color="#ef4444" subtitle={`Best: ${bestStreak}d`} />
        <StatCard label="Weekly Score"   value={weeklyScore}           icon={<TrendingUp size={20} />} color="#10b981" subtitle="This week" />
        <StatCard label="Goals Done"     value={totalGoals}            icon={<Target size={20} />}   color="#6366f1" subtitle="All time" />
        <StatCard label="Focus Hours"    value={`${Math.round(totalMinutes / 60)}h`} icon={<Clock size={20} />} color="#f59e0b" subtitle={`${totalMinutes} minutes`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 30-day heatmap */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h3 className="font-display font-semibold text-white mb-4">30-Day Activity</h3>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(30, 1fr)' }}>
              {last30Days.map((day, i) => (
                <div key={i} className="aspect-square rounded-sm transition-all hover:scale-125 tooltip"
                  data-tip={`${day.date}: ${day.completed} goals`}
                  style={{
                    background: day.met ? '#10b981' : day.completed > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)',
                    boxShadow:  day.met ? '0 0 6px rgba(16,185,129,0.4)' : undefined,
                  }} />
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
              <span>30 days ago</span>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255,255,255,0.06)' }} /> <span>None</span>
                <div className="w-3 h-3 rounded-sm ml-2" style={{ background: 'rgba(16,185,129,0.3)' }} /> <span>Partial</span>
                <div className="w-3 h-3 rounded-sm ml-2" style={{ background: '#10b981' }} /> <span>Met target</span>
              </div>
              <span>Today</span>
            </div>
          </Card>

          <Card>
            <h3 className="font-display font-semibold text-white mb-4">This Week's Goals</h3>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={last7}>
                <defs>
                  <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fill="url(#goalGrad)" strokeWidth={2} name="Goals Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <Card glow="emerald">
            <div className="text-center py-4">
              <div className="text-6xl mb-3 animate-float">🔥</div>
              <p className="text-5xl font-display font-bold text-white">{streak}</p>
              <p className="text-slate-400 mt-1">day streak</p>
              <div className="mt-4 pt-4 border-t border-white/05">
                <p className="text-xs text-slate-400">Best: <span className="text-white font-bold">{bestStreak} days</span></p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-display font-semibold text-white text-sm mb-4">Daily Target</h3>
            <p className="text-2xl font-display font-bold text-white mb-3">
              {dailyTargetValue}
              <span className="text-sm text-slate-400 ml-1">{dailyTargetType === 'goals' ? 'goals/day' : 'min/day'}</span>
            </p>
            <div className="space-y-3">
              <div>
                <select className="input-dark text-sm mb-2" value={dailyTargetType}
                  onChange={e => updateProfile({ dailyTargetType: e.target.value })}>
                  <option value="goals">goals / day</option>
                  <option value="minutes">minutes / day</option>
                </select>
                <input type="range" min={1} max={dailyTargetType === 'goals' ? 20 : 240}
                  value={dailyTargetValue}
                  onChange={e => updateProfile({ dailyTargetValue: Number(e.target.value) })} />
              </div>
            </div>
          </Card>

          {bestWindow && (
            <Card>
              <h3 className="font-display font-semibold text-white text-sm mb-1">Peak Focus Window</h3>
              <p className="text-2xl font-display font-bold text-amber-400">{bestWindow}</p>
              <p className="text-xs text-slate-400 mt-1">Best avg focus quality</p>
            </Card>
          )}

          <Card>
            <h3 className="font-display font-semibold text-white text-sm mb-4">Weekly Score</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#10b981" strokeWidth="7"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - weeklyScore / 100)}`}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-display font-bold text-white">{weeklyScore}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Days met target</span>
                <span className="text-white font-medium">{streakDays}/30</span>
              </div>
              <ProgressBar value={streakDays} max={30} color="#10b981" height={3} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
