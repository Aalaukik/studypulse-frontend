import React, { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { useAuthStore } from './lib/auth';
import { Sidebar } from './components/shared/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { Goals } from './components/goals/Goals';
import { PomodoroTimer } from './components/pomodoro/Pomodoro';
import { SpacedRepetition } from './components/spaced-repetition/SpacedRepetition';
import { ExamPlanner } from './components/exam-planner/ExamPlanner';
import { SubjectHealth } from './components/subject-health/SubjectHealth';
import { StreakAndScore } from './components/streak/Streak';
import { MistakeJournal } from './components/mistake-journal/MistakeJournal';
import { EnergyJournal } from './components/energy-journal/EnergyJournal';
import { TimeAudit, PastPapers, XPSystem, WeeklyReview, Settings } from './components/shared/OtherViews';
import { ToastContainer } from './components/shared';
import { Onboarding } from './components/shared/Onboarding';
import { AuthScreen } from './components/auth/AuthScreen';
import { AppLoader } from './components/shared/AppLoader';

function ViewRenderer() {
  const currentView = useAppStore(s => s.currentView);
  switch (currentView) {
    case 'dashboard':         return <Dashboard />;
    case 'goals':             return <Goals />;
    case 'pomodoro':          return <PomodoroTimer />;
    case 'spaced-repetition': return <SpacedRepetition />;
    case 'exam-planner':      return <ExamPlanner />;
    case 'subject-health':    return <SubjectHealth />;
    case 'streak':            return <StreakAndScore />;
    case 'mistake-journal':   return <MistakeJournal />;
    case 'energy-journal':    return <EnergyJournal />;
    case 'time-audit':        return <TimeAudit />;
    case 'past-papers':       return <PastPapers />;
    case 'xp-system':         return <XPSystem />;
    case 'weekly-review':     return <WeeklyReview />;
    case 'settings':          return <Settings />;
    default:                  return <Dashboard />;
  }
}

export default function App() {
  const { user, isLoading, isLoggedIn, logout, refresh } = useAuthStore();
  const { loadAll, onboardingComplete, completeOnboarding, setUser } = useAppStore();

  // FIX: track whether initial data fetch has completed to prevent
  // onboarding flash on refresh for existing users.
  const [dataLoaded, setDataLoaded] = useState(false);

  // ── On mount: restore session from refresh token ───────────────────────────
  useEffect(() => {
    refresh();
  }, []);

  // ── Sync auth user into app store for convenience ──────────────────────────
  useEffect(() => {
    if (user) setUser(user);
  }, [user]);

  // ── Load all data when user logs in ───────────────────────────────────────
  // FIX: after loadAll resolves, check subjects to decide if onboarding is
  // needed. This prevents the state from resetting on every page refresh.
  useEffect(() => {
    if (isLoggedIn) {
      loadAll().then(() => {
        const { subjects } = useAppStore.getState();
        if (subjects.length > 0) completeOnboarding();
        setDataLoaded(true);
      });
    }
  }, [isLoggedIn]);

  // ── Listen for forced logout (expired tokens) ─────────────────────────────
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  // ── Auth loading (checking stored refresh token on boot) ──────────────────
  if (isLoading) return <AppLoader />;

  // ── Auth required ──────────────────────────────────────────────────────────
  if (!isLoggedIn || !user) return <AuthScreen />;

  // ── Data loading (fetching subjects/goals etc. after login) ───────────────
  if (!dataLoaded) return <AppLoader />;

  // ── Onboarding for brand-new users (no subjects yet) ──────────────────────
  if (!onboardingComplete) return <Onboarding />;

  // ── Main app ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/3 w-72 h-72 rounded-full blur-3xl opacity-5"
          style={{ background: 'linear-gradient(135deg,#10b981,#6366f1)' }} />
        <div className="absolute bottom-1/3 right-0 w-96 h-96 rounded-full blur-3xl opacity-4"
          style={{ background: '#8b5cf6' }} />
      </div>

      <Sidebar />

      <main className="flex-1 min-h-screen overflow-y-auto relative" style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8 pt-16 lg:pt-8">
          <ViewRenderer />
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
