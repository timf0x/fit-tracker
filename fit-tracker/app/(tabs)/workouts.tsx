import { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { Plus, Dumbbell, Trash2 } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Spacing, GlassStyle, Header, PageLayout, IconStroke } from '@/constants/theme';
import { WorkoutListCard } from '@/components/workouts/WorkoutListCard';
import { SmartSuggestionCard } from '@/components/workouts/SmartSuggestionCard';
import { useWorkoutStore } from '@/stores/workoutStore';
import { computeSmartSuggestion } from '@/lib/smartWorkout';
import i18n from '@/lib/i18n';

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const history = useWorkoutStore((s) => s.history);
  const customWorkouts = useWorkoutStore((s) => s.customWorkouts);
  const deleteCustomWorkout = useWorkoutStore((s) => s.deleteCustomWorkout);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const suggestion = useMemo(
    () => computeSmartSuggestion(history),
    [history],
  );

  const handleLongPress = useCallback((id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDeleteTarget({ id, name });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteCustomWorkout(deleteTarget.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteCustomWorkout]);

  const handleAdd = () => router.push('/workout/create');

  const handleGenerate = () => {
    router.push({
      pathname: '/workout/generate',
      params: {
        suggestedMuscles: JSON.stringify(suggestion.muscles.map((m) => m.muscle)),
        sessionType: suggestion.sessionType,
      },
    });
  };

  const handleCreateManual = () => router.push('/workout/create');
  const handleCreateProgram = () => router.push('/program/onboarding');

  return (
    <View style={styles.screen}>
      {/* Ambient orbs */}
      <View style={styles.orbOrange} />
      <View style={styles.orbBlue} />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('workouts.title')}</Text>
          <Pressable style={styles.addButton} onPress={handleAdd}>
            <Plus size={20} color={Colors.primary} strokeWidth={IconStroke.emphasis} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + PageLayout.scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Smart Suggestion Hero Card */}
        <View style={styles.section}>
          <SmartSuggestionCard
            suggestion={suggestion}
            onGenerate={handleGenerate}
            onCreateManual={handleCreateManual}
            onCreateProgram={handleCreateProgram}
          />
        </View>

        {/* Custom Workouts */}
        {customWorkouts.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>{i18n.t('workouts.myWorkouts')}</Text>
              <Text style={styles.groupCount}>{customWorkouts.length}</Text>
            </View>
            <View style={styles.groupList}>
              {customWorkouts.map((workout) => (
                <WorkoutListCard
                  key={workout.id}
                  workout={workout}
                  onPress={() => router.push(`/workout/${workout.id}`)}
                  onLongPress={() => handleLongPress(workout.id, workout.nameFr)}
                />
              ))}
            </View>
          </View>
        ) : suggestion.hasHistory ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Dumbbell size={28} color="rgba(120, 120, 130, 1)" strokeWidth={IconStroke.light} />
            </View>
            <Text style={styles.emptyTitle}>
              {i18n.t('workouts.noCustom')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {i18n.t('workouts.noCustomDesc')}
            </Text>
            <Pressable style={styles.createButton} onPress={handleCreateManual}>
              <Plus size={14} color={Colors.primary} strokeWidth={IconStroke.emphasis} />
              <Text style={styles.createButtonText}>
                {i18n.t('workouts.createWorkout')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setDeleteTarget(null)}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Trash2 size={22} color="#EF4444" strokeWidth={2} />
            </View>
            <Text style={styles.modalTitle}>{i18n.t('workouts.deleteTitle')}</Text>
            <Text style={styles.modalDesc}>
              {deleteTarget?.name ? `« ${deleteTarget.name} »\n` : ''}
              {i18n.t('workouts.deleteMessage')}
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalDeleteBtn} onPress={confirmDelete}>
                <Text style={styles.modalDeleteText}>{i18n.t('common.delete')}</Text>
              </Pressable>
              <Pressable style={styles.modalCancelBtn} onPress={() => setDeleteTarget(null)}>
                <Text style={styles.modalCancelText}>{i18n.t('common.cancel')}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
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

  // Ambient orbs
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

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    // paddingBottom set dynamically via insets
    gap: PageLayout.sectionGap,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PageLayout.paddingHorizontal,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    color: Header.screenLabel.color,
    fontSize: Header.screenLabel.fontSize,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: Header.screenLabel.letterSpacing,
    textTransform: Header.screenLabel.textTransform,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.lg,
  },

  // Group sections
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  groupTitle: {
    color: 'rgba(200, 200, 210, 1)',
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  groupCount: {
    color: 'rgba(100, 100, 110, 1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  groupList: {
    gap: 8,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: Spacing.lg,
    gap: 10,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: GlassStyle.card.backgroundColor,
    borderWidth: 1,
    borderColor: GlassStyle.card.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    color: 'rgba(200, 200, 210, 1)',
    fontSize: 16,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: 'rgba(120, 120, 130, 1)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  createButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Delete modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239,68,68,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalDesc: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  modalDeleteBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDeleteText: {
    color: '#EF4444',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  modalCancelBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
