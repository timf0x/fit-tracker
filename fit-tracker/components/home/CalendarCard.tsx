import { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { useRouter } from 'expo-router';
import { Calendar, Flame, ChevronRight, Zap } from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProgramStore } from '@/stores/programStore';
import { getWeekSummary, getWeekPRs } from '@/lib/statsHelpers';
import { buildWeekTimeline } from '@/lib/timelineEngine';
import { getHomeCalendarNudge } from '@/lib/timelineNudges';
import i18n from '@/lib/i18n';
import { formatWeight, getWeightUnitLabel } from '@/stores/settingsStore';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { useHomeRefreshKey } from '@/lib/refreshContext';

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${formatWeight(kg)}${getWeightUnitLabel()}`;
}

function AnimatedDayColumn({
  index,
  dotStagger,
  hasSessions,
  isToday,
  isScheduled,
  label,
}: {
  index: number;
  dotStagger: SharedValue<number>;
  hasSessions: boolean;
  isToday: boolean;
  isScheduled: boolean;
  label: string;
}) {
  const animStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      dotStagger.value,
      [index, index + 1],
      [0, 1],
      'clamp',
    );
    return {
      opacity: progress,
      transform: [{ scale: interpolate(progress, [0, 1], [0.4, 1]) }],
    };
  });

  return (
    <Animated.View style={[styles.dayColumn, animStyle]}>
      <View
        style={[
          styles.dayCircle,
          hasSessions && styles.dayCompleted,
          isToday && !hasSessions && styles.dayToday,
          !hasSessions && !isToday && isScheduled && styles.dayScheduled,
        ]}
      />
      <Text
        style={[
          styles.dayLabel,
          hasSessions && styles.dayLabelActive,
          isToday && styles.dayLabelToday,
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

export function CalendarCard() {
  const router = useRouter();
  const { history, stats } = useWorkoutStore();
  const { program, activeState } = useProgramStore();

  const refreshKey = useHomeRefreshKey();

  const dotStagger = useSharedValue(7);
  const chipsAnim = useSharedValue(1);

  useEffect(() => {
    if (refreshKey > 0) {
      dotStagger.value = withSequence(
        withTiming(0, { duration: 60 }),
        withTiming(7, { duration: 420, easing: Easing.out(Easing.quad) }),
      );
      chipsAnim.value = withSequence(
        withTiming(0, { duration: 80 }),
        withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }),
      );
    }
  }, [refreshKey]);

  const chipsAnimStyle = useAnimatedStyle(() => ({
    opacity: chipsAnim.value,
    transform: [{ translateY: interpolate(chipsAnim.value, [0, 1], [6, 0]) }],
  }));

  const schedule = activeState?.schedule || null;

  const weekSummary = useMemo(
    () => getWeekSummary(history, 0),
    [history],
  );

  const weekPRs = useMemo(
    () => getWeekPRs(history, 0),
    [history],
  );

  // Build timeline for current week to get schedule-aware dots + nudge
  const weekDays = useMemo(
    () => buildWeekTimeline(history, schedule, program || null, 0),
    [history, schedule, program],
  );

  const nudge = useMemo(
    () => getHomeCalendarNudge(weekDays),
    [weekDays],
  );

  const streak = stats.currentStreak;
  const hasRealData = history.some((s) => s.endTime);

  const dayLabels = i18n.t('home.weekly.days') as unknown as string[];

  return (
    <PressableScale style={styles.container} onPress={() => router.push('/calendar')}>
      <View style={styles.card}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.calendarIconBox}>
              <Calendar size={15} color="#4ade80" strokeWidth={2} />
            </View>
            <Text style={styles.headerLabel}>
              {i18n.t('home.weekly.title')}
            </Text>
          </View>
          <ChevronRight size={16} color="rgba(120,120,130,1)" strokeWidth={2} />
        </View>

        {/* 7-day strip with schedule-aware dots */}
        <View style={styles.daysRow}>
          {weekDays.map((day, index) => {
            const hasSessions = day.sessions.length > 0;
            const isScheduled = !!day.scheduledDay && !day.scheduledDay.completedDate;

            return (
              <AnimatedDayColumn
                key={day.date}
                index={index}
                dotStagger={dotStagger}
                hasSessions={hasSessions}
                isToday={day.isToday}
                isScheduled={isScheduled}
                label={dayLabels[index]}
              />
            );
          })}
        </View>

        {/* Smart nudge */}
        {nudge && (
          <Animated.View style={[styles.nudgeRow, chipsAnimStyle]}>
            <View style={[styles.nudgeAccent, { backgroundColor: nudge.color }]} />
            <Text style={[styles.nudgeText, { color: nudge.color }]} numberOfLines={1}>
              {nudge.text}
            </Text>
          </Animated.View>
        )}

        {/* Stats Chips Row */}
        <Animated.View style={[styles.chipsRow, chipsAnimStyle]}>
          {hasRealData && (
            <>
              <View style={styles.chip}>
                <Text style={styles.chipValue}>{weekSummary.sessions}</Text>
                <Text style={styles.chipLabel}> {i18n.t('home.weekly.sessions')}</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipValue}>
                  {formatVolume(weekSummary.totalVolumeKg)}
                </Text>
              </View>
              {weekPRs.total > 0 && (
                <View style={[styles.chip, styles.chipPR]}>
                  <Text style={styles.chipValuePR}>{weekPRs.total} {i18n.t('home.weekly.pr')}</Text>
                  <Zap size={10} color="#FF6B35" strokeWidth={2.5} />
                </View>
              )}
            </>
          )}
          {streak > 0 && (
            <View style={[styles.chip, styles.chipStreak]}>
              <Flame size={10} color="#f97316" strokeWidth={2.5} />
              <Text style={styles.chipValueStreak}>
                {streak} {i18n.t('home.weekly.streak')}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 20,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLabel: {
    color: 'rgba(200,200,210,1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 8,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  dayCompleted: {
    backgroundColor: '#f97316',
    borderWidth: 0,
  },
  dayToday: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#f97316',
  },
  dayScheduled: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,53,0.4)',
    borderStyle: 'dashed',
  },
  dayLabel: {
    color: 'rgba(120,120,130,1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  dayLabelActive: {
    color: 'rgba(200,200,210,1)',
  },
  dayLabelToday: {
    color: '#f97316',
  },

  // Smart nudge
  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -8,
  },
  nudgeAccent: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
  },
  nudgeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Stats Chips
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipPR: {
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
  chipValue: {
    color: '#fff',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  chipLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  chipValuePR: {
    color: '#FF6B35',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginRight: 3,
  },
  chipStreak: {
    backgroundColor: 'rgba(249,115,22,0.10)',
    gap: 4,
  },
  chipValueStreak: {
    color: '#f97316',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
});
