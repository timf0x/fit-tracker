/**
 * Schedule Reconciliation Engine
 *
 * Detects missed workout days, computes context-aware resolution options,
 * and executes user-chosen resolutions. Science-based: considers recovery
 * windows, volume landmarks, mesocycle phase, and training goals.
 *
 * Runs on app open / store hydration to proactively detect missed days.
 */

import {
  TrainingProgram,
  ProgramSchedule,
  ScheduledDay,
  ActiveProgramState,
  MissedDayResolution,
  ResolutionOption,
  ResolutionAction,
  ProgramDay,
  WeekDay,
} from '@/types/program';
import { WorkoutSession } from '@/types';
import { MUSCLE_RECOVERY_HOURS } from '@/constants/recovery';
import { RP_VOLUME_LANDMARKS } from '@/constants/volumeLandmarks';
import { getSetsForWeek } from '@/lib/weeklyVolume';
import { TARGET_TO_MUSCLE } from '@/lib/muscleMapping';
import { exercises as allExercises } from '@/data/exercises';

const exerciseMap = new Map(allExercises.map((e) => [e.id, e]));

// ─── Date Helpers (mirrored from scheduleEngine for independence) ───

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: string, b: string): number {
  const dateA = parseDate(a);
  const dateB = parseDate(b);
  return Math.round((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
}

function getWeekDay(d: Date): WeekDay {
  const jsDay = d.getDay();
  return (jsDay === 0 ? 6 : jsDay - 1) as WeekDay;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function getMonday(d: Date): Date {
  const day = getWeekDay(d);
  return addDays(d, -day);
}

function nextPreferredDay(from: Date, preferredDays: WeekDay[]): Date {
  const sorted = [...preferredDays].sort((a, b) => a - b);
  const currentDay = getWeekDay(from);
  for (const pd of sorted) {
    if (pd >= currentDay) return addDays(from, pd - currentDay);
  }
  const daysUntilNextWeek = 7 - currentDay + sorted[0];
  return addDays(from, daysUntilNextWeek);
}

// ─── Core Detection ───

/**
 * Detect missed scheduled days — past planned dates with no completion and no skip.
 */
export function detectMissedDays(schedule: ProgramSchedule): ScheduledDay[] {
  const today = toISODate(new Date());
  return schedule.scheduledDays.filter(
    (sd) =>
      sd.plannedDate < today &&
      !sd.completedDate &&
      !sd.skippedDate,
  );
}

/**
 * Compute the full resolution context for missed days.
 * Returns null if no missed days are detected.
 */
export function computeResolution(
  program: TrainingProgram,
  activeState: ActiveProgramState,
  history: WorkoutSession[],
): MissedDayResolution | null {
  if (!activeState.schedule) return null;

  const missed = detectMissedDays(activeState.schedule);
  if (missed.length === 0) return null;

  const today = toISODate(new Date());

  // ─── Context: days since last session ───
  const lastCompleted = activeState.lastCompletedAt || activeState.startDate;
  const daysSinceLast = daysBetween(lastCompleted, today);

  // ─── Context: where in the week ───
  const currentWeek = program.weeks.find(
    (w) => w.weekNumber === missed[0].weekNumber,
  );
  const totalDaysInWeek = currentWeek
    ? currentWeek.days.filter((d) => !d.isRestDay).length
    : 3;
  const completedInWeek = activeState.schedule.scheduledDays.filter(
    (sd) =>
      sd.weekNumber === missed[0].weekNumber &&
      sd.completedDate,
  ).length;
  const positionRatio = completedInWeek / totalDaysInWeek;
  const weekContext: 'early' | 'mid' | 'late' =
    positionRatio < 0.33 ? 'early' : positionRatio < 0.67 ? 'mid' : 'late';

  // ─── Context: mesocycle phase ───
  const weekNumber = missed[0].weekNumber;
  const totalWeeks = program.totalWeeks;
  const currentProgramWeek = program.weeks.find(
    (w) => w.weekNumber === weekNumber,
  );
  const mesocyclePhase: 'ramp' | 'peak' | 'deload' = currentProgramWeek?.isDeload
    ? 'deload'
    : weekNumber >= totalWeeks - 1
      ? 'peak'
      : 'ramp';

  // ─── Context: current weekly volume ───
  const weeklySets = getSetsForWeek(history, 0);

  // ─── Context: recovery state of missed muscles ───
  const missedMuscles = new Set<string>();
  for (const sd of missed) {
    const week = program.weeks.find((w) => w.weekNumber === sd.weekNumber);
    const day = week?.days[sd.dayIndex];
    if (day) {
      for (const muscle of day.muscleTargets) {
        missedMuscles.add(muscle);
      }
    }
  }

  // Check recovery: hours since these muscles were last trained
  const muscleRecoveryStatus = computeMuscleRecovery(
    Array.from(missedMuscles),
    history,
    today,
  );

  // ─── Severity ───
  const severity: 'info' | 'warning' | 'urgent' =
    missed.length >= 3 || daysSinceLast >= 10
      ? 'urgent'
      : missed.length >= 2 || daysSinceLast >= 5
        ? 'warning'
        : 'info';

  // ─── Generate options ───
  const options = generateResolutionOptions(
    missed,
    program,
    activeState,
    history,
    weeklySets,
    muscleRecoveryStatus,
    mesocyclePhase,
    weekContext,
    daysSinceLast,
  );

  // ─── Nudge ───
  const nudgeKey = getNudgeKey(
    missed.length,
    daysSinceLast,
    mesocyclePhase,
    severity,
  );

  return {
    missedDays: missed,
    daysSinceLast,
    weekContext,
    mesocyclePhase,
    options,
    nudgeKey,
    severity,
  };
}

// ─── Recovery Analysis ───

interface MuscleRecoveryInfo {
  muscle: string;
  hoursSinceTraining: number;
  status: 'fatigued' | 'fresh' | 'undertrained';
  canTrainToday: boolean;
}

function computeMuscleRecovery(
  muscles: string[],
  history: WorkoutSession[],
  today: string,
): MuscleRecoveryInfo[] {
  const todayMs = parseDate(today).getTime();
  const result: MuscleRecoveryInfo[] = [];

  for (const muscle of muscles) {
    let lastTrainedMs = 0;

    // Find the most recent session that trained this muscle
    for (const session of history) {
      if (!session.endTime) continue;
      const sessionMs = new Date(session.startTime).getTime();
      if (sessionMs > lastTrainedMs) {
        for (const ex of session.completedExercises) {
          const exData = exerciseMap.get(ex.exerciseId);
          const exMuscle = exData ? TARGET_TO_MUSCLE[exData.target] : '';
          if (exMuscle === muscle && ex.sets.some((s) => s.completed)) {
            lastTrainedMs = sessionMs;
            break;
          }
        }
      }
    }

    const hoursSince = lastTrainedMs > 0
      ? (todayMs - lastTrainedMs) / (1000 * 60 * 60)
      : 999;

    // Look up recovery thresholds
    const recoveryKey = muscle as keyof typeof MUSCLE_RECOVERY_HOURS;
    const thresholds = MUSCLE_RECOVERY_HOURS[recoveryKey];

    let status: 'fatigued' | 'fresh' | 'undertrained';
    if (!thresholds || hoursSince >= 999) {
      status = 'fresh';
    } else if (hoursSince < thresholds.fatigued) {
      status = 'fatigued';
    } else if (hoursSince <= thresholds.freshMax) {
      status = 'fresh';
    } else {
      status = 'undertrained';
    }

    const canTrainToday =
      status === 'fresh' ||
      status === 'undertrained' ||
      (thresholds ? hoursSince >= thresholds.freshMin : true);

    result.push({ muscle, hoursSinceTraining: hoursSince, status, canTrainToday });
  }

  return result;
}

// ─── Option Generation ───

function generateResolutionOptions(
  missed: ScheduledDay[],
  program: TrainingProgram,
  activeState: ActiveProgramState,
  history: WorkoutSession[],
  weeklySets: Record<string, number>,
  muscleRecovery: MuscleRecoveryInfo[],
  mesocyclePhase: 'ramp' | 'peak' | 'deload',
  weekContext: 'early' | 'mid' | 'late',
  daysSinceLast: number,
): ResolutionOption[] {
  const options: ResolutionOption[] = [];
  const allRecovered = muscleRecovery.every((m) => m.canTrainToday);

  // ─── Option 1: Do the missed workout ───
  // Only if single missed day and muscles are recovered and < 4 days missed
  if (missed.length === 1 && allRecovered && daysSinceLast <= 4) {
    const isRecommended =
      mesocyclePhase !== 'deload' && weekContext !== 'late';

    options.push({
      action: 'do_missed',
      labelKey: 'missedDay.doMissed',
      descriptionKey: 'missedDay.doMissedDesc',
      recommended: isRecommended,
    });
  }

  // ─── Option 2: Skip and continue ───
  // Always available — simplest path
  {
    // Recommended when: deload week, late in week, or 3+ missed days
    const isRecommended =
      mesocyclePhase === 'deload' ||
      missed.length >= 3 ||
      (weekContext === 'late' && missed.length >= 2);

    options.push({
      action: 'skip_continue',
      labelKey: 'missedDay.skipContinue',
      descriptionKey: mesocyclePhase === 'deload'
        ? 'missedDay.skipDeloadDesc'
        : missed.length >= 3
          ? 'missedDay.skipMultipleDesc'
          : 'missedDay.skipContinueDesc',
      recommended: isRecommended,
    });
  }

  // ─── Option 3: Merge missed muscles into next session ───
  // Only if missed muscles can fit within session volume cap
  if (missed.length <= 2 && mesocyclePhase !== 'deload') {
    const missedMuscles = new Set<string>();
    let missedSets = 0;
    for (const sd of missed) {
      const week = program.weeks.find((w) => w.weekNumber === sd.weekNumber);
      const day = week?.days[sd.dayIndex];
      if (day) {
        for (const muscle of day.muscleTargets) missedMuscles.add(muscle);
        missedSets += day.exercises.reduce((s, e) => s + e.sets, 0);
      }
    }

    // Get next scheduled day's volume
    const nextDay = getNextUncompletedDay(activeState.schedule!, missed);
    const nextWeek = nextDay
      ? program.weeks.find((w) => w.weekNumber === nextDay.weekNumber)
      : null;
    const nextDayData = nextWeek?.days[nextDay?.dayIndex || 0];
    const nextDaySets = nextDayData
      ? nextDayData.exercises.reduce((s, e) => s + e.sets, 0)
      : 0;

    // RP science: 9-11 effective sets per muscle per session is the practical cap
    // Total session should stay under ~25-30 total sets to avoid junk volume
    const totalMergedSets = nextDaySets + missedSets;
    const mergeFeasible = totalMergedSets <= 28;

    // Check per-muscle cap: no muscle should exceed ~10 sets in one session
    const nextDayMuscles = nextDayData?.muscleTargets || [];
    const allMergedMuscles = new Set([...missedMuscles, ...nextDayMuscles]);
    let perMuscleSafe = true;
    for (const muscle of allMergedMuscles) {
      const currentWeekly = weeklySets[muscle] || 0;
      const landmarks = RP_VOLUME_LANDMARKS[muscle];
      if (landmarks && currentWeekly + 4 > landmarks.mrv) {
        perMuscleSafe = false;
        break;
      }
    }

    if (mergeFeasible && perMuscleSafe && allRecovered) {
      // Recommended when 1 missed day in early/mid week
      const isRecommended =
        missed.length === 1 && weekContext !== 'late' && daysSinceLast <= 3;

      options.push({
        action: 'merge',
        labelKey: 'missedDay.merge',
        descriptionKey: 'missedDay.mergeDesc',
        recommended: isRecommended && !options.some((o) => o.recommended),
        meta: {
          mergedMuscles: Array.from(missedMuscles),
          extraSets: missedSets,
        },
      });
    }
  }

  // ─── Option 4: Reschedule remaining week from today ───
  // Available when there are preferred days left this week
  if (
    activeState.schedule &&
    missed.length <= 2 &&
    mesocyclePhase !== 'deload'
  ) {
    const today = new Date();
    const nextPref = nextPreferredDay(
      addDays(today, 1),
      activeState.schedule.preferredDays,
    );
    const nextPrefISO = toISODate(nextPref);

    // Only offer if rescheduled date is within this calendar week or next 5 days
    const daysToNext = daysBetween(toISODate(today), nextPrefISO);
    if (daysToNext <= 5) {
      options.push({
        action: 'reschedule_week',
        labelKey: 'missedDay.reschedule',
        descriptionKey: 'missedDay.rescheduleDesc',
        recommended:
          !options.some((o) => o.recommended) && weekContext === 'early',
        meta: { newDate: nextPrefISO },
      });
    }
  }

  // Ensure exactly one option is recommended (prefer the first if none are)
  if (!options.some((o) => o.recommended) && options.length > 0) {
    // Default: skip and continue is safest
    const skipIdx = options.findIndex((o) => o.action === 'skip_continue');
    if (skipIdx >= 0) {
      options[skipIdx] = { ...options[skipIdx], recommended: true };
    } else {
      options[0] = { ...options[0], recommended: true };
    }
  }

  // Ensure at most one is recommended
  let foundRecommended = false;
  for (let i = 0; i < options.length; i++) {
    if (options[i].recommended) {
      if (foundRecommended) {
        options[i] = { ...options[i], recommended: false };
      }
      foundRecommended = true;
    }
  }

  return options;
}

// ─── Helpers ───

function getNextUncompletedDay(
  schedule: ProgramSchedule,
  excluded: ScheduledDay[],
): ScheduledDay | null {
  const today = toISODate(new Date());
  const excludedSet = new Set(
    excluded.map((sd) => `${sd.weekNumber}-${sd.dayIndex}`),
  );
  return (
    schedule.scheduledDays.find(
      (sd) =>
        !sd.completedDate &&
        !sd.skippedDate &&
        !excludedSet.has(`${sd.weekNumber}-${sd.dayIndex}`) &&
        sd.plannedDate >= today,
    ) || null
  );
}

function getNudgeKey(
  missedCount: number,
  daysSinceLast: number,
  phase: 'ramp' | 'peak' | 'deload',
  severity: 'info' | 'warning' | 'urgent',
): string {
  if (phase === 'deload') return 'missedDay.nudgeDeload';
  if (severity === 'urgent') return 'missedDay.nudgeUrgent';
  if (daysSinceLast >= 7) return 'missedDay.nudgeLongBreak';
  if (missedCount >= 2) return 'missedDay.nudgeMultiple';
  return 'missedDay.nudgeSingle';
}

// ─── Resolution Execution ───

/**
 * Execute a resolution choice. Returns updated schedule + activeState fields.
 * The caller (programStore) applies these to the store.
 */
export function executeResolution(
  action: ResolutionAction,
  resolution: MissedDayResolution,
  program: TrainingProgram,
  activeState: ActiveProgramState,
): {
  updatedSchedule: ProgramSchedule;
  advanceToWeek?: number;
  advanceToDayIndex?: number;
} {
  if (!activeState.schedule) {
    return { updatedSchedule: activeState.schedule! };
  }

  const schedule = activeState.schedule;
  const today = toISODate(new Date());

  switch (action) {
    case 'do_missed': {
      // Keep the missed day but reschedule it to today, push everything else forward
      const missed = resolution.missedDays[0];
      const updated = schedule.scheduledDays.map((sd) => {
        if (
          sd.weekNumber === missed.weekNumber &&
          sd.dayIndex === missed.dayIndex
        ) {
          return { ...sd, plannedDate: today };
        }
        return { ...sd };
      });

      // Reschedule all future uncompleted days after this one
      const missedIdx = updated.findIndex(
        (sd) =>
          sd.weekNumber === missed.weekNumber &&
          sd.dayIndex === missed.dayIndex,
      );
      let cursor = addDays(parseDate(today), 1);
      let currentProgramWeek = missed.weekNumber;

      for (let i = missedIdx + 1; i < updated.length; i++) {
        const sd = updated[i];
        if (sd.completedDate || sd.skippedDate) continue;

        if (sd.weekNumber > currentProgramWeek) {
          const nextMonday = addDays(
            getMonday(cursor),
            cursor > getMonday(cursor) ? 7 : 0,
          );
          if (cursor < nextMonday) cursor = nextMonday;
          currentProgramWeek = sd.weekNumber;
        }

        const assignedDate = nextPreferredDay(cursor, schedule.preferredDays);
        updated[i] = { ...sd, plannedDate: toISODate(assignedDate) };
        cursor = addDays(assignedDate, 1);
      }

      return {
        updatedSchedule: { ...schedule, scheduledDays: updated },
        advanceToWeek: missed.weekNumber,
        advanceToDayIndex: missed.dayIndex,
      };
    }

    case 'skip_continue': {
      // Mark all missed days as skipped, advance to the next uncompleted day
      const updated = schedule.scheduledDays.map((sd) => {
        const isMissed = resolution.missedDays.some(
          (m) => m.weekNumber === sd.weekNumber && m.dayIndex === sd.dayIndex,
        );
        if (isMissed) {
          return { ...sd, skippedDate: today, skippedReason: 'user_skip' as const };
        }
        return { ...sd };
      });

      // Find next day to advance to
      const nextDay = updated.find(
        (sd) => !sd.completedDate && !sd.skippedDate && sd.plannedDate >= today,
      );

      // Reschedule remaining uncompleted days from today
      const firstFutureIdx = updated.findIndex(
        (sd) => !sd.completedDate && !sd.skippedDate,
      );
      if (firstFutureIdx >= 0) {
        let cursor = addDays(parseDate(today), 0);
        let currentProgramWeek = updated[firstFutureIdx].weekNumber;

        for (let i = firstFutureIdx; i < updated.length; i++) {
          const sd = updated[i];
          if (sd.completedDate || sd.skippedDate) continue;

          if (sd.weekNumber > currentProgramWeek) {
            const nextMonday = addDays(
              getMonday(cursor),
              cursor > getMonday(cursor) ? 7 : 0,
            );
            if (cursor < nextMonday) cursor = nextMonday;
            currentProgramWeek = sd.weekNumber;
          }

          const assignedDate = nextPreferredDay(cursor, schedule.preferredDays);
          updated[i] = { ...sd, plannedDate: toISODate(assignedDate) };
          cursor = addDays(assignedDate, 1);
        }
      }

      return {
        updatedSchedule: { ...schedule, scheduledDays: updated },
        advanceToWeek: nextDay?.weekNumber,
        advanceToDayIndex: nextDay?.dayIndex,
      };
    }

    case 'merge': {
      // Skip missed days, mark them as merged
      const updated = schedule.scheduledDays.map((sd) => {
        const isMissed = resolution.missedDays.some(
          (m) => m.weekNumber === sd.weekNumber && m.dayIndex === sd.dayIndex,
        );
        if (isMissed) {
          return { ...sd, skippedDate: today, skippedReason: 'merged' as const };
        }
        return { ...sd };
      });

      // The actual volume merging (adding sets to next session) is handled
      // by the programStore when it detects `merged` skipped days and builds
      // the session exercises. We just mark the schedule here.

      // Reschedule remaining from today
      const firstFutureIdx = updated.findIndex(
        (sd) => !sd.completedDate && !sd.skippedDate,
      );
      if (firstFutureIdx >= 0) {
        let cursor = parseDate(today);
        let currentProgramWeek = updated[firstFutureIdx].weekNumber;

        for (let i = firstFutureIdx; i < updated.length; i++) {
          const sd = updated[i];
          if (sd.completedDate || sd.skippedDate) continue;

          if (sd.weekNumber > currentProgramWeek) {
            const nextMonday = addDays(
              getMonday(cursor),
              cursor > getMonday(cursor) ? 7 : 0,
            );
            if (cursor < nextMonday) cursor = nextMonday;
            currentProgramWeek = sd.weekNumber;
          }

          const assignedDate = nextPreferredDay(cursor, schedule.preferredDays);
          updated[i] = { ...sd, plannedDate: toISODate(assignedDate) };
          cursor = addDays(assignedDate, 1);
        }
      }

      const nextDay = updated.find(
        (sd) => !sd.completedDate && !sd.skippedDate,
      );

      return {
        updatedSchedule: { ...schedule, scheduledDays: updated },
        advanceToWeek: nextDay?.weekNumber,
        advanceToDayIndex: nextDay?.dayIndex,
      };
    }

    case 'reschedule_week': {
      // Reschedule all uncompleted/unskipped days starting from today
      const updated = schedule.scheduledDays.map((sd) => ({ ...sd }));

      let cursor = parseDate(today);
      let currentProgramWeek = -1;

      for (let i = 0; i < updated.length; i++) {
        const sd = updated[i];
        if (sd.completedDate || sd.skippedDate) continue;
        if (sd.plannedDate < today && !sd.completedDate && !sd.skippedDate) {
          // This is a missed day — keep it, just reschedule
        }

        if (currentProgramWeek === -1) {
          currentProgramWeek = sd.weekNumber;
        }
        if (sd.weekNumber > currentProgramWeek) {
          const nextMonday = addDays(
            getMonday(cursor),
            cursor > getMonday(cursor) ? 7 : 0,
          );
          if (cursor < nextMonday) cursor = nextMonday;
          currentProgramWeek = sd.weekNumber;
        }

        const assignedDate = nextPreferredDay(cursor, schedule.preferredDays);
        updated[i] = { ...sd, plannedDate: toISODate(assignedDate) };
        cursor = addDays(assignedDate, 1);
      }

      // Find what's now planned for today or next
      const nextDay = updated.find(
        (sd) =>
          !sd.completedDate &&
          !sd.skippedDate &&
          sd.plannedDate >= today,
      );

      return {
        updatedSchedule: { ...schedule, scheduledDays: updated },
        advanceToWeek: nextDay?.weekNumber,
        advanceToDayIndex: nextDay?.dayIndex,
      };
    }
  }
}

/**
 * Get the merged muscles and extra exercises for a "merge" resolution.
 * Called when building session exercises for the next day after a merge.
 */
export function getMergedExercises(
  program: TrainingProgram,
  schedule: ProgramSchedule,
): ProgramDay['exercises'] {
  const mergedDays = schedule.scheduledDays.filter(
    (sd) => sd.skippedReason === 'merged' && sd.skippedDate,
  );

  const extraExercises: ProgramDay['exercises'] = [];
  for (const sd of mergedDays) {
    const week = program.weeks.find((w) => w.weekNumber === sd.weekNumber);
    const day = week?.days[sd.dayIndex];
    if (!day) continue;

    // Add exercises from the merged day, but cap at 2 per muscle
    // to avoid junk volume (RP: effective reps drop after 8-10 sets/muscle/session)
    for (const ex of day.exercises) {
      extraExercises.push({
        ...ex,
        sets: Math.min(ex.sets, 2), // Cap merged sets to 2 per exercise
      });
    }
  }

  return extraExercises;
}
