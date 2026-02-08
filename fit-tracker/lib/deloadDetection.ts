import { WorkoutSession } from '@/types';
import { getSetsForWeek } from '@/lib/weeklyVolume';
import { RP_VOLUME_LANDMARKS, getVolumeZone } from '@/constants/volumeLandmarks';
import i18n from '@/lib/i18n';
import { getMuscleLabel } from '@/lib/muscleMapping';

/**
 * Deload Detection Engine
 *
 * Analyzes the last N weeks of training volume per muscle group
 * and flags muscles that have been above MRV for 3+ consecutive weeks.
 *
 * Based on RP (Renaissance Periodization) guidelines:
 * - Training above MRV for 1-2 weeks = acceptable overreach
 * - Training above MRV for 3+ weeks = accumulated fatigue, deload recommended
 * - Deload = drop volume to MV (maintenance) for 1 week
 */

export interface DeloadMuscle {
  muscle: string;
  weeksAboveMrv: number;
  currentSets: number;
  mrv: number;
}

export interface DeloadStatus {
  needsDeload: boolean;
  muscles: DeloadMuscle[];
  severity: 'none' | 'warning' | 'urgent';
  message: string;
  messageFr: string;
}

const WEEKS_TO_CHECK = 4;
const DELOAD_THRESHOLD = 3; // consecutive weeks above MRV

/**
 * Check if any muscle group needs a deload based on recent volume history.
 */
export function checkDeloadStatus(history: WorkoutSession[]): DeloadStatus {
  const flaggedMuscles: DeloadMuscle[] = [];

  for (const [muscle, landmarks] of Object.entries(RP_VOLUME_LANDMARKS)) {
    let consecutiveAboveMrv = 0;
    let currentSets = 0;

    // Check weeks from most recent to oldest
    for (let weekOffset = 0; weekOffset >= -(WEEKS_TO_CHECK - 1); weekOffset--) {
      const setsForWeek = getSetsForWeek(history, weekOffset);
      const sets = setsForWeek[muscle] || 0;

      if (weekOffset === 0) currentSets = sets;

      const zone = getVolumeZone(sets, landmarks);
      if (zone === 'above_mrv') {
        consecutiveAboveMrv++;
      } else {
        break; // streak broken, stop counting
      }
    }

    if (consecutiveAboveMrv >= DELOAD_THRESHOLD) {
      flaggedMuscles.push({
        muscle,
        weeksAboveMrv: consecutiveAboveMrv,
        currentSets,
        mrv: landmarks.mrv,
      });
    }
  }

  if (flaggedMuscles.length === 0) {
    return {
      needsDeload: false,
      muscles: [],
      severity: 'none',
      message: '',
      messageFr: '',
    };
  }

  // Sort by severity (most weeks above MRV first)
  flaggedMuscles.sort((a, b) => b.weeksAboveMrv - a.weeksAboveMrv);

  const maxWeeks = flaggedMuscles[0].weeksAboveMrv;
  const severity = maxWeeks >= 4 ? 'urgent' : 'warning';

  const muscleNames = flaggedMuscles.map((m) => m.muscle);
  const muscleList = muscleNames.map((m) => getMuscleLabel(m)).join(', ');

  const localizedMessage = severity === 'urgent'
    ? i18n.t('deload.urgentMessage', { muscles: muscleList })
    : i18n.t('deload.warningMessage', { muscles: muscleList, weeks: maxWeeks });

  return {
    needsDeload: true,
    muscles: flaggedMuscles,
    severity,
    message: localizedMessage,
    messageFr: localizedMessage,
  };
}

/**
 * Quick check: does ANY muscle currently exceed MRV this week?
 * Lighter than full deload check — useful for real-time display.
 */
export function getMusclesAboveMrv(
  history: WorkoutSession[],
  weekOffset: number = 0,
): Array<{ muscle: string; sets: number; mrv: number; overflow: number }> {
  const setsForWeek = getSetsForWeek(history, weekOffset);
  const result: Array<{ muscle: string; sets: number; mrv: number; overflow: number }> = [];

  for (const [muscle, landmarks] of Object.entries(RP_VOLUME_LANDMARKS)) {
    const sets = setsForWeek[muscle] || 0;
    if (sets > landmarks.mrv) {
      result.push({
        muscle,
        sets,
        mrv: landmarks.mrv,
        overflow: sets - landmarks.mrv,
      });
    }
  }

  return result.sort((a, b) => b.overflow - a.overflow);
}

