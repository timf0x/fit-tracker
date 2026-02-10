/**
 * Recovery Helpers
 * Computes real muscle recovery status from workout history.
 * Replaces all mock data on the recovery page.
 */

import { exercises } from '@/data/exercises';
import { WorkoutSession, RecoveryBodyPart, RecoveryLevel, MuscleRecoveryData, RecoveryOverview } from '@/types';
import {
  MUSCLE_RECOVERY_HOURS,
  SCORE_WEIGHTS,
  TRACKABLE_BODY_PARTS,
  BODY_PART_LABELS,
} from '@/constants/recovery';
import { TARGET_TO_MUSCLE } from '@/lib/muscleMapping';
import { SessionFeedback } from '@/types/program';
import i18n from '@/lib/i18n';

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

interface MuscleLastTrained {
  hoursSince: number;
  totalSets: number;
  sessionDate: string;
  exerciseNames: string[];
  feedback?: SessionFeedback;
}

/**
 * For each muscle group, find the most recent session that trained it
 * and count total sets from that session.
 */
function getLastTrainedPerMuscle(
  history: WorkoutSession[]
): Record<string, MuscleLastTrained> {
  const result: Record<string, MuscleLastTrained> = {};
  const now = Date.now();

  // Sort sessions by start time descending (most recent first)
  const sorted = [...history]
    .filter((s) => s.endTime && s.completedExercises.length > 0)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  for (const session of sorted) {
    const sessionTime = new Date(session.startTime).getTime();
    const hoursSince = (now - sessionTime) / (1000 * 60 * 60);

    // Group exercises by muscle in this session
    const muscleSets: Record<string, { sets: number; names: string[] }> = {};

    for (const compEx of session.completedExercises) {
      const exercise = exerciseMap.get(compEx.exerciseId);
      if (!exercise) continue;

      const muscle = TARGET_TO_MUSCLE[exercise.target];
      if (!muscle) continue;

      const completedSets = compEx.sets.filter((s) => s.completed).length;
      if (completedSets === 0) continue;

      if (!muscleSets[muscle]) {
        muscleSets[muscle] = { sets: 0, names: [] };
      }
      muscleSets[muscle].sets += completedSets;
      const name = exercise.nameFr || exercise.name;
      if (!muscleSets[muscle].names.includes(name)) {
        muscleSets[muscle].names.push(name);
      }
    }

    // Only record if this muscle hasn't been seen yet (most recent wins)
    for (const [muscle, data] of Object.entries(muscleSets)) {
      if (!result[muscle]) {
        result[muscle] = {
          hoursSince,
          totalSets: data.sets,
          sessionDate: session.startTime,
          exerciseNames: data.names,
          feedback: session.feedback,
        };
      }
    }
  }

  return result;
}

/**
 * Compute a recovery time multiplier based on volume and session feedback.
 *
 * Volume: ~4 sets = baseline (1.0x). More sets → proportionally longer recovery.
 *   Capped at [0.8x, 1.6x] to stay realistic.
 *
 * Feedback (multiplicative on top of volume):
 *   - Soreness 3 (high): +25% — significant muscle damage signal
 *   - Soreness 1 (low): -10% — minimal damage
 *   - Joint pain: +40% — injury risk, needs extra caution
 *   - Performance 1 + Soreness ≥ 2: +15% — overreaching signal
 */
function getRecoveryMultiplier(
  totalSets: number,
  feedback?: SessionFeedback,
): number {
  // Volume scaling: 4 sets = baseline
  const volumeMultiplier = Math.max(0.8, Math.min(1.6, 1 + (totalSets - 4) * 0.05));

  let feedbackMultiplier = 1.0;
  if (feedback) {
    if (feedback.soreness === 3) feedbackMultiplier *= 1.25;
    else if (feedback.soreness === 1) feedbackMultiplier *= 0.9;
    if (feedback.jointPain) feedbackMultiplier *= 1.4;
    if (feedback.performance === 1 && feedback.soreness >= 2) feedbackMultiplier *= 1.15;
  }

  return volumeMultiplier * feedbackMultiplier;
}

/**
 * Determine recovery status for a muscle based on hours since training,
 * volume performed, and post-session feedback.
 */
function getRecoveryStatus(
  bodyPart: RecoveryBodyPart,
  hoursSince: number | null,
  totalSets: number = 0,
  feedback?: SessionFeedback,
): RecoveryLevel {
  if (hoursSince === null) return 'undertrained';

  const thresholds = MUSCLE_RECOVERY_HOURS[bodyPart];
  if (!thresholds) return 'fresh';

  const multiplier = getRecoveryMultiplier(totalSets, feedback);
  const adjustedFreshMin = thresholds.freshMin * multiplier;
  const adjustedFreshMax = thresholds.freshMax * multiplier;

  if (hoursSince < adjustedFreshMin) return 'fatigued';
  if (hoursSince <= adjustedFreshMax) return 'fresh';
  // Undertrained threshold stays fixed — it's about training frequency, not fatigue duration
  if (hoursSince > thresholds.undertrained) return 'undertrained';
  return 'fresh';
}

/**
 * Get the adjusted recovery hours for a muscle (for detail views / progress bars).
 */
function getAdjustedRecoveryHours(
  bodyPart: RecoveryBodyPart,
  totalSets: number,
  feedback?: SessionFeedback,
): number {
  const thresholds = MUSCLE_RECOVERY_HOURS[bodyPart];
  if (!thresholds) return 48;
  return thresholds.freshMin * getRecoveryMultiplier(totalSets, feedback);
}

/**
 * Compute full recovery overview from real workout history.
 * Falls back to mock-like default if no history exists.
 */
export function computeRecoveryOverview(
  history: WorkoutSession[]
): RecoveryOverview {
  const lastTrained = getLastTrainedPerMuscle(history);

  const muscles: MuscleRecoveryData[] = TRACKABLE_BODY_PARTS.map((bp) => {
    const data = lastTrained[bp];
    const hoursSince = data ? data.hoursSince : null;
    const totalSets = data ? data.totalSets : 0;
    const status = getRecoveryStatus(bp, hoursSince, totalSets, data?.feedback);

    return { bodyPart: bp, status, hoursSinceTraining: hoursSince, totalSets };
  });

  let freshCount = 0;
  let fatiguedCount = 0;
  let undertrainedCount = 0;

  for (const m of muscles) {
    if (m.status === 'fresh') freshCount++;
    else if (m.status === 'fatigued') fatiguedCount++;
    else undertrainedCount++;
  }

  // Overall score: weighted average
  const totalWeight = muscles.length;
  const score = totalWeight > 0
    ? Math.round(muscles.reduce((acc, m) => acc + SCORE_WEIGHTS[m.status], 0) / totalWeight)
    : 50;

  return { overallScore: score, muscles, freshCount, fatiguedCount, undertrainedCount };
}

/**
 * Get last-trained info for a specific muscle (for detail view).
 */
export function getMuscleRecoveryDetail(
  history: WorkoutSession[],
  bodyPart: RecoveryBodyPart
): {
  hoursSince: number | null;
  totalSets: number;
  exerciseNames: string[];
  sessionDate: string | null;
  recoveryProgress: number;
  hoursRemaining: number;
  totalRecoveryHours: number;
} {
  const lastTrained = getLastTrainedPerMuscle(history);
  const data = lastTrained[bodyPart];

  if (!data) {
    const thresholds = MUSCLE_RECOVERY_HOURS[bodyPart];
    return {
      hoursSince: null,
      totalSets: 0,
      exerciseNames: [],
      sessionDate: null,
      recoveryProgress: 0,
      hoursRemaining: 0,
      totalRecoveryHours: thresholds?.freshMin || 48,
    };
  }

  const totalRecoveryHours = getAdjustedRecoveryHours(bodyPart, data.totalSets, data.feedback);
  const status = getRecoveryStatus(bodyPart, data.hoursSince, data.totalSets, data.feedback);
  let recoveryProgress = 1;
  let hoursRemaining = 0;

  if (status === 'fatigued') {
    recoveryProgress = Math.min(data.hoursSince / totalRecoveryHours, 0.95);
    hoursRemaining = Math.max(0, totalRecoveryHours - data.hoursSince);
  } else if (status === 'undertrained') {
    recoveryProgress = 0;
  }

  return {
    hoursSince: data.hoursSince,
    totalSets: data.totalSets,
    exerciseNames: data.exerciseNames,
    sessionDate: data.sessionDate,
    recoveryProgress,
    hoursRemaining,
    totalRecoveryHours,
  };
}

/**
 * Smart training recommendation based on recovery + volume gaps.
 * Returns a French one-liner nudge.
 */
export function getTrainingRecommendation(
  overview: RecoveryOverview
): { message: string; muscles: string[]; type: 'push' | 'pull' | 'legs' | 'rest' | 'general' } {
  const fresh = overview.muscles.filter((m) => m.status === 'fresh');
  const fatigued = overview.muscles.filter((m) => m.status === 'fatigued');
  const undertrained = overview.muscles.filter((m) => m.status === 'undertrained');

  // If everything is fatigued, suggest rest
  if (fatigued.length >= 10) {
    return {
      message: i18n.t('recovery.recRest'),
      muscles: [],
      type: 'rest',
    };
  }

  // Group fresh muscles by category
  const pushMuscles = fresh.filter((m) =>
    ['chest', 'shoulders', 'triceps'].includes(m.bodyPart)
  );
  const pullMuscles = fresh.filter((m) =>
    ['upper back', 'lats', 'lower back', 'biceps', 'forearms'].includes(m.bodyPart)
  );
  const legMuscles = fresh.filter((m) =>
    ['quads', 'hamstrings', 'glutes', 'calves'].includes(m.bodyPart)
  );

  const locale = i18n.locale;
  const getLabel = (bp: string) => {
    const labels = BODY_PART_LABELS[bp as RecoveryBodyPart];
    return labels ? (locale === 'fr' ? labels.fr : labels.en) : bp;
  };

  // Suggest the category with the most fresh muscles
  const categories = [
    { type: 'push' as const, muscles: pushMuscles, label: 'push' },
    { type: 'pull' as const, muscles: pullMuscles, label: 'pull' },
    { type: 'legs' as const, muscles: legMuscles, label: i18n.t('recovery.recLegs') },
  ].sort((a, b) => b.muscles.length - a.muscles.length);

  const best = categories[0];

  if (best.muscles.length >= 2) {
    const names = best.muscles.slice(0, 3).map((m) => getLabel(m.bodyPart));
    return {
      message: i18n.t('recovery.recFresh', { muscles: names.join(', '), type: best.label }),
      muscles: best.muscles.map((m) => m.bodyPart),
      type: best.type,
    };
  }

  // If undertrained muscles exist, nudge those
  if (undertrained.length > 0) {
    const names = undertrained.slice(0, 3).map((m) => getLabel(m.bodyPart));
    const key = undertrained.length === 1 ? 'recovery.recUntrainedSingle' : 'recovery.recUntrained';
    return {
      message: i18n.t(key, { muscles: names.join(', ') }),
      muscles: undertrained.slice(0, 3).map((m) => m.bodyPart),
      type: 'general',
    };
  }

  return {
    message: i18n.t('recovery.recGeneral'),
    muscles: [],
    type: 'general',
  };
}

/**
 * Format hours since training as a human-readable localized string.
 */
export function formatTimeSince(hours: number | null): string {
  if (hours === null) return i18n.t('recovery.timeNever');
  if (hours < 1) return i18n.t('recovery.timeLessThan1h');
  if (hours < 24) return i18n.t('recovery.timeHours', { hours: Math.round(hours) });
  const days = Math.round(hours / 24);
  if (days === 1) return i18n.t('recovery.timeDay');
  return i18n.t('recovery.timeDays', { days });
}
