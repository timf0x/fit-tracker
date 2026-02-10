import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProgramStore } from '@/stores/programStore';
import { AmbientBackground } from '@/components/home/AmbientBackground';
import { WeekStrip } from '@/components/calendar/WeekStrip';
import { DayContentCard } from '@/components/calendar/DayContentCard';
import { WeekSummaryCard } from '@/components/calendar/WeekSummaryCard';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import {
  buildWeekTimeline,
  buildMonthSummary,
} from '@/lib/timelineEngine';
import { getWeekBounds, getSetsForWeek } from '@/lib/weeklyVolume';
import { getWeekSummary, getWeekPRs, getPeriodPRs } from '@/lib/statsHelpers';
import { TARGET_TO_MUSCLE, getMuscleLabel, MUSCLE_TO_BODYPART } from '@/lib/muscleMapping';
import { BODY_ICONS, DEFAULT_BODY_ICON } from '@/components/home/ActiveProgramCard';
import { buildProgramExercisesParam } from '@/lib/programSession';
import { getProgressiveWeight } from '@/lib/weightEstimation';
import { exercises } from '@/data/exercises';

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

type ViewMode = 'week' | 'month';

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekLabel(weekOffset: number): string {
  const { start } = getWeekBounds(weekOffset);
  const day = start.getDate();
  const locale = i18n.locale === 'fr' ? 'fr-FR' : 'en-US';
  const month = start.toLocaleDateString(locale, { month: 'long' });
  return i18n.t('calendar.weekOf', { date: `${day} ${month}` });
}

function getMonthLabel(year: number, month: number): string {
  const locale = i18n.locale === 'fr' ? 'fr-FR' : 'en-US';
  const d = new Date(year, month, 1);
  const monthName = d.toLocaleDateString(locale, { month: 'long' });
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const history = useWorkoutStore((s) => s.history);
  const startSession = useWorkoutStore((s) => s.startSession);
  const { program, activeState } = useProgramStore();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));

  // Month navigation
  const now = new Date();
  const [monthYear, setMonthYear] = useState(now.getFullYear());
  const [monthMonth, setMonthMonth] = useState(now.getMonth());

  const schedule = activeState?.schedule || null;

  // Build week timeline
  const weekDays = useMemo(
    () => buildWeekTimeline(history, schedule, program || null, weekOffset),
    [history, schedule, program, weekOffset],
  );

  // Build month summary
  const monthData = useMemo(
    () => buildMonthSummary(history, schedule, monthYear, monthMonth),
    [history, schedule, monthYear, monthMonth],
  );

  // Weekly volume for zone context
  const weeklyVolume = useMemo(
    () => getSetsForWeek(history, weekOffset),
    [history, weekOffset],
  );

  // Week summary data
  const weekSummary = useMemo(
    () => getWeekSummary(history, weekOffset),
    [history, weekOffset],
  );

  const weekPRs = useMemo(
    () => getWeekPRs(history, weekOffset),
    [history, weekOffset],
  );

  // Get selected day data
  const selectedDay = useMemo(
    () => weekDays.find((d) => d.date === selectedDate) || null,
    [weekDays, selectedDate],
  );

  // Month stats (enhanced)
  const monthStats = useMemo(() => {
    let sessions = 0;
    let totalVolume = 0;
    let totalMinutes = 0;
    const muscleSetCounts: Record<string, number> = {};
    const monthSessions: typeof history = [];

    for (const s of history) {
      if (!s.endTime) continue;
      const d = new Date(s.startTime);
      if (d.getFullYear() === monthYear && d.getMonth() === monthMonth) {
        sessions++;
        totalMinutes += (s.durationSeconds || 0) / 60;
        monthSessions.push(s);
        for (const ex of s.completedExercises) {
          const exercise = exerciseMap.get(ex.exerciseId);
          const muscle = exercise ? TARGET_TO_MUSCLE[exercise.target] : null;
          for (const set of ex.sets) {
            if (set.completed) {
              totalVolume += (set.weight || 0) * set.reps;
              if (muscle) {
                muscleSetCounts[muscle] = (muscleSetCounts[muscle] || 0) + 1;
              }
            }
          }
        }
      }
    }

    // Top 3 muscles
    const topMuscles = Object.entries(muscleSetCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([muscle, sets]) => ({ muscle, sets }));

    // PRs for month
    const prData = getPeriodPRs(history, monthSessions);

    return {
      sessions,
      totalVolume: Math.round(totalVolume),
      avgMinutes: sessions > 0 ? Math.round(totalMinutes / sessions) : 0,
      prCount: prData.total,
      topMuscles,
    };
  }, [history, monthYear, monthMonth]);

  // ─── Start Session Handler ───
  const handleStartSession = useCallback(() => {
    const today = weekDays.find((d) => d.isToday);
    if (!today?.programDay || !program) return;

    const day = today.programDay;

    // Compute progressive weight overrides
    const weightOverrides: Record<string, { weight: number; action: string }> = {};
    for (const pex of day.exercises) {
      const ex = exerciseMap.get(pex.exerciseId);
      if (!ex) continue;
      const result = getProgressiveWeight(
        pex.exerciseId,
        ex.equipment as any,
        pex.minReps || pex.reps,
        history,
      );
      if (result.action !== 'none') {
        weightOverrides[pex.exerciseId] = {
          weight: result.weight,
          action: result.action,
        };
      }
    }

    const exercisesJson = buildProgramExercisesParam(day, weightOverrides);

    // Start session in store
    const workoutName = day.labelFr || day.label || 'Session';
    const sessionId = startSession('program', workoutName);

    router.push({
      pathname: '/workout/session',
      params: {
        exercises: exercisesJson,
        workoutName,
        sessionId,
      },
    });
  }, [weekDays, program, history, startSession, router]);

  const handleWeekNav = useCallback((direction: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeekOffset((prev) => prev + direction);
  }, []);

  const handleMonthNav = useCallback((direction: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMonthMonth((prev) => {
      const newMonth = prev + direction;
      if (newMonth < 0) {
        setMonthYear((y) => y - 1);
        return 11;
      }
      if (newMonth > 11) {
        setMonthYear((y) => y + 1);
        return 0;
      }
      return newMonth;
    });
  }, []);

  const handleMonthDateSelect = useCallback((date: string) => {
    const [y, m, d] = date.split('-').map(Number);
    const selected = new Date(y, m - 1, d);
    const today = new Date();
    const diffMs = selected.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const newWeekOffset = Math.floor(diffDays / 7);

    setWeekOffset(newWeekOffset);
    setSelectedDate(date);
    setViewMode('week');
  }, []);

  // Check if there's a scheduled session today that hasn't been done
  const hasTodayScheduled = useMemo(() => {
    const today = weekDays.find((d) => d.isToday);
    return today?.programDay && today.sessions.length === 0;
  }, [weekDays]);

  return (
    <View style={styles.screen}>
      <AmbientBackground />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#fff" strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>{i18n.t('calendar.title')}</Text>
          <View style={styles.viewToggle}>
            <Pressable
              style={[styles.viewTab, viewMode === 'week' && styles.viewTabActive]}
              onPress={() => setViewMode('week')}
            >
              <Text style={[styles.viewTabText, viewMode === 'week' && styles.viewTabTextActive]}>
                {i18n.t('calendar.weekView')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.viewTab, viewMode === 'month' && styles.viewTabActive]}
              onPress={() => setViewMode('month')}
            >
              <Text style={[styles.viewTabText, viewMode === 'month' && styles.viewTabTextActive]}>
                {i18n.t('calendar.monthView')}
              </Text>
            </Pressable>
          </View>
        </View>

        {viewMode === 'week' ? (
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Week navigation */}
            <View style={styles.weekNav}>
              <Pressable onPress={() => handleWeekNav(-1)} hitSlop={12}>
                <ChevronLeft size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>
              <Text style={styles.weekLabel}>{getWeekLabel(weekOffset)}</Text>
              <Pressable onPress={() => handleWeekNav(1)} hitSlop={12}>
                <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>

            {/* Week strip */}
            <WeekStrip
              days={weekDays}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedDate(date);
              }}
            />

            {/* Week summary card */}
            {weekSummary.sessions > 0 && (
              <View style={styles.summarySection}>
                <WeekSummaryCard
                  sessions={weekSummary.sessions}
                  totalVolumeKg={weekSummary.totalVolumeKg}
                  prCount={weekPRs.total}
                  totalMinutes={weekSummary.totalMinutes}
                  weeklyVolume={weeklyVolume}
                  currentWeek={activeState?.currentWeek}
                  totalWeeks={program?.totalWeeks}
                />
              </View>
            )}

            {/* Day content */}
            <View style={styles.dayContent}>
              {selectedDay ? (
                <DayContentCard
                  day={selectedDay}
                  weeklyVolume={weeklyVolume}
                  allHistory={history}
                  onPressSession={(sessionId) => {
                    router.push({
                      pathname: '/workout/session',
                      params: { sessionId, review: '1' },
                    });
                  }}
                  onStartSession={
                    hasTodayScheduled && selectedDay.isToday
                      ? handleStartSession
                      : undefined
                  }
                />
              ) : (
                <Text style={styles.emptyText}>{i18n.t('calendar.nothingPlanned')}</Text>
              )}
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Month navigation */}
            <View style={styles.weekNav}>
              <Pressable onPress={() => handleMonthNav(-1)} hitSlop={12}>
                <ChevronLeft size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>
              <Text style={styles.weekLabel}>{getMonthLabel(monthYear, monthMonth)}</Text>
              <Pressable onPress={() => handleMonthNav(1)} hitSlop={12}>
                <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>

            {/* Month grid */}
            <MonthGrid
              year={monthYear}
              month={monthMonth}
              monthData={monthData}
              onSelectDate={handleMonthDateSelect}
            />

            {/* Month summary stats — 4 columns */}
            <View style={styles.monthStats}>
              <View style={styles.monthStat}>
                <Text style={styles.monthStatValue}>{monthStats.sessions}</Text>
                <Text style={styles.monthStatLabel}>{i18n.t('calendar.sessions')}</Text>
              </View>
              {monthStats.totalVolume > 0 && (
                <>
                  <View style={styles.monthStatDivider} />
                  <View style={styles.monthStat}>
                    <Text style={styles.monthStatValue}>
                      {monthStats.totalVolume >= 1000
                        ? `${(monthStats.totalVolume / 1000).toFixed(1)}t`
                        : `${monthStats.totalVolume}${i18n.t('common.kgUnit')}`}
                    </Text>
                    <Text style={styles.monthStatLabel}>{i18n.t('calendar.volume')}</Text>
                  </View>
                </>
              )}
              {monthStats.prCount > 0 && (
                <>
                  <View style={styles.monthStatDivider} />
                  <View style={styles.monthStat}>
                    <View style={styles.prStatRow}>
                      <Text style={styles.monthStatValue}>{monthStats.prCount}</Text>
                      <Zap size={12} color={Colors.primary} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.monthStatLabel}>{i18n.t('calendar.prs')}</Text>
                  </View>
                </>
              )}
              {monthStats.avgMinutes > 0 && (
                <>
                  <View style={styles.monthStatDivider} />
                  <View style={styles.monthStat}>
                    <Text style={styles.monthStatValue}>{monthStats.avgMinutes}{i18n.t('common.minAbbr')}</Text>
                    <Text style={styles.monthStatLabel}>{i18n.t('calendar.avgDuration')}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Top muscles section */}
            {monthStats.topMuscles.length > 0 && (
              <View style={styles.topMusclesSection}>
                <Text style={styles.topMusclesHeader}>{i18n.t('calendar.topMuscles')}</Text>
                {monthStats.topMuscles.map((item, idx) => {
                  const bp = MUSCLE_TO_BODYPART[item.muscle] || 'chest';
                  const iconData = BODY_ICONS[bp] || DEFAULT_BODY_ICON;
                  const { Icon } = iconData;

                  return (
                    <View key={item.muscle} style={styles.topMuscleRow}>
                      <Text style={styles.topMuscleRank}>{idx + 1}.</Text>
                      <Icon size={14} color={Colors.primary} strokeWidth={2} />
                      <Text style={styles.topMuscleName}>
                        {getMuscleLabel(item.muscle)}
                      </Text>
                      <Text style={styles.topMuscleSets}>
                        {item.sets} {i18n.t('common.sets')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0C0C0C',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'rgba(200,200,210,1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
    flex: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  viewTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewTabActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  viewTabText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  viewTabTextActive: {
    color: '#FFFFFF',
  },

  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 100,
    gap: 8,
  },

  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  weekLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  summarySection: {
    paddingHorizontal: 20,
  },

  dayContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 40,
  },

  // Month stats
  monthStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 16,
  },
  monthStat: {
    alignItems: 'center',
    gap: 2,
  },
  monthStatValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  monthStatLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  monthStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  prStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  // Top muscles
  topMusclesSection: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    gap: 10,
  },
  topMusclesHeader: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  topMuscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topMuscleRank: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 13,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    width: 18,
  },
  topMuscleName: {
    flex: 1,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  topMuscleSets: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
