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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import {
  ArrowLeft,
  Plus,
  X,
  Search,
  Check,
  ChevronDown,
  Minus as MinusIcon,
} from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { ExerciseIcon, CategoryIcon } from '@/components/ExerciseIcon';
import { useWorkoutStore } from '@/stores/workoutStore';
import { exercises as allExercises } from '@/data/exercises';
import type { WorkoutExercise, Exercise, BodyPart, Equipment } from '@/types';

// ─── Config ───────────────────────────────────────

const WORKOUT_ICONS = [
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'legs', label: 'Jambes' },
  { id: 'core', label: 'Abdos' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'full_body', label: 'Full Body' },
  { id: 'upper', label: 'Haut' },
  { id: 'lower', label: 'Bas' },
];

const FOCUS_OPTIONS: { value: BodyPart | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'chest', label: 'Pectoraux' },
  { value: 'back', label: 'Dos' },
  { value: 'shoulders', label: 'Épaules' },
  { value: 'upper legs', label: 'Jambes' },
  { value: 'upper arms', label: 'Bras' },
  { value: 'waist', label: 'Abdos' },
  { value: 'cardio', label: 'Cardio' },
];

const EQUIPMENT_OPTIONS: { value: Equipment | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'dumbbell', label: 'Haltères' },
  { value: 'barbell', label: 'Barre' },
  { value: 'cable', label: 'Câble' },
  { value: 'machine', label: 'Machine' },
  { value: 'body weight', label: 'Poids du corps' },
  { value: 'kettlebell', label: 'Kettlebell' },
];

interface SelectedExercise extends WorkoutExercise {
  exercise: Exercise;
  uid: string;
}

type EditingParam = 'sets' | 'reps' | 'weight' | 'restTime' | null;

// ─── Component ────────────────────────────────────

export default function CreateWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addCustomWorkout = useWorkoutStore((s) => s.addCustomWorkout);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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

  // Parameter stepper state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingParam, setEditingParam] = useState<EditingParam>(null);
  const [editingValue, setEditingValue] = useState(0);

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

  // ─── Parameter stepper actions ──────────────────

  const openParamStepper = (index: number, param: EditingParam) => {
    const ex = selectedExercises[index];
    let value = 0;
    if (param === 'sets') value = ex.sets;
    else if (param === 'reps') value = ex.reps;
    else if (param === 'weight') value = ex.weight || 0;
    else if (param === 'restTime') value = ex.restTime;
    setEditingIndex(index);
    setEditingParam(param);
    setEditingValue(value);
  };

  const updateParamValue = (delta: number) => {
    let newVal = editingValue + delta;
    if (editingParam === 'restTime') newVal = Math.max(15, Math.min(300, newVal));
    else if (editingParam === 'weight') newVal = Math.max(0, newVal);
    else newVal = Math.max(1, Math.min(50, newVal));
    setEditingValue(newVal);
  };

  const saveParamValue = () => {
    if (editingIndex === null || !editingParam) return;
    setSelectedExercises(
      selectedExercises.map((ex, i) =>
        i === editingIndex ? { ...ex, [editingParam!]: editingValue } : ex
      )
    );
    setEditingIndex(null);
    setEditingParam(null);
  };

  const getParamLabel = (p: EditingParam) => {
    if (p === 'sets') return 'SÉRIES';
    if (p === 'reps') return 'RÉPÉTITIONS';
    if (p === 'weight') return 'POIDS (KG)';
    if (p === 'restTime') return 'REPOS (SEC)';
    return '';
  };

  const getQuickOptions = (p: EditingParam) => {
    if (p === 'sets') return [3, 4, 5];
    if (p === 'reps') return [8, 12, 15];
    if (p === 'weight') return [10, 20, 40];
    if (p === 'restTime') return [30, 60, 90];
    return [];
  };

  // ─── Calculate duration ─────────────────────────

  const calculateDuration = () => {
    const totalSeconds = selectedExercises.reduce((acc, ex) => {
      return acc + (45 + ex.restTime) * ex.sets;
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
      Alert.alert('Erreur', 'Entrez un nom pour le workout');
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins un exercice');
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
      }));

      addCustomWorkout({
        name: name.trim(),
        nameFr: name.trim(),
        description: description.trim(),
        descriptionFr: description.trim(),
        level: 'intermediate',
        focus: selectedIcon as any,
        durationMinutes: calculateDuration(),
        exerciseCount: selectedExercises.length,
        exercises: workoutExercises,
        icon: selectedIcon,
      });

      router.back();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le workout');
    } finally {
      setIsSaving(false);
    }
  };

  // ═══════════════════════════════════════════════
  // EXERCISE PICKER SCREEN
  // ═══════════════════════════════════════════════

  if (showExercisePicker) {
    const focusLabel = selectedFocus === 'all' ? 'Focus' : FOCUS_OPTIONS.find((o) => o.value === selectedFocus)?.label || 'Focus';
    const equipLabel = selectedEquipment === 'all' ? 'Équipement' : EQUIPMENT_OPTIONS.find((o) => o.value === selectedEquipment)?.label || 'Équipement';

    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.pickerHeader}>
          <Pressable style={s.iconButton} onPress={closePicker}>
            <X size={20} color={Colors.text} strokeWidth={2} />
          </Pressable>
          <Text style={s.pickerTitle}>Ajouter des exercices</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Search */}
        <View style={s.searchContainer}>
          <Search size={16} color="rgba(120,120,130,1)" strokeWidth={2} />
          <TextInput
            style={s.searchInput}
            placeholder="Rechercher un exercice..."
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
          <Text style={s.resultCount}>{filteredExercises.length} exercices</Text>
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
                {isSelected ? (
                  <View style={s.checkCircle}>
                    <Check size={14} color="#fff" strokeWidth={3} />
                  </View>
                ) : (
                  <Plus size={20} color="rgba(120,120,130,1)" strokeWidth={2} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Selection bar */}
        {tempSelected.length > 0 && (
          <View style={[s.selectionBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <Text style={s.selectionText}>
              {tempSelected.length} exercice{tempSelected.length > 1 ? 's' : ''} sélectionné{tempSelected.length > 1 ? 's' : ''}
            </Text>
            <Pressable style={s.addToWorkoutBtn} onPress={handleAddToWorkout}>
              <Text style={s.addToWorkoutText}>Ajouter au workout</Text>
              <ArrowLeft size={16} color="#000" strokeWidth={2.5} style={{ transform: [{ rotate: '180deg' }] }} />
            </Pressable>
          </View>
        )}

        {/* Focus dropdown */}
        <DropdownModal
          visible={showFocusDropdown}
          title="Focus"
          options={FOCUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          selected={selectedFocus}
          onSelect={(v) => { setSelectedFocus(v as any); setShowFocusDropdown(false); }}
          onClose={() => setShowFocusDropdown(false)}
        />

        {/* Equipment dropdown */}
        <DropdownModal
          visible={showEquipmentDropdown}
          title="Équipement"
          options={EQUIPMENT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          selected={selectedEquipment}
          onSelect={(v) => { setSelectedEquipment(v as any); setShowEquipmentDropdown(false); }}
          onClose={() => setShowEquipmentDropdown(false)}
        />
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
          <Text style={s.headerTitle}>Nouveau Workout</Text>
          <Pressable
            style={[s.saveButton, isSaving && s.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={s.saveButtonText}>{isSaving ? '...' : 'Sauver'}</Text>
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
                  placeholder="Nom du workout"
                  placeholderTextColor="rgba(100,100,110,1)"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Description */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>DESCRIPTION (OPTIONNEL)</Text>
                <View style={s.descContainer}>
                  <TextInput
                    style={s.descInput}
                    placeholder="Focus sur les mouvements composés..."
                    placeholderTextColor="rgba(100,100,110,1)"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />
                </View>
              </View>

              {/* Icon picker */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>ICÔNE</Text>
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
                <Text style={s.sectionLabel}>EXERCICES</Text>
                {selectedExercises.length > 0 && (
                  <Text style={s.exerciseCountBadge}>{selectedExercises.length}</Text>
                )}
              </View>
            </>
          }
          renderItem={({ item: ex, drag, isActive, getIndex }) => {
            const index = getIndex()!;
            return (
              <ScaleDecorator>
                <Pressable
                  onLongPress={drag}
                  disabled={isActive}
                  style={[
                    s.exerciseCard,
                    isActive && {
                      shadowColor: Colors.primary,
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 8 },
                      elevation: 10,
                    },
                  ]}
                >
                  <View style={s.exerciseCardHeader}>
                    <ExerciseIcon
                      exerciseName={ex.exercise.name}
                      bodyPart={ex.exercise.bodyPart}
                      size={16}
                      containerSize={40}
                    />
                    <View style={s.exerciseCardInfo}>
                      <Text style={s.exerciseCardName} numberOfLines={1}>{ex.exercise.nameFr}</Text>
                      <Text style={s.exerciseCardMeta}>
                        {ex.sets} séries × {ex.reps} reps{ex.weight ? ` · ${ex.weight} kg` : ''}
                      </Text>
                    </View>
                    <Pressable style={s.removeBtn} onPress={() => setSelectedExercises(prev => prev.filter((_, i) => i !== index))}>
                      <X size={14} color="#FF4B4B" strokeWidth={2.5} />
                    </Pressable>
                  </View>

                  <View style={s.paramGrid}>
                    <Pressable style={s.paramCell} onPress={() => openParamStepper(index, 'sets')}>
                      <Text style={s.paramLabel}>SÉRIES</Text>
                      <Text style={s.paramValue}>{ex.sets}</Text>
                    </Pressable>
                    <Pressable style={s.paramCell} onPress={() => openParamStepper(index, 'reps')}>
                      <Text style={s.paramLabel}>REPS</Text>
                      <Text style={s.paramValue}>{ex.reps}</Text>
                    </Pressable>
                    <Pressable style={s.paramCell} onPress={() => openParamStepper(index, 'weight')}>
                      <Text style={s.paramLabel}>POIDS</Text>
                      <Text style={s.paramValue}>{ex.weight || 0} kg</Text>
                    </Pressable>
                    <Pressable style={s.paramCell} onPress={() => openParamStepper(index, 'restTime')}>
                      <Text style={s.paramLabel}>REPOS</Text>
                      <Text style={s.paramValue}>{ex.restTime}s</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </ScaleDecorator>
            );
          }}
          ListFooterComponent={
            <View style={{ marginTop: 4 }}>
              <Pressable style={s.addExerciseBtn} onPress={() => setShowExercisePicker(true)}>
                <Plus size={20} color="rgba(120,120,130,1)" strokeWidth={2} />
                <Text style={s.addExerciseText}>AJOUTER UN EXERCICE</Text>
              </Pressable>
            </View>
          }
        />
      </KeyboardAvoidingView>

      {/* Parameter stepper modal */}
      <Modal
        visible={editingIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => { setEditingIndex(null); setEditingParam(null); }}
      >
        <View style={s.modalOverlay}>
          <View style={s.stepperModal}>
            {editingIndex !== null && editingParam && (
              <>
                <View style={s.stepperHeader}>
                  <ExerciseIcon
                    exerciseName={selectedExercises[editingIndex]?.exercise.name}
                    bodyPart={selectedExercises[editingIndex]?.exercise.bodyPart}
                    size={16}
                    containerSize={40}
                  />
                  <View style={s.stepperInfo}>
                    <Text style={s.stepperLabel}>{getParamLabel(editingParam)}</Text>
                    <Text style={s.stepperName} numberOfLines={1}>
                      {selectedExercises[editingIndex]?.exercise.nameFr}
                    </Text>
                  </View>
                  <Pressable onPress={() => { setEditingIndex(null); setEditingParam(null); }}>
                    <X size={20} color="rgba(120,120,130,1)" strokeWidth={2} />
                  </Pressable>
                </View>

                {/* Stepper controls */}
                <View style={s.stepperControls}>
                  <Pressable
                    style={s.stepperBtn}
                    onPress={() => updateParamValue(editingParam === 'restTime' ? -15 : editingParam === 'weight' ? -5 : -1)}
                  >
                    <MinusIcon size={24} color={Colors.text} strokeWidth={2} />
                  </Pressable>
                  <Text style={s.stepperValue}>
                    {editingValue}
                    <Text style={s.stepperUnit}>
                      {editingParam === 'weight' ? ' kg' : editingParam === 'restTime' ? 's' : ''}
                    </Text>
                  </Text>
                  <Pressable
                    style={[s.stepperBtn, s.stepperBtnPlus]}
                    onPress={() => updateParamValue(editingParam === 'restTime' ? 15 : editingParam === 'weight' ? 5 : 1)}
                  >
                    <Plus size={24} color="#000" strokeWidth={2} />
                  </Pressable>
                </View>

                {/* Quick select */}
                <View style={s.quickRow}>
                  {getQuickOptions(editingParam).map((val) => (
                    <Pressable
                      key={val}
                      style={[s.quickChip, editingValue === val && s.quickChipActive]}
                      onPress={() => setEditingValue(val)}
                    >
                      <Text style={[s.quickChipText, editingValue === val && s.quickChipTextActive]}>
                        {val}{editingParam === 'restTime' ? 's' : editingParam === 'weight' ? ' kg' : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Update button */}
                <Pressable style={s.updateBtn} onPress={saveParamValue}>
                  <Text style={s.updateBtnText}>Valider</Text>
                  <Check size={18} color="#000" strokeWidth={2.5} />
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Dropdown Modal Component ─────────────────────

function DropdownModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <View style={s.dropdownModal}>
          <View style={s.dropdownHeader}>
            <Text style={s.dropdownTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <X size={18} color={Colors.text} strokeWidth={2} />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            {options.map((opt) => (
              <Pressable
                key={opt.value}
                style={[s.dropdownOption, selected === opt.value && s.dropdownOptionActive]}
                onPress={() => onSelect(opt.value)}
              >
                <Text style={[s.dropdownOptionText, selected === opt.value && s.dropdownOptionTextActive]}>
                  {opt.label}
                </Text>
                {selected === opt.value && <Check size={16} color={Colors.primary} strokeWidth={2.5} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050505',
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
    borderRadius: 14,
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

  content: {
    flex: 1,
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

  // Description
  descContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
  },
  descInput: {
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: Colors.text,
    padding: 16,
    minHeight: 72,
    textAlignVertical: 'top',
  },

  // Icon picker
  iconPickerRow: { gap: 8 },
  iconOption: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 74,
  },
  iconOptionSelected: {
    borderColor: Colors.primary,
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

  // Exercise card
  exerciseCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  exerciseCardInfo: { flex: 1 },
  exerciseCardName: {
    color: 'rgba(220,220,230,1)',
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  exerciseCardMeta: {
    color: 'rgba(120,120,130,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,75,75,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Param grid
  paramGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  paramCell: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  paramCellHighlight: {
    backgroundColor: 'rgba(255,107,53,0.06)',
  },
  paramLabel: {
    fontSize: 9,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: 'rgba(100,100,110,1)',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  paramLabelHighlight: { color: Colors.primary },
  paramValue: {
    fontSize: 16,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: Colors.text,
  },
  paramValueHighlight: { color: Colors.primary },

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
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
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

  // ─── Dropdown modal ────────────────────────────

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dropdownModal: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(28,28,32,0.98)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  dropdownTitle: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dropdownOptionActive: {
    backgroundColor: 'rgba(255,107,53,0.06)',
  },
  dropdownOptionText: {
    color: 'rgba(180,180,190,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  dropdownOptionTextActive: {
    color: Colors.primary,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // ─── Stepper modal ─────────────────────────────

  stepperModal: {
    backgroundColor: 'rgba(28,28,32,0.98)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    maxWidth: 360,
    padding: 24,
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  stepperInfo: { flex: 1 },
  stepperLabel: {
    color: 'rgba(120,120,130,1)',
    fontSize: 10,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 1,
  },
  stepperName: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  stepperBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnPlus: {
    backgroundColor: Colors.primary,
  },
  stepperValue: {
    fontSize: 44,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 100,
    textAlign: 'center',
  },
  stepperUnit: {
    fontSize: 16,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(140,140,150,1)',
  },

  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  quickChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
  },
  quickChipActive: {
    backgroundColor: 'rgba(255,107,53,0.15)',
  },
  quickChipText: {
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: 'rgba(140,140,150,1)',
  },
  quickChipTextActive: {
    color: Colors.primary,
  },

  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
  },
  updateBtnText: {
    color: '#000',
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
});
