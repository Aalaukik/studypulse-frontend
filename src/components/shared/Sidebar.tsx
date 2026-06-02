import React, { useState } from 'react';
import {
  LayoutDashboard, Target, Timer, Brain, CalendarDays, Activity,
  Flame, BookOpen, Zap, BarChart2, FileText, Trophy, Star,
  ChevronRight, Settings, Menu, X, LogOut
} from 'lucide-react';
import { useAppStore } from '../../store';
import { useAuthStore } from '../../lib/auth';
import { AppView } from '../../types';
import { xpToLevel } from '../../utils';

const navItems: { view: AppView; label: string; icon: React.ReactNode; color: string }[] = [
  { view: 'dashboard',         label: 'Dashboard',       icon: <LayoutDashboard size={18} />, color: '#10b981' },
  { view: 'goals',             label: 'Goals',           icon: <Target size={18} />,          color: '#6366f1' },
  { view: 'pomodoro',          label: 'Focus Timer',     icon: <Timer size={18} />,           color: '#f59e0b' },
  { view: 'spaced-repetition', label: 'Review Deck',     icon: <Brain size={18} />,           color: '#8b5cf6' },
  { view: 'exam-planner',      label: 'Exam Planner',    icon: <CalendarDays size={18} />,    color: '#3b82f6' },
  { view: 'subject-health',    label: 'Subject Health',  icon: <Activity size={18} />,        color: '#10b981' },
  { view: 'streak',            label: 'Streak & Score',  icon: <Flame size={18} />,           color: '#ef4444' },
  { view: 'mistake-journal',   label: 'Mistake Journal', icon: <BookOpen size={18} />,        color: '#ec4899' },
  { view: 'energy-journal',    label: 'Energy Log',      icon: <Zap size={18} />,             color: '#f59e0b' },
  { view: 'time-audit',        label: 'Time Audit',      icon: <BarChart2 size={18} />,       color: '#14b8a6' },
  { view: 'past-papers',       label: 'Past Papers',     icon: <FileText size={18} />,        color: '#6366f1' },
  { view: 'xp-system',         label: 'XP & Levels',     icon: <Trophy size={18} />,          color: '#f59e0b' },
  { view: 'weekly-review',     label: 'Weekly Review',   icon: <Star size={18} />,            color: '#10b981' },
];

export function Sidebar() {
  const { currentView, setView } = useAppStore();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const xp    = user?.xp || 0;
  const { level, progress } = xpToLevel(xp);

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 mb-8 px-1 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#10b981,#6366f1)' }}>
          <span className="text-white font-display font-bold text-sm">SP</span>
        </div>
        {!collapsed && (
          <span className="text-white font-display font-bold text-lg tracking-tight">
            Study<span className="gradient-text">Pulse</span>
          </span>
        )}
      </div>

      {/* User XP card */}
      {!collapsed && user && (
        <div className="glass rounded-xl p-3 mb-6" style={{ background: 'rgba(16,185,129,0.07)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#10b981,#6366f1)' }}>
              {user.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.name}</p>
              <p className="text-slate-400 text-xs truncate">{user.rank}</p>
            </div>
            <span className="text-xs font-bold text-emerald-400">Lv.{level}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#10b981,#6366f1)' }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-500">{xp} XP</span>
            <span className="text-xs text-slate-500">🔥 {user.streak}d</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => { setView(item.view); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 tap-target ${
                active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
              style={active ? { background: `${item.color}18`, color: item.color, boxShadow: `inset 0 0 0 1px ${item.color}22` } : {}}
              title={collapsed ? item.label : undefined}
            >
              <span style={active ? { color: item.color } : {}}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && active && <ChevronRight size={14} className="ml-auto" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-4 pt-4 border-t border-white/5 space-y-0.5">
        <button onClick={() => setView('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all ${collapsed ? 'justify-center' : ''}`}>
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button onClick={() => logout()}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all ${collapsed ? 'justify-center' : ''}`}>
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
        {!collapsed
          ? <button onClick={() => setCollapsed(true)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-400 hover:bg-white/5 transition-all"><ChevronRight size={14} className="rotate-180" /><span>Collapse</span></button>
          : <button onClick={() => setCollapsed(false)} className="w-full flex justify-center px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"><ChevronRight size={18} /></button>
        }
      </div>
    </>
  );

  return (
    <>
      <button className="lg:hidden fixed top-4 left-4 z-50 p-2.5 glass rounded-xl" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileOpen(false)} />}

      <aside className={`hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0 transition-all duration-300 overflow-hidden ${collapsed ? 'w-16' : 'w-60'}`}
        style={{ background: 'rgba(2,8,23,0.95)', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '20px 12px' }}>
        <NavContent />
      </aside>

      <aside className={`lg:hidden fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 260, background: 'rgba(2,8,23,0.98)', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '20px 12px', paddingTop: 70 }}>
        <NavContent />
      </aside>
    </>
  );
}
