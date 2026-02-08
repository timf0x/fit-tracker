import { ProgramDay } from '@/types/program';
import { getExerciseById } from '@/data/exercises';

/**
 * Build the exercises JSON param for the session screen
 * from a ProgramDay's exercises.
 */
export function buildProgramExercisesParam(day: ProgramDay): string {
  return JSON.stringify(
    day.exercises.map((pex) => {
      const ex = getExerciseById(pex.exerciseId);
      return {
        exerciseId: pex.exerciseId,
        sets: pex.sets,
        reps: pex.maxReps || pex.reps, // backward compat: session uses maxReps as target
        minReps: pex.minReps || pex.reps,
        maxReps: pex.maxReps || pex.reps,
        targetRir: pex.targetRir ?? 2,
        weight: pex.suggestedWeight || 0,
        restTime: pex.restTime,
        exerciseName: ex?.nameFr || ex?.name || '',
        exerciseNameEn: ex?.name || '',
        bodyPart: ex?.bodyPart || 'chest',
        isUnilateral: ex?.isUnilateral || false,
      };
    })
  );
}
