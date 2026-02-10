import { exercises } from '@/data/exercises';
import { WorkoutSession } from '@/types';
import { getWeekBounds } from './weeklyVolume';
import { detectPRs, ExercisePR } from './progressiveOverload';
import { TARGET_TO_MUSCLE } from './muscleMapping';

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

// ─── Types ───

export interface WeekSummary {
  sessions: number;
  totalMinutes: number;
  totalVolumeKg: number;
  completedDays: boolean[];
  currentDayIndex: number;
}

export interface EnrichedPR extends ExercisePR {
  exerciseNameFr: string;
  date: string;
  sessionId: string;
}

export interface WeekPRs {
  total: number;
  prs: EnrichedPR[];
  byType: { weight: number; reps: number; volume: number };
}

export interface DayMuscleData {
  dayIndex: number;
  muscles: string[];
}

export interface MuscleFrequency {
  days: DayMuscleData[];
  perMuscle: Record<string, number>;
}

// ─── getWeekSummary ───

export function getWeekSummary(
  history: WorkoutSession[],
  weekOffset: number
): WeekSummary {
  const { start, end } = getWeekBounds(weekOffset);
  const startMs = start.getTime();
  const endMs = end.getTime();

  const completedDays = [false, false, false, false, false, false, false];
  let sessions = 0;
  let totalSeconds = 0;
  let totalVolumeKg = 0;

  // Current day index (Mon=0 ... Sun=6)
  const now = new Date();
  const jsDay = now.getDay();
  const currentDayIndex = jsDay === 0 ? 6 : jsDay - 1;

  for (const session of history) {
    if (!session.endTime) continue;
    const sessionMs = new Date(session.startTime).getTime();
    if (sessionMs < startMs || sessionMs > endMs) continue;

    sessions++;
    totalSeconds += session.durationSeconds || 0;

    // Mark the day
    const d = new Date(session.startTime);
    const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
    completedDays[dayIdx] = true;

    // Sum volume
    for (const ex of session.completedExercises) {
      for (const set of ex.sets) {
        if (set.completed) {
          totalVolumeKg += (set.weight || 0) * set.reps;
        }
      }
    }
  }

  return {
    sessions,
    totalMinutes: Math.round(totalSeconds / 60),
    totalVolumeKg: Math.round(totalVolumeKg),
    completedDays,
    currentDayIndex,
  };
}

// ─── getWeekPRs ───

export function getWeekPRs(
  history: WorkoutSession[],
  weekOffset: number
): WeekPRs {
  const { start, end } = getWeekBounds(weekOffset);
  const startMs = start.getTime();
  const endMs = end.getTime();

  // Get all completed sessions sorted by startTime ascending
  const allCompleted = history
    .filter((s) => s.endTime)
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

  // Collect sessions within the week
  const weekSessions: WorkoutSession[] = [];
  for (const session of allCompleted) {
    const sessionMs = new Date(session.startTime).getTime();
    if (sessionMs >= startMs && sessionMs <= endMs) {
      weekSessions.push(session);
    }
  }

  const allPrs: EnrichedPR[] = [];

  for (const session of weekSessions) {
    // Prior history = all completed sessions BEFORE this one
    const priorHistory = allCompleted.filter(
      (s) =>
        new Date(s.startTime).getTime() < new Date(session.startTime).getTime()
    );

    const prs = detectPRs(session, priorHistory);

    for (const pr of prs) {
      const ex = exerciseMap.get(pr.exerciseId);
      allPrs.push({
        ...pr,
        exerciseNameFr: ex?.nameFr || ex?.name || pr.exerciseId,
        date: session.startTime,
        sessionId: session.id,
      });
    }
  }

  // Deduplicate by exerciseId + type (keep best value)
  const bestMap = new Map<string, EnrichedPR>();
  for (const pr of allPrs) {
    const key = `${pr.exerciseId}_${pr.type}`;
    const existing = bestMap.get(key);
    if (!existing || pr.value > existing.value) {
      bestMap.set(key, pr);
    }
  }

  const dedupedPrs = Array.from(bestMap.values());

  return {
    total: dedupedPrs.length,
    prs: dedupedPrs,
    byType: {
      weight: dedupedPrs.filter((p) => p.type === 'weight').length,
      reps: dedupedPrs.filter((p) => p.type === 'reps').length,
      volume: dedupedPrs.filter((p) => p.type === 'volume').length,
    },
  };
}

// ─── getPeriodPRs ───

export function getPeriodPRs(
  history: WorkoutSession[],
  filteredSessions: WorkoutSession[]
): WeekPRs {
  const allCompleted = history
    .filter((s) => s.endTime)
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

  const allPrs: EnrichedPR[] = [];

  for (const session of filteredSessions) {
    const sessionMs = new Date(session.startTime).getTime();
    const priorHistory = allCompleted.filter(
      (s) => new Date(s.startTime).getTime() < sessionMs
    );

    const prs = detectPRs(session, priorHistory);

    for (const pr of prs) {
      const ex = exerciseMap.get(pr.exerciseId);
      allPrs.push({
        ...pr,
        exerciseNameFr: ex?.nameFr || ex?.name || pr.exerciseId,
        date: session.startTime,
        sessionId: session.id,
      });
    }
  }

  const bestMap = new Map<string, EnrichedPR>();
  for (const pr of allPrs) {
    const key = `${pr.exerciseId}_${pr.type}`;
    const existing = bestMap.get(key);
    if (!existing || pr.value > existing.value) {
      bestMap.set(key, pr);
    }
  }

  const dedupedPrs = Array.from(bestMap.values());

  return {
    total: dedupedPrs.length,
    prs: dedupedPrs,
    byType: {
      weight: dedupedPrs.filter((p) => p.type === 'weight').length,
      reps: dedupedPrs.filter((p) => p.type === 'reps').length,
      volume: dedupedPrs.filter((p) => p.type === 'volume').length,
    },
  };
}

// ─── getMuscleFrequency ───

export function getMuscleFrequency(
  history: WorkoutSession[],
  weekOffset: number
): MuscleFrequency {
  const { start, end } = getWeekBounds(weekOffset);
  const startMs = start.getTime();
  const endMs = end.getTime();

  const days: DayMuscleData[] = Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i,
    muscles: [],
  }));

  const perMuscle: Record<string, number> = {};

  for (const session of history) {
    if (!session.endTime) continue;
    const sessionMs = new Date(session.startTime).getTime();
    if (sessionMs < startMs || sessionMs > endMs) continue;

    const d = new Date(session.startTime);
    const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;

    // Get unique muscles from this session
    const sessionMuscles = new Set<string>();
    for (const compEx of session.completedExercises) {
      const exercise = exerciseMap.get(compEx.exerciseId);
      if (!exercise) continue;
      const muscle = TARGET_TO_MUSCLE[exercise.target];
      if (muscle) sessionMuscles.add(muscle);
    }

    // Add muscles to the day (avoid duplicates across sessions on same day)
    for (const muscle of sessionMuscles) {
      if (!days[dayIdx].muscles.includes(muscle)) {
        days[dayIdx].muscles.push(muscle);
      }
      // Count distinct sessions per muscle
      perMuscle[muscle] = (perMuscle[muscle] || 0) + 1;
    }
  }

  return { days, perMuscle };
}
