import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import { Fonts } from '@/constants/theme';
import { exercises } from '@/data/exercises';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { ExerciseSparkline } from '@/components/ExerciseSparkline';
import { useWorkoutStore } from '@/stores/workoutStore';
import {
  getPerformedExerciseIds,
  getExerciseAllTimeStats,
} from '@/lib/exerciseStats';
import type { Exercise } from '@/types';

const BODY_PART_FR: Record<string, string> = {
  back: 'Dos',
  shoulders: 'Épaules',
  chest: 'Pecs',
  'upper arms': 'Bras',
  'lower arms': 'Avant-bras',
  'upper legs': 'Jambes',
  'lower legs': 'Mollets',
  waist: 'Abdos',
  cardio: 'Cardio',
};

interface ExerciseRowData {
  exercise: Exercise;
  isPerformed: boolean;
  lastWeight: number;
}

export default function ExerciseListScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { history } = useWorkoutStore();

  const performedIds = useMemo(
    () => getPerformedExerciseIds(history),
    [history]
  );

  // Build list with metadata
  const allRows = useMemo(() => {
    const performed: ExerciseRowData[] = [];
    const unperformed: ExerciseRowData[] = [];

    for (const ex of exercises) {
      if (performedIds.has(ex.id)) {
        const stats = getExerciseAllTimeStats(history, ex.id);
        performed.push({
          exercise: ex,
          isPerformed: true,
          lastWeight: stats.bestWeight,
        });
      } else {
        unperformed.push({ exercise: ex, isPerformed: false, lastWeight: 0 });
      }
    }

    // Sort performed by last performed date (newest first) - iterate history
    const lastDateMap = new Map<string, number>();
    for (const session of history) {
      if (!session.endTime) continue;
      const ms = new Date(session.startTime).getTime();
      for (const compEx of session.completedExercises) {
        if (!lastDateMap.has(compEx.exerciseId) || ms > lastDateMap.get(compEx.exerciseId)!) {
          lastDateMap.set(compEx.exerciseId, ms);
        }
      }
    }

    performed.sort((a, b) => {
      const aDate = lastDateMap.get(a.exercise.id) || 0;
      const bDate = lastDateMap.get(b.exercise.id) || 0;
      return bDate - aDate;
    });

    // Sort unperformed alphabetically by nameFr
    unperformed.sort((a, b) =>
      a.exercise.nameFr.localeCompare(b.exercise.nameFr, 'fr')
    );

    return [...performed, ...unperformed];
  }, [history, performedIds]);

  // Filtered list
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return allRows;
    const q = searchQuery.toLowerCase().trim();
    return allRows.filter(
      (row) =>
        row.exercise.nameFr.toLowerCase().includes(q) ||
        row.exercise.name.toLowerCase().includes(q)
    );
  }, [allRows, searchQuery]);

  const renderRow = useCallback(
    ({ item }: { item: ExerciseRowData }) => {
      const { exercise, isPerformed, lastWeight } = item;
      return (
        <Pressable
          style={styles.exerciseRow}
          onPress={() => router.push(`/exercise/${exercise.id}`)}
        >
          <ExerciseIcon
            exerciseName={exercise.name}
            bodyPart={exercise.bodyPart}
            gifUrl={exercise.gifUrl}
            size={18}
            containerSize={40}
          />
          <View style={styles.rowInfo}>
            <Text
              style={[styles.rowName, !isPerformed && styles.rowNameMuted]}
              numberOfLines={1}
            >
              {exercise.nameFr}
            </Text>
            <View style={styles.rowMeta}>
              <View
                style={[
                  styles.bodyPartPill,
                  !isPerformed && styles.bodyPartPillMuted,
                ]}
              >
                <Text
                  style={[
                    styles.bodyPartText,
                    !isPerformed && styles.bodyPartTextMuted,
                  ]}
                >
                  {BODY_PART_FR[exercise.bodyPart] || exercise.bodyPart}
                </Text>
              </View>
              {isPerformed && lastWeight > 0 && (
                <Text style={styles.rowWeight}>{lastWeight}kg</Text>
              )}
            </View>
          </View>
          {isPerformed && (
            <ExerciseSparkline
              exerciseId={exercise.id}
              width={64}
              height={28}
              metric="bestWeight"
            />
          )}
        </Pressable>
      );
    },
    [router]
  );

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
          <Text style={styles.headerTitle}>Exercices</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={16} color="rgba(120,120,130,1)" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un exercice..."
            placeholderTextColor="rgba(120,120,130,1)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* List */}
        <FlatList
          data={filteredRows}
          keyExtractor={(item) => item.exercise.id}
          renderItem={renderRow}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        />
      </SafeAreaView>
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
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 22,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    gap: 10,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    padding: 0,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 8,
  },
  rowInfo: {
    flex: 1,
    gap: 4,
  },
  rowName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  rowNameMuted: {
    color: 'rgba(160,150,140,1)',
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bodyPartPill: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bodyPartPillMuted: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  bodyPartText: {
    color: '#FF6B35',
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  bodyPartTextMuted: {
    color: 'rgba(120,120,130,1)',
  },
  rowWeight: {
    color: 'rgba(160,150,140,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
