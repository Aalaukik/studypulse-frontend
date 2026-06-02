// ─── Core Entity Types ─────────────────────────────────────────────────────

export type Priority = 'High' | 'Medium' | 'Low';
export type GoalStatus = 'active' | 'completed' | 'archived';
export type HealthStatus = 'Healthy' | 'At Risk' | 'Neglected';
export type TimerMode = 'focus' | 'short_break' | 'long_break';
export type MasteryLevel = 'Beginner' | 'Developing' | 'Intermediate' | 'Advanced' | 'Expert';
export type ReviewRating = 'Again' | 'Hard' | 'Good' | 'Easy';

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  xp: number;
  rank: string;
  streak: number;
  bestStreak: number;
  dailyTarget: DailyTarget;
  createdAt: string;
  avatar?: string;
}

export interface DailyTarget {
  type: 'goals' | 'minutes';
  value: number;
}

// ─── Subject ─────────────────────────────────────────────────────────────────

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  healthScore: number;
  masteryLevel: MasteryLevel;
  createdAt: string;
}

// ─── Goal ────────────────────────────────────────────────────────────────────

export interface Goal {
  id: string;
  subjectId: string;
  title: string;
  priority: Priority;
  status: GoalStatus;
  deadline?: string;
  completedAt?: string;
  createdAt: string;
  xpAwarded: boolean;
}

// ─── Review Card (Spaced Repetition) ─────────────────────────────────────────

export interface ReviewCard {
  id: string;
  subjectId: string;
  topic: string;
  interval: number;       // days until next review
  easeFactor: number;     // SM-2 ease factor (starts at 2.5)
  dueDate: string;        // ISO date string
  lastRating?: ReviewRating;
  repetitions: number;
  lastReviewed?: string;
  createdAt: string;
}

// ─── Exam ─────────────────────────────────────────────────────────────────────

export interface Exam {
  id: string;
  name: string;
  date: string;
  subjectIds: string[];
  topics: string[];
  color: string;
  createdAt: string;
}

// ─── Study Session ────────────────────────────────────────────────────────────

export interface StudySession {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number;       // minutes
  mode: TimerMode;
  focusRating?: number;   // 1-5
  distractions: number;
  energyBefore?: number;  // 1-5
  subjectId?: string;
  goalId?: string;
  label?: string;
  createdAt: string;
}

// ─── Mistake Entry ────────────────────────────────────────────────────────────

export interface MistakeEntry {
  id: string;
  subjectId: string;
  description: string;
  concept: string;
  note?: string;
  reviewCardId?: string;
  createdAt: string;
}

// ─── Energy Log ────────────────────────────────────────────────────────────────

export interface EnergyLog {
  id: string;
  date: string;
  energyLevel: number;    // 1-5
  distractions: number;
  focusQuality?: number;  // avg from sessions that day
  whatWorked?: string;
  createdAt: string;
}

// ─── Past Paper ────────────────────────────────────────────────────────────────

export interface PastPaper {
  id: string;
  subjectId: string;
  name: string;
  year: string;
  score: number;          // percentage
  date: string;
  topics: string[];
  createdAt: string;
}

// ─── Weekly Review ────────────────────────────────────────────────────────────

export interface WeeklyReview {
  id: string;
  weekStart: string;
  weekEnd: string;
  weeklyScore: number;
  goalsCompleted: number;
  goalsTotal: number;
  streakDays: number;
  avgFocusRating: number;
  totalMinutes: number;
  topSubjects: string[];
  bottomSubjects: string[];
  suggestedGoals: string[];
  generatedAt: string;
}

// ─── XP Event ─────────────────────────────────────────────────────────────────

export interface XPEvent {
  id: string;
  type: 'goal_completed' | 'review_completed' | 'streak_day' | 'mistake_logged' | 'session_completed' | 'exam_added';
  xp: number;
  description: string;
  createdAt: string;
}

// ─── Challenge ────────────────────────────────────────────────────────────────

export interface Challenge {
  id: string;
  title: string;
  targetGoals?: number;
  targetMinutes?: number;
  durationMinutes: number;
  startedAt: string;
  completedAt?: string;
  status: 'active' | 'completed' | 'failed';
}

// ─── Analytics Types ──────────────────────────────────────────────────────────

export interface SubjectHealth {
  subjectId: string;
  score: number;
  status: HealthStatus;
  recencyScore: number;
  completionScore: number;
  srScore: number;
  lastStudied?: string;
}

export interface DailyStats {
  date: string;
  goalsCompleted: number;
  minutesStudied: number;
  avgFocusRating: number;
  streakMet: boolean;
}

export interface HeatmapCell {
  day: string;
  hour: number;
  avgFocus: number;
  sessions: number;
}

// ─── App Navigation ───────────────────────────────────────────────────────────

export type AppView =
  | 'dashboard'
  | 'goals'
  | 'pomodoro'
  | 'spaced-repetition'
  | 'exam-planner'
  | 'subject-health'
  | 'streak'
  | 'mistake-journal'
  | 'energy-journal'
  | 'time-audit'
  | 'past-papers'
  | 'xp-system'
  | 'weekly-review'
  | 'settings';
