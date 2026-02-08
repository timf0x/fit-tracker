import { exercises } from '@/data/exercises';
import { WorkoutSession } from '@/types';

/**
 * Maps exercise `target` field values → canonical muscle group keys
 * (same mapping as muscleMapping.ts, inlined to avoid circular deps)
 */
const TARGET_TO_MUSCLE: Record<string, string> = {
  pecs: 'chest',
  'upper chest': 'chest',
  'lower chest': 'chest',
  lats: 'lats',
  'upper back': 'upper back',
  'middle back': 'upper back',
  'lower back': 'lower back',
  'rear delts': 'shoulders',
  delts: 'shoulders',
  'front delts': 'shoulders',
  'lateral delts': 'shoulders',
  traps: 'shoulders',
  biceps: 'biceps',
  brachialis: 'biceps',
  triceps: 'triceps',
  'forearm flexors': 'forearms',
  'forearm extensors': 'forearms',
  brachioradialis: 'forearms',
  grip: 'forearms',
  quads: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  calves: 'calves',
  gastrocnemius: 'calves',
  soleus: 'calves',
  abs: 'abs',
  'lower abs': 'abs',
  'core stability': 'abs',
  obliques: 'obliques',
};

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

/**
 * Returns Mon 00:00 → Sun 23:59:59.999 for the given week offset.
 * weekOffset=0 → current week, -1 → last week, etc.
 */
export function getWeekBounds(weekOffset: number): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? 6 : day - 1;

  const monday = new Date(now);
  monday.setDate(monday.getDate() - mondayOffset + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

/**
 * Returns a French label like "Sem. du 3 février"
 */
export function getWeekLabel(weekOffset: number): string {
  const { start } = getWeekBounds(weekOffset);
  const day = start.getDate();
  const month = start.toLocaleDateString('fr-FR', { month: 'long' });
  return `Sem. du ${day} ${month}`;
}

/**
 * Filters history to sessions within a given week and counts completed sets per muscle.
 */
export function getSetsForWeek(
  history: WorkoutSession[],
  weekOffset: number
): Record<string, number> {
  const { start, end } = getWeekBounds(weekOffset);
  const startMs = start.getTime();
  const endMs = end.getTime();
  const result: Record<string, number> = {};

  for (const session of history) {
    if (!session.endTime) continue;
    const sessionMs = new Date(session.startTime).getTime();
    if (sessionMs < startMs || sessionMs > endMs) continue;

    for (const compEx of session.completedExercises) {
      const exercise = exerciseMap.get(compEx.exerciseId);
      if (!exercise) continue;

      const muscle = TARGET_TO_MUSCLE[exercise.target];
      if (!muscle) continue;

      const completedSets = compEx.sets.filter((s) => s.completed).length;
      result[muscle] = (result[muscle] || 0) + completedSets;
    }
  }

  return result;
}
