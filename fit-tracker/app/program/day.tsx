import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Weight,
  Check,
  Zap,
  Target,
  Clock,
  Calendar,
  AlertTriangle,
} from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { useProgramStore } from '@/stores/programStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getExerciseById } from '@/data/exercises';
import { ExerciseRow } from '@/components/exercises/ExerciseRow';
import { ConfirmModal } from '@/components/program/ConfirmModal';
import { ExerciseSwapSheet } from '@/components/program/ExerciseSwapSheet';
import { ExerciseInfoSheet } from '@/components/ExerciseInfoSheet';
import { ReadinessCheck } from '@/components/program/ReadinessCheck';
import { SessionFeedback } from '@/components/program/SessionFeedback';
import { AnimatedStartButton } from '@/components/ui/AnimatedStartButton';
import { getMuscleLabel } from '@/lib/muscleMapping';
import { estimateDuration, isCompound, getOverloadSuggestions } from '@/lib/programGenerator';
import { buildProgramExercisesParam } from '@/lib/programSession';
import { getProgressiveWeight, getEstimatedWeight } from '@/lib/weightEstimation';
import { resolveDayLabel } from '@/lib/programLabels';
import { computeSessionInsights } from '@/lib/sessionInsights';
import { SessionInsights } from '@/components/program/SessionInsights';
import { computeReadinessScore, computeSessionAdjustments, applyAdjustmentsToExercises } from '@/lib/readinessEngine';
import { checkDeloadStatus } from '@/lib/deloadDetection';
import { getTodayISO } from '@/lib/scheduleEngine';
import type { ProgramExercise } from '@/types/program';

// Focus color mapping
export default function ProgramDayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ week: string; day: string }>();
  const weekNum = parseInt(params.week || '1', 10);
  const dayIdx = parseInt(params.day || '0', 10);

  const {
    program, activeState, overrideExercise, resetExerciseOverrides,
    swapExercise, saveSessionFeedback, saveReadiness,
  } = useProgramStore();
  const startSession = useWorkoutStore((s) => s.startSession);
  const saveSessionReadiness = useWorkoutStore((s) => s.saveSessionReadiness);
  const history = useWorkoutStore((s) => s.history);

  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [manualOverloads, setManualOverloads] = useState<Record<string, 'bump' | 'hold' | 'drop'>>({});
  const [showPacingWarning, setShowPacingWarning] = useState(false);
  const [showSwapSheet, setShowSwapSheet] = useState(false);
  const [swapExerciseIndex, setSwapExerciseIndex] = useState<number | null>(null);
  const [showReadiness, setShowReadiness] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [infoExercise, setInfoExercise] = useState<import('@/types').Exercise | null>(null);

  if (!program || !activeState) {
    router.replace('/program/onboarding');
    return null;
  }

  const weekData = program.weeks.find((w) => w.weekNumber === weekNum);
  const day = weekData?.days[dayIdx];

  if (!day) {
    router.back();
    return null;
  }

  const duration = useMemo(() => estimateDuration(day), [day]);
  const isDone = activeState.completedDays.includes(`${weekNum}-${dayIdx}`);

  // Determine isToday from the schedule's planned date (not just program index)
  const todayISO = getTodayISO();
  const scheduledDay = activeState.schedule?.scheduledDays.find(
    (sd) => sd.weekNumber === weekNum && sd.dayIndex === dayIdx,
  );
  const isToday = scheduledDay
    ? scheduledDay.plannedDate === todayISO
    : weekNum === activeState.currentWeek && dayIdx === activeState.currentDayIndex;

  const isFutureDay = scheduledDay
    ? scheduledDay.plannedDate > todayISO
    : weekNum > activeState.currentWeek ||
      (weekNum === activeState.currentWeek && dayIdx > activeState.currentDayIndex);
  const isPastIncomplete = !isDone && !isToday && !isFutureDay;

  const totalSets = useMemo(
    () => day.exercises.reduce((sum, e) => sum + e.sets, 0),
    [day.exercises]
  );

  // Week-level RIR (same for all exercises in a week)
  const weekRir = day.exercises[0]?.targetRir;

  // Split exercises into compounds and isolations
  const { compounds, isolations } = useMemo(() => {
    const c: { pex: ProgramExercise; idx: number }[] = [];
    const iso: { pex: ProgramExercise; idx: number }[] = [];
    day.exercises.forEach((pex, idx) => {
      if (isCompound(pex.exerciseId)) {
        c.push({ pex, idx });
      } else {
        iso.push({ pex, idx });
      }
    });
    return { compounds: c, isolations: iso };
  }, [day.exercises]);

  // Overload suggestions
  const suggestions = useMemo(() => {
    const relevant = history
      .filter((s) => s.completedExercises && s.completedExercises.length > 0)
      .flatMap((s) =>
        s.completedExercises.map((e) => ({
          exerciseId: e.exerciseId,
          sets: e.sets.map((set) => ({
            reps: set.reps,
            weight: set.weight,
            completed: set.completed,
          })),
        }))
      );
    return getOverloadSuggestions(relevant, day);
  }, [history, day]);

  // Last performance — O(n) index-based lookup (fixed from O(n*m))
  const lastPerformance = useMemo(() => {
    const index = new Map<string, { weight: number; reps: number }>();
    const targetIds = new Set(day.exercises.map((e) => e.exerciseId));

    for (const session of history) {
      if (!session.completedExercises) continue;
      for (const found of session.completedExercises) {
        if (!targetIds.has(found.exerciseId)) continue;
        if (index.has(found.exerciseId)) continue;
        const completedSets = found.sets.filter((s) => s.completed);
        if (completedSets.length > 0) {
          index.set(found.exerciseId, {
            weight: completedSets[0].weight || 0,
            reps: completedSets[0].reps,
          });
        }
      }
      if (index.size >= targetIds.size) break;
    }

    return Object.fromEntries(index);
  }, [history, day.exercises]);

  // Pacing guard
  const isLastCompletionToday = useMemo(() => {
    if (!activeState.lastCompletedAt) return false;
    const last = new Date(activeState.lastCompletedAt);
    const now = new Date();
    return last.toDateString() === now.toDateString();
  }, [activeState.lastCompletedAt]);

  // Session insights — volume impact
  const insightsData = useMemo(
    () => computeSessionInsights(day, history),
    [day, history],
  );

  // Deload detection
  const deloadStatus = useMemo(
    () => checkDeloadStatus(history),
    [history],
  );

  // Progressive overload — recalculate weights from history
  const progressiveWeights = useMemo(() => {
    const map: Record<string, { weight: number; action: 'bump' | 'hold' | 'drop' | 'none'; lastWeight: number }> = {};
    for (const pex of day.exercises) {
      const ex = getExerciseById(pex.exerciseId);
      if (!ex) continue;
      const prog = getProgressiveWeight(
        pex.exerciseId,
        ex.equipment,
        pex.minReps || pex.reps,
        history,
      );
      if (prog.action !== 'none') {
        map[pex.exerciseId] = prog;
      } else if ((pex.suggestedWeight || 0) === 0 && program.userProfile) {
        // No history + no weight → estimate from BW
        const estimated = getEstimatedWeight(
          pex.exerciseId,
          ex.equipment,
          ex.target,
          program.userProfile.weight,
          program.userProfile.sex,
          program.userProfile.experience || 'intermediate',
        );
        if (estimated > 0) {
          map[pex.exerciseId] = { weight: estimated, action: 'none', lastWeight: 0 };
        }
      }
    }
    return map;
  }, [day.exercises, history, program.userProfile]);

  const handleStart = useCallback(() => {
    if (isLastCompletionToday && !isDone) {
      setShowPacingWarning(true);
      return;
    }
    setShowReadiness(true);
  }, [isLastCompletionToday, isDone]);

  const startSessionNow = useCallback((readiness?: import('@/types/program').ReadinessCheck) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const workoutId = `program_${program.id}_w${weekNum}_d${dayIdx}`;
    const sessionId = startSession(workoutId, resolveDayLabel(day), {
      programId: program.id,
      programWeek: weekNum,
      programDayIndex: dayIdx,
    });
    if (readiness) {
      saveSessionReadiness(sessionId, readiness);
    }

    let exercisesJson = buildProgramExercisesParam(day, progressiveWeights);

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
        workoutName: resolveDayLabel(day),
        exercises: exercisesJson,
      },
    });
  }, [program, weekNum, dayIdx, day, progressiveWeights]);

  const handleEditField = (exerciseIdx: number, field: keyof ProgramExercise, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const pex = day.exercises[exerciseIdx];
    if (!pex) return;

    let newValue: number;
    switch (field) {
      case 'sets':
        newValue = Math.max(1, pex.sets + delta);
        break;
      case 'maxReps':
        newValue = Math.max(1, (pex.maxReps || pex.reps) + delta);
        overrideExercise(weekNum, dayIdx, exerciseIdx, { maxReps: newValue, reps: newValue });
        return;
      case 'suggestedWeight': {
        const ex = getExerciseById(pex.exerciseId);
        const step = (ex?.equipment === 'barbell' || ex?.equipment === 'ez bar' || ex?.equipment === 'smith machine') ? 2.5 : 2;
        newValue = Math.max(0, (pex.suggestedWeight || 0) + delta * step);
        // Update overload badge based on manual weight vs last session
        const prog = progressiveWeights[pex.exerciseId];
        if (prog && prog.lastWeight > 0) {
          const action = newValue > prog.lastWeight ? 'bump'
            : newValue < prog.lastWeight ? 'drop' : 'hold';
          setManualOverloads((prev) => ({ ...prev, [pex.exerciseId]: action }));
        }
        break;
      }
      case 'restTime':
        newValue = Math.max(15, pex.restTime + delta * 15);
        break;
      case 'setTime':
        newValue = Math.max(10, (pex.setTime || 35) + delta * 5);
        break;
      default:
        return;
    }

    overrideExercise(weekNum, dayIdx, exerciseIdx, { [field]: newValue });
  };

  // Swap exercise target muscle
  const swapMuscleTargets = useMemo(() => {
    if (swapExerciseIndex === null) return [];
    return day.muscleTargets;
  }, [swapExerciseIndex, day.muscleTargets]);

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
        if (editingIndex === idx) setEditingIndex(null);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const toggleEdit = (idx: number) => {
    setEditingIndex(editingIndex === idx ? null : idx);
  };

  const renderExercise = (pex: ProgramExercise, globalIdx: number, isLast: boolean) => {
    const ex = getExerciseById(pex.exerciseId);
    if (!ex) return null;
    const suggestion = suggestions[pex.exerciseId];
    const lastPerf = lastPerformance[pex.exerciseId];
    const progWeight = progressiveWeights[pex.exerciseId];
    const displayWeight = progWeight && progWeight.action !== 'none'
      ? progWeight.weight
      : (pex.suggestedWeight || 0);
    const overloadAction =
      (manualOverloads[pex.exerciseId] || progWeight?.action || 'none') as 'bump' | 'hold' | 'drop' | 'none';

    return (
      <ExerciseRow
        key={`${pex.exerciseId}-${globalIdx}`}
        index={globalIdx}
        exerciseName={ex.nameFr}
        exerciseIconName={ex.name}
        bodyPart={ex.bodyPart}
        gifUrl={ex.gifUrl}
        sets={pex.sets}
        reps={pex.maxReps || pex.reps}
        minReps={pex.minReps && pex.minReps !== (pex.maxReps || pex.reps) ? pex.minReps : undefined}
        weight={displayWeight}
        restTime={pex.restTime}
        setTime={pex.setTime}
        overloadAction={overloadAction}
        lastPerformance={lastPerf}
        overloadMessages={{
          bump: i18n.t('programDay.overloadBump', { weight: displayWeight }),
          drop: i18n.t('programDay.overloadDrop'),
          hold: i18n.t('programDay.overloadHold'),
          suggestion: suggestion ? i18n.t('programDay.suggestion', { suggestion }) : undefined,
        }}
        editorTip={i18n.t('programDay.adjustTip')}
        editorWeight={pex.suggestedWeight || 0}
        showMinRepsHint={pex.minReps > 0 && pex.minReps !== (pex.maxReps || pex.reps) ? { min: pex.minReps } : undefined}
        isExpanded={expandedIndices.has(globalIdx)}
        isEditing={editingIndex === globalIdx}
        isLast={isLast}
        onToggleExpand={() => toggleExpand(globalIdx)}
        onToggleEdit={() => toggleEdit(globalIdx)}
        onEditField={(field, delta) => {
          // Map ExerciseRow field names to ProgramExercise fields
          const fieldMap: Record<string, keyof ProgramExercise> = {
            sets: 'sets',
            reps: 'maxReps',
            weight: 'suggestedWeight',
            restTime: 'restTime',
            setTime: 'setTime',
          };
          const pexField = fieldMap[field];
          if (pexField) handleEditField(globalIdx, pexField, delta);
        }}
        onInfoPress={() => setInfoExercise(ex)}
        onLongPress={() => {
          setSwapExerciseIndex(globalIdx);
          setShowSwapSheet(true);
        }}
        onReset={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          resetExerciseOverrides(weekNum, dayIdx, globalIdx);
        }}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.orbOrange} pointerEvents="none" />
      <View style={styles.orbBlue} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#fff" strokeWidth={2} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{resolveDayLabel(day)}</Text>
            <Text style={styles.headerSub}>{i18n.t('programDay.weekLabel', { week: weekNum })}</Text>
          </View>
          {isDone && (
            <View style={styles.doneBadge}>
              <Check size={14} color={Colors.success} strokeWidth={3} />
              <Text style={styles.doneBadgeText}>{i18n.t('programDay.done')}</Text>
            </View>
          )}
          {isToday && !isDone && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>{i18n.t('programDay.today')}</Text>
            </View>
          )}
          {isFutureDay && (
            <View style={styles.futureBadge}>
              <Calendar size={12} color="rgba(255,255,255,0.4)" />
              <Text style={styles.futureBadgeText}>{i18n.t('programDay.planned')}</Text>
            </View>
          )}
        </View>

        {/* Inline metrics strip (no card) */}
        <View style={styles.metricsStrip}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{day.exercises.length}</Text>
            <Text style={styles.metricLabel}>{i18n.t('programDay.exercisesCount')}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{totalSets}</Text>
            <Text style={styles.metricLabel}>{i18n.t('programDay.setsCount')}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>~{duration}</Text>
            <Text style={styles.metricLabel}>{i18n.t('programDay.minutes')}</Text>
          </View>
        </View>

        {/* Muscle pills — horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.muscleScroll}
          contentContainerStyle={styles.muscleScrollContent}
        >
          {day.muscleTargets.map((m) => (
            <Pressable
              key={m}
              style={styles.musclePill}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/volume/${m}`);
              }}
            >
              <Text style={styles.musclePillText}>
                {getMuscleLabel(m)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Exercise list */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Session insights panel */}
          {!isDone && <SessionInsights data={insightsData} />}

          {/* Deload warning banner */}
          {deloadStatus.needsDeload && (
            <View style={[
              styles.deloadBanner,
              deloadStatus.severity === 'urgent' && styles.deloadBannerUrgent,
            ]}>
              <AlertTriangle
                size={14}
                color={deloadStatus.severity === 'urgent' ? '#EF4444' : '#FBBF24'}
              />
              <Text style={[
                styles.deloadBannerText,
                deloadStatus.severity === 'urgent' && styles.deloadBannerTextUrgent,
              ]}>
                {deloadStatus.messageFr}
              </Text>
            </View>
          )}

          {/* Compound exercises */}
          {compounds.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <Zap size={12} color={Colors.primary} />
                </View>
                <Text style={styles.sectionLabel}>{i18n.t('programDay.compounds')}</Text>
                {weekRir != null && (
                  <View style={styles.sectionRirBadge}>
                    <Text style={styles.sectionRirText}>{i18n.t('workoutSession.rirLabel')} {weekRir}</Text>
                  </View>
                )}
                <View style={styles.sectionLine} />
                <Text style={styles.sectionCount}>{compounds.length}</Text>
              </View>
              {compounds.map(({ pex, idx }, i) =>
                renderExercise(pex, idx, i === compounds.length - 1 && isolations.length === 0)
              )}
            </>
          )}

          {/* Isolation exercises */}
          {isolations.length > 0 && (
            <>
              <View style={[styles.sectionHeader, compounds.length > 0 && { marginTop: 20 }]}>
                <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(168,85,247,0.1)' }]}>
                  <Target size={12} color="#A855F7" />
                </View>
                <Text style={styles.sectionLabel}>{i18n.t('programDay.isolation')}</Text>
                {weekRir != null && compounds.length === 0 && (
                  <View style={styles.sectionRirBadge}>
                    <Text style={styles.sectionRirText}>{i18n.t('workoutSession.rirLabel')} {weekRir}</Text>
                  </View>
                )}
                <View style={styles.sectionLine} />
                <Text style={styles.sectionCount}>{isolations.length}</Text>
              </View>
              {isolations.map(({ pex, idx }, i) =>
                renderExercise(pex, idx, i === isolations.length - 1)
              )}
            </>
          )}

          {weekData?.isDeload && (
            <View style={styles.deloadNote}>
              <Text style={styles.deloadNoteText}>
                {i18n.t('programDay.deloadBanner')}
              </Text>
            </View>
          )}

          {day.exercises.some((e) => e.suggestedWeight && e.suggestedWeight > 0) && (
            <View style={styles.weightNote}>
              <Weight size={13} color="rgba(255,107,53,0.6)" />
              <Text style={styles.weightNoteText}>
                {i18n.t('programDay.estimatedWeightTip')}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA — contextual */}
        {isDone && (
          <View style={styles.bottomCta}>
            <View style={styles.doneBar}>
              <Check size={16} color={Colors.success} strokeWidth={2.5} />
              <Text style={styles.doneBarText}>{i18n.t('programDay.sessionDone')}</Text>
            </View>
          </View>
        )}
        {isToday && !isDone && (
          <View style={styles.bottomCta}>
            <AnimatedStartButton
              onPress={handleStart}
              label={i18n.t('programDay.startSession')}
              style={styles.startButton}
            />
            <Text style={styles.ctaMicro}>{i18n.t('programDay.sessionFormat', { duration, sets: totalSets })}</Text>
          </View>
        )}
        {isPastIncomplete && (
          <View style={styles.bottomCta}>
            <AnimatedStartButton
              onPress={handleStart}
              label={i18n.t('programDay.catchUp')}
              style={styles.catchUpButton}
            />
            <Text style={styles.ctaMicroSubtle}>{i18n.t('programDay.catchUpDesc')}</Text>
          </View>
        )}
        {isFutureDay && !isDone && (
          <View style={styles.bottomCta}>
            <View style={styles.plannedBar}>
              <Calendar size={14} color="rgba(255,255,255,0.4)" />
              <Text style={styles.plannedText}>{i18n.t('programDay.planned')}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Pacing Warning Modal */}
      <ConfirmModal
        visible={showPacingWarning}
        onClose={() => setShowPacingWarning(false)}
        icon={<Clock size={28} color="#FBBF24" />}
        iconBgColor="rgba(251,191,36,0.12)"
        title={i18n.t('workoutDetail.alreadyTrainedTitle')}
        description={i18n.t('workoutDetail.alreadyTrainedMessage')}
        cancelText={i18n.t('common.postpone')}
        confirmText={i18n.t('common.continue')}
        confirmColor={Colors.primary}
        onConfirm={() => {
          setShowPacingWarning(false);
          setShowReadiness(true);
        }}
      />

      {/* Readiness Check (pre-session) */}
      <ReadinessCheck
        visible={showReadiness}
        onSubmit={(check) => {
          saveReadiness(check);
          setShowReadiness(false);
          startSessionNow(check);
        }}
        onSkip={() => {
          setShowReadiness(false);
          startSessionNow();
        }}
        onClose={() => setShowReadiness(false)}
      />

      {/* Session Feedback (post-session) */}
      <SessionFeedback
        visible={showFeedback}
        onSubmit={(feedback) => {
          saveSessionFeedback(weekNum, dayIdx, feedback);
          setShowFeedback(false);
        }}
        onSkip={() => setShowFeedback(false)}
      />

      {/* Exercise Swap Sheet */}
      {swapExerciseIndex !== null && (
        <ExerciseSwapSheet
          visible={showSwapSheet}
          onClose={() => {
            setShowSwapSheet(false);
            setSwapExerciseIndex(null);
          }}
          currentExerciseId={day.exercises[swapExerciseIndex]?.exerciseId || ''}
          muscleTargets={swapMuscleTargets}
          equipment={program.userProfile.equipment}
          onSwap={(newId) => {
            swapExercise(weekNum, dayIdx, swapExerciseIndex, newId);
          }}
        />
      )}

      <ExerciseInfoSheet
        exercise={infoExercise}
        onClose={() => setInfoExercise(null)}
      />
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
  orbOrange: {
    position: 'absolute',
    top: -96,
    right: -96,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(249, 115, 22, 0.10)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 100,
  },
  orbBlue: {
    position: 'absolute',
    top: '50%',
    left: -128,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 120,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  headerSub: {
    color: 'rgba(120,120,130,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74,222,128,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  doneBadgeText: {
    color: Colors.success,
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  todayBadge: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  todayBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  futureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  futureBadgeText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Inline metrics strip (no card)
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    color: '#fff',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  metricLabel: {
    color: 'rgba(100,100,110,1)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Muscle horizontal scroll
  muscleScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  muscleScrollContent: {
    paddingHorizontal: 20,
    gap: 6,
  },
  musclePill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  musclePillText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255,107,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1,
  },
  sectionRirBadge: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 5,
  },
  sectionRirText: {
    color: 'rgba(59,130,246,0.7)',
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sectionCount: {
    color: 'rgba(120,120,130,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Body
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
  },

  // Deload warning banner (from deload detection engine)
  deloadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.15)',
    marginBottom: 16,
  },
  deloadBannerUrgent: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.15)',
  },
  deloadBannerText: {
    flex: 1,
    color: '#FBBF24',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    lineHeight: 17,
  },
  deloadBannerTextUrgent: {
    color: '#EF4444',
  },

  // Deload note
  deloadNote: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.12)',
    marginTop: 16,
  },
  deloadNoteText: {
    color: 'rgba(59,130,246,0.7)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 19,
  },

  // Weight note
  weightNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  weightNoteText: {
    flex: 1,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 17,
  },

  // Bottom CTA
  bottomCta: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(12,12,12,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    gap: 6,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  catchUpButton: {
    backgroundColor: 'rgba(255,107,53,0.8)',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  ctaMicro: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  ctaMicroSubtle: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  doneBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  doneBarText: {
    color: Colors.success,
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  plannedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  plannedText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
