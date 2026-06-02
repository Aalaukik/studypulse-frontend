import React, { useState } from 'react';
import { BarChart2, FileText, Trophy, Star, Settings as SettingsIcon, Plus, Trash2, LogOut } from 'lucide-react';
import { useAppStore } from '../../store';
import { useAuthStore } from '../../lib/auth';
import { Card, SectionHeader, Badge, EmptyState, Modal, SubjectSelector, ProgressBar, ConfirmDialog, StatCard } from '../shared';
import { format, addDays, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { xpToLevel, getRankTitle, XP_EVENTS, getLast7Days, getDailyMinutes, computeWeeklyScore } from '../../utils';

// ─── Time Audit ────────────────────────────────────────────────────────────────
export function TimeAudit() {
  const { sessions, subjects, goals } = useAppStore();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const actualBySubject = subjects.map(sub => {
    const subSessions = sessions.filter(s =>
      s.subjectId === sub.id && s.mode === 'focus' &&
      s.startTime >= weekStart && s.startTime <= weekEnd
    );
    const actual = subSessions.reduce((a, s) => a + s.duration, 0);
    const subGoals = goals.filter(g => g.subjectId === sub.id && g.status === 'active');
    const planned = subGoals.length * 30; // assume 30 min per goal
    return {
      subject: sub.name,
      actual,
      planned,
      color: sub.color,
      diff: actual - planned,
    };
  });

  const totalActual = actualBySubject.reduce((a, s) => a + s.actual, 0);
  const totalPlanned = actualBySubject.reduce((a, s) => a + s.planned, 0);

  const days = getLast7Days();
  const dailyData = days.map((d, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    minutes: getDailyMinutes(sessions, [d])[0],
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Time Audit" subtitle={`Week of ${format(parseISO(weekStart), 'MMM d')} – ${format(parseISO(weekEnd), 'MMM d')}`} icon={<BarChart2 size={20} />} />

      <div className="grid grid-cols-2 gap-4">
        <Card><p className="text-xs text-slate-400">Total Planned</p><p className="text-2xl font-display font-bold text-white">{totalPlanned}m</p></Card>
        <Card><p className="text-xs text-slate-400">Total Actual</p><p className="text-2xl font-display font-bold" style={{ color: totalActual >= totalPlanned ? '#10b981' : '#f59e0b' }}>{totalActual}m</p></Card>
      </div>

      <Card>
        <h3 className="font-display font-semibold text-white mb-4">Planned vs Actual by Subject</h3>
        <div className="space-y-4">
          {actualBySubject.map(s => (
            <div key={s.subject}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-300">{s.subject}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs">Plan: {s.planned}m</span>
                  <span className="font-semibold" style={{ color: s.diff >= 0 ? '#10b981' : '#ef4444' }}>
                    {s.diff >= 0 ? '+' : ''}{s.diff}m
                  </span>
                </div>
              </div>
              <div className="relative h-5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="absolute top-0 left-0 h-full rounded-full opacity-30" style={{ width: `${Math.min(100, (s.planned / Math.max(totalPlanned, 1)) * 100)}%`, background: s.color }} />
                <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (s.actual / Math.max(totalPlanned, 1)) * 100)}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-semibold text-white mb-4">Daily Study Minutes</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={dailyData}>
            <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="minutes" radius={[4, 4, 0, 0]} fill="#10b981" name="Minutes" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ─── Past Papers ───────────────────────────────────────────────────────────────
export function PastPapers() {
  const { pastPapers, subjects, addPastPaper, deletePastPaper } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ subjectId: '', name: '', year: new Date().getFullYear().toString(), score: 0, topicsText: '' });

  const handleAdd = () => {
    if (!form.name || !form.subjectId || form.score < 0) return;
    const topics = form.topicsText.split('\n').map(t => t.trim()).filter(Boolean);
    addPastPaper({ subjectId: form.subjectId, name: form.name, year: form.year, score: form.score, topics });
    setForm({ subjectId: '', name: '', year: new Date().getFullYear().toString(), score: 0, topicsText: '' });
    setShowAdd(false);
  };

  const avgBySubject = subjects.map(sub => {
    const papers = pastPapers.filter(p => p.subjectId === sub.id);
    if (papers.length === 0) return null;
    const avg = Math.round(papers.reduce((a, p) => a + p.score, 0) / papers.length);
    return { subject: sub.name, avg, count: papers.length, color: sub.color, icon: sub.icon };
  }).filter(Boolean) as { subject: string; avg: number; count: number; color: string; icon: string }[];

  const topicFreq: Record<string, number> = {};
  pastPapers.forEach(p => p.topics.forEach(t => { topicFreq[t] = (topicFreq[t] || 0) + 1; }));
  const frequentTopics = Object.entries(topicFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Past Papers" subtitle={`${pastPapers.length} papers logged`} icon={<FileText size={20} />}
        action={<button className="btn-primary flex items-center gap-2" onClick={() => setShowAdd(true)}><Plus size={16} /> Add Paper</button>} />

      {avgBySubject.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {avgBySubject.map(s => (
            <Card key={s.subject}>
              <div className="flex items-center gap-2 mb-2">
                <span>{s.icon}</span>
                <span className="text-sm text-slate-300">{s.subject}</span>
              </div>
              <p className="text-3xl font-display font-bold" style={{ color: s.avg >= 70 ? '#10b981' : s.avg >= 50 ? '#f59e0b' : '#ef4444' }}>{s.avg}%</p>
              <p className="text-xs text-slate-400 mt-1">{s.count} paper{s.count !== 1 ? 's' : ''} attempted</p>
              <ProgressBar value={s.avg} color={s.avg >= 70 ? '#10b981' : s.avg >= 50 ? '#f59e0b' : '#ef4444'} className="mt-3" height={4} />
            </Card>
          ))}
        </div>
      )}

      {frequentTopics.length > 0 && (
        <Card>
          <h3 className="font-display font-semibold text-white mb-3">Frequent Topics</h3>
          <div className="flex flex-wrap gap-2">
            {frequentTopics.map(([topic, count]) => (
              <div key={topic} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <span className="text-sm text-indigo-300">{topic}</span>
                <span className="text-xs font-bold text-indigo-400">{count}×</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {pastPapers.length === 0 ? (
        <EmptyState icon={<FileText />} title="No papers logged" description="Track your past paper attempts to identify patterns and improvement areas"
          action={<button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> Add paper</button>} />
      ) : (
        <div className="space-y-3">
          {pastPapers.map(paper => {
            const subject = subjects.find(s => s.id === paper.subjectId);
            const scoreColor = paper.score >= 70 ? '#10b981' : paper.score >= 50 ? '#f59e0b' : '#ef4444';
            return (
              <Card key={paper.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white">{paper.name}</h4>
                      <Badge label={paper.year} color="#6366f1" />
                    </div>
                    {subject && <p className="text-xs text-slate-400 mb-2">{subject.icon} {subject.name} · {paper.date}</p>}
                    {paper.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {paper.topics.slice(0, 5).map(t => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="text-2xl font-display font-bold" style={{ color: scoreColor }}>{paper.score}%</p>
                    </div>
                    <button onClick={() => setDeleteId(paper.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Past Paper">
        <div className="space-y-4">
          <div><label className="text-xs text-slate-400 block mb-1.5">Subject</label><SubjectSelector value={form.subjectId} onChange={v => setForm(p => ({ ...p, subjectId: v }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-400 block mb-1.5">Paper Name</label><input className="input-dark" placeholder="e.g. Mock Paper 3" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="text-xs text-slate-400 block mb-1.5">Year</label><input className="input-dark" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} /></div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Score (%)</label>
            <input type="number" min={0} max={100} className="input-dark" value={form.score} onChange={e => setForm(p => ({ ...p, score: Number(e.target.value) }))} />
          </div>
          <div><label className="text-xs text-slate-400 block mb-1.5">Topics Covered (one per line)</label><textarea className="input-dark resize-none" rows={4} value={form.topicsText} onChange={e => setForm(p => ({ ...p, topicsText: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2"><button className="btn-ghost flex-1" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn-primary flex-1" onClick={handleAdd}>Add Paper</button></div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onConfirm={() => { if (deleteId) deletePastPaper(deleteId); setDeleteId(null); }} onCancel={() => setDeleteId(null)} message="This paper record will be permanently deleted." />
    </div>
  );
}

// ─── XP & Levels ───────────────────────────────────────────────────────────────
export function XPSystem() {
  const { xpEvents, subjects, reviewCards, startChallenge, activeChallenge, endChallenge } = useAppStore();
  const { user } = useAuthStore();
  const xp = user?.xp || 0;
  const { level, progress, nextLevelXP } = xpToLevel(xp);
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeForm, setChallengeForm] = useState({ title: '', targetGoals: 4, durationMinutes: 90 });

  const masteryLevels = ['Beginner', 'Developing', 'Intermediate', 'Advanced', 'Expert'];
  const subjectMasteryData = subjects.map(sub => {
    const cards = reviewCards.filter((c: any) => c.subjectId === sub.id);
    const avgEF = cards.length > 0 ? cards.reduce((a: number, c: any) => a + c.easeFactor, 0) / cards.length : 2.5;
    return { subject: sub.name.slice(0, 8), mastery: Math.min(100, Math.round((avgEF - 1.3) / (3.0 - 1.3) * 100)), color: sub.color };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="XP & Levels" subtitle="Track your progress and earn rewards" icon={<Trophy size={20} />} />

      {/* XP Hero Card */}
      <Card glow="amber" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: '#f59e0b', transform: 'translate(30%, -30%)' }} />
        <div className="flex items-center gap-6 flex-wrap">
          <div className="relative">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-display font-bold"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
              {level}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
              <span className="text-xs">⭐</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-display font-bold text-white">{user?.rank || 'Fresh Start'}</h2>
            <p className="text-slate-400">{xp.toLocaleString()} XP total</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Level {level}</span><span>Level {level + 1}</span>
              </div>
              <ProgressBar value={progress} color="#f59e0b" height={8} />
              <p className="text-xs text-slate-500 mt-1">{nextLevelXP - xp} XP to next level</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* XP Events table */}
        <Card>
          <h3 className="font-display font-semibold text-white mb-4">XP Rewards</h3>
          <div className="space-y-2">
            {Object.entries(XP_EVENTS).map(([event, xp]) => (
              <div key={event} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-sm text-slate-300 capitalize">{event.replace(/_/g, ' ')}</span>
                <span className="text-sm font-bold text-amber-400">+{xp} XP</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Subject mastery radar */}
        <Card>
          <h3 className="font-display font-semibold text-white mb-4">Subject Mastery</h3>
          {subjectMasteryData.length > 2 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={subjectMasteryData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Radar dataKey="mastery" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-sm py-8 text-center">Add more subjects to see mastery radar</p>
          )}
        </Card>
      </div>

      {/* Challenge Mode */}
      <Card style={{ border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.05)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-white">⚡ Challenge Mode</h3>
            <p className="text-slate-400 text-sm">Set a timed sprint and earn a badge on completion</p>
          </div>
          {!activeChallenge && (
            <button className="btn-primary text-sm" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }} onClick={() => setShowChallenge(true)}>
              Start Challenge
            </button>
          )}
        </div>
        {activeChallenge ? (
          <div className="p-4 rounded-xl animate-pulse-slow" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <p className="text-indigo-300 font-semibold">🎯 Active: {activeChallenge.title}</p>
            <p className="text-slate-400 text-sm mt-1">Target: {activeChallenge.targetGoals} goals in {activeChallenge.durationMinutes} minutes</p>
            <button className="btn-primary mt-3 text-sm w-full" onClick={() => activeChallenge && endChallenge(activeChallenge.id)} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              Complete Challenge 🏅
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {[
              { title: "Focus Sprint", targetGoals: 2, durationMinutes: 45 },
              { title: "Power Hour", targetGoals: 4, durationMinutes: 90 },
              { title: "Marathon", targetGoals: 8, durationMinutes: 180 },
            ].map(c => (
              <button key={c.title} onClick={() => startChallenge(c)}
                className="p-3 rounded-xl text-center transition-all hover:scale-105 tap-target"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <p className="text-sm font-semibold text-indigo-300">{c.title}</p>
                <p className="text-xs text-slate-400 mt-1">{c.targetGoals} goals · {c.durationMinutes}m</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Recent XP Events */}
      <Card>
        <h3 className="font-display font-semibold text-white mb-4">Recent XP</h3>
        {xpEvents.length === 0 ? <p className="text-slate-400 text-sm">Complete actions to earn XP!</p> : (
          <div className="space-y-2">
            {xpEvents.slice(0, 8).map(event => (
              <div key={event.id} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div>
                  <p className="text-sm text-white">{event.description}</p>
                  <p className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-bold text-amber-400">+{event.xp}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Weekly Review ──────────────────────────────────────────────────────────────
export function WeeklyReview() {
  const { weeklyReviews, generateWeeklyReview, goals, sessions } = useAppStore();
  const { user } = useAuthStore();
  const weeklyScore = computeWeeklyScore(goals, sessions, user?.dailyTargetValue || 3);
  const latestReview = weeklyReviews[0];
  const isNewWeek = !latestReview || new Date(latestReview.generatedAt).toDateString() !== new Date().toDateString();

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Weekly Review" subtitle="Your automated Sunday summary" icon={<Star size={20} />}
        action={<button className="btn-primary flex items-center gap-2" onClick={generateWeeklyReview}><Star size={16} /> Generate Report</button>} />

      {!latestReview ? (
        <EmptyState icon={<Star />} title="No weekly reviews yet"
          description="Generate your first weekly review to see your progress summary"
          action={<button className="btn-primary" onClick={generateWeeklyReview}><Star size={14} /> Generate now</button>} />
      ) : (
        <>
          <Card glow="emerald">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-display font-bold text-white">Week of {latestReview.weekStart}</h2>
                <p className="text-slate-400 text-sm">{latestReview.weekStart} → {latestReview.weekEnd}</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-display font-bold text-emerald-400">{latestReview.weeklyScore}</p>
                <p className="text-xs text-slate-400">weekly score</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-2xl font-display font-bold text-white">{latestReview.goalsCompleted}</p>
                <p className="text-xs text-slate-400">Goals done</p>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-2xl font-display font-bold text-amber-400">{latestReview.streakDays}d</p>
                <p className="text-xs text-slate-400">Streak</p>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-2xl font-display font-bold text-blue-400">{latestReview.totalMinutes}m</p>
                <p className="text-xs text-slate-400">Total focus</p>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-2xl font-display font-bold text-purple-400">{latestReview.avgFocusRating}/5</p>
                <p className="text-xs text-slate-400">Avg focus</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-2">💪 Top subjects</p>
                <div className="space-y-1">
                  {latestReview.topSubjects.map(s => (
                    <div key={s} className="text-sm text-emerald-300 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{s}</div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">⚠️ Needs attention</p>
                <div className="space-y-1">
                  {latestReview.bottomSubjects.map(s => (
                    <div key={s} className="text-sm text-amber-300 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{s}</div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-display font-semibold text-white mb-4">💡 Suggested Goals for Next Week</h3>
            <div className="space-y-2">
              {latestReview.suggestedGoals.map((g, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>{i + 1}</span>
                  <span className="text-sm text-slate-300">{g}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Settings ──────────────────────────────────────────────────────────────────
export function Settings() {
  const { subjects, addSubject, removeSubject } = useAppStore();
  const { user, updateProfile, logout } = useAuthStore();
  const [name, setName]         = useState(user?.name || '');
  const [targetVal, setTargetVal] = useState(user?.dailyTargetValue || 3);
  const [targetType, setTargetType] = useState(user?.dailyTargetType || 'goals');
  const [newSubject, setNewSubject] = useState('');
  const [saved, setSaved]       = useState(false);

  const handleSave = async () => {
    await updateProfile({ name, dailyTargetType: targetType, dailyTargetValue: targetVal });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Settings" subtitle="Customise your study environment" icon={<SettingsIcon size={20} />} />

      <Card>
        <h3 className="font-display font-semibold text-white mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Display Name</label>
            <input className="input-dark" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Email</label>
            <input className="input-dark opacity-60 cursor-not-allowed" value={user?.email || ''} disabled />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Daily Target</label>
            <div className="flex gap-3 items-center">
              <input type="number" min={1} max={targetType === 'goals' ? 20 : 300}
                className="input-dark w-24" value={targetVal}
                onChange={e => setTargetVal(Number(e.target.value))} />
              <select className="input-dark" value={targetType}
                onChange={e => setTargetType(e.target.value)}>
                <option value="goals">goals / day</option>
                <option value="minutes">minutes / day</option>
              </select>
            </div>
          </div>
          <button className="btn-primary" onClick={handleSave}>
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-semibold text-white mb-4">Subjects</h3>
        <div className="space-y-2 mb-4">
          {subjects.map(sub => (
            <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="text-sm text-slate-300">{sub.icon} {sub.name}</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: sub.color }} />
                <button onClick={() => removeSubject(sub.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input-dark flex-1" placeholder="New subject name…" value={newSubject}
            onChange={e => setNewSubject(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newSubject.trim()) { addSubject(newSubject); setNewSubject(''); } }} />
          <button className="btn-primary" onClick={() => { if (newSubject.trim()) { addSubject(newSubject); setNewSubject(''); } }}>
            <Plus size={16} />
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-semibold text-white mb-3">Account</h3>
        <p className="text-xs text-slate-400 mb-4">All your data is securely stored in the database and synced across devices.</p>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-2 rounded-lg hover:bg-red-400/10"
        >
          <LogOut size={15} /> Sign out of StudyPulse
        </button>
      </Card>

      <Card>
        <h3 className="font-display font-semibold text-white mb-3">About StudyPulse</h3>
        <div className="space-y-1 text-sm text-slate-400">
          <p>Version 1.0.0 — Database edition</p>
          <p>Your personal study operating system.</p>
        </div>
      </Card>
    </div>
  );
}
