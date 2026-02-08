import { WorkoutSession, WorkoutExercise } from '@/types';
import { ProgramDay } from '@/types/program';
import { getExerciseById } from '@/data/exercises';
import { TARGET_TO_MUSCLE, MUSCLE_LABELS_FR } from '@/lib/muscleMapping';
import { getSetsForWeek } from '@/lib/weeklyVolume';
import {
  RP_VOLUME_LANDMARKS,
  VolumeLandmarks,
  VolumeLandmarkZone,
  getVolumeZone,
  getZoneColor,
} from '@/constants/volumeLandmarks';
import { getOverloadSuggestions } from '@/lib/programGenerator';

export interface MuscleImpact {
  muscle: string;
  labelFr: string;
  currentSets: number;
  plannedSets: number;
  projectedSets: number;
  currentZone: VolumeLandmarkZone;
  projectedZone: VolumeLandmarkZone;
  zoneColor: string;
  landmarks: VolumeLandmarks;
  fillPct: number;
}

export interface SessionInsightsData {
  muscleImpacts: MuscleImpact[];
  overloadTips: { exerciseId: string; exerciseName: string; tip: string }[];
  totalPlannedSets: number;
  muscleCount: number;
}

export function computeSessionInsights(
  day: ProgramDay,
  history: WorkoutSession[],
): SessionInsightsData {
  // 1. Current week sets per muscle
  const currentWeekSets = getSetsForWeek(history, 0);

  // 2. Planned sets per muscle from this session's exercises
  const plannedPerMuscle: Record<string, number> = {};
  let totalPlannedSets = 0;

  for (const pex of day.exercises) {
    const ex = getExerciseById(pex.exerciseId);
    if (!ex) continue;
    const muscle = TARGET_TO_MUSCLE[ex.target];
    if (!muscle) continue;
    plannedPerMuscle[muscle] = (plannedPerMuscle[muscle] || 0) + pex.sets;
    totalPlannedSets += pex.sets;
  }

  // 3. Build muscle impacts
  const muscleImpacts: MuscleImpact[] = [];

  for (const muscle of Object.keys(plannedPerMuscle)) {
    const landmarks = RP_VOLUME_LANDMARKS[muscle];
    if (!landmarks) continue;

    const currentSets = currentWeekSets[muscle] || 0;
    const plannedSets = plannedPerMuscle[muscle];
    const projectedSets = currentSets + plannedSets;
    const currentZone = getVolumeZone(currentSets, landmarks);
    const projectedZone = getVolumeZone(projectedSets, landmarks);
    const zoneColor = getZoneColor(projectedZone);
    const fillPct = landmarks.mrv > 0 ? Math.min(projectedSets / landmarks.mrv, 1) : 1;

    muscleImpacts.push({
      muscle,
      labelFr: MUSCLE_LABELS_FR[muscle] || muscle,
      currentSets,
      plannedSets,
      projectedSets,
      currentZone,
      projectedZone,
      zoneColor,
      landmarks,
      fillPct,
    });
  }

  // Sort by plannedSets desc
  muscleImpacts.sort((a, b) => b.plannedSets - a.plannedSets);

  // 4. Overload tips (reuse existing pattern from day.tsx)
  const relevant = history
    .filter((s) => s.completedExercises && s.completedExercises.length > 0)
    .flatMap((s) =>
      s.completedExercises.map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets.map((set) => ({
          reps: set.reps,
          weight: set.weight,
          completed: set.completed,
        })),
      })),
    );

  const suggestionsMap = getOverloadSuggestions(relevant, day);
  const overloadTips: SessionInsightsData['overloadTips'] = [];

  for (const [exerciseId, tip] of Object.entries(suggestionsMap)) {
    if (overloadTips.length >= 3) break;
    const ex = getExerciseById(exerciseId);
    if (!ex) continue;
    overloadTips.push({ exerciseId, exerciseName: ex.nameFr || ex.name, tip });
  }

  return {
    muscleImpacts,
    overloadTips,
    totalPlannedSets,
    muscleCount: muscleImpacts.length,
  };
}

/**
 * Same muscle-impact panel for regular workouts (non-program).
 * Works with WorkoutExercise[] instead of ProgramDay.
 * Simpler overload tips: detects stale weight across sessions.
 */
export function computeWorkoutInsights(
  exercises: WorkoutExercise[],
  history: WorkoutSession[],
): SessionInsightsData {
  // 1. Current week sets per muscle
  const currentWeekSets = getSetsForWeek(history, 0);

  // 2. Planned sets per muscle
  const plannedPerMuscle: Record<string, number> = {};
  let totalPlannedSets = 0;

  for (const we of exercises) {
    const ex = getExerciseById(we.exerciseId);
    if (!ex) continue;
    const muscle = TARGET_TO_MUSCLE[ex.target];
    if (!muscle) continue;
    plannedPerMuscle[muscle] = (plannedPerMuscle[muscle] || 0) + we.sets;
    totalPlannedSets += we.sets;
  }

  // 3. Build muscle impacts
  const muscleImpacts: MuscleImpact[] = [];

  for (const muscle of Object.keys(plannedPerMuscle)) {
    const landmarks = RP_VOLUME_LANDMARKS[muscle];
    if (!landmarks) continue;

    const currentSets = currentWeekSets[muscle] || 0;
    const plannedSets = plannedPerMuscle[muscle];
    const projectedSets = currentSets + plannedSets;
    const currentZone = getVolumeZone(currentSets, landmarks);
    const projectedZone = getVolumeZone(projectedSets, landmarks);
    const zoneColor = getZoneColor(projectedZone);
    const fillPct = landmarks.mrv > 0 ? Math.min(projectedSets / landmarks.mrv, 1) : 1;

    muscleImpacts.push({
      muscle,
      labelFr: MUSCLE_LABELS_FR[muscle] || muscle,
      currentSets,
      plannedSets,
      projectedSets,
      currentZone,
      projectedZone,
      zoneColor,
      landmarks,
      fillPct,
    });
  }

  muscleImpacts.sort((a, b) => b.plannedSets - a.plannedSets);

  // 4. Simple overload tips — detect stale weight (same weight 2+ sessions)
  const overloadTips: SessionInsightsData['overloadTips'] = [];
  const completedHistory = history.filter(
    (s) => s.completedExercises && s.completedExercises.length > 0,
  );

  for (const we of exercises) {
    if (overloadTips.length >= 3) break;
    const ex = getExerciseById(we.exerciseId);
    if (!ex) continue;

    const past = completedHistory
      .flatMap((s) => s.completedExercises.filter((ce) => ce.exerciseId === we.exerciseId))
      .slice(0, 3);

    if (past.length < 2) continue;

    const weights = past.map((p) => {
      const done = p.sets.filter((s) => s.completed);
      return done.length > 0 ? done[0].weight || 0 : 0;
    });

    if (weights[0] > 0 && weights.every((w) => w === weights[0])) {
      const equip = ex.equipment;
      const step = (equip === 'barbell' || equip === 'ez bar' || equip === 'smith machine' || equip === 'trap bar')
        ? 2.5 : 2;
      overloadTips.push({
        exerciseId: we.exerciseId,
        exerciseName: ex.nameFr || ex.name,
        tip: `${weights[0]}kg depuis ${past.length} séances — essaie ${weights[0] + step}kg`,
      });
    }
  }

  return {
    muscleImpacts,
    overloadTips,
    totalPlannedSets,
    muscleCount: muscleImpacts.length,
  };
}
