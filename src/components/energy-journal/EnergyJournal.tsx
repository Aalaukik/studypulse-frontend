import React, { useState } from 'react';
import { Zap, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../store';
import { Card, SectionHeader, StatCard } from '../shared';
import { format, addDays } from 'date-fns';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const ENERGY_LABELS = ['', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'];
const ENERGY_COLORS = ['', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981'];
const ENERGY_EMOJI = ['', '😴', '😐', '😊', '⚡', '🚀'];

export function EnergyJournal() {
  const { energyLogs, sessions, logEnergy, logWhatWorked, getTodayEnergyLog } = useAppStore();
  const [whatWorked, setWhatWorked] = useState('');
  const todayLog = getTodayEnergyLog();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Last 14 days energy data
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = format(addDays(new Date(), -(13 - i)), 'yyyy-MM-dd');
    const log = energyLogs.find(l => l.date === d);
    const daySessions = sessions.filter(s => s.startTime.startsWith(d) && s.mode === 'focus' && s.focusRating);
    const avgFocus = daySessions.length > 0
      ? daySessions.reduce((a, s) => a + (s.focusRating || 3), 0) / daySessions.length : 0;
    return {
      date: d,
      day: format(addDays(new Date(), -(13 - i)), 'EEE'),
      energy: log?.energyLevel || 0,
      focus: Math.round(avgFocus * 10) / 10,
      distractions: log?.distractions || 0,
    };
  });

  // Correlation data (energy vs focus)
  const correlationData = last14
    .filter(d => d.energy > 0 && d.focus > 0)
    .map(d => ({ energy: d.energy, focus: d.focus, day: d.day }));

  // Average by energy level
  const avgByEnergy: Record<number, { totalFocus: number; count: number }> = {};
  correlationData.forEach(d => {
    if (!avgByEnergy[d.energy]) avgByEnergy[d.energy] = { totalFocus: 0, count: 0 };
    avgByEnergy[d.energy].totalFocus += d.focus;
    avgByEnergy[d.energy].count++;
  });

  const avgEnergy = energyLogs.length > 0
    ? Math.round(energyLogs.reduce((a, l) => a + l.energyLevel, 0) / energyLogs.length * 10) / 10
    : 0;

  const handleWhatWorked = () => {
    if (!whatWorked.trim()) return;
    logWhatWorked(whatWorked);
    setWhatWorked('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Energy Journal" subtitle="Understand how your energy affects your study quality" icon={<Zap size={20} />} />

      {/* Today's check-in */}
      <Card className={todayLog ? 'border border-emerald-500/20' : 'border border-amber-500/20'}
        style={{ background: todayLog ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-display font-semibold text-white">
              {todayLog ? `Today's energy: ${ENERGY_LABELS[todayLog.energyLevel]} ${ENERGY_EMOJI[todayLog.energyLevel]}` : "How's your energy today?"}
            </h3>
            <p className="text-slate-400 text-sm mt-0.5">
              {todayLog ? 'Tap to update' : 'Quick check-in — takes under 3 seconds'}
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => logEnergy(n)}
                className="w-10 h-10 rounded-xl font-bold text-sm transition-all hover:scale-110 active:scale-95 tap-target flex flex-col items-center justify-center"
                style={{
                  background: todayLog?.energyLevel === n ? `${ENERGY_COLORS[n]}30` : 'rgba(255,255,255,0.07)',
                  color: todayLog?.energyLevel === n ? ENERGY_COLORS[n] : '#64748b',
                  border: `1px solid ${todayLog?.energyLevel === n ? `${ENERGY_COLORS[n]}50` : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: todayLog?.energyLevel === n ? `0 0 12px ${ENERGY_COLORS[n]}30` : undefined,
                }}
              >
                <span className="text-base">{ENERGY_EMOJI[n]}</span>
                <span className="text-xs">{n}</span>
              </button>
            ))}
          </div>
        </div>

        {/* What worked */}
        {todayLog && (
          <div className="mt-4 pt-4 border-t border-white/05">
            <p className="text-xs text-slate-400 mb-2">✨ What made today's session good?</p>
            <div className="flex gap-2">
              <input
                className="input-dark text-sm flex-1"
                placeholder="e.g. Studied early morning, no phone nearby…"
                value={whatWorked}
                onChange={e => setWhatWorked(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleWhatWorked()}
              />
              <button className="btn-primary text-sm px-4" onClick={handleWhatWorked}>Save</button>
            </div>
            {todayLog.whatWorked && (
              <p className="text-sm text-emerald-300 mt-2 italic">"{todayLog.whatWorked}"</p>
            )}
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Avg Energy" value={avgEnergy || '—'} icon={<Zap size={20} />} color="#f59e0b" subtitle="Last 14 days" />
        <StatCard label="Days Logged" value={energyLogs.length} icon={<TrendingUp size={20} />} color="#10b981" subtitle="Total check-ins" />
        <StatCard
          label="Best Day"
          value={last14.reduce((best, d) => d.energy > best.energy ? d : best, { energy: 0, day: '—' }).day}
          icon={<Zap size={20} />} color="#8b5cf6"
          subtitle="Highest energy"
        />
        <StatCard
          label="Today"
          value={todayLog ? `${ENERGY_EMOJI[todayLog.energyLevel]} ${todayLog.energyLevel}/5` : '—'}
          icon={<Zap size={20} />} color={todayLog ? ENERGY_COLORS[todayLog.energyLevel] : '#64748b'}
          subtitle="Energy level"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 14-day energy bar */}
        <Card>
          <h3 className="font-display font-semibold text-white mb-4">14-Day Energy Levels</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={last14}>
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} hide />
              <Tooltip
                contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                formatter={(v: any, name: string) => [v, name === 'energy' ? 'Energy' : 'Focus']}
              />
              <Bar dataKey="energy" radius={[4, 4, 0, 0]} name="energy">
                {last14.map((entry, i) => (
                  <Cell key={i} fill={entry.energy > 0 ? ENERGY_COLORS[entry.energy] : 'rgba(255,255,255,0.06)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Energy vs Focus correlation */}
        <Card>
          <h3 className="font-display font-semibold text-white mb-1">Energy vs Focus Quality</h3>
          <p className="text-xs text-slate-400 mb-4">Each dot = one study day</p>
          {correlationData.length < 3 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-500 text-sm">Log more energy + complete focus sessions to see correlation</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <ScatterChart>
                <XAxis dataKey="energy" name="Energy" domain={[0, 5]} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Energy', position: 'insideBottom', fill: '#475569', fontSize: 11 }} />
                <YAxis dataKey="focus" name="Focus" domain={[0, 5]} hide />
                <Tooltip
                  contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }}
                  formatter={(v: any, name: string) => [`${v}/5`, name]}
                />
                <Scatter data={correlationData} fill="#10b981" opacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Recent logs */}
      <Card>
        <h3 className="font-display font-semibold text-white mb-4">Recent Energy Logs</h3>
        {energyLogs.length === 0 ? (
          <p className="text-slate-400 text-sm">No logs yet. Start by checking in today!</p>
        ) : (
          <div className="space-y-2">
            {energyLogs.slice(0, 7).map(log => (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-2xl">{ENERGY_EMOJI[log.energyLevel]}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{ENERGY_LABELS[log.energyLevel]}</span>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `${ENERGY_COLORS[log.energyLevel]}20`, color: ENERGY_COLORS[log.energyLevel] }}>
                      {log.energyLevel}/5
                    </span>
                  </div>
                  {log.whatWorked && <p className="text-xs text-slate-400 italic mt-0.5">"{log.whatWorked}"</p>}
                </div>
                <span className="text-xs text-slate-500">{log.date}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
