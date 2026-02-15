import { useState, useMemo } from 'react';
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
  Search,
  ChevronDown,
  Minus,
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
import { TARGET_TO_MUSCLE, getMuscleLabel } from '@/lib/muscleMapping';
import { formatWeight, getWeightUnitLabel } from '@/stores/settingsStore';
import type { Exercise, BodyPart, Equipment, CompletedExercise, CompletedSet } from '@/types';

// ─── Config ───

const FOCUS_OPTIONS = getFocusOptions();
const EQUIPMENT_OPTIONS = getEquipmentOptions();

const DURATION_PRESETS = [30, 45, 60, 75, 90];

interface SelectedExercise {
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  weight: number;
  uid: string;
}

/** Generate a workout name from the muscles targeted */
function autoWorkoutName(exercises: SelectedExercise[]): string {
  const muscles = new Set<string>();
  for (const ex of exercises) {
    const muscle = TARGET_TO_MUSCLE[ex.exercise.target];
    if (muscle) muscles.add(muscle);
  }
  if (muscles.size === 0) return '';
  const labels = Array.from(muscles).slice(0, 3).map((m) => getMuscleLabel(m));
  return labels.join(' + ');
}

/** Format the selected date for display */
function formatDateDisplay(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const locale = i18n.locale === 'fr' ? 'fr-FR' : 'en-US';
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// ─── Component ───

export default function LogPastWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { date } = useLocalSearchParams<{ date: string }>();
  const logPastWorkout = useWorkoutStore((s) => s.logPastWorkout);

  const dateISO = date || new Date().toISOString().split('T')[0];

  // Form state
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(60);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Exercise picker state
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFocus, setSelectedFocus] = useState<BodyPart | 'all'>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | 'all'>('all');
  const [tempSelected, setTempSelected] = useState<Exercise[]>([]);

  // Dropdown state
  const [showFocusDropdown, setShowFocusDropdown] = useState(false);
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);

  // Exercise info sheet state
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);

  // Inline editor state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Auto-generated name from muscles
  const autoName = useMemo(() => autoWorkoutName(selectedExercises), [selectedExercises]);

  // ─── Filtered exercises ───

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

  // ─── Exercise picker actions ───

  const toggleExercise = (exercise: Exercise) => {
    const exists = tempSelected.some((e) => e.id === exercise.id);
    setTempSelected(exists ? tempSelected.filter((e) => e.id !== exercise.id) : [...tempSelected, exercise]);
  };

  const handleAddToWorkout = () => {
    const newExercises: SelectedExercise[] = tempSelected.map((exercise, i) => ({
      exerciseId: exercise.id,
      exercise,
      sets: 4,
      reps: 12,
      weight: 0,
      uid: `${exercise.id}_${Date.now()}_${i}`,
    }));
    setSelectedExercises((prev) => [...prev, ...newExercises]);
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

  // ─── Inline editor actions ───

  const handleEditField = (index: number, field: string, delta: number) => {
    setSelectedExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[index] };
      switch (field) {
        case 'sets':
          ex.sets = Math.max(1, Math.min(10, ex.sets + delta));
          break;
        case 'reps':
          ex.reps = Math.max(1, Math.min(30, ex.reps + delta));
          break;
        case 'weight':
          ex.weight = Math.max(0, ex.weight + delta * 2.5);
          break;
      }
      next[index] = ex;
      return next;
    });
  };

  // ─── Save ───

  const handleSave = () => {
    if (selectedExercises.length === 0) {
      Alert.alert(i18n.t('common.error'), i18n.t('calendarLog.noExercises'));
      return;
    }

    setIsSaving(true);
    try {
      const workoutName = (name.trim() || autoName || i18n.t('calendarLog.title')).trim();

      // Convert to CompletedExercise[] — all sets marked completed
      const completedExercises: CompletedExercise[] = selectedExercises.map((ex) => {
        const sets: CompletedSet[] = Array.from({ length: ex.sets }, () => ({
          reps: ex.reps,
          weight: ex.weight > 0 ? ex.weight : undefined,
          completed: true,
        }));
        return {
          exerciseId: ex.exerciseId,
          sets,
        };
      });

      logPastWorkout({
        dateISO,
        workoutName,
        durationMinutes: duration,
        exercises: completedExercises,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert(i18n.t('common.error'), i18n.t('calendarLog.noExercises'));
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
          <Text style={s.pickerTitle}>{i18n.t('calendarLog.addExercise')}</Text>
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
              <Text style={s.addToWorkoutText}>{i18n.t('calendarLog.addExercise')}</Text>
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
  // MAIN LOG SCREEN
  // ═══════════════════════════════════════════════

  return (
    <View style={s.screen}>
      <View style={s.orbOrange} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header — matches generate.tsx pattern */}
        <View style={[s.header, { paddingTop: insets.top + 12 }]}>
          <Pressable style={s.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.text} strokeWidth={IconStroke.default} />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>{i18n.t('calendarLog.title')}</Text>
            <Text style={s.headerSub}>{formatDateDisplay(dateISO)}</Text>
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
              placeholder={i18n.t('calendarLog.namePlaceholder')}
              placeholderTextColor="rgba(100,100,110,1)"
              value={name}
              onChangeText={setName}
            />
            {!name && autoName ? (
              <Text style={s.autoNameHint}>{autoName}</Text>
            ) : null}
          </View>

          {/* Duration — plain text tabs (no bordered pills) */}
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

          {/* Exercises section */}
          <View style={s.sectionBlock}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>{i18n.t('common.exercises').toUpperCase()}</Text>
              {selectedExercises.length > 0 && (
                <Text style={s.exerciseCountBadge}>{selectedExercises.length}</Text>
              )}
            </View>

            {selectedExercises.map((ex, index) => {
              const isEditing = editingIndex === index;
              const isLast = index === selectedExercises.length - 1;
              return (
                <View key={ex.uid}>
                  <Pressable
                    onPress={() => setEditingIndex(isEditing ? null : index)}
                    style={[s.exRow, isEditing && s.exRowEditing]}
                  >
                    {/* Number badge */}
                    <View style={s.exNumber}>
                      <Text style={s.exNumberText}>{String(index + 1).padStart(2, '0')}</Text>
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
                          <Text style={s.exMetaText}>{ex.sets}×{ex.reps}</Text>
                        </View>
                        {ex.weight > 0 && (
                          <View style={[s.exMetaPill, s.exWeightPill]}>
                            <Text style={[s.exMetaText, s.exWeightText]}>
                              {formatWeight(ex.weight)}{getWeightUnitLabel()}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <Pressable
                      style={s.removeBtn}
                      onPress={() => {
                        if (editingIndex === index) setEditingIndex(null);
                        setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
                      }}
                      hitSlop={6}
                    >
                      <X size={14} color="#FF4B4B" strokeWidth={IconStroke.emphasis} />
                    </Pressable>
                  </Pressable>

                  {/* Inline editor */}
                  {isEditing && (
                    <View style={s.editorPanel}>
                      <View style={s.editorRow}>
                        <Text style={s.editorFieldLabel}>{i18n.t('calendarLog.sets')}</Text>
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
                        <Text style={s.editorFieldLabel}>{i18n.t('calendarLog.reps')}</Text>
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
                        <Text style={s.editorFieldLabel}>{i18n.t('calendarLog.weight')}</Text>
                        <View style={s.stepperRow}>
                          <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'weight', -1)}>
                            <Minus size={14} color="#fff" />
                          </Pressable>
                          <Text style={s.stepperValue}>{formatWeight(ex.weight)}</Text>
                          <Pressable style={s.stepperBtn} onPress={() => handleEditField(index, 'weight', 1)}>
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

            {/* Add exercise button */}
            <Pressable style={s.addExerciseBtn} onPress={() => setShowExercisePicker(true)}>
              <Plus size={20} color="rgba(120,120,130,1)" strokeWidth={IconStroke.default} />
              <Text style={s.addExerciseText}>{i18n.t('calendarLog.addExercise').toUpperCase()}</Text>
            </Pressable>
          </View>

          {/* Save CTA */}
          <PressableScale
            style={[s.saveButton, (isSaving || selectedExercises.length === 0) && s.saveButtonDisabled]}
            onPress={handleSave}
            activeScale={0.97}
            disabled={isSaving || selectedExercises.length === 0}
          >
            <Check size={18} color="#000" strokeWidth={IconStroke.emphasis} />
            <Text style={s.saveButtonText}>{i18n.t('calendarLog.save')}</Text>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
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

  // Header — matches generate.tsx
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

  // Scroll content — gap-based spacing (matches generate.tsx)
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
  autoNameHint: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 6,
  },

  // Section blocks — matches generate.tsx sectionBlock
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

  // Duration — plain text tabs (matches generate.tsx exactly)
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

  // Exercise rows
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

  // Inline editor
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
