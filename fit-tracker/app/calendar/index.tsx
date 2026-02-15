import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  NotebookPen,
} from 'lucide-react-native';
import { Fonts, Colors, Header, PageLayout, IconStroke, GlassStyle } from '@/constants/theme';
import { PressableScale } from '@/components/ui/PressableScale';
import i18n from '@/lib/i18n';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProgramStore } from '@/stores/programStore';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import { DayContentCard } from '@/components/calendar/DayContentCard';
import {
  buildMonthSummary,
  buildDayDetail,
} from '@/lib/timelineEngine';
import { getSetsForWeek } from '@/lib/weeklyVolume';
import { buildProgramExercisesParam } from '@/lib/programSession';
import { getProgressiveWeight } from '@/lib/weightEstimation';
import { exercises } from '@/data/exercises';

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

function getMonthName(year: number, month: number): string {
  const locale = i18n.locale === 'fr' ? 'fr-FR' : 'en-US';
  const d = new Date(year, month, 1);
  const monthName = d.toLocaleDateString(locale, { month: 'long' });
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
}

/** Compute week offset from today for a given ISO date */
function getWeekOffsetForDate(dateISO: string): number {
  const [y, m, d] = dateISO.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const targetDay = target.getDay();
  const targetMonday = new Date(target);
  targetMonday.setDate(target.getDate() - (targetDay === 0 ? 6 : targetDay - 1));
  targetMonday.setHours(0, 0, 0, 0);

  const today = new Date();
  const todayDay = today.getDay();
  const todayMonday = new Date(today);
  todayMonday.setDate(today.getDate() - (todayDay === 0 ? 6 : todayDay - 1));
  todayMonday.setHours(0, 0, 0, 0);

  return Math.round(
    (targetMonday.getTime() - todayMonday.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
}

const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 600;
const SLIDE_OUT_MS = 120;
const SLIDE_IN_MS = 180;
const GRID_SLIDE_DISTANCE = 80;

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const history = useWorkoutStore((s) => s.history);
  const startSession = useWorkoutStore((s) => s.startSession);
  const { program, activeState } = useProgramStore();

  const now = new Date();
  const [monthYear, setMonthYear] = useState(now.getFullYear());
  const [monthMonth, setMonthMonth] = useState(now.getMonth());
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayISO);

  const schedule = activeState?.schedule || null;

  // ─── Swipe animation shared values ───
  const translateY = useSharedValue(0);
  const gridOpacity = useSharedValue(1);

  const gridAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: gridOpacity.value,
  }));

  // ─── Month change handler (called from gesture worklet via runOnJS) ───
  const handleMonthSwipe = useCallback((direction: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let newMonth = monthMonth + direction;
    let newYear = monthYear;
    if (newMonth < 0) {
      newYear -= 1;
      newMonth = 11;
    } else if (newMonth > 11) {
      newYear += 1;
      newMonth = 0;
    }

    setMonthYear(newYear);
    setMonthMonth(newMonth);

    // Auto-select: today if in the new month, otherwise 1st
    const todayDate = new Date();
    if (todayDate.getFullYear() === newYear && todayDate.getMonth() === newMonth) {
      setSelectedDate(todayISO);
    } else {
      setSelectedDate(
        `${newYear}-${String(newMonth + 1).padStart(2, '0')}-01`,
      );
    }
  }, [monthMonth, monthYear, todayISO]);

  // ─── Pan gesture on grid ───
  const panGesture = useMemo(() =>
    Gesture.Pan()
      .activeOffsetY([-15, 15])
      .failOffsetX([-25, 25])
      .onUpdate((e) => {
        translateY.value = e.translationY * 0.4;
      })
      .onEnd((e) => {
        const shouldSwipe =
          Math.abs(e.translationY) > SWIPE_THRESHOLD ||
          Math.abs(e.velocityY) > VELOCITY_THRESHOLD;

        if (shouldSwipe) {
          const direction = e.translationY < 0 ? 1 : -1; // swipe up = next month
          const exitY = direction * -GRID_SLIDE_DISTANCE;
          const entryY = direction * GRID_SLIDE_DISTANCE;

          // Slide out
          translateY.value = withTiming(exitY, {
            duration: SLIDE_OUT_MS,
            easing: Easing.out(Easing.quad),
          });
          gridOpacity.value = withTiming(0, {
            duration: SLIDE_OUT_MS,
            easing: Easing.out(Easing.quad),
          });

          // After exit completes: change month, then slide in
          translateY.value = withSequence(
            withTiming(exitY, {
              duration: SLIDE_OUT_MS,
              easing: Easing.out(Easing.quad),
            }),
            withTiming(entryY, { duration: 0 }),
            withTiming(0, {
              duration: SLIDE_IN_MS,
              easing: Easing.out(Easing.quad),
            }),
          );
          gridOpacity.value = withSequence(
            withTiming(0, {
              duration: SLIDE_OUT_MS,
              easing: Easing.out(Easing.quad),
            }),
            withTiming(0, { duration: 0 }),
            withTiming(1, {
              duration: SLIDE_IN_MS,
              easing: Easing.out(Easing.quad),
            }),
          );

          // Change month data after exit animation
          runOnJS(handleMonthSwipe)(direction);
        } else {
          // Snap back
          translateY.value = withTiming(0, { duration: 200 });
          gridOpacity.value = withTiming(1, { duration: 200 });
        }
      })
      .onFinalize((_e, success) => {
        if (!success) {
          translateY.value = 0;
          gridOpacity.value = 1;
        }
      }),
  [handleMonthSwipe]);

  // Build month summary
  const monthData = useMemo(
    () => buildMonthSummary(history, schedule, monthYear, monthMonth),
    [history, schedule, monthYear, monthMonth],
  );

  // Build detail for selected day
  const selectedDay = useMemo(
    () => buildDayDetail(history, schedule, program || null, selectedDate),
    [history, schedule, program, selectedDate],
  );

  // Weekly sets for the selected date's week (for zone coloring in DayContentCard)
  const weeklySets = useMemo(
    () => getSetsForWeek(history, getWeekOffsetForDate(selectedDate)),
    [history, selectedDate],
  );

  // Check if there's something to show for the selected day
  const hasDayContent = selectedDay.sessions.length > 0 ||
    selectedDay.programDay !== undefined ||
    selectedDay.isSkipped;

  // ─── Start Session Handler ───
  const handleStartSession = useCallback(() => {
    if (!selectedDay?.programDay || !program) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const day = selectedDay.programDay;

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
  }, [selectedDay, program, history, startSession, router]);

  // ─── Edit Session Handler ───
  const handleEditSession = useCallback((sessionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/calendar/edit', params: { sessionId } });
  }, [router]);

  // Can start session: selected day is today, has scheduled workout, no completed sessions
  const canStartSession = selectedDay.isToday &&
    !!selectedDay.programDay &&
    selectedDay.sessions.length === 0;

  // Can log past workout: only today or past days
  const canLogPast = selectedDay.isPast || selectedDay.isToday;

  const headerMonthName = getMonthName(monthYear, monthMonth);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header with month name */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#fff" strokeWidth={IconStroke.default} />
          </Pressable>
          <Text style={styles.headerTitle}>{i18n.t('calendar.title')}</Text>
          <View style={styles.headerPipe} />
          <Text style={styles.headerMonth}>{headerMonthName}</Text>
        </View>

        {/* Fixed grid area with swipe gesture */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.gridWrapper, gridAnimStyle]}>
            <MonthGrid
              year={monthYear}
              month={monthMonth}
              monthData={monthData}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedDate(date);
              }}
            />
          </Animated.View>
        </GestureDetector>

        {/* Scrollable bottom area */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Day content — shows detail for the tapped date */}
          {hasDayContent && (
            <View style={styles.dayContent}>
              <DayContentCard
                day={selectedDay}
                weekHistory={history}
                weeklySets={weeklySets}
                onStartSession={canStartSession ? handleStartSession : undefined}
                onEditSession={handleEditSession}
              />
            </View>
          )}

          {/* Log past workout button — only for today or past days */}
          {canLogPast && (
            <View style={styles.dayContent}>
              <PressableScale
                style={styles.logButton}
                activeScale={0.97}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/calendar/log', params: { date: selectedDate } });
                }}
              >
                <NotebookPen size={16} color="rgba(255,255,255,0.45)" strokeWidth={IconStroke.default} />
                <Text style={styles.logButtonText}>{i18n.t('calendarLog.logButton')}</Text>
              </PressableScale>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PageLayout.paddingHorizontal,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    ...Header.backButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Header.screenLabel,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  headerPipe: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerMonth: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    flex: 1,
  },

  gridWrapper: {
    overflow: 'hidden',
    paddingVertical: 8,
  },

  body: {
    flex: 1,
  },
  bodyContent: {
    gap: 8,
  },

  dayContent: {
    paddingHorizontal: PageLayout.paddingHorizontal,
    paddingTop: 8,
  },

  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  logButtonText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
