import { exercises } from '@/data/exercises';
import { WorkoutSession, CompletedExercise } from '@/types';
import { getSetsForWeek } from './weeklyVolume';

// ─── Types ───

export interface MuscleTrend {
  muscle: string;
  currentSets: number;
  previousSets: number;
  delta: number;
  /** -1 = down, 0 = flat, 1 = up */
  direction: -1 | 0 | 1;
  /** Percentage change (e.g. +25 means 25% more) */
  percentChange: number;
}

export interface ExercisePR {
  exerciseId: string;
  type: 'weight' | 'reps' | 'volume';
  /** The new record value */
  value: number;
  /** The old record value (0 if first time) */
  previousValue: number;
  /** Human label for the PR type */
  label: string;
}

export interface ExerciseSessionData {
  date: string;
  bestWeight: number;
  bestReps: number;
  totalVolume: number;
  totalSets: number;
}

// ─── Week-over-week muscle trends ───

/**
 * Computes trend data for each muscle by comparing two weeks.
 * Returns a map of muscle → MuscleTrend.
 */
export function getMuscleTrends(
  history: WorkoutSession[],
  weekOffset: number
): Record<string, MuscleTrend> {
  const current = getSetsForWeek(history, weekOffset);
  const previous = getSetsForWeek(history, weekOffset - 1);

  const allMuscles = new Set([
    ...Object.keys(current),
    ...Object.keys(previous),
  ]);

  const result: Record<string, MuscleTrend> = {};

  for (const muscle of allMuscles) {
    const curr = current[muscle] || 0;
    const prev = previous[muscle] || 0;
    const delta = curr - prev;

    let direction: -1 | 0 | 1 = 0;
    if (delta > 0) direction = 1;
    else if (delta < 0) direction = -1;

    const percentChange = prev > 0 ? Math.round((delta / prev) * 100) : curr > 0 ? 100 : 0;

    result[muscle] = {
      muscle,
      currentSets: curr,
      previousSets: prev,
      delta,
      direction,
      percentChange,
    };
  }

  return result;
}

// ─── Personal Record Detection ───

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

/**
 * Detects personal records achieved in a given session by comparing
 * against all previous sessions in history.
 *
 * PR types:
 * - weight: heaviest single set (weight) for an exercise
 * - reps: most reps in a single set at any weight for an exercise
 * - volume: highest total volume (weight × reps summed) for an exercise in one session
 */
export function detectPRs(
  currentSession: {
    completedExercises: CompletedExercise[];
  },
  history: WorkoutSession[]
): ExercisePR[] {
  const prs: ExercisePR[] = [];

  // Build historical bests from all completed sessions
  const historicalBests: Record<
    string,
    { bestWeight: number; bestReps: number; bestSessionVolume: number }
  > = {};

  for (const session of history) {
    if (!session.endTime) continue;

    for (const ex of session.completedExercises) {
      if (!historicalBests[ex.exerciseId]) {
        historicalBests[ex.exerciseId] = {
          bestWeight: 0,
          bestReps: 0,
          bestSessionVolume: 0,
        };
      }

      const best = historicalBests[ex.exerciseId];
      let sessionVolume = 0;

      for (const set of ex.sets) {
        if (!set.completed) continue;
        const w = set.weight || 0;
        if (w > best.bestWeight) best.bestWeight = w;
        if (set.reps > best.bestReps) best.bestReps = set.reps;
        sessionVolume += w * set.reps;
      }

      if (sessionVolume > best.bestSessionVolume) {
        best.bestSessionVolume = sessionVolume;
      }
    }
  }

  // Check current session against historical bests
  for (const ex of currentSession.completedExercises) {
    const exerciseData = exerciseMap.get(ex.exerciseId);
    if (!exerciseData) continue;

    const prev = historicalBests[ex.exerciseId] || {
      bestWeight: 0,
      bestReps: 0,
      bestSessionVolume: 0,
    };

    let sessionBestWeight = 0;
    let sessionBestReps = 0;
    let sessionVolume = 0;

    for (const set of ex.sets) {
      if (!set.completed) continue;
      const w = set.weight || 0;
      if (w > sessionBestWeight) sessionBestWeight = w;
      if (set.reps > sessionBestReps) sessionBestReps = set.reps;
      sessionVolume += w * set.reps;
    }

    // Only count as PR if the exercise was actually performed
    if (sessionBestWeight === 0 && sessionBestReps === 0) continue;

    // Weight PR (only for weighted exercises)
    if (sessionBestWeight > prev.bestWeight && sessionBestWeight > 0) {
      prs.push({
        exerciseId: ex.exerciseId,
        type: 'weight',
        value: sessionBestWeight,
        previousValue: prev.bestWeight,
        label: `${sessionBestWeight} kg`,
      });
    }

    // Reps PR — meaningful for bodyweight exercises (primary metric)
    // and for weighted exercises when weight didn't decrease (true strength gain)
    if (
      sessionBestReps > prev.bestReps &&
      prev.bestReps > 0 &&
      (sessionBestWeight === 0 || sessionBestWeight >= prev.bestWeight)
    ) {
      prs.push({
        exerciseId: ex.exerciseId,
        type: 'reps',
        value: sessionBestReps,
        previousValue: prev.bestReps,
        label: `${sessionBestReps} reps`,
      });
    }

    // Volume PR (session total for this exercise)
    if (sessionVolume > prev.bestSessionVolume && sessionVolume > 0) {
      prs.push({
        exerciseId: ex.exerciseId,
        type: 'volume',
        value: sessionVolume,
        previousValue: prev.bestSessionVolume,
        label: `${sessionVolume} kg total`,
      });
    }
  }

  return prs;
}

// ─── Per-Exercise History (for sparklines) ───

/**
 * Returns the last N session data points for a specific exercise.
 * Each point contains the best weight, best reps, total volume, and date.
 */
export function getExerciseHistory(
  history: WorkoutSession[],
  exerciseId: string,
  maxSessions: number = 8
): ExerciseSessionData[] {
  const points: ExerciseSessionData[] = [];

  // History is stored newest-first, iterate normally
  for (const session of history) {
    if (!session.endTime) continue;

    const ex = session.completedExercises.find(
      (e) => e.exerciseId === exerciseId
    );
    if (!ex) continue;

    let bestWeight = 0;
    let bestReps = 0;
    let totalVolume = 0;
    let totalSets = 0;

    for (const set of ex.sets) {
      if (!set.completed) continue;
      const w = set.weight || 0;
      if (w > bestWeight) bestWeight = w;
      if (set.reps > bestReps) bestReps = set.reps;
      totalVolume += w * set.reps;
      totalSets++;
    }

    if (totalSets === 0) continue;

    points.push({
      date: session.startTime,
      bestWeight,
      bestReps,
      totalVolume,
      totalSets,
    });

    if (points.length >= maxSessions) break;
  }

  // Return oldest-first for sparkline rendering (left = oldest, right = newest)
  return points.reverse();
}
