import React, { useState } from 'react';
import {
  Target, Flame, Brain, Clock, TrendingUp, Zap,
  CheckCircle2, Calendar, Plus
} from 'lucide-react';
import { useAppStore } from '../../store';
import { useAuthStore } from '../../lib/auth';
import { Card, StatCard, Badge, ProgressBar, SubjectDot, Modal } from '../shared';
import { SubjectSelector } from '../shared';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { getDailyGoalCounts, getDailyMinutes, getLast7Days, getHealthColor, computeWeeklyScore } from '../../utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

export function Dashboard() {
  const {
    goals, sessions, subjects, reviewCards, exams,
    getDueCards, completeGoal, setView, addGoal, energyLogs, logEnergy
  } = useAppStore();
  const { user } = useAuthStore();

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', subjectId: '', priority: 'Medium' as const, deadline: '' });

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayGoals = goals.filter(g => g.status === 'active');
  const completedToday = goals.filter(g => g.completedAt?.startsWith(today));
  const dueCards = getDueCards();
  const todaySessions = sessions.filter(s => s.startTime?.startsWith(today));
  const minutesToday = todaySessions.filter(s => s.mode === 'focus').reduce((a, s) => a + (s.duration || 0), 0);
  const weeklyScore = computeWeeklyScore(goals, sessions, user?.dailyTargetValue || 3);
  const todayEnergy = energyLogs.find(l => l.date === today);

  const days = getLast7Days();
  const chartData = days.map((d, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][new Date(d).getDay() === 0 ? 6 : new Date(d).getDay() - 1] || d.slice(5),
    goals: getDailyGoalCounts(goals, [d])[0],
    minutes: Math.round(getDailyMinutes(sessions, [d])[0]),
  }));

  const nearestExam = exams
    .filter(e => (e.examDate || e.date) > today)
    .sort((a, b) => (a.examDate || a.date).localeCompare(b.examDate || b.date))[0];

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.subjectId) return;
    addGoal({ title: newGoal.title, subjectId: newGoal.subjectId, priority: newGoal.priority, deadline: newGoal.deadline || undefined });
    setNewGoal({ title: '', subjectId: '', priority: 'Medium', deadline: '' });
    setShowAddGoal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name || 'Scholar'} 👋
          </h1>
          <p className="text-slate-400 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button
          onClick={() => setShowAddGoal(true)}
          className="btn-primary flex items-center gap-2 hidden sm:flex"
        >
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {/* Energy Check-in banner */}
      {!todayEnergy && (
        <Card className="border border-amber-500/20" style={{ background: 'rgba(245,158,11,0.06)' }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-amber-400 font-semibold text-sm">⚡ How's your energy today?</p>
              <p className="text-slate-400 text-xs mt-0.5">Quick check-in takes under 3 seconds</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => logEnergy(n)}
                  className="w-9 h-9 rounded-xl font-bold text-sm transition-all hover:scale-110 tap-target"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Goals Today" value={`${completedToday.length}/${user?.dailyTargetValue || 3}`}
          icon={<Target size={20} />} color="#6366f1"
          subtitle={`${todayGoals.length} pending`} />
        <StatCard label="Streak" value={`${user?.streak || 0}d`}
          icon={<Flame size={20} />} color="#ef4444"
          subtitle={`Best: ${user?.bestStreak || 0}d`} />
        <StatCard label="Review Due" value={dueCards.length}
          icon={<Brain size={20} />} color="#8b5cf6"
          subtitle={dueCards.length > 0 ? 'Cards waiting' : 'All caught up!'} />
        <StatCard label="Focus Time" value={`${minutesToday}m`}
          icon={<Clock size={20} />} color="#14b8a6"
          subtitle="Today's sessions" />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Goals */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-white">Today's Goals</h3>
              <button onClick={() => setView('goals')} className="text-xs text-emerald-400 hover:text-emerald-300">View all →</button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {todayGoals.slice(0, 8).map(goal => {
                const subject = subjects.find(s => s.id === goal.subjectId);
                const isDone = goal.status === 'completed';
                return (
                  <div key={goal.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isDone ? 'opacity-50' : 'hover:bg-white/5'}`}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <button
                      onClick={() => !isDone && completeGoal(goal.id)}
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                      style={{ background: isDone ? '#10b981' : 'transparent', border: `2px solid ${isDone ? '#10b981' : 'rgba(255,255,255,0.2)'}` }}
                    >
                      {isDone && <CheckCircle2 size={14} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                        {goal.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <SubjectDot subject={subject} showName />
                        {goal.deadline && (
                          <span className="text-xs text-slate-500">
                            Due {format(parseISO(goal.deadline), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      label={goal.priority}
                      color={goal.priority === 'High' ? '#ef4444' : goal.priority === 'Medium' ? '#f59e0b' : '#10b981'}
                    />
                  </div>
                );
              })}
              {todayGoals.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-slate-400 text-sm">All caught up! Add new goals to keep momentum.</p>
                </div>
              )}
            </div>
            <button onClick={() => setShowAddGoal(true)}
              className="w-full mt-3 p-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2">
              <Plus size={14} /> Add goal
            </button>
          </Card>

          {/* Weekly Activity Chart */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-white">Weekly Activity</h3>
              <div className="flex gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded" style={{ background: '#6366f1', display: 'inline-block' }} /> Goals</span>
                <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded" style={{ background: '#10b981', display: 'inline-block' }} /> Minutes</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barGap={4}>
                <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="goals" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.8} />
                <Bar dataKey="minutes" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Weekly Score */}
          <Card glow="emerald">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-white">Weekly Score</h3>
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <div className="flex items-center justify-center my-4">
              <div className="relative">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - weeklyScore / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-display font-bold text-white">{weeklyScore}</span>
                </div>
              </div>
            </div>
            <ProgressBar value={weeklyScore} color="#10b981" height={4} showLabel />
          </Card>

          {/* Nearest Exam */}
          {nearestExam && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} style={{ color: nearestExam.color }} />
                <h3 className="font-display font-semibold text-white text-sm">Upcoming Exam</h3>
              </div>
              <p className="font-semibold text-white">{nearestExam.name}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-slate-400 text-sm">{format(parseISO(nearestExam.examDate || nearestExam.date), 'MMM d, yyyy')}</span>
                <span className="font-bold text-lg" style={{ color: nearestExam.color }}>
                  {differenceInDays(parseISO(nearestExam.examDate || nearestExam.date), new Date())}d
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-400 mb-2">Topics to cover:</p>
                <div className="flex flex-wrap gap-1">
                  {nearestExam.topics.slice(0, 4).map(t => (
                    <Badge key={t} label={t} color={nearestExam.color} />
                  ))}
                  {nearestExam.topics.length > 4 && (
                    <Badge label={`+${nearestExam.topics.length - 4} more`} color="#475569" />
                  )}
                </div>
              </div>
              <button onClick={() => setView('exam-planner')}
                className="btn-ghost w-full mt-3 text-xs">View planner →</button>
            </Card>
          )}

          {/* Due Reviews */}
          {dueCards.length > 0 && (
            <Card style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-white text-sm">Due for Review</h3>
                <Badge label={`${dueCards.length}`} color="#8b5cf6" />
              </div>
              <div className="space-y-1.5">
                {dueCards.slice(0, 3).map(card => {
                  const subject = subjects.find(s => s.id === card.subjectId);
                  return (
                    <div key={card.id} className="flex items-center gap-2 text-sm">
                      <SubjectDot subject={subject} />
                      <span className="text-slate-300 truncate">{card.topic}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setView('spaced-repetition')}
                className="btn-ghost w-full mt-3 text-xs" style={{ borderColor: 'rgba(139,92,246,0.3)', color: '#8b5cf6' }}>
                Start review session →
              </button>
            </Card>
          )}

          {/* Subject Health Snapshot */}
          <Card>
            <h3 className="font-display font-semibold text-white text-sm mb-3">Subject Health</h3>
            <div className="space-y-3">
              {subjects.map(sub => (
                <div key={sub.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300">{sub.icon} {sub.name}</span>
                    <span className="text-sm font-bold" style={{ color: getHealthColor(sub.healthScore >= 70 ? 'Healthy' : sub.healthScore >= 40 ? 'At Risk' : 'Neglected') }}>
                      {sub.healthScore}
                    </span>
                  </div>
                  <ProgressBar
                    value={sub.healthScore}
                    color={getHealthColor(sub.healthScore >= 70 ? 'Healthy' : sub.healthScore >= 40 ? 'At Risk' : 'Neglected')}
                    height={3}
                  />
                </div>
              ))}
            </div>
            <button onClick={() => setView('subject-health')} className="btn-ghost w-full mt-3 text-xs">
              View details →
            </button>
          </Card>
        </div>
      </div>

      {/* Add Goal Modal */}
      <Modal isOpen={showAddGoal} onClose={() => setShowAddGoal(false)} title="Add New Goal">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Goal Title</label>
            <input className="input-dark" placeholder="What do you want to accomplish?"
              value={newGoal.title} onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Subject</label>
            <SubjectSelector value={newGoal.subjectId} onChange={v => setNewGoal(p => ({ ...p, subjectId: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Priority</label>
              <select className="input-dark" value={newGoal.priority}
                onChange={e => setNewGoal(p => ({ ...p, priority: e.target.value as any }))}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Deadline (optional)</label>
              <input type="date" className="input-dark" value={newGoal.deadline}
                onChange={e => setNewGoal(p => ({ ...p, deadline: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1" onClick={() => setShowAddGoal(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleAddGoal}>Add Goal</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
