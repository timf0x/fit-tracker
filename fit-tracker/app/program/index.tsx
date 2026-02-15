import { useState, useMemo, useEffect, Fragment } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  LogOut,
  AlertTriangle,
  RefreshCw,
  Trophy,
  ChevronRight,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { AnimatedStartButton } from '@/components/ui/AnimatedStartButton';
import { Fonts, Colors, GlassStyle, Header, PageLayout, IconStroke, CTAButton } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { useProgramStore } from '@/stores/programStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import type { ResolutionAction } from '@/types/program';
import { AmbientBackground } from '@/components/home/AmbientBackground';
import { MesocycleTimeline } from '@/components/program/MesocycleTimeline';
import { DayCard } from '@/components/program/DayCard';
import { ConfirmModal } from '@/components/program/ConfirmModal';
import { ReadinessCheck } from '@/components/program/ReadinessCheck';
import { RirMeter } from '@/components/program/RirMeter';
import { VolumeSnapshot } from '@/components/program/VolumeSnapshot';
import { buildProgramExercisesParam } from '@/lib/programSession';
import { resolveDayLabel, resolveProgramName } from '@/lib/programLabels';
import { computeReadinessScore, computeSessionAdjustments, applyAdjustmentsToExercises } from '@/lib/readinessEngine';
import { getPlannedDayForDate, getNextScheduledDay, getTodayISO, formatScheduledDate } from '@/lib/scheduleEngine';

export default function ProgramScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    program, activeState, clearProgram, isProgramComplete,
    saveReadiness, reconcileSchedule, resolveAndApply,
  } = useProgramStore();
  const startSession = useWorkoutStore((s) => s.startSession);
  const saveSessionReadiness = useWorkoutStore((s) => s.saveSessionReadiness);
  const workoutHistory = useWorkoutStore((s) => s.history);

  const [selectedWeek, setSelectedWeek] = useState(
    activeState?.currentWeek || 1,
  );
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showModifyConfirm, setShowModifyConfirm] = useState(false);
  const [showPacingWarning, setShowPacingWarning] = useState(false);
  const [showReadiness, setShowReadiness] = useState(false);

  const needsOnboarding = !program || !activeState;

  const currentWeekData = program?.weeks.find(
    (w) => w.weekNumber === selectedWeek,
  ) ?? null;

  const completedWeeks = useMemo(() => {
    if (!program || !activeState) return [];
    const result: number[] = [];
    for (const week of program.weeks) {
      const totalDays = week.days.length;
      const completedDays = activeState.completedDays.filter((k) =>
        k.startsWith(`${week.weekNumber}-`),
      ).length;
      if (completedDays >= totalDays) result.push(week.weekNumber);
    }
    return result;
  }, [program?.weeks, activeState?.completedDays]);

  const weekSummary = useMemo(() => {
    if (!currentWeekData || !activeState) return { done: 0, total: 0, sets: 0 };
    const done = activeState.completedDays.filter((k) =>
      k.startsWith(`${selectedWeek}-`),
    ).length;
    const sets = currentWeekData.days.reduce(
      (sum, d) => sum + d.exercises.reduce((s, e) => s + e.sets, 0),
      0,
    );
    return { done, total: currentWeekData.days.length, sets };
  }, [currentWeekData, selectedWeek, activeState?.completedDays]);

  const weekRir = useMemo(() => {
    if (!currentWeekData) return null;
    const firstEx = currentWeekData.days
      .flatMap((d) => d.exercises)
      .find((e) => e.targetRir !== undefined);
    return firstEx?.targetRir ?? null;
  }, [currentWeekData]);

  const volumeDelta = useMemo(() => {
    if (!currentWeekData || !program) return null;
    const currentTotal = Object.values(currentWeekData.volumeTargets).reduce((s, v) => s + v, 0);
    const prevWeek = program.weeks.find((w) => w.weekNumber === selectedWeek - 1);
    if (!prevWeek) return null;
    const prevTotal = Object.values(prevWeek.volumeTargets).reduce((s, v) => s + v, 0);
    return { delta: currentTotal - prevTotal, prevWeek: selectedWeek - 1 };
  }, [currentWeekData, selectedWeek, program?.weeks]);

  const weekPhase = useMemo(() => {
    if (!currentWeekData || !program) return 'adaptation';
    if (currentWeekData.isDeload) return 'deload' as const;
    const training = program.totalWeeks - 1;
    const weekIdx = selectedWeek - 1;
    const progress = weekIdx / Math.max(training - 1, 1);
    if (progress <= 0.15) return 'adaptation' as const;
    if (progress <= 0.55) return 'accumulation' as const;
    if (progress <= 0.85) return 'intensification' as const;
    return 'peak' as const;
  }, [currentWeekData, selectedWeek, program?.totalWeeks]);

  const NUDGE_KEYS: Record<string, string> = {
    adaptation: 'programOverview.nudgeAdaptation',
    accumulation: 'programOverview.nudgeAccumulation',
    intensification: 'programOverview.nudgeIntensification',
    peak: 'programOverview.nudgePeak',
    deload: 'programOverview.nudgeDeload',
  };

  const PHASE_COLORS: Record<string, string> = {
    adaptation: 'rgba(255,255,255,0.25)',
    accumulation: '#3B82F6',
    intensification: '#FF6B35',
    peak: '#FBBF24',
    deload: '#3B82F6',
  };

  const NUDGE_TEXT_COLORS: Record<string, string> = {
    adaptation: 'rgba(255,255,255,0.2)',
    accumulation: 'rgba(59,130,246,0.5)',
    intensification: 'rgba(255,107,53,0.5)',
    peak: 'rgba(251,191,36,0.5)',
    deload: 'rgba(59,130,246,0.5)',
  };

  const handleSelectWeek = (week: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWeek(week);
  };

  // Pacing check — warn if already completed a session today
  const isLastCompletionToday = useMemo(() => {
    if (!activeState?.lastCompletedAt) return false;
    const last = new Date(activeState.lastCompletedAt);
    const now = new Date();
    return last.toDateString() === now.toDateString();
  }, [activeState?.lastCompletedAt]);

  // ─── Missed day reconciliation ───
  useEffect(() => {
    if (program && activeState?.schedule) {
      reconcileSchedule(workoutHistory);
    }
  }, [workoutHistory.length, activeState?.schedule, program]);

  // ─── Redirect to onboarding if no program (after all hooks) ───
  useEffect(() => {
    if (needsOnboarding) {
      router.replace('/program/onboarding');
    }
  }, [needsOnboarding]);

  if (needsOnboarding) {
    return null;
  }

  // ─── Derived values (safe: program & activeState guaranteed non-null below) ───
  const programComplete = isProgramComplete();

  const deloadWeekNum = program.weeks.find((w) => w.isDeload)?.weekNumber;
  const isCurrentWeek = selectedWeek === activeState.currentWeek;

  const todayISO = getTodayISO();
  const scheduledToday = activeState.schedule
    ? getPlannedDayForDate(activeState.schedule, todayISO)
    : null;

  const todayDay = activeState.schedule
    ? (scheduledToday && !scheduledToday.completedDate
        ? currentWeekData?.days[scheduledToday.dayIndex]
        : null)
    : (isCurrentWeek
        ? currentWeekData?.days[activeState.currentDayIndex]
        : null);

  const todayDayIndex = activeState.schedule
    ? (scheduledToday && scheduledToday.weekNumber === selectedWeek
        ? scheduledToday.dayIndex
        : -1)
    : (isCurrentWeek ? activeState.currentDayIndex : -1);

  const isDayDone = (dayIndex: number) =>
    activeState.completedDays.includes(`${selectedWeek}-${dayIndex}`);

  const handleStartToday = () => {
    if (!todayDay) return;
    if (isLastCompletionToday) {
      setShowPacingWarning(true);
      return;
    }
    setShowReadiness(true);
  };

  const startSessionNow = (readiness?: import('@/types/program').ReadinessCheck) => {
    if (!todayDay) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const workoutId = `program_${program.id}_w${activeState.currentWeek}_d${activeState.currentDayIndex}`;
    const sessionId = startSession(workoutId, resolveDayLabel(todayDay), {
      programId: program.id,
      programWeek: activeState.currentWeek,
      programDayIndex: activeState.currentDayIndex,
    });
    if (readiness) {
      saveReadiness(readiness);
      saveSessionReadiness(sessionId, readiness);
    }

    let exercisesJson = buildProgramExercisesParam(todayDay);

    // Apply readiness adjustments if score is moderate or low
    if (readiness) {
      const score = computeReadinessScore(readiness);
      const adj = computeSessionAdjustments(score);
      if (adj.level === 'moderate' || adj.level === 'low') {
        const parsed = JSON.parse(exercisesJson);
        const adjusted = applyAdjustmentsToExercises(parsed, adj);
        exercisesJson = JSON.stringify(adjusted);
      }
    }

    router.push({
      pathname: '/workout/session',
      params: {
        workoutId,
        sessionId,
        workoutName: resolveDayLabel(todayDay),
        exercises: exercisesJson,
      },
    });
  };

  const sectionLabel = isCurrentWeek
    ? i18n.t('programOverview.thisWeek')
    : i18n.t('programOverview.weekLabel', { week: selectedWeek });

  return (
    <View style={styles.screen}>
      <AmbientBackground />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* ─── Header — clean typography, no pills ─── */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#fff" strokeWidth={IconStroke.default} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {resolveProgramName(program)}
            </Text>
            <Text style={styles.headerSub}>
              {i18n.t('programOverview.weekProgress', { current: activeState.currentWeek, total: program.totalWeeks })}
            </Text>
          </View>
        </View>

        {/* ─── Mesocycle Timeline — keep as-is ─── */}
        <MesocycleTimeline
          totalWeeks={program.totalWeeks}
          currentWeek={activeState.currentWeek}
          selectedWeek={selectedWeek}
          onSelect={handleSelectWeek}
          deloadWeek={deloadWeekNum}
          completedWeeks={completedWeeks}
        />

        {/* ─── Program completion ─── */}
        {programComplete && (
          <View style={styles.completionCard}>
            <Trophy size={28} color="#FBBF24" />
            <View style={styles.completionTextWrap}>
              <Text style={styles.completionTitle}>{i18n.t('programOverview.completed')}</Text>
              <Text style={styles.completionSubtitle}>
                {i18n.t('programOverview.completedSessions', { count: activeState.completedDays.length })}
              </Text>
            </View>
            <PressableScale
              style={styles.newProgramButton}
              activeScale={0.97}
              onPress={() => router.push('/program/onboarding')}
            >
              <Text style={styles.newProgramText}>{i18n.t('programOverview.newProgram')}</Text>
              <ChevronRight size={14} color="#0C0C0C" />
            </PressableScale>
          </View>
        )}

        {/* ─── Missed day banner ─── */}
        {activeState.pendingResolution && activeState.pendingResolution.missedDays.length > 0 && (
          <View style={styles.missedBanner}>
            <AlertTriangle
              size={14}
              color={
                activeState.pendingResolution.severity === 'urgent' ? '#FF4B4B'
                : activeState.pendingResolution.severity === 'warning' ? '#FBBF24'
                : Colors.primary
              }
              strokeWidth={IconStroke.emphasis}
            />
            <Text style={[
              styles.missedBannerText,
              {
                color: activeState.pendingResolution.severity === 'urgent' ? '#FF4B4B'
                  : activeState.pendingResolution.severity === 'warning' ? '#FBBF24'
                  : Colors.primary,
              },
            ]}>
              {i18n.t(activeState.pendingResolution.nudgeKey)}
            </Text>
          </View>
        )}

        {/* ─── Week card: header + day rows ─── */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.weekCard}>
            {/* Card header — section label + summary */}
            <View style={styles.weekCardHeader}>
              <Text style={styles.weekCardLabel}>{sectionLabel}</Text>
              <Text style={styles.weekCardSummary}>
                {i18n.t('programOverview.weekSummary', { done: weekSummary.done, total: weekSummary.total, sets: weekSummary.sets })}
              </Text>
            </View>

            {/* RIR Meter + Volume delta */}
            <View style={styles.meterRow}>
              <RirMeter rir={weekRir} isDeload={!!currentWeekData?.isDeload} />
              {volumeDelta && (
                <View style={styles.volumeDelta}>
                  {currentWeekData?.isDeload ? (
                    <>
                      <TrendingDown size={11} color="rgba(59,130,246,0.6)" strokeWidth={IconStroke.emphasis} />
                      <Text style={[styles.volumeDeltaText, { color: 'rgba(59,130,246,0.6)' }]}>
                        {i18n.t('programOverview.deloadVolume')}
                      </Text>
                    </>
                  ) : volumeDelta.delta > 0 ? (
                    <>
                      <TrendingUp size={11} color="#4ADE80" strokeWidth={IconStroke.emphasis} />
                      <Text style={[styles.volumeDeltaText, { color: '#4ADE80' }]}>
                        {i18n.t('programOverview.volumeUp', { delta: volumeDelta.delta, prev: volumeDelta.prevWeek })}
                      </Text>
                    </>
                  ) : volumeDelta.delta < 0 ? (
                    <>
                      <TrendingDown size={11} color="#FBBF24" strokeWidth={IconStroke.emphasis} />
                      <Text style={[styles.volumeDeltaText, { color: '#FBBF24' }]}>
                        {i18n.t('programOverview.volumeDown', { delta: volumeDelta.delta, prev: volumeDelta.prevWeek })}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Minus size={11} color="rgba(255,255,255,0.3)" strokeWidth={IconStroke.emphasis} />
                      <Text style={styles.volumeDeltaText}>
                        {i18n.t('programOverview.volumeSame')}
                      </Text>
                    </>
                  )}
                </View>
              )}
            </View>

            {/* Volume snapshot — top muscles with zone-colored bars */}
            {currentWeekData?.volumeTargets && (
              <View style={styles.snapshotWrap}>
                <VolumeSnapshot volumeTargets={currentWeekData.volumeTargets} />
              </View>
            )}

            {/* Smart nudge */}
            <View style={styles.nudgeRow}>
              <View style={[styles.nudgeAccent, { backgroundColor: PHASE_COLORS[weekPhase] }]} />
              <Text style={[styles.nudgeText, { color: NUDGE_TEXT_COLORS[weekPhase] }]}>
                {i18n.t(NUDGE_KEYS[weekPhase])}
              </Text>
            </View>

            {/* Day rows with separators */}
            {currentWeekData?.days.map((day, dayIdx, arr) => {
              const isToday = dayIdx === todayDayIndex;
              const completed = isDayDone(dayIdx);

              // Get scheduled date for this day if schedule exists
              const scheduledDateStr = activeState.schedule
                ? activeState.schedule.scheduledDays.find(
                    (sd) => sd.weekNumber === selectedWeek && sd.dayIndex === dayIdx,
                  )?.plannedDate
                : undefined;
              const formattedDate = scheduledDateStr
                ? formatScheduledDate(scheduledDateStr, i18n.locale)
                : undefined;

              return (
                <Fragment key={dayIdx}>
                  <View style={styles.daySeparator} />
                  <DayCard
                    day={day}
                    dayNumber={dayIdx + 1}
                    isToday={isToday}
                    isCompleted={completed}
                    scheduledDate={formattedDate}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({
                        pathname: '/program/day',
                        params: {
                          week: String(selectedWeek),
                          day: String(dayIdx),
                        },
                      });
                    }}
                  />
                </Fragment>
              );
            })}
          </View>

          {/* ─── Management section ─── */}
          <View style={styles.managementSection}>
            <PressableScale
              style={styles.managementRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowModifyConfirm(true);
              }}
            >
              <RefreshCw size={16} color="rgba(255,255,255,0.4)" />
              <Text style={styles.managementText}>{i18n.t('programOverview.modifyProgram')}</Text>
              <ChevronRight size={16} color="rgba(100,100,110,1)" />
            </PressableScale>

            <View style={styles.managementSep} />

            <PressableScale
              style={styles.managementRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowQuitConfirm(true);
              }}
            >
              <LogOut size={16} color="rgba(239,68,68,0.5)" />
              <Text
                style={[styles.managementText, { color: 'rgba(239,68,68,0.5)' }]}
              >
                {i18n.t('programOverview.quitProgram')}
              </Text>
              <ChevronRight size={16} color="rgba(100,100,110,1)" />
            </PressableScale>
          </View>
        </ScrollView>

        {/* ─── Bottom CTA ─── */}
        {todayDay &&
          todayDayIndex >= 0 &&
          !isDayDone(todayDayIndex) &&
          !programComplete && (
            <View style={styles.bottomCta}>
              <AnimatedStartButton
                onPress={handleStartToday}
                label={i18n.t('programOverview.startSession')}
                style={styles.startButton}
              />
            </View>
          )}
      </SafeAreaView>

      {/* ─── Modals ─── */}
      <ConfirmModal
        visible={showQuitConfirm}
        onClose={() => setShowQuitConfirm(false)}
        icon={<AlertTriangle size={28} color="#EF4444" />}
        title={i18n.t('programOverview.quitConfirmTitle')}
        description={i18n.t('programOverview.quitConfirmMessage')}
        confirmText={i18n.t('programOverview.quitConfirmButton')}
        onConfirm={() => {
          clearProgram();
          router.replace('/');
        }}
      />
      <ConfirmModal
        visible={showModifyConfirm}
        onClose={() => setShowModifyConfirm(false)}
        icon={<RefreshCw size={28} color={Colors.primary} />}
        iconBgColor="rgba(255,107,53,0.12)"
        title={i18n.t('programOverview.modifyConfirmTitle')}
        description={i18n.t('programOverview.modifyConfirmMessage')}
        cancelText={i18n.t('common.cancel')}
        confirmText={i18n.t('common.modify')}
        confirmColor={Colors.primary}
        onConfirm={() => {
          setShowModifyConfirm(false);
          router.push('/program/onboarding');
        }}
      />
      <ConfirmModal
        visible={showPacingWarning}
        onClose={() => setShowPacingWarning(false)}
        icon={<Clock size={28} color="#FBBF24" />}
        iconBgColor="rgba(251,191,36,0.12)"
        title={i18n.t('programOverview.alreadyTrainedTitle')}
        description={i18n.t('programOverview.alreadyTrainedMessage')}
        cancelText={i18n.t('common.postpone')}
        confirmText={i18n.t('common.continue')}
        confirmColor={Colors.primary}
        onConfirm={() => {
          setShowPacingWarning(false);
          setShowReadiness(true);
        }}
      />
      <ReadinessCheck
        visible={showReadiness}
        onSubmit={(check) => {
          setShowReadiness(false);
          startSessionNow(check);
        }}
        onSkip={() => {
          setShowReadiness(false);
          startSessionNow();
        }}
        onClose={() => setShowReadiness(false)}
      />
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

  // ─── Header ───
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
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    color: 'rgba(200,200,210,1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerSub: {
    color: 'rgba(120,120,130,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 2,
  },

  // (deload banner removed — replaced by smart nudge)

  // ─── Completion ───
  completionCard: {
    marginHorizontal: PageLayout.paddingHorizontal,
    marginTop: 8,
    backgroundColor: 'rgba(251,191,36,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.1)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completionTextWrap: {
    flex: 1,
    gap: 2,
  },
  completionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  completionSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  newProgramButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newProgramText: {
    color: '#0C0C0C',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // ─── Missed Day Banner ───
  missedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: PageLayout.paddingHorizontal,
    marginTop: 8,
    backgroundColor: 'rgba(251,191,36,0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  missedBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 18,
  },

  // ─── Body ───
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: PageLayout.paddingHorizontal,
    paddingTop: 8,
    gap: PageLayout.sectionGap,
  },

  // ─── Week card (single glass card wrapping all day rows) ───
  weekCard: {
    ...GlassStyle.card,
    overflow: 'hidden',
  },
  weekCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  weekCardLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1,
  },
  weekCardSummary: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  volumeDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  volumeDeltaText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  snapshotWrap: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  nudgeAccent: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
    marginTop: 1,
  },
  nudgeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 16,
  },
  daySeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: 16,
  },

  // ─── Management ───
  managementSection: {
    gap: 0,
  },
  managementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  managementText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },
  managementSep: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 28,
  },

  // ─── Bottom CTA ───
  bottomCta: {
    paddingHorizontal: PageLayout.paddingHorizontal,
    paddingVertical: 12,
    backgroundColor: 'rgba(12,12,12,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: CTAButton.borderRadius,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startText: {
    color: '#0C0C0C',
    fontSize: CTAButton.fontSize,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
});
