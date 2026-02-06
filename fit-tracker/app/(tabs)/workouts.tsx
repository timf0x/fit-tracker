import { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { Plus, Dumbbell, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { SegmentedControl } from '@/components/workouts/SegmentedControl';
import { FilterPills } from '@/components/workouts/FilterPills';
import { WorkoutListCard } from '@/components/workouts/WorkoutListCard';
import { presetWorkouts } from '@/data/workouts';
import { useWorkoutStore } from '@/stores/workoutStore';
import i18n from '@/lib/i18n';
import type { Workout } from '@/types';

const TABS = ['Custom', 'Presets'];

const FILTER_CONFIGS = [
  {
    key: 'level',
    label: 'Niveau',
    options: [
      { label: 'Débutant', value: 'beginner' },
      { label: 'Intermédiaire', value: 'intermediate' },
      { label: 'Avancé', value: 'advanced' },
      { label: 'Tous niveaux', value: 'all' },
    ],
  },
  {
    key: 'focus',
    label: 'Focus',
    options: [
      { label: 'Full Body', value: 'full_body' },
      { label: 'Push', value: 'push' },
      { label: 'Pull', value: 'pull' },
      { label: 'Jambes', value: 'legs' },
      { label: 'Haut du corps', value: 'upper' },
      { label: 'Bas du corps', value: 'lower' },
      { label: 'Abdos', value: 'core' },
      { label: 'Cardio', value: 'cardio' },
    ],
  },
  {
    key: 'equipment',
    label: 'Équipement',
    options: [
      { label: 'Poids du corps', value: 'bodyweight' },
      { label: 'Haltères', value: 'dumbbell' },
      { label: 'Barre', value: 'barbell' },
      { label: 'Salle', value: 'gym' },
    ],
  },
  {
    key: 'duration',
    label: 'Durée',
    options: [
      { label: '< 20 min', value: 'short' },
      { label: '20-35 min', value: 'medium' },
      { label: '35-50 min', value: 'long' },
      { label: '50+ min', value: 'extra' },
    ],
  },
];

const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced', 'all'] as const;
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  all: 'Express / Tous niveaux',
};

interface WorkoutGroup {
  level: string;
  label: string;
  workouts: Workout[];
}

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const customWorkouts = useWorkoutStore((s) => s.customWorkouts);
  const [activeTab, setActiveTab] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string | null>>({});
  const isPresets = activeTab === 1;

  const handleFilterChange = useCallback((key: string, value: string | null) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const filteredWorkouts = useMemo(() => {
    if (!isPresets) return [];

    let results = presetWorkouts;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(w =>
        w.nameFr.toLowerCase().includes(q) ||
        w.name.toLowerCase().includes(q) ||
        w.descriptionFr.toLowerCase().includes(q)
      );
    }

    // Level filter
    if (activeFilters.level) {
      results = results.filter(w => w.level === activeFilters.level);
    }

    // Focus filter
    if (activeFilters.focus) {
      results = results.filter(w => w.focus === activeFilters.focus);
    }

    // Equipment filter
    if (activeFilters.equipment) {
      results = results.filter(w =>
        w.equipment?.includes(activeFilters.equipment!)
      );
    }

    // Duration filter
    if (activeFilters.duration) {
      const d = activeFilters.duration;
      results = results.filter(w => {
        if (d === 'short') return w.durationMinutes < 20;
        if (d === 'medium') return w.durationMinutes >= 20 && w.durationMinutes < 35;
        if (d === 'long') return w.durationMinutes >= 35 && w.durationMinutes < 50;
        if (d === 'extra') return w.durationMinutes >= 50;
        return true;
      });
    }

    return results;
  }, [isPresets, searchQuery, activeFilters]);

  const hasActiveFilters = Object.values(activeFilters).some(v => v !== null && v !== undefined);

  const groupedWorkouts = useMemo((): WorkoutGroup[] => {
    // Don't group if any filters or search are active — show flat list
    if (hasActiveFilters || searchQuery.trim()) {
      return [{ level: 'results', label: `${filteredWorkouts.length} résultats`, workouts: filteredWorkouts }];
    }

    return LEVEL_ORDER
      .map(level => ({
        level,
        label: LEVEL_LABELS[level],
        workouts: filteredWorkouts.filter(w => w.level === level),
      }))
      .filter(g => g.workouts.length > 0);
  }, [filteredWorkouts, hasActiveFilters, searchQuery]);

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <View style={styles.screen}>
      {/* Ambient orbs */}
      <View style={styles.orbOrange} />
      <View style={styles.orbBlue} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.headerArea, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerLabel}>MES WORKOUTS</Text>
              <Text style={styles.headerTitle}>Entraînements</Text>
            </View>
            <Pressable style={styles.addButton} onPress={() => router.push('/workout/create')}>
              <Plus size={20} color={Colors.primary} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentWrapper}>
          <SegmentedControl
            tabs={TABS}
            activeIndex={activeTab}
            onTabChange={setActiveTab}
          />
        </View>

        {/* Search Bar (Presets only) */}
        {isPresets && (
          <View style={styles.searchWrapper}>
            <View style={styles.searchBar}>
              <Search size={16} color="rgba(120, 120, 130, 1)" strokeWidth={2} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un workout..."
                placeholderTextColor="rgba(100, 100, 110, 1)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <X size={16} color="rgba(120, 120, 130, 1)" strokeWidth={2} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Filters (Presets only) */}
        {isPresets && (
          <FilterPills
            filters={FILTER_CONFIGS}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          />
        )}

        {/* Content */}
        {isPresets ? (
          <View style={styles.list}>
            {groupedWorkouts.map((group) => (
              <View key={group.level} style={styles.groupSection}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{group.label}</Text>
                  <Text style={styles.groupCount}>{group.workouts.length}</Text>
                </View>
                {group.workouts.map((workout) => (
                  <WorkoutListCard
                    key={workout.id}
                    workout={workout}
                    onPress={() => router.push(`/workout/${workout.id}`)}
                  />
                ))}
              </View>
            ))}

            {filteredWorkouts.length === 0 && (
              <View style={styles.noResults}>
                <Search size={24} color="rgba(100, 100, 110, 1)" strokeWidth={1.5} />
                <Text style={styles.noResultsTitle}>Aucun résultat</Text>
                <Text style={styles.noResultsSubtitle}>
                  Essayez d'autres filtres ou termes de recherche
                </Text>
              </View>
            )}
          </View>
        ) : customWorkouts.length > 0 ? (
          <View style={styles.list}>
            <View style={styles.groupSection}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>Mes workouts</Text>
                <Text style={styles.groupCount}>{customWorkouts.length}</Text>
              </View>
              {customWorkouts.map((workout) => (
                <WorkoutListCard
                  key={workout.id}
                  workout={workout}
                  onPress={() => router.push(`/workout/${workout.id}`)}
                />
              ))}
            </View>
          </View>
        ) : (
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
            <Pressable style={styles.createButton} onPress={() => router.push('/workout/create')}>
              <Plus size={16} color="#fff" strokeWidth={2.5} />
              <Text style={styles.createButtonText}>
                {i18n.t('workouts.createWorkout')}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050505',
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
    paddingBottom: 120,
    gap: 16,
    alignItems: 'stretch',
  },

  // Header
  headerArea: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: 4,
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

  // Segment
  segmentWrapper: {
    paddingHorizontal: Spacing.lg,
  },

  // Search
  searchWrapper: {
    paddingHorizontal: Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: 'rgba(220, 220, 230, 1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    padding: 0,
  },

  // List
  list: {
    paddingHorizontal: Spacing.lg,
    gap: 24,
  },

  // Group sections
  groupSection: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
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
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: 'hidden',
  },

  // No results
  noResults: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 10,
  },
  noResultsTitle: {
    color: 'rgba(180, 180, 190, 1)',
    fontSize: 16,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  noResultsSubtitle: {
    color: 'rgba(100, 100, 110, 1)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
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
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
});
