import { exercises as allExercises } from '@/data/exercises';
import { TARGET_TO_MUSCLE, getMuscleLabel } from '@/lib/muscleMapping';
import { getSetsForWeek } from '@/lib/weeklyVolume';
import {
  RP_VOLUME_LANDMARKS,
  getVolumeZone,
  getZoneColor,
  type VolumeLandmarkZone,
  type VolumeLandmarks,
} from '@/constants/volumeLandmarks';
import i18n from '@/lib/i18n';
import type { CompletedExercise, CompletedSet, WorkoutSession } from '@/types';
import { isEffectiveSet } from '@/types';
import type { SessionFeedback } from '@/types/program';

const exerciseMap = new Map(allExercises.map((e) => [e.id, e]));

// ─── Types ───

export interface VolumeImpact {
  muscle: string;
  muscleLabel: string;
  setsBefore: number;
  setsAdded: number;
  setsAfter: number;
  zoneBefore: VolumeLandmarkZone;
  zoneAfter: VolumeLandmarkZone;
  zoneColor: string;
  landmarks: VolumeLandmarks;
}

export interface RecoveryForecast {
  muscle: string;
  muscleLabel: string;
  hours: number;
  readyAt: Date;
}

// ─── Volume Impact ───

/**
 * Computes per-muscle volume impact of the session:
 * sets before this session (this week), sets added, zone change.
 */
export function computeVolumeImpact(
  completedExercises: CompletedExercise[],
  history: WorkoutSession[],
  currentSessionId?: string,
): VolumeImpact[] {
  // Get this week's sets BEFORE this session (exclude current session)
  const filteredHistory = currentSessionId
    ? history.filter((s) => s.id !== currentSessionId)
    : history;
  const weeklySetsBefore = getSetsForWeek(filteredHistory, 0);

  // Count sets added in this session
  const sessionSets: Record<string, number> = {};
  for (const compEx of completedExercises) {
    const exercise = exerciseMap.get(compEx.exerciseId);
    if (!exercise) continue;
    const muscle = TARGET_TO_MUSCLE[exercise.target];
    if (!muscle) continue;
    const completed = compEx.sets.filter(isEffectiveSet).length;
    sessionSets[muscle] = (sessionSets[muscle] || 0) + completed;
  }

  // Build impact for each muscle worked
  const impacts: VolumeImpact[] = [];
  for (const muscle of Object.keys(sessionSets)) {
    const landmarks = RP_VOLUME_LANDMARKS[muscle];
    if (!landmarks) continue;

    const setsBefore = weeklySetsBefore[muscle] || 0;
    const setsAdded = sessionSets[muscle];
    const setsAfter = setsBefore + setsAdded;
    const zoneBefore = getVolumeZone(setsBefore, landmarks);
    const zoneAfter = getVolumeZone(setsAfter, landmarks);

    impacts.push({
      muscle,
      muscleLabel: getMuscleLabel(muscle),
      setsBefore,
      setsAdded,
      setsAfter,
      zoneBefore,
      zoneAfter,
      zoneColor: getZoneColor(zoneAfter),
      landmarks,
    });
  }

  // Sort by setsAdded descending
  impacts.sort((a, b) => b.setsAdded - a.setsAdded);
  return impacts;
}

// ─── Recovery Forecast ───

/**
 * Estimates recovery time per muscle worked.
 * Base: 48h. Modifiers: heavy compounds +24h, high volume +12h, feedback (soreness/joint).
 */
export function computeRecoveryForecast(
  completedExercises: CompletedExercise[],
  feedback?: SessionFeedback,
): RecoveryForecast[] {
  const muscleData: Record<string, { sets: number; isCompound: boolean }> = {};

  for (const compEx of completedExercises) {
    const exercise = exerciseMap.get(compEx.exerciseId);
    if (!exercise) continue;
    const muscle = TARGET_TO_MUSCLE[exercise.target];
    if (!muscle) continue;
    const completed = compEx.sets.filter((s) => s.completed).length;
    if (completed === 0) continue;

    if (!muscleData[muscle]) {
      muscleData[muscle] = { sets: 0, isCompound: false };
    }
    muscleData[muscle].sets += completed;
    // Check if exercise is compound (multi-joint)
    if (exercise.secondaryMuscles && exercise.secondaryMuscles.length >= 2) {
      muscleData[muscle].isCompound = true;
    }
  }

  const now = new Date();
  const forecasts: RecoveryForecast[] = [];

  for (const [muscle, data] of Object.entries(muscleData)) {
    let hours = 48; // base

    // Compound exercises recover slower
    if (data.isCompound) hours += 24;

    // High volume adds recovery time
    if (data.sets > 8) hours += 12;

    // Feedback modifiers
    if (feedback) {
      if (feedback.soreness === 3) hours += 12;
      if (feedback.jointPain) hours += 24;
    }

    const readyAt = new Date(now.getTime() + hours * 3600000);

    forecasts.push({
      muscle,
      muscleLabel: getMuscleLabel(muscle),
      hours,
      readyAt,
    });
  }

  // Sort by longest recovery first
  forecasts.sort((a, b) => b.hours - a.hours);
  return forecasts;
}

// ─── Training Load ───

/**
 * Foster method: duration (minutes) × session intensity (10 - avgRir).
 * Returns arbitrary units (AU).
 */
export function computeTrainingLoad(durationSeconds: number, completedSets: Record<number, CompletedSet[]>): number {
  const minutes = durationSeconds / 60;

  // Compute average RIR across all completed sets
  let totalRir = 0;
  let count = 0;
  for (const sets of Object.values(completedSets)) {
    for (const s of sets) {
      if (s.completed) {
        totalRir += s.rir ?? 2;
        count++;
      }
    }
  }

  const avgRir = count > 0 ? totalRir / count : 2;
  const intensity = 10 - avgRir;

  return Math.round(minutes * intensity);
}

// ─── Celebration Subtitle ───

/**
 * Returns a contextual celebration subtitle based on session performance.
 */
export function getCelebrationSubtitle(
  completionRatio: number,
  prCount: number,
): string {
  if (completionRatio >= 0.8 && prCount > 0) {
    return i18n.t('workoutSession.celebrationBeast');
  }
  if (prCount > 0) {
    return i18n.t('workoutSession.celebrationPR');
  }
  if (completionRatio >= 0.6) {
    return i18n.t('workoutSession.celebrationGood');
  }
  return i18n.t('workoutSession.celebrationShort');
}

// ─── Feedback Transparency ───

/**
 * Returns a transparency nudge explaining what the feedback does.
 */
export function getFeedbackTransparency(feedback: SessionFeedback): string {
  if (feedback.jointPain) {
    return i18n.t('workoutSession.feedbackTransparencyJoint');
  }
  if (feedback.soreness === 3 && feedback.performance === 1) {
    return i18n.t('workoutSession.feedbackTransparencyReduces');
  }
  if (feedback.pump === 1 && feedback.soreness === 1 && feedback.performance >= 2) {
    return i18n.t('workoutSession.feedbackTransparencyIncreases');
  }
  return i18n.t('workoutSession.feedbackTransparencyMaintains');
}

// ─── Zone Label ───

const ZONE_LABELS: Record<VolumeLandmarkZone, string> = {
  below_mv: 'MV',
  mv_mev: 'MV',
  mev_mav: 'MAV',
  mav_mrv: 'MRV',
  above_mrv: 'MRV+',
};

export function getZoneLabel(zone: VolumeLandmarkZone): string {
  return ZONE_LABELS[zone];
}

// ─── Recovery Time Formatting ───

/**
 * Formats a recovery readyAt date as a relative label.
 */
export function formatReadyAt(readyAt: Date): string {
  const now = new Date();
  const diffMs = readyAt.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / 3600000);

  if (diffHours <= 0) return i18n.t('workoutSession.readyAt', { time: i18n.locale === 'fr' ? 'maintenant' : 'now' });

  const targetDay = readyAt.getDay();
  const today = now.getDay();
  const locale = i18n.locale === 'fr' ? 'fr-FR' : 'en-US';
  const dayNames = i18n.locale === 'fr'
    ? ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const hours = readyAt.getHours().toString().padStart(2, '0');
  const minutes = readyAt.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  if (targetDay === today && diffHours <= 24) {
    return i18n.t('workoutSession.readyAt', { time: timeStr });
  }

  return i18n.t('workoutSession.readyAt', {
    time: `${dayNames[targetDay]} ${timeStr}`,
  });
}
