import { exercises } from '@/data/exercises';
import { Exercise, WorkoutSession, isEffectiveSet } from '@/types';
import { TARGET_TO_MUSCLE } from './muscleMapping';
import { getSetsForWeek, getWeekBounds } from './weeklyVolume';
import {
  RP_VOLUME_LANDMARKS,
  VolumeLandmarkZone,
  getVolumeZone,
} from '@/constants/volumeLandmarks';
import i18n from '@/lib/i18n';

// ─── Types ───

export interface WeekVolumePoint {
  weekOffset: number;
  sets: number;
  zone: VolumeLandmarkZone;
}

export interface ExerciseBreakdownItem {
  exerciseId: string;
  exerciseName: string;
  exerciseNameFr: string;
  bodyPart: string;
  sets: number;
  bestWeight: number;
}

// ─── Reverse map: muscle → exercise IDs ───

const muscleToExercises = new Map<string, Exercise[]>();
for (const ex of exercises) {
  const muscle = TARGET_TO_MUSCLE[ex.target];
  if (!muscle) continue;
  if (!muscleToExercises.has(muscle)) muscleToExercises.set(muscle, []);
  muscleToExercises.get(muscle)!.push(ex);
}

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

/**
 * Returns all exercises from the catalog that target a given muscle group.
 */
export function getExercisesForMuscle(muscle: string): Exercise[] {
  return muscleToExercises.get(muscle) || [];
}

/**
 * Returns weekly set counts for a muscle over the last N weeks.
 */
export function getWeeklyVolumeHistory(
  history: WorkoutSession[],
  muscle: string,
  weeks: number = 12
): WeekVolumePoint[] {
  const landmarks = RP_VOLUME_LANDMARKS[muscle];
  const points: WeekVolumePoint[] = [];

  for (let i = -(weeks - 1); i <= 0; i++) {
    const weekData = getSetsForWeek(history, i);
    const sets = weekData[muscle] || 0;
    const zone = landmarks ? getVolumeZone(sets, landmarks) : 'below_mv';
    points.push({ weekOffset: i, sets, zone });
  }

  return points;
}

/**
 * Returns which exercises the user actually performed for this muscle
 * during a given week, with their set counts and best weight.
 */
export function getExerciseBreakdown(
  history: WorkoutSession[],
  muscle: string,
  weekOffset: number = 0
): ExerciseBreakdownItem[] {
  const { start, end } = getWeekBounds(weekOffset);
  const startMs = start.getTime();
  const endMs = end.getTime();

  const breakdown: Record<
    string,
    { sets: number; bestWeight: number }
  > = {};

  for (const session of history) {
    if (!session.endTime) continue;
    const sessionMs = new Date(session.startTime).getTime();
    if (sessionMs < startMs || sessionMs > endMs) continue;

    for (const compEx of session.completedExercises) {
      const exercise = exerciseMap.get(compEx.exerciseId);
      if (!exercise) continue;

      const exMuscle = TARGET_TO_MUSCLE[exercise.target];
      if (exMuscle !== muscle) continue;

      if (!breakdown[compEx.exerciseId]) {
        breakdown[compEx.exerciseId] = { sets: 0, bestWeight: 0 };
      }

      for (const set of compEx.sets) {
        if (!isEffectiveSet(set)) continue;
        breakdown[compEx.exerciseId].sets++;
        const w = set.weight || 0;
        if (w > breakdown[compEx.exerciseId].bestWeight) {
          breakdown[compEx.exerciseId].bestWeight = w;
        }
      }
    }
  }

  return Object.entries(breakdown)
    .map(([exerciseId, data]) => {
      const ex = exerciseMap.get(exerciseId);
      return {
        exerciseId,
        exerciseName: ex?.name || exerciseId,
        exerciseNameFr: ex?.nameFr || ex?.name || exerciseId,
        bodyPart: ex?.bodyPart || '',
        sets: data.sets,
        bestWeight: data.bestWeight,
      };
    })
    .sort((a, b) => b.sets - a.sets);
}

/**
 * Returns a localized advice string based on current zone.
 */
export function getZoneAdvice(zone: VolumeLandmarkZone): string {
  switch (zone) {
    case 'below_mv':
      return i18n.t('volume.zoneAdvice.belowMv');
    case 'mv_mev':
      return i18n.t('volume.zoneAdvice.mvMev');
    case 'mev_mav':
      return i18n.t('volume.zoneAdvice.mevMav');
    case 'mav_mrv':
      return i18n.t('volume.zoneAdvice.mavMrv');
    case 'above_mrv':
      return i18n.t('volume.zoneAdvice.aboveMrv');
  }
}
