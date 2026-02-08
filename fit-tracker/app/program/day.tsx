import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Play,
  Repeat,
  Timer,
  Weight,
  Check,
  Zap,
  Target,
  Minus,
  Plus,
  RotateCcw,
  Clock,
  Calendar,
  TrendingUp,
} from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import { useProgramStore } from '@/stores/programStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getExerciseById } from '@/data/exercises';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { ConfirmModal } from '@/components/program/ConfirmModal';
import { ExerciseSwapSheet } from '@/components/program/ExerciseSwapSheet';
import { ReadinessCheck } from '@/components/program/ReadinessCheck';
import { SessionFeedback } from '@/components/program/SessionFeedback';
import { MUSCLE_LABELS_FR } from '@/lib/muscleMapping';
import { estimateDuration, isCompound, getOverloadSuggestions } from '@/lib/programGenerator';
import { buildProgramExercisesParam } from '@/lib/programSession';
import type { ProgramExercise } from '@/types/program';

// Focus color mapping
const FOCUS_COLORS: Record<string, { bg: string; text: string }> = {
  push: { bg: 'rgba(255,107,53,0.12)', text: '#FF6B35' },
  pull: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6' },
  legs: { bg: 'rgba(74,222,128,0.12)', text: '#4ADE80' },
  upper: { bg: 'rgba(255,107,53,0.12)', text: '#FF6B35' },
  lower: { bg: 'rgba(74,222,128,0.12)', text: '#4ADE80' },
  full_body: { bg: 'rgba(168,85,247,0.12)', text: '#A855F7' },
};

export default function ProgramDayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ week: string; day: string }>();
  const weekNum = parseInt(params.week || '1', 10);
  const dayIdx = parseInt(params.day || '0', 10);

  const {
    program, activeState, overrideExercise, resetExerciseOverrides,
    swapExercise, saveSessionFeedback, saveReadiness,
  } = useProgramStore();
  const startSession = useWorkoutStore((s) => s.startSession);
  const history = useWorkoutStore((s) => s.history);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showPacingWarning, setShowPacingWarning] = useState(false);
  const [showSwapSheet, setShowSwapSheet] = useState(false);
  const [swapExerciseIndex, setSwapExerciseIndex] = useState<number | null>(null);
  const [showReadiness, setShowReadiness] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

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
  const isToday =
    weekNum === activeState.currentWeek &&
    dayIdx === activeState.currentDayIndex;

  const isFutureDay = weekNum > activeState.currentWeek ||
    (weekNum === activeState.currentWeek && dayIdx > activeState.currentDayIndex);
  const isPastIncomplete = !isDone && !isToday && !isFutureDay;

  const totalSets = useMemo(
    () => day.exercises.reduce((sum, e) => sum + e.sets, 0),
    [day.exercises]
  );

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

  const focusStyle = FOCUS_COLORS[day.focus] || { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.6)' };

  const handleStart = useCallback(() => {
    if (isLastCompletionToday && !isDone) {
      setShowPacingWarning(true);
      return;
    }
    setShowReadiness(true);
  }, [isLastCompletionToday, isDone]);

  const startSessionNow = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const workoutId = `program_${program.id}_w${weekNum}_d${dayIdx}`;
    const sessionId = startSession(workoutId, day.labelFr, {
      programId: program.id,
      programWeek: weekNum,
      programDayIndex: dayIdx,
    });
    router.push({
      pathname: '/workout/session',
      params: {
        workoutId,
        sessionId,
        workoutName: day.labelFr,
        exercises: buildProgramExercisesParam(day),
      },
    });
  }, [program, weekNum, dayIdx, day]);

  const handleEditField = (exerciseIdx: number, field: keyof ProgramExercise, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const pex = day.exercises[exerciseIdx];
    if (!pex) return;

    let newValue: number;
    switch (field) {
      case 'sets':
        newValue = Math.max(1, pex.sets + delta);
        break;
      case 'reps':
        newValue = Math.max(1, pex.reps + delta);
        break;
      case 'suggestedWeight': {
        const ex = getExerciseById(pex.exerciseId);
        const step = (ex?.equipment === 'barbell' || ex?.equipment === 'ez bar' || ex?.equipment === 'smith machine') ? 2.5 : 2;
        newValue = Math.max(0, (pex.suggestedWeight || 0) + delta * step);
        break;
      }
      case 'restTime':
        newValue = Math.max(15, pex.restTime + delta * 15);
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

  const renderExercise = (pex: ProgramExercise, globalIdx: number, isLast: boolean) => {
    const ex = getExerciseById(pex.exerciseId);
    if (!ex) return null;
    const compound = isCompound(pex.exerciseId);
    const isEditing = editingIndex === globalIdx;
    const suggestion = suggestions[pex.exerciseId];
    const lastPerf = lastPerformance[pex.exerciseId];

    return (
      <View key={`${pex.exerciseId}-${globalIdx}`}>
        <Pressable
          style={[styles.exRow, isEditing && styles.exRowEditing]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setEditingIndex(isEditing ? null : globalIdx);
          }}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setSwapExerciseIndex(globalIdx);
            setShowSwapSheet(true);
          }}
        >
          {/* Exercise number */}
          <View style={[styles.exNumber, compound && styles.exNumberCompound]}>
            <Text style={[styles.exNumberText, compound && styles.exNumberTextCompound]}>
              {String(globalIdx + 1).padStart(2, '0')}
            </Text>
          </View>

          <ExerciseIcon
            exerciseName={ex.name}
            bodyPart={ex.bodyPart}
            gifUrl={ex.gifUrl}
            size={20}
            containerSize={44}
          />

          <View style={styles.exInfo}>
            <Text style={styles.exName} numberOfLines={1}>
              {ex.nameFr}
            </Text>

            {lastPerf && (
              <Text style={styles.lastPerfText}>
                Derniere fois : {lastPerf.weight > 0 ? `${lastPerf.weight}kg x ` : ''}{lastPerf.reps} reps
              </Text>
            )}

            <View style={styles.exMeta}>
              <View style={styles.exMetaPill}>
                <Repeat size={10} color="rgba(255,255,255,0.4)" />
                <Text style={styles.exMetaText}>
                  {pex.sets} x {pex.reps}
                </Text>
              </View>
              {pex.suggestedWeight != null && pex.suggestedWeight > 0 && (
                <View style={[styles.exMetaPill, styles.exWeightPill]}>
                  <Weight size={10} color={Colors.primary} />
                  <Text style={[styles.exMetaText, styles.exWeightText]}>
                    {pex.suggestedWeight}kg
                  </Text>
                </View>
              )}
              <View style={styles.exMetaPill}>
                <Timer size={10} color="rgba(255,255,255,0.4)" />
                <Text style={styles.exMetaText}>{pex.restTime}s</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Inline editor */}
        {isEditing && (
          <View style={styles.editorPanel}>
            {/* Overload suggestion in editor */}
            {suggestion && (
              <View style={styles.overloadRow}>
                <TrendingUp size={12} color={Colors.primary} />
                <Text style={styles.overloadText}>Suggestion : essaie {suggestion}</Text>
              </View>
            )}

            <Text style={styles.editorLabel}>Valeurs suggerees — ajuste selon ton ressenti</Text>

            <View style={styles.editorRow}>
              <Text style={styles.editorFieldLabel}>Series</Text>
              <View style={styles.stepperRow}>
                <Pressable style={styles.stepperBtn} onPress={() => handleEditField(globalIdx, 'sets', -1)}>
                  <Minus size={14} color="#fff" />
                </Pressable>
                <Text style={styles.stepperValue}>{pex.sets}</Text>
                <Pressable style={styles.stepperBtn} onPress={() => handleEditField(globalIdx, 'sets', 1)}>
                  <Plus size={14} color="#fff" />
                </Pressable>
              </View>
            </View>

            <View style={styles.editorRow}>
              <Text style={styles.editorFieldLabel}>Reps</Text>
              <View style={styles.stepperRow}>
                <Pressable style={styles.stepperBtn} onPress={() => handleEditField(globalIdx, 'reps', -1)}>
                  <Minus size={14} color="#fff" />
                </Pressable>
                <Text style={styles.stepperValue}>{pex.reps}</Text>
                <Pressable style={styles.stepperBtn} onPress={() => handleEditField(globalIdx, 'reps', 1)}>
                  <Plus size={14} color="#fff" />
                </Pressable>
              </View>
            </View>

            {(pex.suggestedWeight || 0) >= 0 && (
              <View style={styles.editorRow}>
                <Text style={styles.editorFieldLabel}>Charge (kg)</Text>
                <View style={styles.stepperRow}>
                  <Pressable style={styles.stepperBtn} onPress={() => handleEditField(globalIdx, 'suggestedWeight', -1)}>
                    <Minus size={14} color="#fff" />
                  </Pressable>
                  <Text style={styles.stepperValue}>{pex.suggestedWeight || 0}</Text>
                  <Pressable style={styles.stepperBtn} onPress={() => handleEditField(globalIdx, 'suggestedWeight', 1)}>
                    <Plus size={14} color="#fff" />
                  </Pressable>
                </View>
              </View>
            )}

            <View style={styles.editorRow}>
              <Text style={styles.editorFieldLabel}>Repos (s)</Text>
              <View style={styles.stepperRow}>
                <Pressable style={styles.stepperBtn} onPress={() => handleEditField(globalIdx, 'restTime', -1)}>
                  <Minus size={14} color="#fff" />
                </Pressable>
                <Text style={styles.stepperValue}>{pex.restTime}</Text>
                <Pressable style={styles.stepperBtn} onPress={() => handleEditField(globalIdx, 'restTime', 1)}>
                  <Plus size={14} color="#fff" />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={styles.resetButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                resetExerciseOverrides(weekNum, dayIdx, globalIdx);
              }}
            >
              <RotateCcw size={12} color="rgba(255,255,255,0.4)" />
              <Text style={styles.resetText}>Reinitialiser</Text>
            </Pressable>
          </View>
        )}

        {/* Separator between exercises (not after last) */}
        {!isEditing && !isLast && <View style={styles.exSeparator} />}
      </View>
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
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>{day.labelFr}</Text>
              <View style={[styles.focusTag, { backgroundColor: focusStyle.bg }]}>
                <Text style={[styles.focusTagText, { color: focusStyle.text }]}>
                  {day.focus}
                </Text>
              </View>
            </View>
            <Text style={styles.headerSub}>Semaine {weekNum}</Text>
          </View>
          {isDone && (
            <View style={styles.doneBadge}>
              <Check size={14} color={Colors.success} strokeWidth={3} />
              <Text style={styles.doneBadgeText}>Fait</Text>
            </View>
          )}
          {isToday && !isDone && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Aujourd'hui</Text>
            </View>
          )}
          {isFutureDay && (
            <View style={styles.futureBadge}>
              <Calendar size={12} color="rgba(255,255,255,0.4)" />
              <Text style={styles.futureBadgeText}>Planifie</Text>
            </View>
          )}
        </View>

        {/* Inline metrics strip (no card) */}
        <View style={styles.metricsStrip}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{day.exercises.length}</Text>
            <Text style={styles.metricLabel}>exercices</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{totalSets}</Text>
            <Text style={styles.metricLabel}>series</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>~{duration}</Text>
            <Text style={styles.metricLabel}>minutes</Text>
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
                {MUSCLE_LABELS_FR[m] || m}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Exercise list */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Compound exercises */}
          {compounds.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <Zap size={12} color={Colors.primary} />
                </View>
                <Text style={styles.sectionLabel}>COMPOSES</Text>
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
                <Text style={styles.sectionLabel}>ISOLATION</Text>
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
                Semaine de deload : volume reduit pour favoriser la recuperation et la supercompensation.
              </Text>
            </View>
          )}

          {day.exercises.some((e) => e.suggestedWeight && e.suggestedWeight > 0) && (
            <View style={styles.weightNote}>
              <Weight size={13} color="rgba(255,107,53,0.6)" />
              <Text style={styles.weightNoteText}>
                Les charges sont estimees a partir de ton poids de corps. Ajuste selon ton ressenti.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA — contextual */}
        {isDone && (
          <View style={styles.bottomCta}>
            <View style={styles.doneBar}>
              <Check size={16} color={Colors.success} strokeWidth={2.5} />
              <Text style={styles.doneBarText}>Seance terminee</Text>
            </View>
          </View>
        )}
        {isToday && !isDone && (
          <View style={styles.bottomCta}>
            <Pressable style={styles.startButton} onPress={handleStart}>
              <Play size={18} color="#0C0C0C" fill="#0C0C0C" />
              <Text style={styles.startText}>Commencer</Text>
            </Pressable>
            <Text style={styles.ctaMicro}>~{duration} min · {totalSets} series</Text>
          </View>
        )}
        {isPastIncomplete && (
          <View style={styles.bottomCta}>
            <Pressable style={styles.catchUpButton} onPress={handleStart}>
              <Play size={18} color="#0C0C0C" fill="#0C0C0C" />
              <Text style={styles.startText}>Rattraper cette seance</Text>
            </Pressable>
            <Text style={styles.ctaMicroSubtle}>Seance planifiee precedemment</Text>
          </View>
        )}
        {isFutureDay && !isDone && (
          <View style={styles.bottomCta}>
            <View style={styles.plannedBar}>
              <Calendar size={14} color="rgba(255,255,255,0.4)" />
              <Text style={styles.plannedText}>Planifie</Text>
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
        title="Deja une seance aujourd'hui"
        description="Tu as deja termine une seance aujourd'hui. La recuperation est essentielle pour la progression."
        cancelText="Reporter"
        confirmText="Continuer"
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
          startSessionNow();
        }}
        onSkip={() => {
          setShowReadiness(false);
          startSessionNow();
        }}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  focusTag: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  focusTagText: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    textTransform: 'capitalize',
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
    paddingBottom: 120,
  },

  // Exercise rows (no card bg)
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  exRowEditing: {
    backgroundColor: 'rgba(255,107,53,0.04)',
    borderRadius: 14,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 10,
    marginHorizontal: -10,
  },
  exSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 82,
  },
  exNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exNumberCompound: {
    backgroundColor: 'rgba(255,107,53,0.1)',
  },
  exNumberText: {
    color: 'rgba(120,120,130,1)',
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  exNumberTextCompound: {
    color: Colors.primary,
  },
  exInfo: {
    flex: 1,
    gap: 4,
  },
  exName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  lastPerfText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  exMeta: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  exMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  exWeightPill: {
    backgroundColor: 'rgba(255,107,53,0.1)',
  },
  exMetaText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  exWeightText: {
    color: Colors.primary,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Overload (inside editor now)
  overloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,107,53,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
  },
  overloadText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Inline editor
  editorPanel: {
    backgroundColor: 'rgba(255,107,53,0.04)',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(255,107,53,0.15)',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 14,
    marginHorizontal: -10,
    gap: 10,
  },
  editorLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginBottom: 2,
  },
  editorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editorFieldLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  resetText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
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
  startText: {
    color: '#0C0C0C',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
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
