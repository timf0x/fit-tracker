import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Repeat,
  Weight,
  Minus,
  Plus,
  Info,
  Timer,
  Bookmark,
  TrendingUp,
  Check,
} from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProgramStore } from '@/stores/programStore';
import { getExerciseById } from '@/data/exercises';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { ExerciseInfoSheet } from '@/components/ExerciseInfoSheet';
import { ExerciseSwapSheet } from '@/components/program/ExerciseSwapSheet';
import { ReadinessCheck } from '@/components/program/ReadinessCheck';
import { ConfirmModal } from '@/components/program/ConfirmModal';
import { AnimatedStartButton } from '@/components/ui/AnimatedStartButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { RECOVERY_COLORS } from '@/constants/recovery';
import {
  generateSmartWorkout,
  getAllMuscleData,
  estimateSessionSummary,
} from '@/lib/smartWorkout';
import type { GeneratedExercise } from '@/lib/smartWorkout';
import { computeWorkoutInsights } from '@/lib/sessionInsights';
import type { MuscleImpact } from '@/lib/sessionInsights';
import { MUSCLE_LABELS_FR } from '@/lib/muscleMapping';
import type { EquipmentSetup } from '@/types/program';
import type { Exercise, WorkoutExercise } from '@/types';
import type { ReadinessCheck as ReadinessCheckType } from '@/types/program';

type GeneratorStep = 'select' | 'review';

const EQUIPMENT_OPTIONS: { key: EquipmentSetup; label: string }[] = [
  { key: 'full_gym', label: 'Salle' },
  { key: 'home_dumbbell', label: 'Haltères' },
  { key: 'bodyweight', label: 'Poids du corps' },
];

const MUSCLE_GROUPS: { label: string; muscles: string[] }[] = [
  { label: 'PUSH', muscles: ['chest', 'shoulders', 'triceps'] },
  { label: 'PULL', muscles: ['upper back', 'lats', 'lower back', 'biceps', 'forearms'] },
  { label: 'JAMBES', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  { label: 'TRONC', muscles: ['abs', 'obliques'] },
];

export default function GenerateWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    suggestedMuscles?: string;
    sessionType?: string;
  }>();

  const history = useWorkoutStore((s) => s.history);
  const addCustomWorkout = useWorkoutStore((s) => s.addCustomWorkout);
  const startSession = useWorkoutStore((s) => s.startSession);
  const saveSessionReadiness = useWorkoutStore((s) => s.saveSessionReadiness);
  const userProfile = useProgramStore((s) => s.userProfile);

  // Parse suggested muscles from route params
  const initialMuscles = useMemo(() => {
    try {
      return new Set<string>(JSON.parse(params.suggestedMuscles || '[]'));
    } catch {
      return new Set<string>();
    }
  }, [params.suggestedMuscles]);

  // State
  const [step, setStep] = useState<GeneratorStep>('select');
  const [selectedMuscles, setSelectedMuscles] = useState<Set<string>>(initialMuscles);
  const [equipment, setEquipment] = useState<EquipmentSetup>(
    userProfile?.equipment || 'full_gym'
  );
  const [generatedExercises, setGeneratedExercises] = useState<GeneratedExercise[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showSwap, setShowSwap] = useState<{ index: number; exerciseId: string } | null>(null);
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);
  const [showReadiness, setShowReadiness] = useState(false);
  const [showPacingWarning, setShowPacingWarning] = useState(false);

  // All muscle data for selector
  const allMuscleData = useMemo(() => getAllMuscleData(history), [history]);

  // Live summary for selector step
  const summary = useMemo(
    () => estimateSessionSummary(Array.from(selectedMuscles), equipment),
    [selectedMuscles, equipment],
  );

  // Session label
  const sessionLabel = useMemo(() => {
    if (generatedExercises.length > 0) {
      // Derive from generated workout
      const muscles = [...new Set(generatedExercises.map((e) => e.muscle))];
      return getLabel(muscles);
    }
    return getLabel(Array.from(selectedMuscles));
  }, [generatedExercises, selectedMuscles]);

  // Session insights for review step
  const insightsData = useMemo(() => {
    if (generatedExercises.length === 0) return null;
    const asWorkoutExercises: WorkoutExercise[] = generatedExercises.map((ge) => ({
      exerciseId: ge.exerciseId,
      sets: ge.sets,
      reps: ge.reps,
      weight: ge.suggestedWeight,
      restTime: ge.restTime,
    }));
    return computeWorkoutInsights(asWorkoutExercises, history);
  }, [generatedExercises, history]);

  // Review stats
  const reviewStats = useMemo(() => {
    if (generatedExercises.length === 0) return { totalSets: 0, durationMin: 0 };
    const totalSets = generatedExercises.reduce((s, e) => s + e.sets, 0);
    const durationMin = Math.round(
      generatedExercises.reduce((s, e) => s + e.sets * (e.setTime + e.restTime), 0) / 60
    );
    return { totalSets, durationMin };
  }, [generatedExercises]);

  // Overload tips mapped by exerciseId for inline display
  const overloadTipMap = useMemo(() => {
    if (!insightsData) return {};
    const map: Record<string, string> = {};
    for (const tip of insightsData.overloadTips) {
      map[tip.exerciseId] = tip.tip;
    }
    return map;
  }, [insightsData]);

  // Map muscle data for quick lookup
  const muscleDataMap = useMemo(() => {
    const map: Record<string, (typeof allMuscleData)[0]> = {};
    for (const m of allMuscleData) map[m.muscle] = m;
    return map;
  }, [allMuscleData]);

  // Toggle muscle selection
  const toggleMuscle = useCallback((muscle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMuscles((prev) => {
      const next = new Set(prev);
      if (next.has(muscle)) next.delete(muscle);
      else next.add(muscle);
      return next;
    });
  }, []);

  // Toggle entire muscle group
  const toggleGroup = useCallback((muscles: string[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMuscles((prev) => {
      const next = new Set(prev);
      const allSelected = muscles.every((m) => next.has(m));
      if (allSelected) {
        muscles.forEach((m) => next.delete(m));
      } else {
        muscles.forEach((m) => next.add(m));
      }
      return next;
    });
  }, []);

  // Generate workout
  const handleGenerate = useCallback(() => {
    if (selectedMuscles.size === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = generateSmartWorkout({
      selectedMuscles: Array.from(selectedMuscles),
      equipment,
      history,
      userWeight: userProfile?.weight,
      userSex: userProfile?.sex,
      userExperience: userProfile?.experience,
    });

    setGeneratedExercises(result.exercises);
    setStep('review');
  }, [selectedMuscles, equipment, history, userProfile]);

  // Edit exercise field
  const handleEditField = useCallback((index: number, field: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGeneratedExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[index] };
      const exData = getExerciseById(ex.exerciseId);

      switch (field) {
        case 'sets':
          ex.sets = Math.max(1, ex.sets + delta);
          break;
        case 'reps':
          ex.maxReps = Math.max(1, ex.maxReps + delta);
          ex.reps = ex.maxReps;
          break;
        case 'weight': {
          const step = (exData?.equipment === 'barbell' || exData?.equipment === 'ez bar' || exData?.equipment === 'smith machine') ? 2.5 : 2;
          ex.suggestedWeight = Math.max(0, ex.suggestedWeight + delta * step);
          break;
        }
        case 'rest':
          ex.restTime = Math.max(15, ex.restTime + delta * 15);
          break;
      }

      next[index] = ex;
      return next;
    });
  }, []);

  // Swap exercise
  const handleSwap = useCallback((newExerciseId: string) => {
    if (!showSwap) return;
    const { index } = showSwap;

    setGeneratedExercises((prev) => {
      const next = [...prev];
      const old = next[index];
      const newEx = getExerciseById(newExerciseId);
      if (!newEx) return prev;

      next[index] = {
        ...old,
        exerciseId: newExerciseId,
        suggestedWeight: 0, // Reset weight for new exercise
      };
      return next;
    });
    setShowSwap(null);
  }, [showSwap]);

  // Save as custom workout
  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const muscleArr = Array.from(selectedMuscles);
    const durationMin = Math.round(
      generatedExercises.reduce((sum, e) => sum + e.sets * (e.setTime + e.restTime), 0) / 60
    );

    const id = addCustomWorkout({
      name: sessionLabel,
      nameFr: sessionLabel,
      description: `Generated workout targeting ${muscleArr.join(', ')}`,
      descriptionFr: `Séance générée — ${muscleArr.map((m) => MUSCLE_LABELS_FR[m] || m).join(', ')}`,
      level: 'intermediate',
      focus: undefined,
      durationMinutes: durationMin,
      exerciseCount: generatedExercises.length,
      exercises: generatedExercises.map((ge) => ({
        exerciseId: ge.exerciseId,
        sets: ge.sets,
        reps: ge.reps,
        weight: ge.suggestedWeight || undefined,
        restTime: ge.restTime,
        setTime: ge.setTime,
      })),
    });

    router.replace(`/workout/${id}`);
  }, [generatedExercises, selectedMuscles, sessionLabel, addCustomWorkout]);

  // Start session
  const handleStartSession = useCallback((readiness?: ReadinessCheckType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const workoutId = `generated_${Date.now()}`;
    const sessionId = startSession(workoutId, sessionLabel);

    if (readiness) {
      saveSessionReadiness(sessionId, readiness);
    }

    router.push({
      pathname: '/workout/session',
      params: {
        workoutId,
        sessionId,
        workoutName: sessionLabel,
        exercises: JSON.stringify(
          generatedExercises.map((ge) => {
            const ex = getExerciseById(ge.exerciseId);
            return {
              exerciseId: ge.exerciseId,
              sets: ge.sets,
              reps: ge.maxReps || ge.reps,
              minReps: ge.minReps,
              maxReps: ge.maxReps,
              weight: ge.suggestedWeight || 0,
              restTime: ge.restTime,
              exerciseName: ex?.nameFr || ex?.name || '',
              exerciseNameEn: ex?.name || '',
              bodyPart: ex?.bodyPart || 'chest',
              isUnilateral: ex?.isUnilateral || false,
            };
          }),
        ),
      },
    });
  }, [generatedExercises, sessionLabel, startSession, saveSessionReadiness]);

  // Get muscle targets for swap sheet
  const swapMuscleTargets = useMemo(() => {
    if (!showSwap) return [];
    const ex = generatedExercises[showSwap.index];
    return ex ? [ex.muscle] : [];
  }, [showSwap, generatedExercises]);

  // ─── Render ───

  if (step === 'select') {
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
            <Text style={styles.headerTitle}>Générer une séance</Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Equipment selector */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>ÉQUIPEMENT</Text>
              <View style={styles.equipmentRow}>
                {EQUIPMENT_OPTIONS.map((opt) => (
                  <PressableScale
                    key={opt.key}
                    style={[
                      styles.equipmentPill,
                      equipment === opt.key && styles.equipmentPillActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setEquipment(opt.key);
                    }}
                  >
                    <Text
                      style={[
                        styles.equipmentText,
                        equipment === opt.key && styles.equipmentTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </PressableScale>
                ))}
              </View>
            </View>

            {/* Muscle chips grid */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>MUSCLES CIBLÉS</Text>
              <View style={styles.muscleGrid}>
                {allMuscleData.map((m) => (
                  <MuscleChip
                    key={m.muscle}
                    muscle={m.muscle}
                    labelFr={m.labelFr}
                    recoveryStatus={m.recoveryStatus}
                    zoneColor={m.zoneColor}
                    zoneLabelShort={m.zoneLabelShort}
                    selected={selectedMuscles.has(m.muscle)}
                    onPress={() => toggleMuscle(m.muscle)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Bottom bar */}
          <View style={styles.bottomBar}>
            {selectedMuscles.size > 0 && (
              <Text style={styles.summaryText}>
                {summary.muscleCount} muscle{summary.muscleCount > 1 ? 's' : ''} · ~{summary.totalSets} séries · ~{summary.estimatedMinutes} min
              </Text>
            )}
            <AnimatedStartButton
              onPress={handleGenerate}
              label="Générer"
              loadingLabel="Génération..."
              disabled={selectedMuscles.size === 0}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Step 2: Review ───

  return (
    <View style={styles.screen}>
      <View style={styles.orbOrange} pointerEvents="none" />
      <View style={styles.orbBlue} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header — session name + stats */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              setStep('select');
              setEditingIndex(null);
            }}
          >
            <ArrowLeft size={22} color="#fff" strokeWidth={2} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{sessionLabel}</Text>
            <Text style={styles.headerSub}>
              {generatedExercises.length} exos · {reviewStats.totalSets} séries · ~{reviewStats.durationMin}min
            </Text>
          </View>
          <Pressable style={styles.saveIconBtn} onPress={handleSave}>
            <Bookmark size={18} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Muscle zone strip — compact horizontal chips */}
          {insightsData && insightsData.muscleImpacts.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.zoneStripScroll}
              contentContainerStyle={styles.zoneStrip}
            >
              {insightsData.muscleImpacts.map((impact: MuscleImpact) => (
                <View key={impact.muscle} style={styles.zoneChip}>
                  <View style={[styles.zoneDot, { backgroundColor: impact.zoneColor }]} />
                  <Text style={styles.zoneChipLabel}>{impact.labelFr}</Text>
                  <Text style={[styles.zoneChipSets, { color: impact.zoneColor }]}>
                    {impact.projectedSets}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Exercise list — flows freely, no card wrapper */}
          {generatedExercises.map((ge, idx) => {
            const ex = getExerciseById(ge.exerciseId);
            if (!ex) return null;
            const isEditing = editingIndex === idx;
            const isLast = idx === generatedExercises.length - 1;
            const overloadTip = overloadTipMap[ge.exerciseId];

            return (
              <View key={`${ge.exerciseId}-${idx}`}>
                <Pressable
                  style={[styles.exRow, isEditing && styles.exRowEditing]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEditingIndex(isEditing ? null : idx);
                  }}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setShowSwap({ index: idx, exerciseId: ge.exerciseId });
                  }}
                >
                  {/* Number badge */}
                  <View style={styles.exNumber}>
                    <Text style={styles.exNumberText}>
                      {String(idx + 1).padStart(2, '0')}
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
                    <View style={styles.exMeta}>
                      <View style={styles.exMetaPill}>
                        <Repeat size={10} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.exMetaText}>
                          {ge.sets} x {ge.minReps !== ge.maxReps
                            ? `${ge.minReps}-${ge.maxReps}`
                            : ge.maxReps}
                        </Text>
                      </View>
                      {ge.suggestedWeight > 0 && (
                        <View style={[styles.exMetaPill, styles.exWeightPill]}>
                          <Weight size={10} color={Colors.primary} />
                          <Text style={[styles.exMetaText, styles.exWeightText]}>
                            {ge.suggestedWeight}kg
                          </Text>
                        </View>
                      )}
                      <View style={styles.exMetaPill}>
                        <Timer size={10} color="rgba(255,255,255,0.3)" />
                        <Text style={styles.exMetaText}>{ge.restTime}s</Text>
                      </View>
                    </View>
                  </View>

                  <Pressable
                    style={styles.infoButton}
                    onPress={() => setInfoExercise(ex)}
                    hitSlop={8}
                  >
                    <Info size={16} color="rgba(255,255,255,0.25)" />
                  </Pressable>
                </Pressable>

                {/* Inline overload tip */}
                {!isEditing && overloadTip && (
                  <View style={styles.inlineTip}>
                    <TrendingUp size={11} color={Colors.primary} />
                    <Text style={styles.inlineTipText} numberOfLines={1}>{overloadTip}</Text>
                  </View>
                )}

                {/* Inline editor */}
                {isEditing && (
                  <View style={styles.editorPanel}>
                    <View style={styles.editorRow}>
                      <Text style={styles.editorFieldLabel}>Séries</Text>
                      <View style={styles.stepperRow}>
                        <Pressable style={styles.stepperBtn} onPress={() => handleEditField(idx, 'sets', -1)}>
                          <Minus size={14} color="#fff" />
                        </Pressable>
                        <Text style={styles.stepperValue}>{ge.sets}</Text>
                        <Pressable style={styles.stepperBtn} onPress={() => handleEditField(idx, 'sets', 1)}>
                          <Plus size={14} color="#fff" />
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.editorRow}>
                      <Text style={styles.editorFieldLabel}>Reps</Text>
                      <View style={styles.stepperRow}>
                        <Pressable style={styles.stepperBtn} onPress={() => handleEditField(idx, 'reps', -1)}>
                          <Minus size={14} color="#fff" />
                        </Pressable>
                        <Text style={styles.stepperValue}>{ge.maxReps}</Text>
                        <Pressable style={styles.stepperBtn} onPress={() => handleEditField(idx, 'reps', 1)}>
                          <Plus size={14} color="#fff" />
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.editorRow}>
                      <Text style={styles.editorFieldLabel}>Charge (kg)</Text>
                      <View style={styles.stepperRow}>
                        <Pressable style={styles.stepperBtn} onPress={() => handleEditField(idx, 'weight', -1)}>
                          <Minus size={14} color="#fff" />
                        </Pressable>
                        <Text style={styles.stepperValue}>{ge.suggestedWeight}</Text>
                        <Pressable style={styles.stepperBtn} onPress={() => handleEditField(idx, 'weight', 1)}>
                          <Plus size={14} color="#fff" />
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.editorRow}>
                      <Text style={styles.editorFieldLabel}>Repos (s)</Text>
                      <View style={styles.stepperRow}>
                        <Pressable style={styles.stepperBtn} onPress={() => handleEditField(idx, 'rest', -1)}>
                          <Minus size={14} color="#fff" />
                        </Pressable>
                        <Text style={styles.stepperValue}>{ge.restTime}</Text>
                        <Pressable style={styles.stepperBtn} onPress={() => handleEditField(idx, 'rest', 1)}>
                          <Plus size={14} color="#fff" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )}

                {!isEditing && !isLast && <View style={styles.exSeparator} />}
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom — single CTA */}
        <View style={styles.bottomBar}>
          <AnimatedStartButton
            onPress={() => setShowReadiness(true)}
            label="Commencer"
            loadingLabel="C'est parti !"
          />
        </View>
      </SafeAreaView>

      {/* Modals */}
      <ExerciseInfoSheet
        exercise={infoExercise}
        onClose={() => setInfoExercise(null)}
      />

      {showSwap && (
        <ExerciseSwapSheet
          visible={!!showSwap}
          onClose={() => setShowSwap(null)}
          currentExerciseId={showSwap.exerciseId}
          muscleTargets={swapMuscleTargets}
          equipment={equipment}
          onSwap={handleSwap}
        />
      )}

      <ReadinessCheck
        visible={showReadiness}
        onSubmit={(r) => {
          setShowReadiness(false);
          handleStartSession(r);
        }}
        onSkip={() => {
          setShowReadiness(false);
          handleStartSession();
        }}
        onClose={() => setShowReadiness(false)}
      />

      <ConfirmModal
        visible={showPacingWarning}
        onClose={() => setShowPacingWarning(false)}
        icon={<Timer size={24} color="#FBBF24" />}
        iconBgColor="rgba(251,191,36,0.12)"
        title="Déjà une séance aujourd'hui"
        description="Tu as déjà terminé une séance aujourd'hui. Veux-tu quand même en commencer une autre ?"
        confirmText="Continuer"
        confirmColor={Colors.primary}
        onConfirm={() => {
          setShowPacingWarning(false);
          setShowReadiness(true);
        }}
      />
    </View>
  );
}

// ─── Helpers ───

function getLabel(muscles: string[]): string {
  const set = new Set(muscles);
  const hasPush = set.has('chest') || set.has('shoulders') || set.has('triceps');
  const hasPull = set.has('lats') || set.has('upper back') || set.has('biceps');
  const hasLegs = set.has('quads') || set.has('hamstrings') || set.has('glutes');

  if (hasPush && !hasPull && !hasLegs) return 'Push';
  if (hasPull && !hasPush && !hasLegs) return 'Pull';
  if (hasLegs && !hasPush && !hasPull) return 'Jambes';
  if (hasPush && hasPull && !hasLegs) return 'Haut du corps';
  if (hasLegs && !hasPush && !hasPull) return 'Bas du corps';
  if (hasPush && hasPull && hasLegs) return 'Full Body';
  return 'Entraînement';
}

// ─── Styles ───

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
  orbOrange: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 80,
  },
  orbBlue: {
    position: 'absolute',
    top: '55%',
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(59, 130, 246, 0.04)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 140,
    gap: 24,
  },

  // Section blocks
  sectionBlock: {
    gap: 12,
  },
  sectionLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  // Equipment
  equipmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  equipmentPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  equipmentPillActive: {
    backgroundColor: 'rgba(255,107,53,0.1)',
  },
  equipmentText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  equipmentTextActive: {
    color: Colors.primary,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Muscle grid
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // Summary
  summaryText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },

  // Save icon button (header)
  saveIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Muscle zone strip
  zoneStripScroll: {
    marginHorizontal: -Spacing.lg,
  },
  zoneStrip: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
    paddingBottom: 4,
  },
  zoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  zoneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  zoneChipLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  zoneChipSets: {
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    backgroundColor: 'rgba(12,12,12,0.95)',
  },

  // Exercise row
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  exRowEditing: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  exNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exNumberText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  exInfo: {
    flex: 1,
    gap: 4,
  },
  exName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  exMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  exMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  exMetaText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  exWeightPill: {
    backgroundColor: 'rgba(255,107,53,0.08)',
  },
  exWeightText: {
    color: Colors.primary,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 52,
  },

  // Editor
  editorPanel: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  editorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editorFieldLabel: {
    color: 'rgba(255,255,255,0.45)',
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
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'center',
  },

  // Inline overload tip (under exercise row)
  inlineTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingLeft: 52,
    paddingBottom: 8,
  },
  inlineTipText: {
    color: 'rgba(255,107,53,0.7)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },
});
