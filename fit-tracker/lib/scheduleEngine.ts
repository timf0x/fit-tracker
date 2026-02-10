/**
 * Schedule Engine
 * Maps program days to calendar dates using preferred training days.
 * Supports elastic rescheduling when users train on different days.
 */

import {
  TrainingProgram,
  ProgramSchedule,
  ScheduledDay,
  WeekDay,
} from '@/types/program';

// ─── Date Helpers ───

/** Get ISO date string (YYYY-MM-DD) from a Date */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse ISO date string to Date (at midnight local) */
function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Get WeekDay (0=Mon..6=Sun) from a Date */
function getWeekDay(d: Date): WeekDay {
  const jsDay = d.getDay(); // 0=Sun..6=Sat
  return (jsDay === 0 ? 6 : jsDay - 1) as WeekDay;
}

/** Advance a date by N days */
function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

/** Find the next date on or after `from` that falls on one of the preferred days */
function nextPreferredDay(from: Date, preferredDays: WeekDay[]): Date {
  const sorted = [...preferredDays].sort((a, b) => a - b);
  const currentDay = getWeekDay(from);

  // Try to find a preferred day on or after current day in this week
  for (const pd of sorted) {
    if (pd >= currentDay) {
      return addDays(from, pd - currentDay);
    }
  }

  // Wrap to next week's first preferred day
  const daysUntilNextWeek = 7 - currentDay + sorted[0];
  return addDays(from, daysUntilNextWeek);
}

/** Get the Monday of the week containing the given date */
function getMonday(d: Date): Date {
  const day = getWeekDay(d);
  return addDays(d, -day);
}

// ─── Build Schedule ───

/**
 * Build initial schedule from preferred days + start date.
 *
 * Algorithm:
 * 1. Start cursor at startDate
 * 2. For each program week, iterate through its training days
 * 3. Assign each day to the next available preferred day on or after cursor
 * 4. After a week's days are assigned, advance cursor to next week's Monday
 */
export function buildSchedule(
  program: TrainingProgram,
  preferredDays: WeekDay[],
  startDate: string,
): ProgramSchedule {
  if (preferredDays.length === 0) {
    return { preferredDays, startDate, scheduledDays: [] };
  }

  const scheduledDays: ScheduledDay[] = [];
  let cursor = parseDate(startDate);

  for (const week of program.weeks) {
    // Ensure cursor is at or after the Monday of this calendar week
    const weekMonday = getMonday(cursor);
    if (cursor < weekMonday) {
      cursor = weekMonday;
    }

    for (let dayIdx = 0; dayIdx < week.days.length; dayIdx++) {
      const day = week.days[dayIdx];
      if (day.isRestDay) continue;

      const assignedDate = nextPreferredDay(cursor, preferredDays);

      scheduledDays.push({
        weekNumber: week.weekNumber,
        dayIndex: dayIdx,
        plannedDate: toISODate(assignedDate),
      });

      // Move cursor to the day after the assigned date
      cursor = addDays(assignedDate, 1);
    }

    // After assigning all days in this program week,
    // advance cursor to next Monday for the next program week
    const nextMonday = addDays(getMonday(cursor), 7);
    if (cursor < nextMonday) {
      cursor = nextMonday;
    }
  }

  return { preferredDays, startDate, scheduledDays };
}

// ─── Reschedule Forward ───

/**
 * After a day is completed (possibly early/late), reschedule all future days.
 *
 * Completed days stay locked. Uncompleted days are rescheduled
 * from the day after today to the next available preferred days.
 */
export function rescheduleForward(
  schedule: ProgramSchedule,
  completedWeek: number,
  completedDayIndex: number,
  completedDate: string,
): ProgramSchedule {
  const { preferredDays, scheduledDays, startDate } = schedule;

  // Mark the completed day
  const updated = scheduledDays.map((sd) => {
    if (sd.weekNumber === completedWeek && sd.dayIndex === completedDayIndex) {
      return { ...sd, completedDate };
    }
    return { ...sd };
  });

  // Find uncompleted days that need rescheduling
  // (all days after the completed one that don't have a completedDate)
  const completedIdx = updated.findIndex(
    (sd) => sd.weekNumber === completedWeek && sd.dayIndex === completedDayIndex,
  );

  if (completedIdx === -1) return { ...schedule, scheduledDays: updated };

  // Start rescheduling from the day after today
  const today = parseDate(completedDate);
  let cursor = addDays(today, 1);

  let currentProgramWeek = completedWeek;

  for (let i = completedIdx + 1; i < updated.length; i++) {
    const sd = updated[i];
    if (sd.completedDate) continue; // already done, skip

    // If we crossed into a new program week, advance cursor to next Monday
    if (sd.weekNumber > currentProgramWeek) {
      const nextMonday = addDays(getMonday(cursor), cursor > getMonday(cursor) ? 7 : 0);
      if (cursor < nextMonday) {
        cursor = nextMonday;
      }
      currentProgramWeek = sd.weekNumber;
    }

    const assignedDate = nextPreferredDay(cursor, preferredDays);
    updated[i] = { ...sd, plannedDate: toISODate(assignedDate) };
    cursor = addDays(assignedDate, 1);
  }

  return { preferredDays, startDate, scheduledDays: updated };
}

// ─── Query Helpers ───

/** Get what's planned for a specific date */
export function getPlannedDayForDate(
  schedule: ProgramSchedule,
  date: string,
): ScheduledDay | null {
  return schedule.scheduledDays.find((sd) => sd.plannedDate === date) || null;
}

/** Get the next upcoming (uncompleted) scheduled day */
export function getNextScheduledDay(
  schedule: ProgramSchedule,
): ScheduledDay | null {
  const today = toISODate(new Date());

  // First check if today has a scheduled (uncompleted) day
  const todayDay = schedule.scheduledDays.find(
    (sd) => sd.plannedDate === today && !sd.completedDate,
  );
  if (todayDay) return todayDay;

  // Otherwise find the next future uncompleted day
  return (
    schedule.scheduledDays.find(
      (sd) => !sd.completedDate && sd.plannedDate > today,
    ) || null
  );
}

/** Get today's ISO date string */
export function getTodayISO(): string {
  return toISODate(new Date());
}

/** Format a scheduled date as a short localized string (e.g. "Lun 17 fév") */
export function formatScheduledDate(
  isoDate: string,
  locale: string = 'fr',
): string {
  const date = parseDate(isoDate);
  const dayNames =
    locale === 'fr'
      ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames =
    locale === 'fr'
      ? ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = dayNames[date.getDay()];
  const dayNum = date.getDate();
  const monthName = monthNames[date.getMonth()];

  return `${dayName} ${dayNum} ${monthName}`;
}

/** Get default preferred days for a given frequency */
export function getDefaultPreferredDays(daysPerWeek: number): WeekDay[] {
  switch (daysPerWeek) {
    case 3: return [0, 2, 4]; // Mon, Wed, Fri
    case 4: return [0, 1, 3, 4]; // Mon, Tue, Thu, Fri
    case 5: return [0, 1, 2, 3, 4]; // Mon-Fri
    case 6: return [0, 1, 2, 3, 4, 5]; // Mon-Sat
    default: return [0, 2, 4];
  }
}
