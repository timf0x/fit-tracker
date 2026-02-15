import { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { AnimatedStartButton } from '@/components/ui/AnimatedStartButton';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import {
  ChevronRight,
  Play,
  Trophy,
  Check,
  Clock,
  Flame,
  Mountain,
  Zap,
  Dumbbell,
  Target,
  Diamond,
  HeartPulse,
  Shield,
  AlertTriangle,
  SkipForward,
  Merge,
  CalendarClock,
  RotateCcw,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useProgramStore } from '@/stores/programStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getExerciseById } from '@/data/exercises';
import { estimateDuration } from '@/lib/programGenerator';
import { buildProgramExercisesParam } from '@/lib/programSession';
import { getProgressiveWeight } from '@/lib/weightEstimation';
import { checkDeloadStatus } from '@/lib/deloadDetection';
import { ReadinessCheck } from '@/components/program/ReadinessCheck';
import { ConfirmModal } from '@/components/program/ConfirmModal';
import type { ReadinessCheck as ReadinessCheckType, ResolutionAction, ResolutionOption } from '@/types/program';
import i18n from '@/lib/i18n';
import { resolveDayLabel } from '@/lib/programLabels';
import { getNextScheduledDay, formatScheduledDate, getPlannedDayForDate, getTodayISO } from '@/lib/scheduleEngine';

const SPLIT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ppl: { label: i18n.t('activeProgram.splitLabels.ppl'), color: '#FF6B35', bg: 'rgba(255,107,53,0.15)' },
  upper_lower: { label: i18n.t('activeProgram.splitLabels.upperLower'), color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  full_body: { label: i18n.t('activeProgram.splitLabels.fullBody'), color: '#A855F7', bg: 'rgba(168,85,247,0.15)' },
};

// Onset muscle identity — each body part gets a Lucide icon + colored tint
// Icons are conceptual: Flame=chest (fire day), Mountain=back (V-taper),
// Zap=legs (power), Target=shoulders (precision), Diamond=core (cut)
export interface BodyIcon { Icon: LucideIcon; color: string; bg: string }

const NEUTRAL = { color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.06)' };

export const BODY_ICONS: Record<string, BodyIcon> = {
  chest:       { Icon: Flame,     ...NEUTRAL },
  back:        { Icon: Mountain,  ...NEUTRAL },
  'upper legs':{ Icon: Zap,       ...NEUTRAL },
  'lower legs':{ Icon: Zap,       ...NEUTRAL },
  'upper arms':{ Icon: Dumbbell,  ...NEUTRAL },
  'lower arms':{ Icon: Dumbbell,  ...NEUTRAL },
  shoulders:   { Icon: Target,    ...NEUTRAL },
  waist:       { Icon: Diamond,   ...NEUTRAL },
  cardio:      { Icon: HeartPulse,...NEUTRAL },
  neck:        { Icon: Shield,    ...NEUTRAL },
};

export const DEFAULT_BODY_ICON: BodyIcon = { Icon: Dumbbell, ...NEUTRAL };


export function ActiveProgramCard() {
  const router = useRouter();
  const {
    userProfile, program, activeState, isProgramComplete,
    saveReadiness, reconcileSchedule, resolveAndApply,
  } = useProgramStore();
  const startSession = useWorkoutStore((s) => s.startSession);
  const saveSessionReadiness = useWorkoutStore((s) => s.saveSessionReadiness);
  const workoutHistory = useWorkoutStore((s) => s.history);

  const [showReadiness, setShowReadiness] = useState(false);
  const [showPacingWarning, setShowPacingWarning] = useState(false);

  // ─── Missed day reconciliation — runs on mount + history change ───
  useEffect(() => {
    if (program && activeState?.schedule) {
      reconcileSchedule(workoutHistory);
    }
  }, [workoutHistory, activeState?.schedule, program]);

  const handleResolution = useCallback((action: ResolutionAction) => {
    resolveAndApply(action, workoutHistory);
  }, [resolveAndApply, workoutHistory]);

  // Pacing guard — check if user already completed a session today
  const hasSessionToday = useMemo(() => {
    const today = new Date().toDateString();
    return workoutHistory.some((s) => s.endTime && new Date(s.endTime).toDateString() === today);
  }, [workoutHistory]);

  // Pulsing glow for start button
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(pulse.value, [0, 1], [0.15, 0.4]),
    shadowRadius: interpolate(pulse.value, [0, 1], [8, 20]),
  }));

  const programComplete = useMemo(() => isProgramComplete(), [activeState?.completedDays, program]);

  // Deload detection
  const deloadStatus = useMemo(
    () => checkDeloadStatus(workoutHistory),
    [workoutHistory],
  );

  // ─── State 1: No program — Clean CTA ───
  if (!userProfile || !program || !activeState) {
    return (
      <View style={styles.container}>
        <PressableScale
          style={styles.card}
          onPress={() => router.push('/program/onboarding')}
        >
          <View style={styles.sessionTitleRow}>
            <View style={[styles.focusDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.sessionName}>{i18n.t('activeProgram.createTitle')}</Text>
            <View style={{ flex: 1 }} />
            <ChevronRight size={16} color="rgba(120,120,130,1)" />
          </View>
          <Text style={styles.sessionMeta}>
            {i18n.t('activeProgram.createSubtitle')}
          </Text>
          <PressableScale
            style={styles.ghostCta}
            activeScale={0.97}
            onPress={() => router.push('/program/onboarding')}
          >
            <Text style={styles.ghostCtaText}>{i18n.t('activeProgram.createCta')}</Text>
            <ChevronRight size={14} color={Colors.primary} strokeWidth={2.5} />
          </PressableScale>
        </PressableScale>
      </View>
    );
  }

  // ─── State 3: Program Complete ───
  if (programComplete) {
    const totalSessions = activeState.completedDays.length;
    const splitInfo = SPLIT_LABELS[program.splitType] || SPLIT_LABELS.ppl;
    return (
      <View style={styles.container}>
        <PressableScale style={styles.card} onPress={() => router.push('/program')}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>{i18n.t('activeProgram.programLabel')}</Text>
            <ChevronRight size={16} color="rgba(120,120,130,1)" strokeWidth={2} />
          </View>

          <View style={styles.completeContent}>
            <View style={styles.trophyWrap}>
              <Trophy size={24} color="#FBBF24" />
            </View>
            <View style={styles.completeTextWrap}>
              <Text style={styles.completeTitle}>{i18n.t('activeProgram.completed')}</Text>
              <Text style={styles.completeSubtitle}>
                {splitInfo.label} · {program.totalWeeks} {i18n.t('activeProgram.weeks')}
              </Text>
            </View>
          </View>

          {/* Completion stats */}
          <View style={styles.completeStats}>
            <View style={styles.completeStat}>
              <Text style={styles.completeStatValue}>{totalSessions}</Text>
              <Text style={styles.completeStatLabel}>{i18n.t('activeProgram.sessions')}</Text>
            </View>
            <View style={styles.completeStatDivider} />
            <View style={styles.completeStat}>
              <Text style={styles.completeStatValue}>{program.totalWeeks}</Text>
              <Text style={styles.completeStatLabel}>{i18n.t('activeProgram.weeks')}</Text>
            </View>
            <View style={styles.completeStatDivider} />
            <View style={styles.completeStat}>
              <Text style={[styles.completeStatValue, { color: splitInfo.color }]}>
                {splitInfo.label}
              </Text>
              <Text style={styles.completeStatLabel}>{i18n.t('activeProgram.split')}</Text>
            </View>
          </View>

          {/* Completed mesocycle bar */}
          <View style={styles.mesoBar}>
            {program.weeks.map((week) => (
              <View
                key={week.weekNumber}
                style={[
                  styles.mesoSegment,
                  week.isDeload ? styles.mesoSegmentDeload : styles.mesoSegmentDone,
                ]}
              />
            ))}
          </View>

          <PressableScale
            style={styles.ghostCta}
            activeScale={0.97}
            onPress={() => router.push('/program/onboarding')}
          >
            <Text style={styles.ghostCtaText}>{i18n.t('activeProgram.newProgram')}</Text>
            <ChevronRight size={14} color={Colors.primary} strokeWidth={2.5} />
          </PressableScale>
        </PressableScale>
      </View>
    );
  }

  // ─── State 4: Missed day detected ───
  const pendingResolution = activeState.pendingResolution;
  if (pendingResolution && pendingResolution.missedDays.length > 0) {
    const missedCount = pendingResolution.missedDays.length;
    const severityColor =
      pendingResolution.severity === 'urgent' ? '#FF4B4B'
      : pendingResolution.severity === 'warning' ? '#FBBF24'
      : Colors.primary;
    const severityBg =
      pendingResolution.severity === 'urgent' ? 'rgba(255,75,75,0.08)'
      : pendingResolution.severity === 'warning' ? 'rgba(251,191,36,0.08)'
      : 'rgba(255,107,53,0.08)';

    const RESOLUTION_ICONS: Record<string, typeof SkipForward> = {
      do_missed: RotateCcw,
      skip_continue: SkipForward,
      merge: Merge,
      reschedule_week: CalendarClock,
    };

    return (
      <View style={styles.container}>
        <View style={[styles.card, { borderColor: `${severityColor}20` }]}>
          {/* Header */}
          <View style={styles.sessionHeader}>
            <View style={styles.sessionTitleRow}>
              <View style={[styles.focusDot, { backgroundColor: severityColor }]} />
              <Text style={styles.sessionName}>
                {missedCount === 1
                  ? i18n.t('missedDay.title')
                  : i18n.t('missedDay.titleMultiple', { count: missedCount })}
              </Text>
            </View>
            <Text style={styles.sessionMeta}>
              {i18n.t('missedDay.daysSince', { count: pendingResolution.daysSinceLast })}
            </Text>
          </View>

          {/* Nudge */}
          <View style={[styles.missedNudge, { backgroundColor: severityBg }]}>
            <View style={[styles.missedNudgeAccent, { backgroundColor: severityColor }]} />
            <Text style={[styles.missedNudgeText, { color: severityColor }]}>
              {i18n.t(pendingResolution.nudgeKey)}
            </Text>
          </View>

          {/* Resolution options */}
          <View style={styles.missedOptions}>
            {pendingResolution.options.map((option) => {
              const OptionIcon = RESOLUTION_ICONS[option.action] || SkipForward;
              const isRec = option.recommended;
              return (
                <PressableScale
                  key={option.action}
                  style={[
                    styles.missedOptionBtn,
                    isRec && styles.missedOptionBtnRecommended,
                  ]}
                  activeScale={0.97}
                  onPress={() => handleResolution(option.action)}
                >
                  <View style={styles.missedOptionRow}>
                    <OptionIcon
                      size={16}
                      color={isRec ? Colors.primary : 'rgba(255,255,255,0.5)'}
                      strokeWidth={2}
                    />
                    <View style={styles.missedOptionContent}>
                      <View style={styles.missedOptionLabelRow}>
                        <Text style={[
                          styles.missedOptionLabel,
                          isRec && { color: Colors.primary },
                        ]}>
                          {i18n.t(option.labelKey)}
                        </Text>
                        {isRec && (
                          <Text style={styles.missedOptionRecBadge}>
                            {i18n.t('missedDay.recommended')}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.missedOptionDesc}>
                        {i18n.t(option.descriptionKey, {
                          sets: option.meta?.extraSets || 0,
                        })}
                      </Text>
                    </View>
                  </View>
                </PressableScale>
              );
            })}
          </View>

          {/* Mesocycle bar (same as active state) */}
          <View style={styles.mesoBar}>
            {program.weeks.map((week) => {
              const weekDays = week.days.length;
              const completedInWeek = activeState.completedDays.filter(
                (k) => k.startsWith(`${week.weekNumber}-`)
              ).length;
              const weekComplete = completedInWeek >= weekDays;
              return (
                <View
                  key={week.weekNumber}
                  style={[
                    styles.mesoSegment,
                    weekComplete && !week.isDeload && styles.mesoSegmentDone,
                    weekComplete && week.isDeload && styles.mesoSegmentDeload,
                  ]}
                />
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  // ─── State 2: Active program ───
  const currentWeek = program.weeks.find(
    (w) => w.weekNumber === activeState.currentWeek
  );

  // Schedule-aware today detection
  const todayISO = getTodayISO();
  const scheduledToday = activeState.schedule
    ? getPlannedDayForDate(activeState.schedule, todayISO)
    : null;
  const nextScheduled = activeState.schedule
    ? getNextScheduledDay(activeState.schedule)
    : null;

  // Determine the day to show — schedule-aware or legacy
  const todayDay = activeState.schedule
    ? (scheduledToday && !scheduledToday.completedDate
        ? program.weeks.find((w) => w.weekNumber === scheduledToday.weekNumber)?.days[scheduledToday.dayIndex]
        : null)
    : currentWeek?.days[activeState.currentDayIndex];

  const exercisePreview = useMemo(() => {
    if (!todayDay) return [];
    return todayDay.exercises.slice(0, 3).map((e) => {
      const ex = getExerciseById(e.exerciseId);
      if (!ex) return null;
      return {
        id: ex.id,
        nameFr: ex.nameFr || ex.name,
        bodyPart: ex.bodyPart,
        sets: e.sets,
        minReps: e.minReps,
        maxReps: e.maxReps || e.reps,
      };
    }).filter(Boolean) as Array<{ id: string; nameFr: string; bodyPart: string; sets: number; minReps: number; maxReps: number }>;
  }, [todayDay]);

  const duration = todayDay ? estimateDuration(todayDay) : 0;
  const isDayDone = activeState.schedule
    ? (scheduledToday ? !!scheduledToday.completedDate : false)
    : activeState.completedDays.includes(
        `${activeState.currentWeek}-${activeState.currentDayIndex}`
      );

  const splitStyle = SPLIT_LABELS[program.splitType] || SPLIT_LABELS.ppl;

  const handleStart = () => {
    if (!todayDay || isDayDone) return;
    if (hasSessionToday) {
      setShowPacingWarning(true);
      return;
    }
    setShowReadiness(true);
  };

  // Compute progressive weight overrides for session
  const progressiveWeights = useMemo(() => {
    if (!todayDay) return {};
    const map: Record<string, { weight: number; action: string }> = {};
    for (const pex of todayDay.exercises) {
      const ex = getExerciseById(pex.exerciseId);
      if (!ex) continue;
      const prog = getProgressiveWeight(
        pex.exerciseId,
        ex.equipment,
        pex.minReps || pex.reps,
        workoutHistory,
      );
      if (prog.action !== 'none') {
        map[pex.exerciseId] = prog;
      }
    }
    return map;
  }, [todayDay, workoutHistory]);

  const startSessionNow = (readiness?: ReadinessCheckType) => {
    if (!todayDay) return;

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

    const exercisesJson = buildProgramExercisesParam(todayDay, progressiveWeights);

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

  return (
    <>
      <View style={styles.container}>
        <PressableScale
          style={[
            styles.card,
            !isDayDone && styles.cardActive,
          ]}
          onPress={() => router.push('/program')}
        >
          {/* Next session nudge — when schedule exists and no session today */}
          {!todayDay && activeState.schedule && nextScheduled && (() => {
            const nextDayData = program.weeks
              .find((w) => w.weekNumber === nextScheduled.weekNumber)
              ?.days[nextScheduled.dayIndex];
            const dateStr = formatScheduledDate(nextScheduled.plannedDate, i18n.locale);
            const label = nextDayData ? resolveDayLabel(nextDayData) : '';
            return (
              <View style={styles.sessionHeader}>
                <View style={styles.sessionTitleRow}>
                  <View style={[styles.focusDot, { backgroundColor: splitStyle.color }]} />
                  <Text style={styles.sessionName}>
                    {i18n.t('activeProgram_schedule.noSessionToday')}
                  </Text>
                  <View style={{ flex: 1 }} />
                  <ChevronRight size={16} color="rgba(120,120,130,1)" />
                </View>
                <Text style={styles.sessionMeta}>
                  {dateStr} — {label}
                </Text>
              </View>
            );
          })()}

          {/* Session header — typography only, no pills */}
          {todayDay && (
            <View style={styles.sessionHeader}>
              <View style={styles.sessionTitleRow}>
                <View style={[styles.focusDot, { backgroundColor: splitStyle.color }]} />
                <Text style={styles.sessionName}>{resolveDayLabel(todayDay)}</Text>
                <View style={{ flex: 1 }} />
                <ChevronRight size={16} color="rgba(120,120,130,1)" />
              </View>
              <Text style={styles.sessionMeta}>
                S{activeState.currentWeek}/{program.totalWeeks}
                {duration > 0 ? ` · ~${duration} ${i18n.t('common.minAbbr')}` : ''}
                {` · ${todayDay.exercises.length} ${i18n.t('common.exosAbbr')}`}
              </Text>

              {/* Deload warning */}
              {deloadStatus.needsDeload && (
                <View style={[styles.deloadBanner, deloadStatus.severity === 'urgent' && styles.deloadBannerUrgent]}>
                  <AlertTriangle
                    size={13}
                    color={deloadStatus.severity === 'urgent' ? '#FF4B4B' : '#FBBF24'}
                    strokeWidth={2.5}
                  />
                  <Text style={[styles.deloadText, deloadStatus.severity === 'urgent' && styles.deloadTextUrgent]}>
                    {deloadStatus.messageFr}
                  </Text>
                </View>
              )}

              {exercisePreview.length > 0 && (
                <View style={styles.exercisePreviewList}>
                  {exercisePreview.map((ex) => {
                    const icon = BODY_ICONS[ex.bodyPart] || DEFAULT_BODY_ICON;
                    return (
                      <View key={ex.id} style={styles.exercisePreviewRow}>
                        <View style={[styles.exerciseBadge, { backgroundColor: icon.bg }]}>
                          <icon.Icon size={12} color={icon.color} strokeWidth={2.5} />
                        </View>
                        <Text style={styles.exercisePreviewName} numberOfLines={1}>
                          {ex.nameFr}
                        </Text>
                        <Text style={styles.exercisePreviewMeta}>
                          {ex.sets}×{ex.minReps && ex.minReps !== ex.maxReps
                            ? `${ex.minReps}-${ex.maxReps}`
                            : ex.maxReps}
                        </Text>
                      </View>
                    );
                  })}
                  {todayDay.exercises.length > 3 && (
                    <Text style={styles.exerciseMoreText}>
                      +{todayDay.exercises.length - 3} exercices
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Mesocycle bar */}
          <View style={styles.mesoBar}>
            {program.weeks.map((week) => {
              const weekDays = week.days.length;
              const completedInWeek = activeState.completedDays.filter(
                (k) => k.startsWith(`${week.weekNumber}-`)
              ).length;
              const isCurrentWeek = week.weekNumber === activeState.currentWeek;
              const weekComplete = completedInWeek >= weekDays;
              const hasProgress = completedInWeek > 0 && !weekComplete;

              return (
                <View
                  key={week.weekNumber}
                  style={[
                    styles.mesoSegment,
                    weekComplete && !week.isDeload && styles.mesoSegmentDone,
                    weekComplete && week.isDeload && styles.mesoSegmentDeload,
                    isCurrentWeek && !weekComplete && styles.mesoSegmentCurrent,
                    hasProgress && isCurrentWeek && {
                      backgroundColor: `rgba(255,107,53,${0.15 + (completedInWeek / weekDays) * 0.35})`,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Bottom CTA */}
          {!isDayDone && todayDay && (
            <Animated.View style={[styles.startButtonWrap, pulseStyle]}>
              <AnimatedStartButton
                onPress={handleStart}
                label={i18n.t('activeProgram.start')}
                style={styles.startButton}
                iconSize={14}
              />
            </Animated.View>
          )}
          {isDayDone && (
            <View style={styles.doneRow}>
              <Check size={14} color={Colors.success} strokeWidth={2.5} />
              <Text style={styles.doneText}>{i18n.t('activeProgram.sessionDone')}</Text>
            </View>
          )}
        </PressableScale>
      </View>

      <ConfirmModal
        visible={showPacingWarning}
        onClose={() => setShowPacingWarning(false)}
        icon={<Clock size={28} color="#FBBF24" />}
        iconBgColor="rgba(251,191,36,0.12)"
        title={i18n.t('activeProgram.alreadyTrainedTitle')}
        description={i18n.t('activeProgram.alreadyTrainedMessage')}
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
    </>
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
    padding: 16,
    gap: 16,
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: 'rgba(255,107,53,0.12)',
  },

  // ─── Section header (shared by CTA + complete states) ───
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: 'rgba(200,200,210,1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  // ─── CTA Button ───
  ghostCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.25)',
    backgroundColor: 'rgba(255,107,53,0.06)',
  },
  ghostCtaText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // ─── Complete State ───
  completeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trophyWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTextWrap: {
    flex: 1,
    gap: 2,
  },
  completeTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  completeSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  completeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  completeStat: {
    alignItems: 'center',
    gap: 2,
  },
  completeStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  completeStatLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completeStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // ─── Active State ───
  sessionHeader: {
    gap: 10,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  sessionMeta: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    paddingLeft: 16,
  },

  exercisePreviewList: {
    gap: 6,
    paddingLeft: 16,
  },
  exercisePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exercisePreviewName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },
  exercisePreviewMeta: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  exerciseMoreText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    paddingLeft: 32,
  },

  // Mesocycle bar
  mesoBar: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
  },
  mesoSegment: {
    flex: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  mesoSegmentDone: {
    backgroundColor: Colors.primary,
  },
  mesoSegmentDeload: {
    backgroundColor: '#3B82F6',
  },
  mesoSegmentCurrent: {
    backgroundColor: 'rgba(255,107,53,0.25)',
  },

  // Bottom CTA
  startButtonWrap: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    color: '#0C0C0C',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  doneText: {
    color: Colors.success,
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // ─── Missed Day State ───
  missedNudge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  missedNudgeAccent: {
    width: 3,
    height: 16,
    borderRadius: 1.5,
    marginTop: 1,
  },
  missedNudgeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 18,
  },
  missedOptions: {
    gap: 6,
  },
  missedOptionBtn: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  missedOptionBtnRecommended: {
    borderColor: 'rgba(255,107,53,0.2)',
    backgroundColor: 'rgba(255,107,53,0.04)',
  },
  missedOptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  missedOptionContent: {
    flex: 1,
    gap: 2,
  },
  missedOptionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  missedOptionLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  missedOptionRecBadge: {
    color: Colors.primary,
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  missedOptionDesc: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 16,
  },

  // Deload banner
  deloadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 16,
  },
  deloadBannerUrgent: {
    backgroundColor: 'rgba(255,75,75,0.08)',
  },
  deloadText: {
    flex: 1,
    color: '#FBBF24',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 16,
  },
  deloadTextUrgent: {
    color: '#FF4B4B',
  },
});
