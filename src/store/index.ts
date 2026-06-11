import { create } from 'zustand';
import {
  subjectsApi, goalsApi, reviewCardsApi, examsApi,
  sessionsApi, mistakesApi, energyApi, papersApi,
  weeklyReviewsApi, xpApi, challengesApi,
  authApi, // FIX: added for completeGoal user sync
} from '../lib/api';
import { AppView, ReviewRating, Priority } from '../types';
import { computeSubjectHealth, sm2Update, computeStreak, format, addDays } from '../utils';

// ─── State shape ──────────────────────────────────────────────────────────────

interface LoadingMap { [key: string]: boolean }

interface AppState {
  currentView:  AppView;
  setView:      (v: AppView) => void;

  subjects:      any[];
  goals:         any[];
  reviewCards:   any[];
  exams:         any[];
  sessions:      any[];
  mistakes:      any[];
  energyLogs:    any[];
  pastPapers:    any[];
  weeklyReviews: any[];
  xpEvents:      any[];
  activeChallenge: any | null;

  loading: LoadingMap;
  errors:  Record<string, string | null>;

  onboardingComplete: boolean;
  completeOnboarding: () => void;

  loadAll:        () => Promise<void>;
  loadSubjects:   () => Promise<void>;
  loadGoals:      () => Promise<void>;
  loadReviewCards:() => Promise<void>;
  loadExams:      () => Promise<void>;
  loadSessions:   () => Promise<void>;
  loadMistakes:   () => Promise<void>;
  loadEnergyLogs: () => Promise<void>;
  loadPastPapers: () => Promise<void>;
  loadWeeklyReviews: () => Promise<void>;
  loadXPEvents:   () => Promise<void>;
  loadActiveChallenge: () => Promise<void>;

  addSubject:    (name: string) => Promise<void>;
  removeSubject: (id: string)   => Promise<void>;

  addGoal:     (data: { subjectId: string; title: string; priority: Priority; deadline?: string }) => Promise<void>;
  completeGoal:(id: string) => Promise<void>;
  deleteGoal:  (id: string)  => Promise<void>;
  editGoal:    (id: string, data: any) => Promise<void>;

  addReviewCard:    (subjectId: string, topic: string) => Promise<void>;
  rateReviewCard:   (id: string, rating: ReviewRating) => Promise<void>;
  deleteReviewCard: (id: string) => Promise<void>;
  getDueCards:      () => any[];

  addExam:    (data: any) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;

  activeSession: any | null;
  startSession:  (mode: string, subjectId?: string) => void;
  endSession:    (focusRating?: number, distractions?: number) => Promise<void>;
  logDistraction: () => void;
  getSessionsToday: () => any[];

  addMistake:    (data: any) => Promise<void>;
  deleteMistake: (id: string) => Promise<void>;

  logEnergy:         (level: number) => Promise<void>;
  logWhatWorked:     (note: string)  => Promise<void>;
  getTodayEnergyLog: () => any | null;

  addPastPaper:    (data: any) => Promise<void>;
  deletePastPaper: (id: string) => Promise<void>;

  generateWeeklyReview: () => Promise<void>;

  startChallenge: (data: any)  => Promise<void>;
  endChallenge:   (id: string) => Promise<void>;

  user: any;
  setUser: (u: any) => void;
}

function setLoading(set: any, key: string, val: boolean) {
  set((s: AppState) => ({ loading: { ...s.loading, [key]: val } }));
}

export const useAppStore = create<AppState>((set, get) => ({

  currentView: 'dashboard',
  setView:     (v) => set({ currentView: v }),

  subjects:      [],
  goals:         [],
  reviewCards:   [],
  exams:         [],
  sessions:      [],
  mistakes:      [],
  energyLogs:    [],
  pastPapers:    [],
  weeklyReviews: [],
  xpEvents:      [],
  activeChallenge: null,
  activeSession:   null,
  user:            null,

  loading: {},
  errors:  {},

  onboardingComplete: false,
  completeOnboarding: () => set({ onboardingComplete: true }),

  setUser: (u) => set({ user: u }),

  // ── Load all ───────────────────────────────────────────────────────────────
  loadAll: async () => {
    await Promise.allSettled([
      get().loadSubjects(),
      get().loadGoals(),
      get().loadReviewCards(),
      get().loadExams(),
      get().loadSessions(),
      get().loadMistakes(),
      get().loadEnergyLogs(),
      get().loadPastPapers(),
      get().loadWeeklyReviews(),
      get().loadXPEvents(),
      get().loadActiveChallenge(),
    ]);
  },

  // ── Individual loaders ─────────────────────────────────────────────────────
  loadSubjects: async () => {
    setLoading(set, 'subjects', true);
    try { set({ subjects: await subjectsApi.list() }); } catch {}
    finally { setLoading(set, 'subjects', false); }
  },

  loadGoals: async () => {
    setLoading(set, 'goals', true);
    try { set({ goals: await goalsApi.list() }); } catch {}
    finally { setLoading(set, 'goals', false); }
  },

  loadReviewCards: async () => {
    setLoading(set, 'reviewCards', true);
    try { set({ reviewCards: await reviewCardsApi.list() }); } catch {}
    finally { setLoading(set, 'reviewCards', false); }
  },

  loadExams: async () => {
    setLoading(set, 'exams', true);
    try { set({ exams: await examsApi.list() }); } catch {}
    finally { setLoading(set, 'exams', false); }
  },

  loadSessions: async () => {
    setLoading(set, 'sessions', true);
    try { set({ sessions: await sessionsApi.list({ limit: 200 }) }); } catch {}
    finally { setLoading(set, 'sessions', false); }
  },

  loadMistakes: async () => {
    setLoading(set, 'mistakes', true);
    try { set({ mistakes: await mistakesApi.list() }); } catch {}
    finally { setLoading(set, 'mistakes', false); }
  },

  loadEnergyLogs: async () => {
    setLoading(set, 'energyLogs', true);
    try { set({ energyLogs: await energyApi.list() }); } catch {}
    finally { setLoading(set, 'energyLogs', false); }
  },

  loadPastPapers: async () => {
    setLoading(set, 'pastPapers', true);
    try { set({ pastPapers: await papersApi.list() }); } catch {}
    finally { setLoading(set, 'pastPapers', false); }
  },

  loadWeeklyReviews: async () => {
    setLoading(set, 'weeklyReviews', true);
    try { set({ weeklyReviews: await weeklyReviewsApi.list() }); } catch {}
    finally { setLoading(set, 'weeklyReviews', false); }
  },

  loadXPEvents: async () => {
    try { set({ xpEvents: await xpApi.list() }); } catch {}
  },

  loadActiveChallenge: async () => {
    try { set({ activeChallenge: await challengesApi.active() }); } catch {}
  },

  // ── Subjects ───────────────────────────────────────────────────────────────
  addSubject: async (name) => {
    const colors = ['#10b981','#6366f1','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
    const icons  = ['📚','🔬','📐','🌍','💻','🎨','🏛️','🧬','📊','🎵'];
    const idx    = get().subjects.length % colors.length;
    const subject = await subjectsApi.create({ name, color: colors[idx], icon: icons[idx] });
    set(s => ({ subjects: [...s.subjects, subject] }));
  },

  removeSubject: async (id) => {
    set(s => ({ subjects: s.subjects.filter(x => x.id !== id) }));
    await subjectsApi.delete(id);
  },

  // ── Goals ──────────────────────────────────────────────────────────────────
  addGoal: async (data) => {
    const goal = await goalsApi.create(data);
    set(s => ({ goals: [goal, ...s.goals] }));
  },

  // FIX: use authApi.me() instead of refresh() — no token rotation needed,
  // just a lightweight profile fetch to sync updated xp/streak into the UI.
  completeGoal: async (id) => {
    set(s => ({
      goals: s.goals.map(g =>
        g.id === id ? { ...g, status: 'completed', completedAt: new Date().toISOString() } : g
      ),
    }));
    const updated = await goalsApi.complete(id);
    set(s => ({ goals: s.goals.map(g => g.id === id ? updated : g) }));

    authApi.me().then(freshUser => {
      import('./authStoreProxy').then(({ useAuthStore }) => {
        useAuthStore.setState(s => ({ ...s, user: freshUser }));
      });
    }).catch(() => {});
  },

  deleteGoal: async (id) => {
    set(s => ({ goals: s.goals.filter(g => g.id !== id) }));
    await goalsApi.delete(id);
  },

  editGoal: async (id, data) => {
    set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...data } : g) }));
    const updated = await goalsApi.update(id, data);
    set(s => ({ goals: s.goals.map(g => g.id === id ? updated : g) }));
  },

  // ── Review Cards ───────────────────────────────────────────────────────────
  addReviewCard: async (subjectId, topic) => {
    const card = await reviewCardsApi.create({ subjectId, topic });
    set(s => ({ reviewCards: [...s.reviewCards, card] }));
  },

  rateReviewCard: async (id, rating) => {
    const updated = await reviewCardsApi.rate(id, rating);
    set(s => ({ reviewCards: s.reviewCards.map(c => c.id === id ? updated : c) }));
    xpApi.list().then(xpEvents => set({ xpEvents })).catch(() => {});
  },

  deleteReviewCard: async (id) => {
    set(s => ({ reviewCards: s.reviewCards.filter(c => c.id !== id) }));
    await reviewCardsApi.delete(id);
  },

  getDueCards: () => {
    const today = new Date(); today.setHours(23, 59, 59, 999);
    return get().reviewCards.filter(c => new Date(c.dueDate) <= today);
  },

  // ── Exams ──────────────────────────────────────────────────────────────────
  addExam: async (data) => {
    const exam = await examsApi.create({ ...data, date: data.date });
    set(s => ({ exams: [...s.exams, exam] }));
  },

  deleteExam: async (id) => {
    set(s => ({ exams: s.exams.filter(e => e.id !== id) }));
    await examsApi.delete(id);
  },

  // ── Sessions ───────────────────────────────────────────────────────────────
  startSession: (mode, subjectId) => {
    set({
      activeSession: {
        id:           `local-${Date.now()}`,
        startTime:    new Date().toISOString(),
        mode,
        distractions: 0,
        subjectId:    subjectId || null,
      },
    });
  },

  endSession: async (focusRating, distractions) => {
    const active = get().activeSession;
    if (!active) return;

    const endTime  = new Date();
    const duration = Math.round((endTime.getTime() - new Date(active.startTime).getTime()) / 60000);

    const payload = {
      startTime:    active.startTime,
      endTime:      endTime.toISOString(),
      duration:     Math.max(duration, 1),
      mode:         active.mode,
      focusRating:  focusRating  ?? undefined,
      distractions: distractions ?? active.distractions,
      subjectId:    active.subjectId ?? undefined,
    };

    set({ activeSession: null });

    try {
      const session = await sessionsApi.create(payload);
      set(s => ({ sessions: [session, ...s.sessions] }));
      if (focusRating) {
        xpApi.list().then(xpEvents => set({ xpEvents })).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  },

  logDistraction: () => {
    set(s => ({
      activeSession: s.activeSession
        ? { ...s.activeSession, distractions: (s.activeSession.distractions || 0) + 1 }
        : null,
    }));
  },

  // FIX: was using startsWith(today) against UTC ISO strings, which breaks for
  // timezones ahead of UTC (e.g. IST +5:30) — sessions after midnight local
  // time but still previous day UTC would be missed.
  // format(new Date(isoString), 'yyyy-MM-dd') uses the local timezone correctly.
  getSessionsToday: () => {
    const todayLocal = format(new Date(), 'yyyy-MM-dd');
    return get().sessions.filter(s => {
      if (!s.startTime) return false;
      return format(new Date(s.startTime), 'yyyy-MM-dd') === todayLocal;
    });
  },

  // ── Mistakes ───────────────────────────────────────────────────────────────
  addMistake: async (data) => {
    const result = await mistakesApi.create(data);
    set(s => ({
      mistakes:    [result.mistake, ...s.mistakes],
      reviewCards: [...s.reviewCards, result.reviewCard],
    }));
    xpApi.list().then(xpEvents => set({ xpEvents })).catch(() => {});
  },

  deleteMistake: async (id) => {
    set(s => ({ mistakes: s.mistakes.filter(m => m.id !== id) }));
    await mistakesApi.delete(id);
  },

  // ── Energy ─────────────────────────────────────────────────────────────────
  logEnergy: async (level) => {
    const log   = await energyApi.log(level);
    const today = format(new Date(), 'yyyy-MM-dd');
    set(s => ({
      energyLogs: s.energyLogs.some(l => l.date === today)
        ? s.energyLogs.map(l => l.date === today ? log : l)
        : [log, ...s.energyLogs],
    }));
  },

  logWhatWorked: async (note) => {
    const log   = await energyApi.whatWorked(note);
    const today = format(new Date(), 'yyyy-MM-dd');
    set(s => ({ energyLogs: s.energyLogs.map(l => l.date === today ? log : l) }));
  },

  getTodayEnergyLog: () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return get().energyLogs.find(l => l.date === today) || null;
  },

  // ── Past Papers ────────────────────────────────────────────────────────────
  addPastPaper: async (data) => {
    const paper = await papersApi.create(data);
    set(s => ({ pastPapers: [paper, ...s.pastPapers] }));
  },

  deletePastPaper: async (id) => {
    set(s => ({ pastPapers: s.pastPapers.filter(p => p.id !== id) }));
    await papersApi.delete(id);
  },

  // ── Weekly Reviews ─────────────────────────────────────────────────────────
  generateWeeklyReview: async () => {
    const review = await weeklyReviewsApi.generate();
    set(s => ({ weeklyReviews: [review, ...s.weeklyReviews] }));
  },

  // ── Challenges ─────────────────────────────────────────────────────────────
  startChallenge: async (data) => {
    const challenge = await challengesApi.start(data);
    set({ activeChallenge: challenge });
  },

  endChallenge: async (id) => {
    const completed = await challengesApi.complete(id);
    set({ activeChallenge: completed });
    setTimeout(() => set({ activeChallenge: null }), 3000);
  },
}));
