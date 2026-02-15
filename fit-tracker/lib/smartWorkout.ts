/**
 * Smart Workout Engine
 *
 * Computes data-driven training suggestions and generates
 * ad-hoc workouts based on recovery + volume + history.
 */

import { WorkoutSession, RecoveryLevel, Equipment } from '@/types';
import { EquipmentSetup, ExperienceLevel } from '@/types/program';
import { exercises, getExerciseById } from '@/data/exercises';
import { computeRecoveryOverview, getTrainingRecommendation } from '@/lib/recoveryHelpers';
import { getSetsForWeek } from '@/lib/weeklyVolume';
import { MUSCLE_LABELS_FR } from '@/lib/muscleMapping';
import {
  RP_VOLUME_LANDMARKS,
  VolumeLandmarkZone,
  getVolumeZone,
  getZoneColor,
} from '@/constants/volumeLandmarks';
import {
  EXERCISE_POOLS,
  EQUIPMENT_BY_SETUP,
  GOAL_CONFIG,
} from '@/constants/programTemplates';
import { isCompound } from '@/lib/programGenerator';
import { getExerciseCategory } from '@/lib/exerciseClassification';
import { getEstimatedWeight, getProgressiveWeight, roundToIncrement } from '@/lib/weightEstimation';
import { RECOVERY_COLORS, TRACKABLE_BODY_PARTS } from '@/constants/recovery';
import i18n from '@/lib/i18n';

// ─── Types ───

export interface SmartMuscleSuggestion {
  muscle: string;
  labelFr: string;
  recoveryStatus: RecoveryLevel;
  zone: VolumeLandmarkZone;
  zoneLabelShort: string;
  zoneColor: string;
  currentSets: number;
}

export interface SmartSuggestion {
  sessionType: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body' | 'rest';
  sessionLabel: string;
  sessionColor: string;
  muscles: SmartMuscleSuggestion[];
  nudge: string;
  hasHistory: boolean;
}

export interface GeneratedExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  minReps: number;
  maxReps: number;
  restTime: number;
  setTime: number;
  suggestedWeight: number;
  muscle: string;
}

export interface GeneratedWorkout {
  exercises: GeneratedExercise[];
  sessionLabel: string;
  muscleTargets: string[];
  totalSets: number;
  estimatedMinutes: number;
}

export interface SessionSummary {
  muscleCount: number;
  totalSets: number;
  estimatedMinutes: number;
}

// ─── Zone Labels (i18n) ───

const ZONE_I18N_KEY: Record<VolumeLandmarkZone, string> = {
  below_mv: 'zones.shortBelowMv',
  mv_mev: 'zones.shortMv',
  mev_mav: 'zones.shortMev',
  mav_mrv: 'zones.shortMav',
  above_mrv: 'zones.shortMrv',
};

function getZoneLabelShort(zone: VolumeLandmarkZone): string {
  return i18n.t(ZONE_I18N_KEY[zone]);
}

// ─── Session Type Mapping (i18n) ───

const SESSION_LABEL_KEY: Record<string, string> = {
  push: 'workoutGenerate.sessionLabels.push',
  pull: 'workoutGenerate.sessionLabels.pull',
  legs: 'workoutGenerate.sessionLabels.legs',
  upper: 'workoutGenerate.sessionLabels.upper',
  lower: 'workoutGenerate.sessionLabels.lower',
  full_body: 'workoutGenerate.sessionLabels.fullBody',
  rest: 'workoutGenerate.sessionLabels.rest',
  general: 'workoutGenerate.sessionLabels.default',
};

function getSessionTypeLabel(type: string): string {
  const key = SESSION_LABEL_KEY[type];
  return key ? i18n.t(key) : i18n.t('workoutGenerate.sessionLabels.default');
}

const SESSION_TYPE_COLOR: Record<string, string> = {
  push: '#FF6B35',
  pull: '#3B82F6',
  legs: '#4ADE80',
  upper: '#FF6B35',
  lower: '#4ADE80',
  full_body: '#A855F7',
  rest: '#6B7280',
  general: '#FF6B35',
};

// ─── Muscle Sort Order (compounds first) ───

const MUSCLE_SORT_ORDER: Record<string, number> = {
  quads: 0, hamstrings: 1, glutes: 2, chest: 3, lats: 4,
  'upper back': 5, 'lower back': 6, shoulders: 7,
  triceps: 8, biceps: 9, forearms: 10, calves: 11,
  abs: 12, obliques: 13,
};

// ─── Muscle Size Classification ───

const LARGE_MUSCLES = new Set(['chest', 'lats', 'quads', 'hamstrings', 'glutes']);
const SMALL_MUSCLES = new Set(['biceps', 'triceps', 'forearms', 'calves', 'abs', 'obliques']);
// Everything else is medium: shoulders, upper back, lower back

// ─── Main Functions ───

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

/**
 * Compute a smart training suggestion based on recovery + volume data.
 */
export function computeSmartSuggestion(
  history: WorkoutSession[],
): SmartSuggestion {
  const hasHistory = history.some((s) => s.endTime && s.completedExercises.length > 0);

  if (!hasHistory) {
    return {
      sessionType: 'full_body',
      sessionLabel: getSessionTypeLabel('full_body'),
      sessionColor: SESSION_TYPE_COLOR.full_body,
      muscles: [],
      nudge: '',
      hasHistory: false,
    };
  }

  // 1. Recovery overview
  const overview = computeRecoveryOverview(history);

  // 2. Current week volume
  const currentWeekSets = getSetsForWeek(history, 0);

  // 3. Training recommendation
  const rec = getTrainingRecommendation(overview);

  // 4. Map session type
  const sessionType = rec.type === 'general' ? 'full_body' : rec.type;

  // 5. Build muscle suggestions from recommended muscles
  const muscles: SmartMuscleSuggestion[] = rec.muscles
    .filter((m) => m !== 'cardio')
    .slice(0, 4)
    .map((muscle) => {
      const landmarks = RP_VOLUME_LANDMARKS[muscle];
      const currentSets = currentWeekSets[muscle] || 0;
      const zone = landmarks ? getVolumeZone(currentSets, landmarks) : 'below_mv' as VolumeLandmarkZone;
      const zoneColor = getZoneColor(zone);
      const recoveryData = overview.muscles.find((m) => m.bodyPart === muscle);

      return {
        muscle,
        labelFr: MUSCLE_LABELS_FR[muscle] || muscle,
        recoveryStatus: recoveryData?.status || 'fresh',
        zone,
        zoneLabelShort: getZoneLabelShort(zone),
        zoneColor,
        currentSets,
      };
    });

  return {
    sessionType: sessionType as SmartSuggestion['sessionType'],
    sessionLabel: getSessionTypeLabel(sessionType),
    sessionColor: SESSION_TYPE_COLOR[sessionType] || '#FF6B35',
    muscles,
    nudge: rec.message,
    hasHistory: true,
  };
}

/**
 * Get recovery + volume data for ALL muscles (for the generator selector screen).
 */
export function getAllMuscleData(
  history: WorkoutSession[],
): SmartMuscleSuggestion[] {
  const overview = computeRecoveryOverview(history);
  const currentWeekSets = getSetsForWeek(history, 0);

  return TRACKABLE_BODY_PARTS
    .filter((bp) => bp !== 'cardio')
    .map((muscle) => {
      const landmarks = RP_VOLUME_LANDMARKS[muscle];
      const currentSets = currentWeekSets[muscle] || 0;
      const zone = landmarks ? getVolumeZone(currentSets, landmarks) : 'below_mv' as VolumeLandmarkZone;
      const zoneColor = getZoneColor(zone);
      const recoveryData = overview.muscles.find((m) => m.bodyPart === muscle);

      return {
        muscle,
        labelFr: MUSCLE_LABELS_FR[muscle] || muscle,
        recoveryStatus: recoveryData?.status || 'undertrained',
        zone,
        zoneLabelShort: getZoneLabelShort(zone),
        zoneColor,
        currentSets,
      };
    });
}

/**
 * Lightweight session summary for live preview in the selector step.
 */
export function estimateSessionSummary(
  selectedMuscles: string[],
  equipment: EquipmentSetup,
  targetDurationMin?: number,
  allowedEquipmentOverride?: Equipment[],
): SessionSummary {
  let totalSets = 0;
  const allowedEquipment = allowedEquipmentOverride ?? EQUIPMENT_BY_SETUP[equipment];

  for (const muscle of selectedMuscles) {
    const landmarks = RP_VOLUME_LANDMARKS[muscle];
    if (!landmarks) continue;

    // Target sets per session = MAV low / 2 (assumes ~2x/week frequency)
    let setsPerSession = Math.floor(landmarks.mavLow / 2);

    // Cap by muscle size
    if (LARGE_MUSCLES.has(muscle)) setsPerSession = Math.min(Math.max(setsPerSession, 2), 6);
    else if (SMALL_MUSCLES.has(muscle)) setsPerSession = Math.min(Math.max(setsPerSession, 2), 4);
    else setsPerSession = Math.min(Math.max(setsPerSession, 2), 5);

    totalSets += setsPerSession;
  }

  // Estimate duration: ~2.5 min per set average (set + rest)
  let estimatedMinutes = Math.round(totalSets * 2.5);

  // If target duration specified, cap sets proportionally
  if (targetDurationMin && estimatedMinutes > targetDurationMin) {
    const ratio = targetDurationMin / estimatedMinutes;
    totalSets = Math.max(Math.round(totalSets * ratio), selectedMuscles.length);
    estimatedMinutes = targetDurationMin;
  }

  return {
    muscleCount: selectedMuscles.length,
    totalSets,
    estimatedMinutes: targetDurationMin || estimatedMinutes,
  };
}

/**
 * Generate a complete workout for the selected muscles.
 */
export function generateSmartWorkout(params: {
  selectedMuscles: string[];
  equipment: EquipmentSetup;
  allowedEquipment?: Equipment[];
  goal?: string;
  targetDurationMin?: number;
  history: WorkoutSession[];
  userWeight?: number;
  userSex?: 'male' | 'female';
  userExperience?: ExperienceLevel;
}): GeneratedWorkout {
  const {
    selectedMuscles,
    equipment,
    history,
    goal = 'hypertrophy',
    targetDurationMin,
    userWeight = 80,
    userSex = 'male',
    userExperience = 'intermediate',
  } = params;

  const allowedEquipment = params.allowedEquipment ?? EQUIPMENT_BY_SETUP[equipment];
  const goalConfig = GOAL_CONFIG[goal] || GOAL_CONFIG.hypertrophy;

  // Get last session's exercises for variety
  const lastSessionExercises = new Set<string>();
  const completedHistory = history.filter((s) => s.endTime && s.completedExercises.length > 0);
  if (completedHistory.length > 0) {
    for (const ce of completedHistory[0].completedExercises) {
      lastSessionExercises.add(ce.exerciseId);
    }
  }

  const usedExercises = new Set<string>();
  const allExercises: GeneratedExercise[] = [];

  // Process muscles sorted by MUSCLE_SORT_ORDER (big muscles first)
  const sortedMuscles = [...selectedMuscles].sort(
    (a, b) => (MUSCLE_SORT_ORDER[a] ?? 99) - (MUSCLE_SORT_ORDER[b] ?? 99)
  );

  for (const muscle of sortedMuscles) {
    const landmarks = RP_VOLUME_LANDMARKS[muscle];
    if (!landmarks) continue;

    // Target sets for this session
    let setsForMuscle = Math.floor(landmarks.mavLow / 2);

    // Cap by muscle size
    if (LARGE_MUSCLES.has(muscle)) setsForMuscle = Math.min(Math.max(setsForMuscle, 2), 6);
    else if (SMALL_MUSCLES.has(muscle)) setsForMuscle = Math.min(Math.max(setsForMuscle, 2), 4);
    else setsForMuscle = Math.min(Math.max(setsForMuscle, 2), 5);

    if (setsForMuscle <= 0) continue;

    // Pick exercises
    const pool = EXERCISE_POOLS[muscle] || [];
    const available = pool.filter((id) => {
      const ex = exerciseMap.get(id);
      return ex && allowedEquipment.includes(ex.equipment);
    });

    if (available.length === 0) continue;

    // How many unique unused exercises exist for this muscle?
    const unusedAvailable = available.filter((id) => !usedExercises.has(id));
    // Number of exercises: prefer 2 if >4 sets, but cap to what's actually available
    const exerciseCount = Math.min(
      setsForMuscle > 4 ? 2 : 1,
      Math.max(unusedAvailable.length, 1),
    );

    for (let i = 0; i < exerciseCount; i++) {
      let picked: string | null = null;

      // Prefer exercises NOT in the last session for variety
      for (const id of available) {
        if (usedExercises.has(id)) continue;
        if (!lastSessionExercises.has(id)) {
          // For first exercise, prefer compound
          if (i === 0 && !isCompound(id)) continue;
          picked = id;
          break;
        }
      }

      // Fallback: accept any unused exercise (compound preferred for first)
      if (!picked) {
        for (const id of available) {
          if (usedExercises.has(id)) continue;
          if (i === 0 && isCompound(id)) { picked = id; break; }
        }
      }

      // Final fallback: any unused exercise
      if (!picked) {
        for (const id of available) {
          if (!usedExercises.has(id)) { picked = id; break; }
        }
      }

      // Skip if no unused exercise found (never duplicate)
      if (!picked) continue;

      usedExercises.add(picked);

      const setsForThis = exerciseCount === 1
        ? setsForMuscle
        : i === 0
          ? Math.ceil(setsForMuscle / 2)
          : Math.floor(setsForMuscle / 2);

      // Get rep/rest config based on exercise category
      const category = getExerciseCategory(picked);
      const catConfig = goalConfig[category];

      // Weight: progressive overload from history, else estimate
      const ex = exerciseMap.get(picked);
      let weight = 0;

      if (ex) {
        // Try progressive overload from history
        const progressive = getProgressiveWeight(
          picked, ex.equipment, catConfig.minReps, completedHistory,
        );

        if (progressive.action !== 'none') {
          weight = progressive.weight;
        } else {
          // No history → cold estimate from BW ratios
          weight = getEstimatedWeight(
            picked, ex.equipment, ex.target,
            userWeight, userSex, userExperience,
          );
        }
      }

      allExercises.push({
        exerciseId: picked,
        sets: Math.max(setsForThis, 1),
        reps: catConfig.maxReps,
        minReps: catConfig.minReps,
        maxReps: catConfig.maxReps,
        restTime: catConfig.restTime,
        setTime: catConfig.setTime,
        suggestedWeight: weight,
        muscle,
      });
    }
  }

  // Sort: compounds first by muscle order, then isolations
  allExercises.sort((a, b) => {
    const aComp = isCompound(a.exerciseId);
    const bComp = isCompound(b.exerciseId);
    if (aComp !== bComp) return aComp ? -1 : 1;
    return (MUSCLE_SORT_ORDER[a.muscle] ?? 99) - (MUSCLE_SORT_ORDER[b.muscle] ?? 99);
  });

  // Duration-based trimming: if target duration is set, trim from the end
  if (targetDurationMin && targetDurationMin > 0) {
    const targetSeconds = targetDurationMin * 60;
    let running = 0;
    let cutoff = allExercises.length;
    for (let i = 0; i < allExercises.length; i++) {
      running += allExercises[i].sets * (allExercises[i].setTime + allExercises[i].restTime);
      if (running > targetSeconds) {
        cutoff = i + 1; // keep at least this exercise
        break;
      }
    }
    // If over budget, reduce sets on last exercise or drop trailing isolations
    if (running > targetSeconds && allExercises.length > cutoff) {
      allExercises.splice(cutoff);
    }
    // If still over, trim sets from the last exercise
    while (allExercises.length > 1) {
      const totalSec = allExercises.reduce((s, e) => s + e.sets * (e.setTime + e.restTime), 0);
      if (totalSec <= targetSeconds) break;
      const last = allExercises[allExercises.length - 1];
      if (last.sets > 2) {
        last.sets--;
      } else {
        allExercises.pop();
      }
    }
  }

  // Estimate duration
  let totalSeconds = 0;
  for (const ex of allExercises) {
    totalSeconds += ex.sets * (ex.setTime + ex.restTime);
  }

  // Build session label
  const sessionLabel = getSessionLabel(selectedMuscles);

  return {
    exercises: allExercises,
    sessionLabel,
    muscleTargets: selectedMuscles,
    totalSets: allExercises.reduce((sum, e) => sum + e.sets, 0),
    estimatedMinutes: Math.round(totalSeconds / 60),
  };
}

/**
 * Infer a session label from selected muscles.
 */
function getSessionLabel(muscles: string[]): string {
  const set = new Set(muscles);
  const hasPush = set.has('chest') || set.has('shoulders') || set.has('triceps');
  const hasPull = set.has('lats') || set.has('upper back') || set.has('biceps');
  const hasLegs = set.has('quads') || set.has('hamstrings') || set.has('glutes');

  if (hasPush && !hasPull && !hasLegs) return getSessionTypeLabel('push');
  if (hasPull && !hasPush && !hasLegs) return getSessionTypeLabel('pull');
  if (hasLegs && !hasPush && !hasPull) return getSessionTypeLabel('legs');
  if (hasPush && hasPull && !hasLegs) return getSessionTypeLabel('upper');
  if (hasLegs && !hasPush && !hasPull) return getSessionTypeLabel('lower');
  if (hasPush && hasPull && hasLegs) return getSessionTypeLabel('full_body');

  return getSessionTypeLabel('general');
}
