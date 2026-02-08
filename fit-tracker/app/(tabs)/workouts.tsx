import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Plus, Dumbbell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing } from '@/constants/theme';
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

  const suggestion = useMemo(
    () => computeSmartSuggestion(history),
    [history],
  );

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

      {/* Fixed Header */}
      <View style={[styles.headerArea, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerLabel}>MES WORKOUTS</Text>
            <Text style={styles.headerTitle}>Entraînements</Text>
          </View>
          <Pressable style={styles.addButton} onPress={handleAdd}>
            <Plus size={20} color={Colors.primary} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
              <Text style={styles.groupTitle}>Mes workouts</Text>
              <Text style={styles.groupCount}>{customWorkouts.length}</Text>
            </View>
            <View style={styles.groupList}>
              {customWorkouts.map((workout) => (
                <WorkoutListCard
                  key={workout.id}
                  workout={workout}
                  onPress={() => router.push(`/workout/${workout.id}`)}
                />
              ))}
            </View>
          </View>
        ) : suggestion.hasHistory ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Dumbbell size={28} color="rgba(120, 120, 130, 1)" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>
              {i18n.t('workouts.noCustom')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {i18n.t('workouts.noCustomDesc')}
            </Text>
            <Pressable style={styles.createButton} onPress={handleCreateManual}>
              <Plus size={14} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.createButtonText}>
                {i18n.t('workouts.createWorkout')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
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
    paddingBottom: 120,
    gap: 24,
  },

  // Header
  headerArea: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: 12,
    position: 'relative',
    overflow: 'visible',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: {
    color: 'rgba(160, 150, 140, 1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 26,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
});
