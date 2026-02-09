import { exercises } from '@/data/exercises';

/**
 * 6-tier exercise classification for rep/rest/RIR assignment.
 *
 * Based on RP Hypertrophy guidelines:
 * - Heavy barbell compounds: lower reps, longer rest
 * - Machine isolations: higher reps, shorter rest
 * - Abs/calves: highest reps, minimal rest
 */

export type ExerciseCategory =
  | 'heavy_barbell_compound'
  | 'dumbbell_compound'
  | 'machine_compound'
  | 'isolation'
  | 'machine_isolation'
  | 'abs_calves';

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

// Body parts that are abs/calves tier
const ABS_CALVES_TARGETS = new Set([
  'abs', 'lower abs', 'core stability', 'obliques',
  'calves', 'gastrocnemius', 'soleus',
]);

// Compound movement targets (multi-joint)
const COMPOUND_TARGETS = new Set([
  'pecs', 'upper chest', 'lower chest',
  'lats', 'upper back', 'middle back', 'lower back',
  'quads', 'hamstrings', 'glutes',
  'front delts', 'delts',
]);

/**
 * Classify an exercise into one of 6 tiers based on equipment + target.
 */
export function getExerciseCategory(exerciseId: string): ExerciseCategory {
  const ex = exerciseMap.get(exerciseId);
  if (!ex) return 'isolation';

  const { equipment, target } = ex;

  // Abs & calves always get their own tier
  if (ABS_CALVES_TARGETS.has(target)) {
    return 'abs_calves';
  }

  const isCompoundTarget = COMPOUND_TARGETS.has(target);

  // Barbell compounds (heaviest loading)
  if ((equipment === 'barbell' || equipment === 'trap bar' || equipment === 'smith machine') && isCompoundTarget) {
    return 'heavy_barbell_compound';
  }

  // Dumbbell compounds
  if (equipment === 'dumbbell' && isCompoundTarget) {
    return 'dumbbell_compound';
  }

  // Machine / cable compounds
  if ((equipment === 'machine' || equipment === 'cable') && isCompoundTarget) {
    return 'machine_compound';
  }

  // Body weight compounds (pull-ups, dips, squats)
  if (equipment === 'body weight' && isCompoundTarget) {
    return 'dumbbell_compound'; // treat like dumbbell tier
  }

  // Machine / cable isolations
  if (equipment === 'machine' || equipment === 'cable') {
    return 'machine_isolation';
  }

  // Everything else: dumbbell isolations, band work, etc.
  return 'isolation';
}

/**
 * Get target RIR for a given week in the mesocycle.
 *
 * Linear interpolation from RIR 4 (week 1) → RIR 0 (last training week).
 * Deload weeks always return RIR 4.
 *
 * Example (5-week meso): 4 → 3 → 1 → 0 → 4(deload)
 */
export function getTargetRir(
  weekIdx: number,
  totalWeeks: number,
  isDeload: boolean,
): number {
  if (isDeload) return 4;

  const trainingWeeks = totalWeeks - 1; // last week is deload
  if (trainingWeeks <= 0) return 2;

  // Linear interpolation: RIR 4 at week 0, RIR 0 at last training week
  const progress = Math.min(weekIdx / (trainingWeeks - 1), 1);
  const rir = Math.round(4 * (1 - progress));

  return Math.max(0, Math.min(4, rir));
}
