import React, { useEffect } from 'react';
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
import { tokenStore } from './lib/api';

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
  const {
    loadAll,
    onboardingComplete,
    setUser,
    subjects,
    loading,
    resetStore,
  } = useAppStore();

  // ── On mount: restore session from refresh token ───────────────────────────
  useEffect(() => {
    refresh();
  }, []);

  // ── Sync auth user into app store for convenience ──────────────────────────
  useEffect(() => {
    if (user) setUser(user);
  }, [user]);

  // ── Load all data when user logs in ───────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn) loadAll();
  }, [isLoggedIn]);

  // ── When user logs out: clear the persisted app store (onboardingComplete etc.)
  // This prevents a different user logging in on the same device and skipping onboarding.
  useEffect(() => {
    if (!isLoggedIn) {
      resetStore();
    }
  }, [isLoggedIn]);

  // ── Listen for forced logout (expired tokens) ─────────────────────────────
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  // ── Boot screen ────────────────────────────────────────────────────────────
  if (isLoading) return <AppLoader />;

  // ── Auth required ──────────────────────────────────────────────────────────
  if (!isLoggedIn || !user) return <AuthScreen />;

  // ── FIX C4: Show onboarding only when BOTH the persisted flag is false
  //    AND subjects haven't loaded yet / are truly empty.
  //    This means an existing user who refreshes will never get stuck in
  //    onboarding because their subjects come back from the API.
  //    We also wait for the subjects load to finish before deciding.
  const subjectsLoaded = !loading.subjects;
  const showOnboarding = !onboardingComplete && subjectsLoaded && subjects.length === 0;
  if (showOnboarding) return <Onboarding />;

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
