import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import {
  ArrowLeft,
  Play,
  Plus,
  X,
  Search,
  Check,
  ChevronDown,
  Minus,
  Trash2,
  MoreVertical,
  Pencil,
  Info,
  Repeat,
  Weight,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { ExerciseInfoSheet } from '@/components/ExerciseInfoSheet';
import { ReadinessCheck } from '@/components/program/ReadinessCheck';
import { ConfirmModal } from '@/components/program/ConfirmModal';
import { SessionInsights } from '@/components/program/SessionInsights';
import { computeWorkoutInsights } from '@/lib/sessionInsights';
import { useWorkoutStore } from '@/stores/workoutStore';
import { exercises as allExercises, getExerciseById } from '@/data/exercises';
import { getProgressiveWeight, getEstimatedWeight } from '@/lib/weightEstimation';
import { useProgramStore } from '@/stores/programStore';
import type { WorkoutExercise, Exercise, BodyPart, Equipment } from '@/types';
import { DEFAULT_SET_TIME } from '@/types';
import type { ReadinessCheck as ReadinessCheckType } from '@/types/program';
import { computeReadinessScore, computeSessionAdjustments, applyAdjustmentsToExercises } from '@/lib/readinessEngine';
import { getExerciseCategory } from '@/lib/exerciseClassification';
import { GOAL_CONFIG } from '@/constants/programTemplates';
import { DropdownModal } from '@/components/ui/DropdownModal';
import { getFocusOptions, getEquipmentOptions } from '@/constants/filterOptions';

// ─── Constants ───

const FOCUS_COLORS: Record<string, string> = {
  push: '#ff7043',
  pull: '#42a5f5',
  legs: '#66bb6a',
  core: '#fbbf24',
  cardio: '#ff4444',
  full_body: '#ff7043',
  upper: '#42a5f5',
  lower: '#66bb6a',
};

const FOCUS_OPTIONS = getFocusOptions();
const EQUIPMENT_OPTIONS = getEquipmentOptions();

// ─── Types ───

interface SelectedExercise extends WorkoutExercise {
  exercise: Exercise;
  uid: string;
  overloadAction?: 'bump' | 'hold' | 'drop' | 'none';
}

type EditableField = 'sets' | 'reps' | 'weight' | 'restTime' | 'setTime';

const OVERLOAD_CONFIG = {
  bump: { icon: TrendingUp, label: '↑', color: '#4ADE80', bg: 'rgba(74,222,128,0.10)' },
  hold: { icon: ArrowRight, label: '→', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)' },
  drop: { icon: TrendingDown, label: '↓', color: '#FBBF24', bg: 'rgba(251,191,36,0.10)' },
} as const;

// ─── Main Screen ───

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useWorkoutStore();
  const history = useWorkoutStore((s) => s.history);

  const workout = store.getWorkoutById(id || '');
  const isCustom = !!workout?.isCustom;

  // ─── Custom workout editable state ───
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Exercise picker
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFocus, setSelectedFocus] = useState<BodyPart | 'all'>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | 'all'>('all');
  const [tempSelected, setTempSelected] = useState<Exercise[]>([]);
  const [showFocusDropdown, setShowFocusDropdown] = useState(false);
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);

  // Inline editor — tap row to expand (matches program day pattern)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Kebab menu & rename modal
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Pre-session readiness & pacing guard
  const [showReadiness, setShowReadiness] = useState(false);
  const [showPacingWarning, setShowPacingWarning] = useState(false);

  // Pacing guard — check if user already completed a session today
  const hasSessionToday = useMemo(() => {
    const today = new Date().toDateString();
    return history.some((s) => s.endTime && new Date(s.endTime).toDateString() === today);
  }, [history]);

  // ─── Session insights (muscle impact) ───
  const insightsData = useMemo(
    () => computeWorkoutInsights(selectedExercises, history),
    [selectedExercises, history],
  );

  // User profile for weight estimation fallback
  const userProfile = useProgramStore((s) => s.userProfile);
  const goalConfig = GOAL_CONFIG[userProfile?.goal || 'hypertrophy'];

  // ─── Load workout exercises into local state (with progressive overload) ───
  useEffect(() => {
    if (workout && !loaded) {
      const exercises: SelectedExercise[] = workout.exercises
        .map((we, i) => {
          const exercise = getExerciseById(we.exerciseId);
          if (!exercise) return null;

          // Compute progressive weight from history
          const prog = getProgressiveWeight(
            we.exerciseId,
            exercise.equipment,
            we.reps,
            history,
          );

          let weight = we.weight || 0;
          let overloadAction: SelectedExercise['overloadAction'] = 'none';

          if (prog.action !== 'none') {
            // History exists — use progressive weight
            weight = prog.weight;
            overloadAction = prog.action;
          } else if (weight === 0 && userProfile) {
            // No history + no saved weight — estimate from BW
            weight = getEstimatedWeight(
              we.exerciseId,
              exercise.equipment,
              exercise.target,
              userProfile.weight,
              userProfile.sex,
              userProfile.experience || 'intermediate',
            );
          }

          return {
            ...we,
            weight,
            exercise,
            uid: `${we.exerciseId}_load_${i}`,
            overloadAction,
          };
        })
        .filter(Boolean) as SelectedExercise[];

      setSelectedExercises(exercises);
      setLoaded(true);
    }
  }, [workout, loaded]);

  // Reset loaded state when id changes (e.g. after duplicateWorkout redirect)
  useEffect(() => {
    setLoaded(false);
  }, [id]);

  // ─── Auto-save helper ───
  const autoSave = useCallback(
    (exercises: SelectedExercise[]) => {
      if (!id || !isCustom) return;
      const workoutExercises: WorkoutExercise[] = exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        restTime: ex.restTime,
        setTime: ex.setTime,
      }));
      const duration = Math.ceil(
        exercises.reduce((acc, ex) => acc + ((ex.setTime || 35) + ex.restTime) * ex.sets, 0) / 60
      );
      store.updateCustomWorkout(id, {
        exercises: workoutExercises,
        durationMinutes: duration,
        exerciseCount: exercises.length,
      });
    },
    [id, isCustom, store]
  );

  // ─── Exercise picker logic ───
  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        ex.nameFr.toLowerCase().includes(q) ||
        ex.name.toLowerCase().includes(q) ||
        ex.target.toLowerCase().includes(q);
      const matchesFocus = selectedFocus === 'all' || ex.bodyPart === selectedFocus;
      const matchesEquip = selectedEquipment === 'all' || ex.equipment === selectedEquipment;
      return matchesSearch && matchesFocus && matchesEquip;
    });
  }, [searchQuery, selectedFocus, selectedEquipment]);

  const toggleExercise = (exercise: Exercise) => {
    const exists = tempSelected.some((e) => e.id === exercise.id);
    setTempSelected(exists ? tempSelected.filter((e) => e.id !== exercise.id) : [...tempSelected, exercise]);
  };

  const handleAddToWorkout = () => {
    const newExercises: SelectedExercise[] = tempSelected.map((exercise, i) => {
      const category = getExerciseCategory(exercise.id);
      const catConfig = goalConfig[category];
      return {
        exerciseId: exercise.id,
        exercise,
        sets: 3,
        reps: catConfig.maxReps,
        weight: 0,
        restTime: catConfig.restTime,
        setTime: catConfig.setTime,
        uid: `${exercise.id}_${Date.now()}_${i}`,
      };
    });
    const updated = [...selectedExercises, ...newExercises];
    setSelectedExercises(updated);
    autoSave(updated);
    setTempSelected([]);
    setShowExercisePicker(false);
    setSearchQuery('');
    setSelectedFocus('all');
    setSelectedEquipment('all');
  };

  const closePicker = () => {
    setShowExercisePicker(false);
    setTempSelected([]);
    setSearchQuery('');
    setSelectedFocus('all');
    setSelectedEquipment('all');
  };

  // ─── Inline field stepper (matches program day pattern) ───
  const handleEditField = (index: number, field: EditableField, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = selectedExercises.map((ex, i) => {
      if (i !== index) return ex;
      let newValue: number;
      switch (field) {
        case 'sets':
          newValue = Math.max(1, ex.sets + delta);
          break;
        case 'reps':
          newValue = Math.max(1, ex.reps + delta);
          break;
        case 'weight': {
          const equip = ex.exercise.equipment;
          const step = (equip === 'barbell' || equip === 'ez bar' || equip === 'smith machine') ? 2.5 : 2;
          newValue = Math.max(0, (ex.weight || 0) + delta * step);
          // Recalculate overload action based on new weight vs history
          const prog = getProgressiveWeight(ex.exerciseId, equip, ex.reps, history);
          let overloadAction: SelectedExercise['overloadAction'] = 'none';
          if (prog.action !== 'none') {
            if (newValue > prog.lastWeight) overloadAction = 'bump';
            else if (newValue < prog.lastWeight) overloadAction = 'drop';
            else overloadAction = 'hold';
          }
          return { ...ex, weight: newValue, overloadAction };
        }
        case 'restTime':
          newValue = Math.max(15, ex.restTime + delta * 15);
          break;
        case 'setTime':
          newValue = Math.max(10, (ex.setTime || 35) + delta * 5);
          break;
        default:
          return ex;
      }
      return { ...ex, [field]: newValue };
    });
    setSelectedExercises(updated);
    autoSave(updated);
  };

  // ─── Drag reorder ───
  const handleDragEnd = ({ data }: { data: SelectedExercise[] }) => {
    setSelectedExercises(data);
    autoSave(data);
  };

  // ─── Remove exercise ───
  const handleRemoveExercise = (index: number) => {
    const updated = selectedExercises.filter((_, i) => i !== index);
    setSelectedExercises(updated);
    autoSave(updated);
  };

  // ─── Kebab menu actions ───
  const handleRename = () => {
    setShowMenu(false);
    setRenameValue(workout?.nameFr || workout?.name || '');
    setShowRenameModal(true);
  };

  const handleSaveRename = () => {
    if (!renameValue.trim() || !id) return;
    store.updateCustomWorkout(id, {
      name: renameValue.trim(),
      nameFr: renameValue.trim(),
    });
    setShowRenameModal(false);
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    if (id) store.deleteCustomWorkout(id);
    router.back();
  };

  // Start workout session (with optional readiness)
  const handleStartSession = (readiness?: ReadinessCheckType) => {
    if (!workout || selectedExercises.length === 0) return;
    const sessionId = store.startSession(id || '', workout.nameFr || workout.name);
    if (readiness) {
      store.saveSessionReadiness(sessionId, readiness);
    }

    let exercisesData = selectedExercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      sets: ex.sets,
      reps: ex.reps,
      minReps: Math.max(1, ex.reps - 2),
      maxReps: ex.reps,
      targetRir: 2,
      weight: ex.weight || 0,
      restTime: ex.restTime,
      setTime: ex.setTime || DEFAULT_SET_TIME,
      exerciseName: ex.exercise.nameFr,
      exerciseNameEn: ex.exercise.name,
      bodyPart: ex.exercise.bodyPart,
      isUnilateral: ex.exercise.isUnilateral,
      overloadAction: ex.overloadAction || 'none',
    }));

    // Apply readiness adjustments if score is moderate or low
    if (readiness) {
      const score = computeReadinessScore(readiness);
      const adjustments = computeSessionAdjustments(score);
      exercisesData = applyAdjustmentsToExercises(exercisesData, adjustments);
    }

    router.push({
      pathname: '/workout/session',
      params: {
        workoutId: id,
        sessionId,
        workoutName: workout.nameFr || workout.name,
        exercises: JSON.stringify(exercisesData),
      },
    });
  };

  // ─── Not found ───
  if (!workout) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <Pressable style={s.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text} strokeWidth={2} />
        </Pressable>
        <View style={s.notFound}>
          <Text style={s.notFoundText}>{i18n.t('workoutDetail.notFound')}</Text>
        </View>
      </View>
    );
  }

  const focusColor = FOCUS_COLORS[workout.focus || 'full_body'] || '#ff7043';

  // ═══════════════════════════════════════════
  // Exercise Picker (full-screen overlay)
  // ═══════════════════════════════════════════
  if (showExercisePicker) {
    const focusLabel =
      selectedFocus === 'all'
        ? i18n.t('workouts.filters.focus')
        : FOCUS_OPTIONS.find((o) => o.value === selectedFocus)?.label || i18n.t('workouts.filters.focus');
    const equipLabel =
      selectedEquipment === 'all'
        ? i18n.t('workouts.filters.equipment')
        : EQUIPMENT_OPTIONS.find((o) => o.value === selectedEquipment)?.label || i18n.t('workouts.filters.equipment');

    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <View style={s.pickerHeader}>
          <Pressable style={s.iconButton} onPress={closePicker}>
            <X size={20} color={Colors.text} strokeWidth={2} />
          </Pressable>
          <Text style={s.pickerTitle}>{i18n.t('workoutDetail.addExercisesModal')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={s.searchContainer}>
          <Search size={16} color="rgba(120,120,130,1)" strokeWidth={2} />
          <TextInput
            style={s.searchInput}
            placeholder={i18n.t('workoutDetail.searchPlaceholder')}
            placeholderTextColor="rgba(100,100,110,1)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={16} color="rgba(120,120,130,1)" strokeWidth={2} />
            </Pressable>
          )}
        </View>

        <View style={s.filterRow}>
          <Pressable
            style={[s.filterPill, selectedFocus !== 'all' && s.filterPillActive]}
            onPress={() => setShowFocusDropdown(true)}
          >
            <Text style={[s.filterPillText, selectedFocus !== 'all' && s.filterPillTextActive]}>
              {focusLabel}
            </Text>
            <ChevronDown
              size={12}
              color={selectedFocus !== 'all' ? '#000' : 'rgba(140,140,150,1)'}
              strokeWidth={2.5}
            />
          </Pressable>
          <Pressable
            style={[s.filterPill, selectedEquipment !== 'all' && s.filterPillActive]}
            onPress={() => setShowEquipmentDropdown(true)}
          >
            <Text style={[s.filterPillText, selectedEquipment !== 'all' && s.filterPillTextActive]}>
              {equipLabel}
            </Text>
            <ChevronDown
              size={12}
              color={selectedEquipment !== 'all' ? '#000' : 'rgba(140,140,150,1)'}
              strokeWidth={2.5}
            />
          </Pressable>
          {(selectedFocus !== 'all' || selectedEquipment !== 'all') && (
            <Pressable
              onPress={() => {
                setSelectedFocus('all');
                setSelectedEquipment('all');
              }}
              style={s.clearButton}
            >
              <X size={14} color="#FF4B4B" strokeWidth={2.5} />
            </Pressable>
          )}
        </View>

        <ScrollView
          style={s.exerciseList}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.resultCount}>{i18n.t('workoutCreate.exerciseCount', { count: filteredExercises.length })}</Text>
          {filteredExercises.map((exercise) => {
            const isSelected = tempSelected.some((e) => e.id === exercise.id);
            return (
              <Pressable
                key={exercise.id}
                style={[s.exercisePickerCard, isSelected && s.exercisePickerCardSelected]}
                onPress={() => toggleExercise(exercise)}
              >
                <ExerciseIcon
                  exerciseName={exercise.name}
                  bodyPart={exercise.bodyPart}
                  size={18}
                  containerSize={44}
                />
                <View style={s.exercisePickerInfo}>
                  <Text style={s.exercisePickerName} numberOfLines={1}>
                    {exercise.nameFr}
                  </Text>
                  <Text style={s.exercisePickerTarget}>{exercise.target}</Text>
                </View>
                <Pressable
                  style={s.infoBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    setInfoExercise(exercise);
                  }}
                  hitSlop={6}
                >
                  <Info size={16} color="rgba(140,140,150,1)" strokeWidth={2} />
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>

        {tempSelected.length > 0 && (
          <View style={[s.selectionBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <Text style={s.selectionText}>
              {tempSelected.length > 1 ? i18n.t('workoutCreate.selectedCountPlural', { count: tempSelected.length }) : i18n.t('workoutCreate.selectedCount', { count: tempSelected.length })}
            </Text>
            <Pressable style={s.addToWorkoutBtn} onPress={handleAddToWorkout}>
              <Text style={s.addToWorkoutText}>{i18n.t('workoutDetail.addToWorkout')}</Text>
            </Pressable>
          </View>
        )}

        <DropdownModal
          visible={showFocusDropdown}
          title={i18n.t('workouts.filters.focus')}
          options={FOCUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          selected={selectedFocus}
          onSelect={(v) => {
            setSelectedFocus(v as any);
            setShowFocusDropdown(false);
          }}
          onClose={() => setShowFocusDropdown(false)}
        />
        <DropdownModal
          visible={showEquipmentDropdown}
          title={i18n.t('workouts.filters.equipment')}
          options={EQUIPMENT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          selected={selectedEquipment}
          onSelect={(v) => {
            setSelectedEquipment(v as any);
            setShowEquipmentDropdown(false);
          }}
          onClose={() => setShowEquipmentDropdown(false)}
        />

        <ExerciseInfoSheet exercise={infoExercise} onClose={() => setInfoExercise(null)} />
      </View>
    );
  }

  // ═══════════════════════════════════════════
  // Main unified screen
  // ═══════════════════════════════════════════

  const displayName = workout.nameFr || workout.name;

  // ─── Render exercise row (custom — matches program day pattern) ───
  const renderEditableItem = ({ item: ex, drag, isActive, getIndex }: RenderItemParams<SelectedExercise>) => {
    const index = getIndex()!;
    const isEditing = editingIndex === index;
    const isLast = index === selectedExercises.length - 1;

    return (
      <ScaleDecorator>
        <View>
          <Pressable
            style={[s.exRow, isEditing && s.exRowEditing]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEditingIndex(isEditing ? null : index);
            }}
            onLongPress={drag}
            disabled={isActive}
          >
            <View style={s.exNumber}>
              <Text style={s.exNumberText}>{String(index + 1).padStart(2, '0')}</Text>
            </View>

            <ExerciseIcon
              exerciseName={ex.exercise.name}
              bodyPart={ex.exercise.bodyPart}
              gifUrl={ex.exercise.gifUrl}
              size={20}
              containerSize={44}
            />

            <View style={s.exInfo}>
              <Text style={s.exName} numberOfLines={1}>{ex.exercise.nameFr}</Text>
              <View style={s.exMeta}>
                <View style={s.exMetaPill}>
                  <Repeat size={10} color="rgba(255,255,255,0.4)" />
                  <Text style={s.exMetaText}>{ex.sets} x {ex.reps}</Text>
                </View>
                {(ex.weight || 0) > 0 && (
                  <View style={[s.exMetaPill, s.exWeightPill]}>
                    <Weight size={10} color={Colors.primary} />
                    <Text style={[s.exMetaText, s.exWeightText]}>{ex.weight}kg</Text>
                  </View>
                )}
                {ex.overloadAction && ex.overloadAction !== 'none' && OVERLOAD_CONFIG[ex.overloadAction] && (
                  <View style={[s.exMetaPill, { backgroundColor: OVERLOAD_CONFIG[ex.overloadAction].bg }]}>
                    <Text style={[s.exMetaText, { color: OVERLOAD_CONFIG[ex.overloadAction].color }]}>
                      {OVERLOAD_CONFIG[ex.overloadAction].label}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <Pressable style={s.infoButton} onPress={() => setInfoExercise(ex.exercise)} hitSlop={8}>
              <Info size={16} color="rgba(255,255,255,0.25)" />
            </Pressable>
          </Pressable>

          {/* Inline editor panel */}
          {isEditing && (
            <View style={s.editorPanel}>
              {/* Overload suggestion */}
              {ex.overloadAction === 'bump' && (
                <View style={s.overloadRow}>
                  <TrendingUp size={12} color="#4ADE80" />
                  <Text style={s.overloadText}>{i18n.t('workoutDetail.overloadBump')}</Text>
                </View>
              )}
              {ex.overloadAction === 'drop' && (
                <View style={[s.overloadRow, { backgroundColor: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.15)' }]}>
                  <TrendingDown size={12} color="#FBBF24" />
                  <Text style={[s.overloadText, { color: '#FBBF24' }]}>{i18n.t('workoutDetail.overloadDrop')}</Text>
                </View>
              )}
              <Text style={s.editorLabel}>{i18n.t('workoutDetail.overloadHold')}</Text>

              <View style={s.editorRow}>
                <Text style={s.editorFieldLabel}>{i18n.t('workoutDetail.sets')}</Text>
                <View style={s.stepperRow}>
                  <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'sets', -1)}>
                    <Minus size={14} color="#fff" />
                  </Pressable>
                  <Text style={s.stepperValue}>{ex.sets}</Text>
                  <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'sets', 1)}>
                    <Plus size={14} color="#fff" />
                  </Pressable>
                </View>
              </View>

              <View style={s.editorRow}>
                <Text style={s.editorFieldLabel}>{i18n.t('workoutDetail.reps')}</Text>
                <View style={s.stepperRow}>
                  <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'reps', -1)}>
                    <Minus size={14} color="#fff" />
                  </Pressable>
                  <Text style={s.stepperValue}>{ex.reps}</Text>
                  <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'reps', 1)}>
                    <Plus size={14} color="#fff" />
                  </Pressable>
                </View>
              </View>

              <View style={s.editorRow}>
                <Text style={s.editorFieldLabel}>{i18n.t('workoutDetail.weight')}</Text>
                <View style={s.stepperRow}>
                  <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'weight', -1)}>
                    <Minus size={14} color="#fff" />
                  </Pressable>
                  <Text style={s.stepperValue}>{ex.weight || 0}</Text>
                  <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'weight', 1)}>
                    <Plus size={14} color="#fff" />
                  </Pressable>
                </View>
              </View>

              <View style={s.editorRow}>
                <Text style={s.editorFieldLabel}>{i18n.t('workoutDetail.rest')}</Text>
                <View style={s.stepperRow}>
                  <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'restTime', -1)}>
                    <Minus size={14} color="#fff" />
                  </Pressable>
                  <Text style={s.stepperValue}>{ex.restTime}</Text>
                  <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'restTime', 1)}>
                    <Plus size={14} color="#fff" />
                  </Pressable>
                </View>
              </View>

              <View style={s.editorRow}>
                <Text style={s.editorFieldLabel}>{i18n.t('workoutDetail.timePerSet')}</Text>
                <View style={s.stepperRow}>
                  <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'setTime', -1)}>
                    <Minus size={14} color="#fff" />
                  </Pressable>
                  <Text style={s.stepperValue}>{ex.setTime || 35}</Text>
                  <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'setTime', 1)}>
                    <Plus size={14} color="#fff" />
                  </Pressable>
                </View>
              </View>

              <Pressable style={s.removeRow} onPress={() => handleRemoveExercise(index)}>
                <Trash2 size={12} color="#FF4B4B" />
                <Text style={s.removeText}>{i18n.t('workoutDetail.removeExercise')}</Text>
              </Pressable>
            </View>
          )}

          {!isEditing && !isLast && <View style={s.exSeparator} />}
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={s.screen}>
      {/* Ambient orbs */}
      <View style={[s.orbAccent, { backgroundColor: `${focusColor}10`, shadowColor: focusColor }]} />
      <View style={s.orbBlue} />

      {/* ─── Compact Header ─── */}
      <View style={[s.compactHeader, { paddingTop: insets.top + 8 }]}>
        <Pressable style={s.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>
          {displayName}
        </Text>
        {isCustom ? (
          <Pressable style={s.menuButton} onPress={() => setShowMenu(true)}>
            <MoreVertical size={20} color={Colors.text} strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* ─── Exercise List ─── */}
      {isCustom ? (
        // Editable DraggableFlatList for custom workouts
        <DraggableFlatList
          data={selectedExercises}
          onDragEnd={handleDragEnd}
          keyExtractor={(item) => item.uid}
          containerStyle={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + 40, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={renderEditableItem}
          ListHeaderComponent={<SessionInsights data={insightsData} />}
          ListFooterComponent={
            <View style={{ marginTop: 4 }}>
              <Pressable style={s.addExerciseBtn} onPress={() => setShowExercisePicker(true)}>
                <Plus size={20} color="rgba(120,120,130,1)" strokeWidth={2} />
                <Text style={s.addExerciseText}>{i18n.t('workoutDetail.addExercise')}</Text>
              </Pressable>
              <Pressable style={s.deleteWorkoutBtn} onPress={handleDelete}>
                <Trash2 size={16} color="#FF4B4B" strokeWidth={2} />
                <Text style={s.deleteWorkoutText}>{i18n.t('workoutDetail.deleteWorkout')}</Text>
              </Pressable>
            </View>
          }
        />
      ) : (
        // Preset workouts — row pattern matching program day
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + 40, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <SessionInsights data={insightsData} />
          {selectedExercises.map((ex, index) => {
            const isEditing = editingIndex === index;
            const isLast = index === selectedExercises.length - 1;
            return (
              <View key={ex.uid}>
                <Pressable
                  style={[s.exRow, isEditing && s.exRowEditing]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEditingIndex(isEditing ? null : index);
                  }}
                >
                  <View style={s.exNumber}>
                    <Text style={s.exNumberText}>{String(index + 1).padStart(2, '0')}</Text>
                  </View>

                  <ExerciseIcon
                    exerciseName={ex.exercise.name}
                    bodyPart={ex.exercise.bodyPart}
                    gifUrl={ex.exercise.gifUrl}
                    size={20}
                    containerSize={44}
                  />

                  <View style={s.exInfo}>
                    <Text style={s.exName} numberOfLines={1}>{ex.exercise.nameFr}</Text>
                    <View style={s.exMeta}>
                      <View style={s.exMetaPill}>
                        <Repeat size={10} color="rgba(255,255,255,0.4)" />
                        <Text style={s.exMetaText}>{ex.sets} x {ex.reps}</Text>
                      </View>
                      {(ex.weight || 0) > 0 && (
                        <View style={[s.exMetaPill, s.exWeightPill]}>
                          <Weight size={10} color={Colors.primary} />
                          <Text style={[s.exMetaText, s.exWeightText]}>{ex.weight}kg</Text>
                        </View>
                      )}
                      {ex.overloadAction && ex.overloadAction !== 'none' && OVERLOAD_CONFIG[ex.overloadAction] && (
                        <View style={[s.exMetaPill, { backgroundColor: OVERLOAD_CONFIG[ex.overloadAction].bg }]}>
                          <Text style={[s.exMetaText, { color: OVERLOAD_CONFIG[ex.overloadAction].color }]}>
                            {OVERLOAD_CONFIG[ex.overloadAction].label}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Pressable style={s.infoButton} onPress={() => setInfoExercise(ex.exercise)} hitSlop={8}>
                    <Info size={16} color="rgba(255,255,255,0.25)" />
                  </Pressable>
                </Pressable>

                {/* Inline editor panel */}
                {isEditing && (
                  <View style={s.editorPanel}>
                    {ex.overloadAction === 'bump' && (
                      <View style={s.overloadRow}>
                        <TrendingUp size={12} color="#4ADE80" />
                        <Text style={s.overloadText}>{i18n.t('workoutDetail.overloadBump')}</Text>
                      </View>
                    )}
                    {ex.overloadAction === 'drop' && (
                      <View style={[s.overloadRow, { backgroundColor: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.15)' }]}>
                        <TrendingDown size={12} color="#FBBF24" />
                        <Text style={[s.overloadText, { color: '#FBBF24' }]}>{i18n.t('workoutDetail.overloadDrop')}</Text>
                      </View>
                    )}
                    <Text style={s.editorLabel}>{i18n.t('workoutDetail.overloadHold')}</Text>

                    <View style={s.editorRow}>
                      <Text style={s.editorFieldLabel}>{i18n.t('workoutDetail.sets')}</Text>
                      <View style={s.stepperRow}>
                        <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'sets', -1)}>
                          <Minus size={14} color="#fff" />
                        </Pressable>
                        <Text style={s.stepperValue}>{ex.sets}</Text>
                        <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'sets', 1)}>
                          <Plus size={14} color="#fff" />
                        </Pressable>
                      </View>
                    </View>

                    <View style={s.editorRow}>
                      <Text style={s.editorFieldLabel}>{i18n.t('workoutDetail.reps')}</Text>
                      <View style={s.stepperRow}>
                        <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'reps', -1)}>
                          <Minus size={14} color="#fff" />
                        </Pressable>
                        <Text style={s.stepperValue}>{ex.reps}</Text>
                        <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'reps', 1)}>
                          <Plus size={14} color="#fff" />
                        </Pressable>
                      </View>
                    </View>

                    <View style={s.editorRow}>
                      <Text style={s.editorFieldLabel}>{i18n.t('workoutDetail.weight')}</Text>
                      <View style={s.stepperRow}>
                        <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'weight', -1)}>
                          <Minus size={14} color="#fff" />
                        </Pressable>
                        <Text style={s.stepperValue}>{ex.weight || 0}</Text>
                        <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'weight', 1)}>
                          <Plus size={14} color="#fff" />
                        </Pressable>
                      </View>
                    </View>

                    <View style={s.editorRow}>
                      <Text style={s.editorFieldLabel}>{i18n.t('workoutDetail.rest')}</Text>
                      <View style={s.stepperRow}>
                        <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'restTime', -1)}>
                          <Minus size={14} color="#fff" />
                        </Pressable>
                        <Text style={s.stepperValue}>{ex.restTime}</Text>
                        <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'restTime', 1)}>
                          <Plus size={14} color="#fff" />
                        </Pressable>
                      </View>
                    </View>

                    <View style={s.editorRow}>
                      <Text style={s.editorFieldLabel}>{i18n.t('workoutDetail.timePerSet')}</Text>
                      <View style={s.stepperRow}>
                        <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'setTime', -1)}>
                          <Minus size={14} color="#fff" />
                        </Pressable>
                        <Text style={s.stepperValue}>{ex.setTime || 35}</Text>
                        <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'setTime', 1)}>
                          <Plus size={14} color="#fff" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )}

                {!isEditing && !isLast && <View style={s.exSeparator} />}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ─── Bottom Bar ─── */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Pressable
          style={s.startButton}
          onPress={() => {
            if (!workout || selectedExercises.length === 0) return;
            if (hasSessionToday) {
              setShowPacingWarning(true);
              return;
            }
            setShowReadiness(true);
          }}
        >
          <Play size={20} color="#fff" fill="#fff" strokeWidth={0} />
          <Text style={s.startButtonText}>{i18n.t('common.start')}</Text>
        </Pressable>
      </View>

      {/* ─── Kebab Menu Modal ─── */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={s.menuModal}>
            <Pressable style={s.menuOption} onPress={handleRename}>
              <Pencil size={18} color={Colors.text} strokeWidth={2} />
              <Text style={s.menuOptionText}>{i18n.t('workoutDetail.rename')}</Text>
            </Pressable>
            <View style={s.menuDivider} />
            <Pressable style={s.menuOption} onPress={handleDelete}>
              <Trash2 size={18} color="#FF4B4B" strokeWidth={2} />
              <Text style={[s.menuOptionText, { color: '#FF4B4B' }]}>{i18n.t('workoutDetail.delete')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ─── Rename Modal ─── */}
      <Modal visible={showRenameModal} transparent animationType="fade" onRequestClose={() => setShowRenameModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.renameModal}>
            <Text style={s.renameTitle}>{i18n.t('workoutDetail.renameTitle')}</Text>
            <View style={s.renameInputContainer}>
              <TextInput
                style={s.renameInput}
                value={renameValue}
                onChangeText={setRenameValue}
                placeholder={i18n.t('workoutDetail.renameLabel')}
                placeholderTextColor="rgba(100,100,110,1)"
                autoFocus
                selectTextOnFocus
              />
            </View>
            <View style={s.renameActions}>
              <Pressable style={s.renameCancelBtn} onPress={() => setShowRenameModal(false)}>
                <Text style={s.renameCancelText}>{i18n.t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={s.renameSaveBtn} onPress={handleSaveRename}>
                <Text style={s.renameSaveText}>{i18n.t('common.confirm')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Delete Confirmation Modal ─── */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={s.modalOverlay}>
          <View style={s.deleteModal}>
            <View style={s.deleteModalIcon}>
              <Trash2 size={24} color="#FF4B4B" strokeWidth={2} />
            </View>
            <Text style={s.deleteModalTitle}>{i18n.t('workoutDetail.deleteConfirmTitle')}</Text>
            <Text style={s.deleteModalDesc}>{i18n.t('workoutDetail.deleteConfirmMessage')}</Text>
            <View style={s.deleteModalActions}>
              <Pressable style={s.deleteModalCancelBtn} onPress={() => setShowDeleteConfirm(false)}>
                <Text style={s.deleteModalCancelText}>{i18n.t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={s.deleteModalConfirmBtn} onPress={confirmDelete}>
                <Text style={s.deleteModalConfirmText}>{i18n.t('common.delete')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Parameter stepper modal removed — inline editors used instead */}

      {/* ─── Pacing Warning Modal ─── */}
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

      {/* ─── Readiness Check Modal ─── */}
      <ReadinessCheck
        visible={showReadiness}
        onSubmit={(check) => {
          setShowReadiness(false);
          handleStartSession(check);
        }}
        onSkip={() => {
          setShowReadiness(false);
          handleStartSession();
        }}
        onClose={() => setShowReadiness(false)}
      />

      <ExerciseInfoSheet exercise={infoExercise} onClose={() => setInfoExercise(null)} />
    </View>
  );
}

// ═══════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0C0C0C',
    position: 'relative',
    overflow: 'hidden',
  },

  // Ambient orbs
  orbAccent: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 80,
  },
  orbBlue: {
    position: 'absolute',
    bottom: '20%',
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

  // ─── Compact Header ───
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ─── Exercise rows (matches program day pattern) ───
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
  exNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exNumberText: {
    color: 'rgba(120,120,130,1)',
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
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
  exSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 82,
  },
  infoButton: {
    padding: 6,
    borderRadius: 12,
  },

  // ─── Inline editor panel ───
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
  overloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74,222,128,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.15)',
  },
  overloadText: {
    color: '#4ADE80',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
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
  removeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  removeText: {
    color: '#FF4B4B',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // ─── Add Exercise / Delete Buttons ───
  addExerciseBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  addExerciseText: {
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: 'rgba(120,120,130,1)',
    letterSpacing: 1,
  },
  deleteWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,75,75,0.15)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,75,75,0.06)',
    marginTop: 24,
  },
  deleteWorkoutText: {
    color: '#FF4B4B',
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // ─── Bottom Bar ───
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(5, 5, 5, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // ─── Kebab Menu Modal ───
  menuModal: {
    backgroundColor: 'rgba(28,28,32,0.98)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    maxWidth: 280,
    overflow: 'hidden',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuOptionText: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // ─── Delete Confirmation Modal ───
  deleteModal: {
    backgroundColor: 'rgba(28,28,32,0.98)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    maxWidth: 320,
    padding: 24,
    alignItems: 'center',
  },
  deleteModalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,75,75,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    marginBottom: 6,
  },
  deleteModalDesc: {
    color: 'rgba(140,140,150,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  deleteModalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  deleteModalCancelText: {
    color: 'rgba(160,160,170,1)',
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  deleteModalConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FF4B4B',
  },
  deleteModalConfirmText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // ─── Rename Modal ───
  renameModal: {
    backgroundColor: 'rgba(28,28,32,0.98)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    maxWidth: 340,
    padding: 24,
  },
  renameTitle: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    marginBottom: 16,
  },
  renameInputContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    marginBottom: 20,
  },
  renameInput: {
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: Colors.text,
    padding: 16,
  },
  renameActions: {
    flexDirection: 'row',
    gap: 10,
  },
  renameCancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  renameCancelText: {
    color: 'rgba(160,160,170,1)',
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  renameSaveBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  renameSaveText: {
    color: '#000',
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // ─── Not Found ───
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    color: 'rgba(140, 140, 150, 1)',
    fontSize: 16,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // ─── Exercise Picker ───
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  pickerTitle: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    marginHorizontal: Spacing.lg,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(220,220,230,1)',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: 12,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: 'rgba(160,160,170,1)',
  },
  filterPillTextActive: {
    color: '#000',
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(255,75,75,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCount: {
    color: 'rgba(100,100,110,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginBottom: 10,
    paddingHorizontal: Spacing.lg,
  },
  exerciseList: { flex: 1 },
  exercisePickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 16,
    padding: 12,
    marginBottom: 6,
    marginHorizontal: Spacing.lg,
    gap: 12,
  },
  exercisePickerCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255,107,53,0.04)',
  },
  exercisePickerInfo: { flex: 1 },
  exercisePickerName: {
    color: 'rgba(220,220,230,1)',
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  exercisePickerTarget: {
    color: 'rgba(120,120,130,1)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  selectionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20,20,25,0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: Spacing.lg,
    paddingTop: 14,
  },
  selectionText: {
    color: 'rgba(160,160,170,1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  addToWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
  },
  addToWorkoutText: {
    color: '#000',
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // ─── Modals (shared) ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});
