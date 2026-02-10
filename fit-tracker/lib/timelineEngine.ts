/**
 * Timeline Engine
 * Merges workout history, program schedule, and recovery predictions
 * into a unified daily view for the calendar screen.
 */

import { WorkoutSession, RecoveryBodyPart } from '@/types';
import {
  TrainingProgram,
  ProgramSchedule,
  ProgramDay,
  ScheduledDay,
  WeekDay,
} from '@/types/program';
import { MUSCLE_RECOVERY_HOURS, TRACKABLE_BODY_PARTS } from '@/constants/recovery';
import { TARGET_TO_MUSCLE } from '@/lib/muscleMapping';
import { exercises } from '@/data/exercises';
import { detectPRs } from '@/lib/progressiveOverload';

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

// ─── Types ───

export interface TimelineDay {
  date: string;                     // ISO date YYYY-MM-DD
  dayOfWeek: WeekDay;
  isPast: boolean;
  isToday: boolean;

  // Actual data (past days)
  sessions: WorkoutSession[];
  totalSets: number;
  totalVolume: number;              // kg
  musclesTrained: string[];
  prs: number;

  // Scheduled data (future days from program)
  scheduledDay?: ScheduledDay;
  programDay?: ProgramDay;

  // Predicted recovery (future days)
  recoveryProjection?: {
    freshMuscles: string[];
    fatiguedMuscles: string[];
    overallReadiness: number;       // 0-100
  };
}

export interface MonthDayData {
  date: string;
  type: 'trained' | 'scheduled' | 'rest' | 'today';
  totalSets: number;
  muscleCount: number;
}

// ─── Helpers ───

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

/** Get muscles trained in a session */
function getSessionMuscles(session: WorkoutSession): string[] {
  const muscles = new Set<string>();
  for (const compEx of session.completedExercises) {
    const exercise = exerciseMap.get(compEx.exerciseId);
    if (!exercise) continue;
    const muscle = TARGET_TO_MUSCLE[exercise.target];
    if (muscle) muscles.add(muscle);
  }
  return Array.from(muscles);
}

/** Get total completed sets in a session */
function getSessionSets(session: WorkoutSession): number {
  let total = 0;
  for (const compEx of session.completedExercises) {
    total += compEx.sets.filter((s) => s.completed).length;
  }
  return total;
}

/** Get total volume (kg) in a session */
function getSessionVolume(session: WorkoutSession): number {
  let total = 0;
  for (const compEx of session.completedExercises) {
    for (const set of compEx.sets) {
      if (set.completed) {
        total += (set.weight || 0) * set.reps;
      }
    }
  }
  return Math.round(total);
}

// ─── Build Week Timeline ───

export function buildWeekTimeline(
  history: WorkoutSession[],
  schedule: ProgramSchedule | null,
  program: TrainingProgram | null,
  weekOffset: number,
): TimelineDay[] {
  const today = new Date();
  const todayISO = toISODate(today);
  const monday = addDays(getMonday(today), weekOffset * 7);

  // Index sessions by date
  const sessionsByDate = new Map<string, WorkoutSession[]>();
  for (const session of history) {
    if (!session.endTime) continue;
    const dateKey = toISODate(new Date(session.startTime));
    const existing = sessionsByDate.get(dateKey) || [];
    existing.push(session);
    sessionsByDate.set(dateKey, existing);
  }

  // Index schedule by date
  const scheduleByDate = new Map<string, ScheduledDay>();
  if (schedule) {
    for (const sd of schedule.scheduledDays) {
      scheduleByDate.set(sd.plannedDate, sd);
    }
  }

  // Build sorted prior sessions for PR detection
  const sortedHistory = [...history]
    .filter((s) => s.endTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const days: TimelineDay[] = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const dateISO = toISODate(date);
    const isPast = dateISO < todayISO;
    const isToday = dateISO === todayISO;
    const dayOfWeek = getWeekDay(date) as WeekDay;

    const sessions = sessionsByDate.get(dateISO) || [];
    const musclesTrained: string[] = [];
    let totalSets = 0;
    let totalVolume = 0;
    let prs = 0;

    for (const session of sessions) {
      musclesTrained.push(...getSessionMuscles(session));
      totalSets += getSessionSets(session);
      totalVolume += getSessionVolume(session);

      // Detect PRs for this session
      const priorHistory = sortedHistory.filter(
        (s) => new Date(s.startTime).getTime() < new Date(session.startTime).getTime(),
      );
      prs += detectPRs(session, priorHistory).length;
    }

    // Scheduled day
    const scheduledDay = scheduleByDate.get(dateISO);
    let programDay: ProgramDay | undefined;
    if (scheduledDay && program) {
      const week = program.weeks.find((w) => w.weekNumber === scheduledDay.weekNumber);
      programDay = week?.days[scheduledDay.dayIndex];
    }

    // Recovery projection for future days
    let recoveryProjection: TimelineDay['recoveryProjection'];
    if (!isPast && !isToday) {
      recoveryProjection = predictRecoveryForDate(history, schedule, dateISO);
    }

    days.push({
      date: dateISO,
      dayOfWeek,
      isPast,
      isToday,
      sessions,
      totalSets,
      totalVolume,
      musclesTrained: [...new Set(musclesTrained)],
      prs,
      scheduledDay,
      programDay,
      recoveryProjection,
    });
  }

  return days;
}

// ─── Recovery Prediction ───

export function predictRecoveryForDate(
  history: WorkoutSession[],
  schedule: ProgramSchedule | null,
  targetDate: string,
): { freshMuscles: string[]; fatiguedMuscles: string[]; overallReadiness: number } {
  const targetMs = parseDate(targetDate).getTime();
  const now = Date.now();

  // Get the last trained time for each muscle from actual history
  const lastTrainedHours: Record<string, number> = {};

  const sorted = [...history]
    .filter((s) => s.endTime)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  for (const session of sorted) {
    const sessionTime = new Date(session.startTime).getTime();
    for (const compEx of session.completedExercises) {
      const exercise = exerciseMap.get(compEx.exerciseId);
      if (!exercise) continue;
      const muscle = TARGET_TO_MUSCLE[exercise.target];
      if (muscle && !(muscle in lastTrainedHours)) {
        lastTrainedHours[muscle] = (targetMs - sessionTime) / (1000 * 60 * 60);
      }
    }
  }

  // For future scheduled sessions between now and target, simulate their impact
  if (schedule) {
    const todayISO = toISODate(new Date());
    for (const sd of schedule.scheduledDays) {
      if (sd.plannedDate > todayISO && sd.plannedDate < targetDate && !sd.completedDate) {
        // This scheduled session will happen before the target date
        const sessionDate = parseDate(sd.plannedDate).getTime();
        const hoursUntilTarget = (targetMs - sessionDate) / (1000 * 60 * 60);
        // Mark affected muscles as recently trained
        // We don't have exact exercises for future sessions, but we can use muscleTargets
        // This is an approximation
      }
    }
  }

  const freshMuscles: string[] = [];
  const fatiguedMuscles: string[] = [];

  for (const bp of TRACKABLE_BODY_PARTS) {
    const hours = lastTrainedHours[bp];
    const thresholds = MUSCLE_RECOVERY_HOURS[bp];
    if (!thresholds) {
      freshMuscles.push(bp);
      continue;
    }

    if (hours === undefined) {
      freshMuscles.push(bp); // never trained = fresh
    } else if (hours < thresholds.freshMin) {
      fatiguedMuscles.push(bp);
    } else {
      freshMuscles.push(bp);
    }
  }

  const total = freshMuscles.length + fatiguedMuscles.length;
  const overallReadiness = total > 0
    ? Math.round((freshMuscles.length / total) * 100)
    : 100;

  return { freshMuscles, fatiguedMuscles, overallReadiness };
}

// ─── Month Summary ───

export function buildMonthSummary(
  history: WorkoutSession[],
  schedule: ProgramSchedule | null,
  year: number,
  month: number,
): MonthDayData[] {
  const todayISO = toISODate(new Date());
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Index sessions by date with stats
  const trainedDates = new Map<string, { totalSets: number; muscles: Set<string> }>();
  for (const session of history) {
    if (!session.endTime) continue;
    const dateKey = toISODate(new Date(session.startTime));
    const existing = trainedDates.get(dateKey) || { totalSets: 0, muscles: new Set<string>() };
    existing.totalSets += getSessionSets(session);
    for (const m of getSessionMuscles(session)) {
      existing.muscles.add(m);
    }
    trainedDates.set(dateKey, existing);
  }

  // Index scheduled dates
  const scheduledDates = new Set<string>();
  if (schedule) {
    for (const sd of schedule.scheduledDays) {
      if (!sd.completedDate) {
        scheduledDates.add(sd.plannedDate);
      }
    }
  }

  const result: MonthDayData[] = [];

  for (let d = new Date(firstDay); d <= lastDay; d = addDays(d, 1)) {
    const dateISO = toISODate(d);
    let type: MonthDayData['type'] = 'rest';

    if (dateISO === todayISO) {
      type = 'today';
    } else if (trainedDates.has(dateISO)) {
      type = 'trained';
    } else if (scheduledDates.has(dateISO) && dateISO > todayISO) {
      type = 'scheduled';
    }

    const dayStats = trainedDates.get(dateISO);
    result.push({
      date: dateISO,
      type,
      totalSets: dayStats?.totalSets || 0,
      muscleCount: dayStats?.muscles.size || 0,
    });
  }

  return result;
}
