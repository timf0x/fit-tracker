import { exercises } from '@/data/exercises';
import { WorkoutSession } from '@/types';
import i18n from '@/lib/i18n';

/**
 * Maps exercise `target` field values → canonical muscle group keys
 * (matching the keys in RP_VOLUME_LANDMARKS from constants/volumeLandmarks.ts)
 */
export const TARGET_TO_MUSCLE: Record<string, string> = {
  // Chest
  pecs: 'chest',
  'upper chest': 'chest',
  'lower chest': 'chest',
  // Back
  lats: 'lats',
  'upper back': 'upper back',
  'middle back': 'upper back',
  'lower back': 'lower back',
  'rear delts': 'shoulders',
  // Shoulders
  delts: 'shoulders',
  'front delts': 'shoulders',
  'lateral delts': 'shoulders',
  traps: 'shoulders',
  // Arms
  biceps: 'biceps',
  brachialis: 'biceps',
  triceps: 'triceps',
  'forearm flexors': 'forearms',
  'forearm extensors': 'forearms',
  brachioradialis: 'forearms',
  grip: 'forearms',
  // Legs
  quads: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  calves: 'calves',
  gastrocnemius: 'calves',
  soleus: 'calves',
  // Core
  abs: 'abs',
  'lower abs': 'abs',
  'core stability': 'abs',
  obliques: 'obliques',
};

/** Muscle key → i18n key mapping for bodyPartsShort */
const MUSCLE_I18N_KEYS: Record<string, string> = {
  chest: 'bodyPartsShort.chest',
  'upper back': 'bodyPartsShort.upperBack',
  lats: 'bodyPartsShort.lats',
  'lower back': 'bodyPartsShort.lowerBack',
  shoulders: 'bodyPartsShort.shoulders',
  biceps: 'bodyPartsShort.biceps',
  triceps: 'bodyPartsShort.triceps',
  forearms: 'bodyPartsShort.forearms',
  quads: 'bodyPartsShort.quads',
  hamstrings: 'bodyPartsShort.hamstrings',
  glutes: 'bodyPartsShort.glutes',
  calves: 'bodyPartsShort.calves',
  abs: 'bodyPartsShort.abs',
  obliques: 'bodyPartsShort.obliques',
};

/** Localized short labels for muscle groups (reads from i18n) */
export function getMuscleLabel(muscle: string): string {
  const key = MUSCLE_I18N_KEYS[muscle];
  return key ? i18n.t(key) : muscle;
}

/** @deprecated Use getMuscleLabel() instead. Kept for backward compat. */
export const MUSCLE_LABELS_FR: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_, prop: string) {
    return getMuscleLabel(prop);
  },
  ownKeys() {
    return Object.keys(MUSCLE_I18N_KEYS);
  },
  getOwnPropertyDescriptor() {
    return { configurable: true, enumerable: true };
  },
});

/**
 * Maps RP muscle keys → BODY_ICONS body-part keys (from ActiveProgramCard)
 */
export const MUSCLE_TO_BODYPART: Record<string, string> = {
  chest: 'chest',
  'upper back': 'back',
  lats: 'back',
  'lower back': 'back',
  shoulders: 'shoulders',
  biceps: 'upper arms',
  triceps: 'upper arms',
  forearms: 'lower arms',
  quads: 'upper legs',
  hamstrings: 'upper legs',
  glutes: 'upper legs',
  calves: 'lower legs',
  abs: 'waist',
  obliques: 'waist',
};

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

/**
 * Compute sets per muscle group from workout history for the last N days.
 * Returns a record of muscle group → completed set count, sorted descending.
 */
export function getSetsPerMuscle(
  history: WorkoutSession[],
  days: number
): Record<string, number> {
  const cutoff = Date.now() - days * 86400000;
  const result: Record<string, number> = {};

  for (const session of history) {
    if (!session.endTime) continue;
    if (new Date(session.startTime).getTime() < cutoff) continue;

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
