import { ReviewCard, ReviewRating, Goal, StudySession, SubjectHealth, HealthStatus } from '../types';
import { format, differenceInDays, parseISO, isToday, isThisWeek, startOfWeek, endOfWeek, addDays } from 'date-fns';

// ─── ID Generator ──────────────────────────────────────────────────────────────

export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ─── SM-2 Algorithm ───────────────────────────────────────────────────────────

const RATING_TO_Q: Record<ReviewRating, number> = {
  'Again': 0,
  'Hard': 2,
  'Good': 4,
  'Easy': 5,
};

export function sm2Update(card: ReviewCard, rating: ReviewRating): Partial<ReviewCard> {
  const q = RATING_TO_Q[rating];
  let newEF = card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newInterval: number;
  let newRepetitions: number;

  if (q < 3) {
    // Failed — reset
    newInterval = 1;
    newRepetitions = 0;
  } else {
    newRepetitions = card.repetitions + 1;
    if (newRepetitions === 1) newInterval = 1;
    else if (newRepetitions === 2) newInterval = 6;
    else newInterval = Math.round(card.interval * newEF);
  }

  const dueDate = addDays(new Date(), newInterval);

  return {
    interval: newInterval,
    easeFactor: Math.round(newEF * 100) / 100,
    repetitions: newRepetitions,
    dueDate: format(dueDate, 'yyyy-MM-dd'),
    lastRating: rating,
    lastReviewed: new Date().toISOString(),
  };
}

// ─── Subject Health Score ─────────────────────────────────────────────────────

export function computeSubjectHealth(
  subjectId: string,
  goals: Goal[],
  sessions: StudySession[],
  cards: ReviewCard[]
): SubjectHealth {
  const now = new Date();

  // Recency: last session for this subject (0–100)
  const subjectSessions = sessions.filter(s => s.subjectId === subjectId);
  const lastSession = subjectSessions.sort((a, b) => b.startTime.localeCompare(a.startTime))[0];
  let recencyScore = 0;
  if (lastSession) {
    const daysAgo = differenceInDays(now, parseISO(lastSession.startTime));
    recencyScore = Math.max(0, 100 - daysAgo * 10);
  }

  // Completion: completed / total goals
  const subjectGoals = goals.filter(g => g.subjectId === subjectId);
  const completedGoals = subjectGoals.filter(g => g.status === 'completed');
  const completionScore = subjectGoals.length > 0
    ? (completedGoals.length / subjectGoals.length) * 100
    : 50;

  // SR performance: % of non-overdue cards
  const subjectCards = cards.filter(c => c.subjectId === subjectId);
  const overdueCards = subjectCards.filter(c => {
    const due = parseISO(c.dueDate);
    return differenceInDays(now, due) > 0;
  });
  const srScore = subjectCards.length > 0
    ? ((subjectCards.length - overdueCards.length) / subjectCards.length) * 100
    : 70;

  const score = Math.round(recencyScore * 0.4 + completionScore * 0.35 + srScore * 0.25);

  let status: HealthStatus;
  if (score >= 70) status = 'Healthy';
  else if (score >= 40) status = 'At Risk';
  else status = 'Neglected';

  return {
    subjectId,
    score,
    status,
    recencyScore: Math.round(recencyScore),
    completionScore: Math.round(completionScore),
    srScore: Math.round(srScore),
    lastStudied: lastSession?.startTime,
  };
}

// ─── Weekly Score ─────────────────────────────────────────────────────────────

export function computeWeeklyScore(
  goals: Goal[],
  sessions: StudySession[],
  targetGoals: number
): number {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const weekGoals = goals.filter(g => {
    if (!g.completedAt) return false;
    const d = parseISO(g.completedAt);
    return d >= weekStart && d <= weekEnd;
  });

  const weekSessions = sessions.filter(s => {
    const d = parseISO(s.startTime);
    return d >= weekStart && d <= weekEnd;
  });

  const goalScore = Math.min(100, (weekGoals.length / (targetGoals * 7)) * 100);
  const avgFocus = weekSessions.length > 0
    ? weekSessions.reduce((a, s) => a + (s.focusRating || 3), 0) / weekSessions.length
    : 3;
  const focusScore = (avgFocus / 5) * 100;

  return Math.round(goalScore * 0.6 + focusScore * 0.4);
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export { format, isToday, isThisWeek, differenceInDays, parseISO, addDays };

export const formatDate = (iso: string) => format(parseISO(iso), 'MMM d, yyyy');
export const formatTime = (iso: string) => format(parseISO(iso), 'h:mm a');
export const formatRelative = (iso: string) => {
  const days = differenceInDays(new Date(), parseISO(iso));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
};

// ─── XP Helpers ──────────────────────────────────────────────────────────────

export const XP_EVENTS = {
  goal_completed: 10,
  review_completed: 5,
  streak_day: 15,
  mistake_logged: 8,
  session_completed: 5,
  exam_added: 3,
};

export function xpToLevel(xp: number): { level: number; progress: number; nextLevelXP: number } {
  const levels = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 18000];
  let level = 0;
  for (let i = 0; i < levels.length; i++) {
    if (xp >= levels[i]) level = i + 1;
  }
  const currentLevelXP = levels[Math.min(level - 1, levels.length - 1)] || 0;
  const nextLevelXP = levels[Math.min(level, levels.length - 1)] || levels[levels.length - 1];
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return { level: Math.min(level, 10), progress: Math.min(progress, 100), nextLevelXP };
}

export function getRankTitle(xp: number): string {
  if (xp < 100) return 'Fresh Start';
  if (xp < 250) return 'Curious Learner';
  if (xp < 500) return 'Study Apprentice';
  if (xp < 1000) return 'Knowledge Seeker';
  if (xp < 2000) return 'Dedicated Scholar';
  if (xp < 3500) return 'Focus Master';
  if (xp < 5500) return 'Academic Elite';
  if (xp < 8000) return 'Study Champion';
  if (xp < 12000) return 'Wisdom Keeper';
  return 'Grand Scholar';
}

// ─── Color Helpers ────────────────────────────────────────────────────────────

export const SUBJECT_COLORS = [
  '#10b981', '#6366f1', '#f59e0b', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f97316', '#84cc16',
];

export const SUBJECT_ICONS = ['📚', '🔬', '📐', '🌍', '💻', '🎨', '🏛️', '🧬', '📊', '🎵'];

export function getHealthColor(status: string): string {
  if (status === 'Healthy') return '#10b981';
  if (status === 'At Risk') return '#f59e0b';
  return '#ef4444';
}

export function getPriorityColor(priority: string): string {
  if (priority === 'High') return '#ef4444';
  if (priority === 'Medium') return '#f59e0b';
  return '#10b981';
}

// ─── Chart Data Helpers ───────────────────────────────────────────────────────

export function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(new Date(), -(6 - i)), 'yyyy-MM-dd')
  );
}

export function getDailyGoalCounts(goals: Goal[], days: string[]): number[] {
  return days.map(day =>
    goals.filter(g => g.completedAt && g.completedAt.startsWith(day)).length
  );
}

export function getDailyMinutes(sessions: StudySession[], days: string[]): number[] {
  return days.map(day =>
    sessions
      .filter(s => s.startTime.startsWith(day) && s.mode === 'focus')
      .reduce((sum, s) => sum + s.duration, 0)
  );
}

// ─── Syllabus Parser ─────────────────────────────────────────────────────────

export function parseSyllabus(text: string): string[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const topics: string[] = [];

  for (const line of lines) {
    // Remove leading numbers, bullets, dashes, letters
    const cleaned = line
      .replace(/^[\d]+[.)]\s*/, '')
      .replace(/^[-•*]\s*/, '')
      .replace(/^[a-zA-Z][.)]\s*/, '')
      .trim();
    if (cleaned.length > 2 && cleaned.length < 200) {
      topics.push(cleaned);
    }
  }

  return [...new Set(topics)];
}

// ─── Streak Calculator ────────────────────────────────────────────────────────

export function computeStreak(goals: Goal[], dailyTargetGoals: number): number {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const day = format(addDays(today, -i), 'yyyy-MM-dd');
    const dayGoals = goals.filter(
      g => g.completedAt && g.completedAt.startsWith(day)
    ).length;

    if (dayGoals >= dailyTargetGoals) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

// ─── Exam Planner ─────────────────────────────────────────────────────────────

export function getTopicsForToday(
  examTopics: string[],
  examDate: string,
  cards: ReviewCard[]
): string[] {
  const daysLeft = differenceInDays(parseISO(examDate), new Date());
  if (daysLeft <= 0) return [];

  // Weight topics by confidence (less confident = higher priority)
  const weakTopics = cards
    .filter(c => examTopics.includes(c.topic) && (c.easeFactor < 2.0 || c.lastRating === 'Again' || c.lastRating === 'Hard'))
    .map(c => c.topic);

  const allTopics = [...new Set([...weakTopics, ...examTopics])];
  const perDay = Math.ceil(allTopics.length / daysLeft);

  return allTopics.slice(0, perDay);
}
