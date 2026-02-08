import { COMPOUND_IDS } from '@/lib/programGenerator';
import { getExerciseById } from '@/data/exercises';

// ─── Exercise Category (6-tier RP-based classification) ───

export type ExerciseCategory =
  | 'heavy_barbell_compound'  // barbell/ez/trap/smith + compound
  | 'dumbbell_compound'       // dumbbell/kb/bodyweight + compound
  | 'machine_compound'        // machine/cable + compound
  | 'isolation'               // non-machine isolation
  | 'machine_isolation'       // machine/cable isolation
  | 'abs_calves';             // abs/obliques/calves regardless

const ABS_CALVES_MUSCLES = new Set([
  'abs', 'lower abs', 'core stability', 'obliques',
  'gastrocnemius', 'soleus', 'calves',
]);

const HEAVY_BARBELL_EQUIPMENT = new Set([
  'barbell', 'ez bar', 'trap bar', 'smith machine',
]);

const MACHINE_EQUIPMENT = new Set(['machine', 'cable']);

const DUMBBELL_EQUIPMENT = new Set(['dumbbell', 'kettlebell', 'body weight']);

export function getExerciseCategory(exerciseId: string): ExerciseCategory {
  const ex = getExerciseById(exerciseId);
  if (!ex) return 'isolation';

  // Abs/calves always go to their own tier
  if (ABS_CALVES_MUSCLES.has(ex.target)) return 'abs_calves';

  const compound = COMPOUND_IDS.has(exerciseId);

  if (compound) {
    if (HEAVY_BARBELL_EQUIPMENT.has(ex.equipment)) return 'heavy_barbell_compound';
    if (MACHINE_EQUIPMENT.has(ex.equipment)) return 'machine_compound';
    return 'dumbbell_compound'; // dumbbell, kb, bodyweight compounds
  }

  // Isolation
  if (MACHINE_EQUIPMENT.has(ex.equipment)) return 'machine_isolation';
  return 'isolation';
}

// ─── Target RIR by Week ───

/**
 * RIR progression across a mesocycle:
 * Week 0 → RIR 4 (easy), linearly down to Week N-1 → RIR 0 (failure)
 * Deload resets to RIR 4.
 */
export function getTargetRir(
  weekIndex: number,
  totalWeeks: number,
  isDeload: boolean
): number {
  if (isDeload) return 4;
  const trainingWeeks = totalWeeks - 1;
  if (trainingWeeks <= 1) return 3;
  return Math.max(0, Math.round(4 - (weekIndex / (trainingWeeks - 1)) * 4));
}
