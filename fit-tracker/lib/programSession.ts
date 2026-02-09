import { ProgramDay } from '@/types/program';
import { getExerciseById } from '@/data/exercises';

/**
 * Build the exercises JSON param for the session screen
 * from a ProgramDay's exercises.
 *
 * @param weightOverrides — optional map of exerciseId → { weight, action }
 *   from getProgressiveWeight(). When present, overrides suggestedWeight.
 */
export function buildProgramExercisesParam(
  day: ProgramDay,
  weightOverrides?: Record<string, { weight: number; action: string }>,
): string {
  return JSON.stringify(
    day.exercises.map((pex) => {
      const ex = getExerciseById(pex.exerciseId);
      const override = weightOverrides?.[pex.exerciseId];
      const weight = override && override.action !== 'none'
        ? override.weight
        : (pex.suggestedWeight || 0);
      return {
        exerciseId: pex.exerciseId,
        sets: pex.sets,
        reps: pex.maxReps || pex.reps, // backward compat: session uses maxReps as target
        minReps: pex.minReps || pex.reps,
        maxReps: pex.maxReps || pex.reps,
        targetRir: pex.targetRir ?? 2,
        weight,
        restTime: pex.restTime,
        exerciseName: ex?.nameFr || ex?.name || '',
        exerciseNameEn: ex?.name || '',
        bodyPart: ex?.bodyPart || 'chest',
        isUnilateral: ex?.isUnilateral || false,
        overloadAction: override?.action || 'none',
      };
    })
  );
}
