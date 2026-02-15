import { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  X,
  Minus,
  Search,
  ChevronDown,
  Info,
  Repeat,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Spacing, GlassStyle, Header, PageLayout, IconStroke, CTAButton } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { ExerciseInfoSheet } from '@/components/ExerciseInfoSheet';
import { PressableScale } from '@/components/ui/PressableScale';
import { DropdownModal } from '@/components/ui/DropdownModal';
import { useWorkoutStore } from '@/stores/workoutStore';
import { exercises as allExercises } from '@/data/exercises';
import { getFocusOptions, getEquipmentOptions } from '@/constants/filterOptions';
import { formatWeight, getWeightUnitLabel } from '@/stores/settingsStore';
import type { Exercise, BodyPart, Equipment, CompletedExercise, CompletedSet } from '@/types';

// ─── Config ───

const exerciseMap = new Map(allExercises.map((e) => [e.id, e]));
const FOCUS_OPTIONS = getFocusOptions();
const EQUIPMENT_OPTIONS = getEquipmentOptions();
const DURATION_PRESETS = [30, 45, 60, 75, 90];

// ─── Types ───

interface EditableSet {
  reps: number;
  weight: number;
  rir?: number;
  completed: boolean;
  side?: 'right' | 'left';
}

interface EditableExercise {
  uid: string;
  exerciseId: string;
  exercise: Exercise;
  sets: EditableSet[];
  isNew?: boolean;
}

// ─── RIR colors ───
const RIR_COLORS: Record<number, string> = {
  0: '#EF4444',
  1: '#FBBF24',
  2: '#4ADE80',
  3: '#3B82F6',
};

/** Format the session date for display */
function formatDateDisplay(dateISO: string): string {
  const date = new Date(dateISO);
  const locale = i18n.locale === 'fr' ? 'fr-FR' : 'en-US';
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Find closest duration preset */
function closestDuration(seconds: number): number {
  const mins = Math.round(seconds / 60);
  let best = DURATION_PRESETS[0];
  let bestDiff = Math.abs(mins - best);
  for (const p of DURATION_PRESETS) {
    const diff = Math.abs(mins - p);
    if (diff < bestDiff) {
      best = p;
      bestDiff = diff;
    }
  }
  return best;
}

// ─── Component ───

export default function EditSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const history = useWorkoutStore((s) => s.history);
  const updateSession = useWorkoutStore((s) => s.updateSession);

  // Find the session
  const session = useMemo(
    () => history.find((s) => s.id === sessionId),
    [history, sessionId],
  );

  // Hydrate session into editable state (only on mount)
  const initialState = useMemo(() => {
    if (!session) return null;

    const exercises: EditableExercise[] = [];
    for (const compEx of session.completedExercises) {
      const ex = exerciseMap.get(compEx.exerciseId);
      if (!ex) continue;
      exercises.push({
        uid: `${compEx.exerciseId}_${Math.random().toString(36).substr(2, 6)}`,
        exerciseId: compEx.exerciseId,
        exercise: ex,
        sets: compEx.sets.map((s) => ({
          reps: s.reps,
          weight: s.weight ?? 0,
          rir: s.rir,
          completed: s.completed,
          side: s.side,
        })),
      });
    }

    return {
      name: session.workoutName,
      duration: closestDuration(session.durationSeconds || 0),
      exercises,
    };
  }, []);  // intentionally [] — snapshot on mount

  // Form state
  const [name, setName] = useState(initialState?.name ?? '');
  const [duration, setDuration] = useState(initialState?.duration ?? 60);
  const [editableExercises, setEditableExercises] = useState<EditableExercise[]>(
    initialState?.exercises ?? [],
  );
  const [isSaving, setIsSaving] = useState(false);

  // Track original state for dirty check
  const originalRef = useRef({
    name: initialState?.name ?? '',
    duration: initialState?.duration ?? 60,
    exercises: JSON.stringify(initialState?.exercises ?? []),
  });

  // Expanded exercise index
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Exercise picker state
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFocus, setSelectedFocus] = useState<BodyPart | 'all'>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | 'all'>('all');
  const [tempSelected, setTempSelected] = useState<Exercise[]>([]);

  // Dropdown state
  const [showFocusDropdown, setShowFocusDropdown] = useState(false);
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);

  // Exercise info sheet
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);

  // ─── Dirty check ───

  const isDirty = useMemo(() => {
    if (name !== originalRef.current.name) return true;
    if (duration !== originalRef.current.duration) return true;
    if (JSON.stringify(editableExercises) !== originalRef.current.exercises) return true;
    return false;
  }, [name, duration, editableExercises]);

  // ─── Session not found ───

  if (!session || !initialState) {
    return (
      <View style={[s.screen, { paddingTop: insets.top + 60 }]}>
        <Text style={s.notFoundText}>{i18n.t('calendarEdit.sessionNotFound')}</Text>
        <PressableScale style={s.notFoundBtn} onPress={() => router.back()} activeScale={0.97}>
          <Text style={s.notFoundBtnText}>{i18n.t('common.back')}</Text>
        </PressableScale>
      </View>
    );
  }

  // ─── Exercise actions ───

  const handleSetField = (exIdx: number, setIdx: number, field: keyof EditableSet, value: number) => {
    setEditableExercises((prev) => {
      const next = [...prev];
      const exercise = { ...next[exIdx], sets: [...next[exIdx].sets] };
      exercise.sets[setIdx] = { ...exercise.sets[setIdx], [field]: value };
      next[exIdx] = exercise;
      return next;
    });
  };

  const handleAddSet = (exIdx: number) => {
    setEditableExercises((prev) => {
      const next = [...prev];
      const exercise = { ...next[exIdx], sets: [...next[exIdx].sets] };
      const lastSet = exercise.sets[exercise.sets.length - 1];
      exercise.sets.push({
        reps: lastSet?.reps ?? 12,
        weight: lastSet?.weight ?? 0,
        rir: lastSet?.rir,
        completed: true,
      });
      next[exIdx] = exercise;
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    setEditableExercises((prev) => {
      const next = [...prev];
      const exercise = { ...next[exIdx], sets: [...next[exIdx].sets] };
      exercise.sets.splice(setIdx, 1);
      next[exIdx] = exercise;
      return next;
    });
  };

  const handleRemoveExercise = (exIdx: number) => {
    if (expandedIndex === exIdx) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > exIdx) setExpandedIndex(expandedIndex - 1);
    setEditableExercises((prev) => prev.filter((_, i) => i !== exIdx));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSetRir = (exIdx: number, setIdx: number, rir: number) => {
    handleSetField(exIdx, setIdx, 'rir', rir);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ─── Exercise picker ───

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
    const newExercises: EditableExercise[] = tempSelected.map((exercise, i) => ({
      uid: `${exercise.id}_new_${Date.now()}_${i}`,
      exerciseId: exercise.id,
      exercise,
      sets: [{ reps: 12, weight: 0, completed: true }, { reps: 12, weight: 0, completed: true }, { reps: 12, weight: 0, completed: true }],
      isNew: true,
    }));
    setEditableExercises((prev) => [...prev, ...newExercises]);
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

  // ─── Back with unsaved changes ───

  const handleBack = useCallback(() => {
    if (isDirty) {
      Alert.alert(
        i18n.t('calendarEdit.unsavedTitle'),
        i18n.t('calendarEdit.unsavedMessage'),
        [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          { text: i18n.t('calendarEdit.discard'), style: 'destructive', onPress: () => router.back() },
        ],
      );
    } else {
      router.back();
    }
  }, [isDirty, router]);

  // ─── Save ───

  const handleSave = () => {
    if (editableExercises.length === 0) return;

    setIsSaving(true);
    try {
      const completedExercises: CompletedExercise[] = editableExercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets.map((set) => {
          const cs: CompletedSet = {
            reps: set.reps,
            weight: set.weight > 0 ? set.weight : undefined,
            completed: set.completed,
          };
          if (set.rir !== undefined) cs.rir = set.rir;
          if (set.side) cs.side = set.side;
          return cs;
        }),
      }));

      updateSession(sessionId!, {
        workoutName: name.trim() || session.workoutName,
        durationSeconds: duration * 60,
        completedExercises,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert(i18n.t('common.error'), '');
    } finally {
      setIsSaving(false);
    }
  };

  // ═══════════════════════════════════════════════
  // EXERCISE PICKER (full-screen overlay)
  // ═══════════════════════════════════════════════

  if (showExercisePicker) {
    const focusLabel = selectedFocus === 'all'
      ? i18n.t('workouts.filters.focus')
      : FOCUS_OPTIONS.find((o) => o.value === selectedFocus)?.label || i18n.t('workouts.filters.focus');
    const equipLabel = selectedEquipment === 'all'
      ? i18n.t('workouts.filters.equipment')
      : EQUIPMENT_OPTIONS.find((o) => o.value === selectedEquipment)?.label || i18n.t('workouts.filters.equipment');

    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.pickerHeader}>
          <Pressable style={s.backButton} onPress={closePicker}>
            <X size={20} color={Colors.text} strokeWidth={IconStroke.default} />
          </Pressable>
          <Text style={s.pickerTitle}>{i18n.t('calendarEdit.addExercise')}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Search */}
        <View style={s.searchContainer}>
          <Search size={16} color="rgba(120,120,130,1)" strokeWidth={IconStroke.default} />
          <TextInput
            style={s.searchInput}
            placeholder={i18n.t('common.search')}
            placeholderTextColor="rgba(100,100,110,1)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={16} color="rgba(120,120,130,1)" strokeWidth={IconStroke.default} />
            </Pressable>
          )}
        </View>

        {/* Filter row */}
        <View style={s.filterRow}>
          <Pressable
            style={[s.filterPill, selectedFocus !== 'all' && s.filterPillActive]}
            onPress={() => setShowFocusDropdown(true)}
          >
            <Text style={[s.filterPillText, selectedFocus !== 'all' && s.filterPillTextActive]}>{focusLabel}</Text>
            <ChevronDown size={12} color={selectedFocus !== 'all' ? '#000' : 'rgba(140,140,150,1)'} strokeWidth={IconStroke.emphasis} />
          </Pressable>

          <Pressable
            style={[s.filterPill, selectedEquipment !== 'all' && s.filterPillActive]}
            onPress={() => setShowEquipmentDropdown(true)}
          >
            <Text style={[s.filterPillText, selectedEquipment !== 'all' && s.filterPillTextActive]}>{equipLabel}</Text>
            <ChevronDown size={12} color={selectedEquipment !== 'all' ? '#000' : 'rgba(140,140,150,1)'} strokeWidth={IconStroke.emphasis} />
          </Pressable>

          {(selectedFocus !== 'all' || selectedEquipment !== 'all') && (
            <Pressable onPress={() => { setSelectedFocus('all'); setSelectedEquipment('all'); }} style={s.clearButton}>
              <X size={14} color="#FF4B4B" strokeWidth={IconStroke.emphasis} />
            </Pressable>
          )}
        </View>

        {/* Exercise list */}
        <ScrollView style={s.exerciseList} contentContainerStyle={{ paddingBottom: insets.bottom + PageLayout.scrollPaddingBottom }} showsVerticalScrollIndicator={false}>
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
                  <Text style={s.exercisePickerName} numberOfLines={1}>{exercise.nameFr}</Text>
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
                  <Info size={16} color="rgba(140,140,150,1)" strokeWidth={IconStroke.default} />
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Selection bar */}
        {tempSelected.length > 0 && (
          <View style={[s.selectionBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <Text style={s.selectionText}>
              {tempSelected.length} {i18n.t('common.exercises')}
            </Text>
            <PressableScale style={s.addToWorkoutBtn} onPress={handleAddToWorkout} activeScale={0.97}>
              <Text style={s.addToWorkoutText}>{i18n.t('calendarEdit.addExercise')}</Text>
              <ArrowLeft size={16} color="#000" strokeWidth={IconStroke.emphasis} style={{ transform: [{ rotate: '180deg' }] }} />
            </PressableScale>
          </View>
        )}

        {/* Dropdown modals */}
        <DropdownModal
          visible={showFocusDropdown}
          title={i18n.t('workouts.filters.focus')}
          options={FOCUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          selected={selectedFocus}
          onSelect={(v) => { setSelectedFocus(v as any); setShowFocusDropdown(false); }}
          onClose={() => setShowFocusDropdown(false)}
        />
        <DropdownModal
          visible={showEquipmentDropdown}
          title={i18n.t('workouts.filters.equipment')}
          options={EQUIPMENT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          selected={selectedEquipment}
          onSelect={(v) => { setSelectedEquipment(v as any); setShowEquipmentDropdown(false); }}
          onClose={() => setShowEquipmentDropdown(false)}
        />

        <ExerciseInfoSheet exercise={infoExercise} onClose={() => setInfoExercise(null)} />
      </View>
    );
  }

  // ═══════════════════════════════════════════════
  // MAIN EDIT SCREEN
  // ═══════════════════════════════════════════════

  return (
    <View style={s.screen}>
      <View style={s.orbOrange} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + 12 }]}>
          <Pressable style={s.backButton} onPress={handleBack}>
            <ArrowLeft size={20} color={Colors.text} strokeWidth={IconStroke.default} />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>{i18n.t('calendarEdit.title')}</Text>
            <Text style={s.headerSub}>{formatDateDisplay(session.startTime)}</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + PageLayout.scrollPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Workout name */}
          <View style={s.nameContainer}>
            <TextInput
              style={s.nameInput}
              placeholder={session.workoutName}
              placeholderTextColor="rgba(100,100,110,1)"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Duration */}
          <View style={s.sectionBlock}>
            <Text style={s.sectionLabel}>{i18n.t('calendarLog.duration').toUpperCase()}</Text>
            <View style={s.durationRow}>
              {DURATION_PRESETS.map((d) => (
                <PressableScale
                  key={d}
                  activeScale={0.97}
                  onPress={() => { setDuration(d); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[s.durationText, duration === d && s.durationTextActive]}>
                    {d} {i18n.t('common.minAbbr')}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </View>

          {/* Exercises */}
          <View style={s.sectionBlock}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>{i18n.t('common.exercises').toUpperCase()}</Text>
              {editableExercises.length > 0 && (
                <Text style={s.exerciseCountBadge}>{editableExercises.length}</Text>
              )}
            </View>

            {editableExercises.map((ex, exIdx) => {
              const isExpanded = expandedIndex === exIdx;
              const totalSets = ex.sets.length;
              const isLast = exIdx === editableExercises.length - 1;
              // Summary: avg reps × total sets, weight range
              const avgReps = Math.round(ex.sets.reduce((sum, s) => sum + s.reps, 0) / totalSets);
              const weights = ex.sets.map((s) => s.weight).filter((w) => w > 0);
              const minW = weights.length > 0 ? Math.min(...weights) : 0;
              const maxW = weights.length > 0 ? Math.max(...weights) : 0;

              return (
                <View key={ex.uid}>
                  <Pressable
                    onPress={() => setExpandedIndex(isExpanded ? null : exIdx)}
                    style={[s.exRow, isExpanded && s.exRowEditing]}
                  >
                    {/* Number badge */}
                    <View style={s.exNumber}>
                      <Text style={s.exNumberText}>{String(exIdx + 1).padStart(2, '0')}</Text>
                    </View>

                    <ExerciseIcon
                      exerciseName={ex.exercise.name}
                      bodyPart={ex.exercise.bodyPart}
                      size={20}
                      containerSize={44}
                    />

                    <View style={s.exInfo}>
                      <Text style={s.exName} numberOfLines={1}>{ex.exercise.nameFr}</Text>
                      <View style={s.exMeta}>
                        <View style={s.exMetaPill}>
                          <Repeat size={10} color="rgba(255,255,255,0.4)" />
                          <Text style={s.exMetaText}>{totalSets}×{avgReps}</Text>
                        </View>
                        {maxW > 0 && (
                          <View style={[s.exMetaPill, s.exWeightPill]}>
                            <Text style={[s.exMetaText, s.exWeightText]}>
                              {minW === maxW
                                ? `${formatWeight(maxW)}${getWeightUnitLabel()}`
                                : `${formatWeight(minW)}-${formatWeight(maxW)}${getWeightUnitLabel()}`}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <Pressable
                      style={s.removeBtn}
                      onPress={() => handleRemoveExercise(exIdx)}
                      hitSlop={6}
                    >
                      <X size={14} color="#FF4B4B" strokeWidth={IconStroke.emphasis} />
                    </Pressable>
                  </Pressable>

                  {/* Expanded: per-set editor */}
                  {isExpanded && (
                    <View style={s.editorPanel}>
                      {ex.sets.map((set, setIdx) => (
                        <View key={setIdx} style={s.setBlock}>
                          {/* Set header */}
                          <View style={s.setHeader}>
                            <Text style={s.setLabel}>
                              {i18n.t('calendarEdit.setNumber', { n: setIdx + 1 })}
                            </Text>
                            {ex.sets.length > 1 && (
                              <Pressable
                                style={s.removeSetBtn}
                                onPress={() => handleRemoveSet(exIdx, setIdx)}
                                hitSlop={6}
                              >
                                <X size={12} color="#FF4B4B" strokeWidth={IconStroke.emphasis} />
                              </Pressable>
                            )}
                          </View>

                          {/* Reps stepper */}
                          <View style={s.editorRow}>
                            <Text style={s.editorFieldLabel}>{i18n.t('common.reps')}</Text>
                            <View style={s.stepperRow}>
                              <Pressable
                                style={s.stepperBtn}
                                onPress={() => handleSetField(exIdx, setIdx, 'reps', Math.max(1, set.reps - 1))}
                              >
                                <Minus size={14} color="#fff" />
                              </Pressable>
                              <Text style={s.stepperValue}>{set.reps}</Text>
                              <Pressable
                                style={s.stepperBtn}
                                onPress={() => handleSetField(exIdx, setIdx, 'reps', Math.min(50, set.reps + 1))}
                              >
                                <Plus size={14} color="#fff" />
                              </Pressable>
                            </View>
                          </View>

                          {/* Weight stepper */}
                          <View style={s.editorRow}>
                            <Text style={s.editorFieldLabel}>{i18n.t('calendarLog.weight')}</Text>
                            <View style={s.stepperRow}>
                              <Pressable
                                style={s.stepperBtn}
                                onPress={() => handleSetField(exIdx, setIdx, 'weight', Math.max(0, set.weight - 2.5))}
                              >
                                <Minus size={14} color="#fff" />
                              </Pressable>
                              <Text style={s.stepperValue}>{formatWeight(set.weight)}</Text>
                              <Pressable
                                style={s.stepperBtn}
                                onPress={() => handleSetField(exIdx, setIdx, 'weight', set.weight + 2.5)}
                              >
                                <Plus size={14} color="#fff" />
                              </Pressable>
                            </View>
                          </View>

                          {/* RIR dots */}
                          <View style={s.editorRow}>
                            <Text style={s.editorFieldLabel}>{i18n.t('workoutSession.rirLabel')}</Text>
                            <View style={s.rirDots}>
                              {[0, 1, 2, 3, 4].map((rir) => {
                                const isActive = set.rir === rir;
                                const color = RIR_COLORS[rir] || 'rgba(255,255,255,0.25)';
                                return (
                                  <Pressable
                                    key={rir}
                                    style={[
                                      s.rirDot,
                                      isActive && { backgroundColor: color },
                                    ]}
                                    onPress={() => handleSetRir(exIdx, setIdx, rir)}
                                    hitSlop={4}
                                  >
                                    <Text style={[s.rirDotText, isActive && { color: '#000' }]}>
                                      {rir}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          </View>
                        </View>
                      ))}

                      {/* Add set button */}
                      <PressableScale
                        style={s.addSetBtn}
                        activeScale={0.97}
                        onPress={() => handleAddSet(exIdx)}
                      >
                        <Plus size={14} color="rgba(255,255,255,0.5)" strokeWidth={IconStroke.default} />
                        <Text style={s.addSetText}>{i18n.t('calendarEdit.addSet')}</Text>
                      </PressableScale>
                    </View>
                  )}

                  {!isExpanded && !isLast && <View style={s.exSeparator} />}
                </View>
              );
            })}

            {/* Add exercise button */}
            <Pressable style={s.addExerciseBtn} onPress={() => setShowExercisePicker(true)}>
              <Plus size={20} color="rgba(120,120,130,1)" strokeWidth={IconStroke.default} />
              <Text style={s.addExerciseText}>{i18n.t('calendarEdit.addExercise').toUpperCase()}</Text>
            </Pressable>
          </View>

          {/* Save CTA */}
          <PressableScale
            style={[s.saveButton, (!isDirty || isSaving || editableExercises.length === 0) && s.saveButtonDisabled]}
            onPress={handleSave}
            activeScale={0.97}
            disabled={!isDirty || isSaving || editableExercises.length === 0}
          >
            <Check size={18} color="#000" strokeWidth={IconStroke.emphasis} />
            <Text style={s.saveButtonText}>{i18n.t('calendarEdit.saveChanges')}</Text>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>

      <ExerciseInfoSheet exercise={infoExercise} onClose={() => setInfoExercise(null)} />
    </View>
  );
}

// ─── Styles ───

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'relative',
    overflow: 'hidden',
  },
  orbOrange: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(249, 115, 22, 0.06)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 80,
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
    ...Header.backButton,
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
    textTransform: 'capitalize',
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: PageLayout.sectionGap,
  },

  // Name input
  nameContainer: {
    ...GlassStyle.card,
    padding: 18,
  },
  nameInput: {
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: Colors.text,
    padding: 0,
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
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  exerciseCountBadge: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Duration
  durationRow: {
    flexDirection: 'row',
    gap: 20,
  },
  durationText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  durationTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Exercise rows — flat rows matching log.tsx
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  exRowEditing: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
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
    color: 'rgba(220,220,230,1)',
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
  exSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 52,
  },
  removeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,75,75,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Per-set editor panel — matches log.tsx editorPanel style
  editorPanel: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  setBlock: {
    gap: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  setLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  removeSetBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,75,75,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 44,
    height: 44,
    borderRadius: 12,
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

  // RIR
  rirDots: {
    flexDirection: 'row',
    gap: 6,
  },
  rirDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rirDotText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Add set button
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginTop: 4,
  },
  addSetText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Add exercise button
  addExerciseBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  addExerciseText: {
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: 'rgba(120,120,130,1)',
    letterSpacing: 1,
  },

  // Save CTA
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: CTAButton.borderRadius,
    height: CTAButton.height,
  },
  saveButtonDisabled: { opacity: 0.35 },
  saveButtonText: {
    color: '#000',
    fontSize: CTAButton.fontSize,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // Not found
  notFoundText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  notFoundBtn: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  notFoundBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // ─── Picker styles ───

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

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlassStyle.card.backgroundColor,
    borderWidth: GlassStyle.card.borderWidth,
    borderColor: GlassStyle.card.borderColor,
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
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(255,75,75,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  exerciseList: { flex: 1 },

  exercisePickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    ...GlassStyle.card,
    padding: 12,
    marginBottom: 6,
    marginHorizontal: Spacing.lg,
    gap: 12,
  },
  exercisePickerCardSelected: {
    borderColor: 'rgba(255,107,53,0.4)',
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Selection bar
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
    borderRadius: CTAButton.borderRadius,
    paddingVertical: 15,
  },
  addToWorkoutText: {
    color: '#000',
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
});
