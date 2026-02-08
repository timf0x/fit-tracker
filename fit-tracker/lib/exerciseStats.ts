import { WorkoutSession } from '@/types';

// ─── Types ───

export type TimePeriod = '3m' | '6m' | '1y';

export interface ExerciseAllTimeStats {
  totalSessions: number;
  bestWeight: number;
  bestWeightDate: string | null;
  bestSessionVolume: number;
  bestSessionVolumeDate: string | null;
  lastPerformedDate: string | null;
}

export interface ExerciseSetDetail {
  reps: number;
  weight: number;
}

export interface ExerciseSessionDetail {
  sessionId: string;
  date: string;
  workoutName: string;
  sets: ExerciseSetDetail[];
  bestWeight: number;
  totalVolume: number;
  totalSets: number;
}

// ─── Period to days mapping ───

const PERIOD_DAYS: Record<TimePeriod, number> = {
  '3m': 90,
  '6m': 180,
  '1y': 365,
};

// ─── getExerciseAllTimeStats ───

export function getExerciseAllTimeStats(
  history: WorkoutSession[],
  exerciseId: string
): ExerciseAllTimeStats {
  let totalSessions = 0;
  let bestWeight = 0;
  let bestWeightDate: string | null = null;
  let bestSessionVolume = 0;
  let bestSessionVolumeDate: string | null = null;
  let lastPerformedDate: string | null = null;

  for (const session of history) {
    if (!session.endTime) continue;

    const ex = session.completedExercises.find(
      (e) => e.exerciseId === exerciseId
    );
    if (!ex) continue;

    let sessionVolume = 0;
    let sessionBestWeight = 0;
    let hasCompletedSet = false;

    for (const set of ex.sets) {
      if (!set.completed) continue;
      hasCompletedSet = true;
      const w = set.weight || 0;
      if (w > sessionBestWeight) sessionBestWeight = w;
      sessionVolume += w * set.reps;
    }

    if (!hasCompletedSet) continue;

    totalSessions++;

    if (sessionBestWeight > bestWeight) {
      bestWeight = sessionBestWeight;
      bestWeightDate = session.startTime;
    }

    if (sessionVolume > bestSessionVolume) {
      bestSessionVolume = sessionVolume;
      bestSessionVolumeDate = session.startTime;
    }

    // History is newest-first, so first match is the latest
    if (!lastPerformedDate) {
      lastPerformedDate = session.startTime;
    }
  }

  return {
    totalSessions,
    bestWeight,
    bestWeightDate,
    bestSessionVolume,
    bestSessionVolumeDate,
    lastPerformedDate,
  };
}

// ─── getExerciseFullHistory ───

export function getExerciseFullHistory(
  history: WorkoutSession[],
  exerciseId: string,
  period?: TimePeriod
): ExerciseSessionDetail[] {
  const cutoff = period
    ? Date.now() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000
    : 0;

  const results: ExerciseSessionDetail[] = [];

  for (const session of history) {
    if (!session.endTime) continue;

    const sessionMs = new Date(session.startTime).getTime();
    if (period && sessionMs < cutoff) continue;

    const ex = session.completedExercises.find(
      (e) => e.exerciseId === exerciseId
    );
    if (!ex) continue;

    const sets: ExerciseSetDetail[] = [];
    let bestWeight = 0;
    let totalVolume = 0;

    for (const set of ex.sets) {
      if (!set.completed) continue;
      const w = set.weight || 0;
      sets.push({ reps: set.reps, weight: w });
      if (w > bestWeight) bestWeight = w;
      totalVolume += w * set.reps;
    }

    if (sets.length === 0) continue;

    results.push({
      sessionId: session.id,
      date: session.startTime,
      workoutName: session.workoutName,
      sets,
      bestWeight,
      totalVolume,
      totalSets: sets.length,
    });
  }

  // Return oldest-first (history is newest-first)
  return results.reverse();
}

// ─── getPerformedExerciseIds ───

export function getPerformedExerciseIds(
  history: WorkoutSession[]
): Set<string> {
  const ids = new Set<string>();

  for (const session of history) {
    if (!session.endTime) continue;
    for (const ex of session.completedExercises) {
      const hasCompleted = ex.sets.some((s) => s.completed);
      if (hasCompleted) {
        ids.add(ex.exerciseId);
      }
    }
  }

  return ids;
}
