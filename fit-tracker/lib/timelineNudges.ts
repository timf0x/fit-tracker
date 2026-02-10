/**
 * Timeline Nudges
 * Smart, contextual one-liners for each timeline day type.
 */

import { TimelineDay } from '@/lib/timelineEngine';
import { resolveDayLabel } from '@/lib/programLabels';
import i18n from '@/lib/i18n';

/**
 * Returns a smart nudge string for a timeline day, or null if no nudge applies.
 */
export function getTimelineNudge(day: TimelineDay): string | null {
  // Past trained day — no nudge needed, data speaks for itself
  if (day.isPast && day.sessions.length > 0) return null;

  // Past rest day — no nudge
  if (day.isPast) return null;

  // Today with scheduled workout
  if (day.isToday && day.programDay) {
    const label = resolveDayLabel(day.programDay);
    return i18n.t('calendar.todayNudge', { name: label });
  }

  // Today with no workout
  if (day.isToday && !day.programDay && day.recoveryProjection) {
    const fatigued = day.recoveryProjection.fatiguedMuscles.length;
    if (fatigued > 0) {
      return i18n.t('calendar.restNudge', { count: fatigued });
    }
    return null;
  }

  // Future scheduled day with recovery data
  if (!day.isPast && !day.isToday && day.programDay && day.recoveryProjection) {
    const readiness = day.recoveryProjection.overallReadiness;
    if (readiness < 60 && day.recoveryProjection.fatiguedMuscles.length > 0) {
      const muscleNames = day.recoveryProjection.fatiguedMuscles.slice(0, 2).join(', ');
      return i18n.t('calendar.readinessLow', { muscles: muscleNames });
    }
    if (day.recoveryProjection.freshMuscles.length > 0) {
      const muscleNames = day.recoveryProjection.freshMuscles.slice(0, 3).join(', ');
      return i18n.t('calendar.projectionFresh', { muscles: muscleNames });
    }
  }

  return null;
}

/**
 * Get the home card nudge — for today or next session.
 */
export function getHomeCalendarNudge(
  days: TimelineDay[],
): { text: string; color: string } | null {
  const today = days.find((d) => d.isToday);

  // Today has a session
  if (today?.programDay) {
    const label = resolveDayLabel(today.programDay);
    return {
      text: i18n.t('calendar.todayNudge', { name: label }),
      color: '#FF6B35',
    };
  }

  // Find next scheduled day
  const nextScheduled = days.find(
    (d) => !d.isPast && !d.isToday && d.scheduledDay && !d.scheduledDay.completedDate,
  );
  if (nextScheduled?.programDay) {
    const dayLabels = i18n.t('scheduling.dayLabelsFull') as unknown as string[];
    const dayName = dayLabels[nextScheduled.dayOfWeek];
    const label = resolveDayLabel(nextScheduled.programDay);
    return {
      text: i18n.t('calendar.nextNudge', { day: dayName, name: label }),
      color: 'rgba(255,255,255,0.4)',
    };
  }

  // Rest day with recovery info
  if (today?.recoveryProjection) {
    const fatigued = today.recoveryProjection.fatiguedMuscles.length;
    if (fatigued > 0) {
      return {
        text: i18n.t('calendar.restNudge', { count: fatigued }),
        color: 'rgba(255,255,255,0.3)',
      };
    }
  }

  return null;
}
