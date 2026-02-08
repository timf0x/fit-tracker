import { exercises } from '@/data/exercises';
import { WorkoutSession } from '@/types';

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

/** French labels for muscle groups */
export const MUSCLE_LABELS_FR: Record<string, string> = {
  chest: 'Pectoraux',
  'upper back': 'Haut dos',
  lats: 'Dorsaux',
  'lower back': 'Bas dos',
  shoulders: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Avant-bras',
  quads: 'Quadriceps',
  hamstrings: 'Ischio',
  glutes: 'Fessiers',
  calves: 'Mollets',
  abs: 'Abdos',
  obliques: 'Obliques',
};

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
