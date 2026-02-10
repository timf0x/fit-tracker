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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import {
  ArrowLeft,
  Plus,
  X,
  Search,
  ChevronDown,
  Minus,
  Info,
  Repeat,
  Timer,
} from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { ExerciseIcon, CategoryIcon } from '@/components/ExerciseIcon';
import { ExerciseInfoSheet } from '@/components/ExerciseInfoSheet';
import { useWorkoutStore } from '@/stores/workoutStore';
import { exercises as allExercises } from '@/data/exercises';
import type { WorkoutExercise, Exercise, BodyPart, Equipment } from '@/types';
import { DropdownModal } from '@/components/ui/DropdownModal';
import { getFocusOptions, getEquipmentOptions } from '@/constants/filterOptions';

// ─── Config ───────────────────────────────────────

const WORKOUT_ICONS = [
  { id: 'push', label: i18n.t('workoutCreate.icons.push') },
  { id: 'pull', label: i18n.t('workoutCreate.icons.pull') },
  { id: 'legs', label: i18n.t('workoutCreate.icons.legs') },
  { id: 'core', label: i18n.t('workoutCreate.icons.core') },
  { id: 'cardio', label: i18n.t('workoutCreate.icons.cardio') },
  { id: 'full_body', label: i18n.t('workoutCreate.icons.fullBody') },
  { id: 'upper', label: i18n.t('workoutCreate.icons.upper') },
  { id: 'lower', label: i18n.t('workoutCreate.icons.lower') },
];

const FOCUS_OPTIONS = getFocusOptions();
const EQUIPMENT_OPTIONS = getEquipmentOptions();

interface SelectedExercise extends WorkoutExercise {
  exercise: Exercise;
  uid: string;
}

// ─── Component ────────────────────────────────────

export default function CreateWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addCustomWorkout = useWorkoutStore((s) => s.addCustomWorkout);

  // Form state
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('push');
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

  // Inline editor state (replaces stepper modal)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // ─── Filtered exercises ─────────────────────────

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

  // ─── Exercise picker actions ────────────────────

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
      restTime: 60,
      setTime: 35,
      uid: `${exercise.id}_${Date.now()}_${i}`,
    }));
    setSelectedExercises([...selectedExercises, ...newExercises]);
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

  // ─── Inline editor actions ─────────────────────

  const handleEditField = (index: number, field: string, delta: number) => {
    setSelectedExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[index] };
      switch (field) {
        case 'sets':
          ex.sets = Math.max(1, ex.sets + delta);
          break;
        case 'reps':
          ex.reps = Math.max(1, ex.reps + delta);
          break;
        case 'weight':
          ex.weight = Math.max(0, (ex.weight || 0) + delta * 2.5);
          break;
        case 'restTime':
          ex.restTime = Math.max(15, ex.restTime + delta * 15);
          break;
        case 'setTime':
          ex.setTime = Math.max(10, (ex.setTime || 35) + delta * 5);
          break;
      }
      next[index] = ex;
      return next;
    });
  };

  // ─── Calculate duration ─────────────────────────

  const calculateDuration = () => {
    const totalSeconds = selectedExercises.reduce((acc, ex) => {
      return acc + ((ex.setTime || 35) + ex.restTime) * ex.sets;
    }, 0);
    return Math.ceil(totalSeconds / 60);
  };

  // ─── Drag reorder ─────────────────────────────────

  const handleDragEnd = ({ data }: { data: SelectedExercise[] }) => {
    setSelectedExercises(data);
  };

  // ─── Save ───────────────────────────────────────

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(i18n.t('common.error'), i18n.t('workoutCreate.errorNoName'));
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert(i18n.t('common.error'), i18n.t('workoutCreate.errorNoExercise'));
      return;
    }

    setIsSaving(true);
    try {
      const workoutExercises: WorkoutExercise[] = selectedExercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        restTime: ex.restTime,
        setTime: ex.setTime || 35,
      }));

      addCustomWorkout({
        name: name.trim(),
        nameFr: name.trim(),
        description: '',
        descriptionFr: '',
        level: 'intermediate',
        focus: selectedIcon as any,
        durationMinutes: calculateDuration(),
        exerciseCount: selectedExercises.length,
        exercises: workoutExercises,
        icon: selectedIcon,
      });

      router.back();
    } catch (error) {
      Alert.alert(i18n.t('common.error'), i18n.t('workoutCreate.errorCreate'));
    } finally {
      setIsSaving(false);
    }
  };

  // ═══════════════════════════════════════════════
  // EXERCISE PICKER SCREEN
  // ═══════════════════════════════════════════════

  if (showExercisePicker) {
    const focusLabel = selectedFocus === 'all' ? i18n.t('workouts.filters.focus') : FOCUS_OPTIONS.find((o) => o.value === selectedFocus)?.label || i18n.t('workouts.filters.focus');
    const equipLabel = selectedEquipment === 'all' ? i18n.t('workouts.filters.equipment') : EQUIPMENT_OPTIONS.find((o) => o.value === selectedEquipment)?.label || i18n.t('workouts.filters.equipment');

    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.pickerHeader}>
          <Pressable style={s.iconButton} onPress={closePicker}>
            <X size={20} color={Colors.text} strokeWidth={2} />
          </Pressable>
          <Text style={s.pickerTitle}>{i18n.t('workoutCreate.addExercisesModal')}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Search */}
        <View style={s.searchContainer}>
          <Search size={16} color="rgba(120,120,130,1)" strokeWidth={2} />
          <TextInput
            style={s.searchInput}
            placeholder={i18n.t('workoutCreate.searchPlaceholder')}
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

        {/* Filter row */}
        <View style={s.filterRow}>
          <Pressable
            style={[s.filterPill, selectedFocus !== 'all' && s.filterPillActive]}
            onPress={() => setShowFocusDropdown(true)}
          >
            <Text style={[s.filterPillText, selectedFocus !== 'all' && s.filterPillTextActive]}>{focusLabel}</Text>
            <ChevronDown size={12} color={selectedFocus !== 'all' ? '#000' : 'rgba(140,140,150,1)'} strokeWidth={2.5} />
          </Pressable>

          <Pressable
            style={[s.filterPill, selectedEquipment !== 'all' && s.filterPillActive]}
            onPress={() => setShowEquipmentDropdown(true)}
          >
            <Text style={[s.filterPillText, selectedEquipment !== 'all' && s.filterPillTextActive]}>{equipLabel}</Text>
            <ChevronDown size={12} color={selectedEquipment !== 'all' ? '#000' : 'rgba(140,140,150,1)'} strokeWidth={2.5} />
          </Pressable>

          {(selectedFocus !== 'all' || selectedEquipment !== 'all') && (
            <Pressable onPress={() => { setSelectedFocus('all'); setSelectedEquipment('all'); }} style={s.clearButton}>
              <X size={14} color="#FF4B4B" strokeWidth={2.5} />
            </Pressable>
          )}
        </View>

        {/* Exercise list */}
        <ScrollView style={s.exerciseList} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
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
                  <Info size={16} color="rgba(140,140,150,1)" strokeWidth={2} />
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Selection bar */}
        {tempSelected.length > 0 && (
          <View style={[s.selectionBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <Text style={s.selectionText}>
              {tempSelected.length > 1 ? i18n.t('workoutCreate.selectedCountPlural', { count: tempSelected.length }) : i18n.t('workoutCreate.selectedCount', { count: tempSelected.length })}
            </Text>
            <Pressable style={s.addToWorkoutBtn} onPress={handleAddToWorkout}>
              <Text style={s.addToWorkoutText}>{i18n.t('workoutCreate.addToWorkout')}</Text>
              <ArrowLeft size={16} color="#000" strokeWidth={2.5} style={{ transform: [{ rotate: '180deg' }] }} />
            </Pressable>
          </View>
        )}

        {/* Focus dropdown */}
        <DropdownModal
          visible={showFocusDropdown}
          title={i18n.t('workouts.filters.focus')}
          options={FOCUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          selected={selectedFocus}
          onSelect={(v) => { setSelectedFocus(v as any); setShowFocusDropdown(false); }}
          onClose={() => setShowFocusDropdown(false)}
        />

        {/* Equipment dropdown */}
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
  // MAIN CREATE SCREEN
  // ═══════════════════════════════════════════════

  return (
    <View style={s.screen}>
      <View style={s.orbOrange} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + 12 }]}>
          <Pressable style={s.iconButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.text} strokeWidth={2} />
          </Pressable>
          <Text style={s.headerTitle}>{i18n.t('workoutCreate.title')}</Text>
          <Pressable
            style={[s.saveButton, isSaving && s.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={s.saveButtonText}>{isSaving ? '...' : i18n.t('workoutCreate.save')}</Text>
          </Pressable>
        </View>

        <DraggableFlatList
          data={selectedExercises}
          onDragEnd={handleDragEnd}
          keyExtractor={(item) => item.uid}
          containerStyle={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Name */}
              <View style={s.nameContainer}>
                <TextInput
                  style={s.nameInput}
                  placeholder={i18n.t('workoutCreate.namePlaceholder')}
                  placeholderTextColor="rgba(100,100,110,1)"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Icon picker */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>{i18n.t('workoutCreate.iconSection')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.iconPickerRow}>
                  {WORKOUT_ICONS.map((icon) => (
                    <Pressable
                      key={icon.id}
                      style={[s.iconOption, selectedIcon === icon.id && s.iconOptionSelected]}
                      onPress={() => setSelectedIcon(icon.id)}
                    >
                      <CategoryIcon category={icon.id} size={22} containerSize={44} showBackground={false} />
                      <Text style={[s.iconOptionLabel, selectedIcon === icon.id && s.iconOptionLabelActive]}>
                        {icon.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Exercises section label */}
              <View style={s.sectionRow}>
                <Text style={s.sectionLabel}>{i18n.t('workoutCreate.exercisesSection')}</Text>
                {selectedExercises.length > 0 && (
                  <Text style={s.exerciseCountBadge}>{selectedExercises.length}</Text>
                )}
              </View>
            </>
          }
          renderItem={({ item: ex, drag, isActive, getIndex }) => {
            const index = getIndex()!;
            const isEditing = editingIndex === index;
            const isLast = index === selectedExercises.length - 1;
            return (
              <ScaleDecorator>
                <View
                  style={[
                    isActive && {
                      shadowColor: Colors.primary,
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 8 },
                      elevation: 10,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => setEditingIndex(isEditing ? null : index)}
                    onLongPress={drag}
                    disabled={isActive}
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
                        {(ex.weight || 0) > 0 && (
                          <View style={[s.exMetaPill, s.exWeightPill]}>
                            <Text style={[s.exMetaText, s.exWeightText]}>{ex.weight}kg</Text>
                          </View>
                        )}
                        <View style={s.exMetaPill}>
                          <Timer size={10} color="rgba(255,255,255,0.3)" />
                          <Text style={s.exMetaText}>{ex.restTime}s</Text>
                        </View>
                      </View>
                    </View>

                    <Pressable
                      style={s.removeBtn}
                      onPress={() => {
                        if (editingIndex === index) setEditingIndex(null);
                        setSelectedExercises(prev => prev.filter((_, i) => i !== index));
                      }}
                      hitSlop={6}
                    >
                      <X size={14} color="#FF4B4B" strokeWidth={2.5} />
                    </Pressable>
                  </Pressable>

                  {/* Inline editor */}
                  {isEditing && (
                    <View style={s.editorPanel}>
                      <View style={s.editorRow}>
                        <Text style={s.editorFieldLabel}>{i18n.t('workoutCreate.sets')}</Text>
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
                        <Text style={s.editorFieldLabel}>{i18n.t('workoutCreate.reps')}</Text>
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
                        <Text style={s.editorFieldLabel}>{i18n.t('workoutCreate.weight')}</Text>
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
                        <Text style={s.editorFieldLabel}>{i18n.t('workoutCreate.rest')}</Text>
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
                        <Text style={s.editorFieldLabel}>{i18n.t('workoutCreate.timePerSet')}</Text>
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
              </ScaleDecorator>
            );
          }}
          ListFooterComponent={
            <View style={{ marginTop: 4 }}>
              <Pressable style={s.addExerciseBtn} onPress={() => setShowExercisePicker(true)}>
                <Plus size={20} color="rgba(120,120,130,1)" strokeWidth={2} />
                <Text style={s.addExerciseText}>{i18n.t('workoutCreate.addExercise')}</Text>
              </Pressable>
            </View>
          }
        />
      </KeyboardAvoidingView>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0C0C0C',
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: {
    color: '#000',
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // Name
  nameContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    marginBottom: 20,
  },
  nameInput: {
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: Colors.text,
    padding: 18,
  },

  // Section
  section: { marginBottom: 24 },
  sectionLabel: {
    color: 'rgba(120,120,130,1)',
    fontSize: 10,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseCountBadge: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  // Icon picker (lightened)
  iconPickerRow: { gap: 8 },
  iconOption: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minWidth: 70,
  },
  iconOptionSelected: {
    borderColor: 'rgba(255,107,53,0.4)',
    backgroundColor: 'rgba(255,107,53,0.08)',
  },
  iconOptionLabel: {
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(120,120,130,1)',
    marginTop: 6,
  },
  iconOptionLabelActive: {
    color: Colors.primary,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // ─── Exercise rows (generate.tsx pattern) ──────

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
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,75,75,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Inline editor ────────────────────────────

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

  // Add exercise button
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

  // ─── Picker ────────────────────────────────────

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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
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
    width: 32,
    height: 32,
    borderRadius: 10,
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
    borderRadius: 14,
    paddingVertical: 15,
  },
  addToWorkoutText: {
    color: '#000',
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

});
