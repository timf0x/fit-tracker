import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Lightbulb,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { useWorkoutStore } from '@/stores/workoutStore';
import { MUSCLE_LABELS_FR } from '@/lib/muscleMapping';
import {
  RP_VOLUME_LANDMARKS,
  VolumeLandmarkZone,
  getVolumeZone,
  getZoneColor,
} from '@/constants/volumeLandmarks';
import { getSetsForWeek } from '@/lib/weeklyVolume';
import {
  getWeeklyVolumeHistory,
  getExerciseBreakdown,
  getZoneAdvice,
} from '@/lib/muscleDetail';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { ExerciseSparkline } from '@/components/ExerciseSparkline';

const WEEKS = 12;

const ZONE_LABELS: Record<VolumeLandmarkZone, string> = {
  below_mv: i18n.t('zones.belowMv'),
  mv_mev: i18n.t('zones.maintenance'),
  mev_mav: i18n.t('zones.growth'),
  mav_mrv: i18n.t('zones.overload'),
  above_mrv: i18n.t('zones.danger'),
};

export default function MuscleDetailScreen() {
  const router = useRouter();
  const { muscle } = useLocalSearchParams<{ muscle: string }>();
  const { history } = useWorkoutStore();

  const muscleName = MUSCLE_LABELS_FR[muscle] || muscle;
  const landmarks = RP_VOLUME_LANDMARKS[muscle];

  // Current week sets
  const currentSets = useMemo(() => {
    const data = getSetsForWeek(history, 0);
    return data[muscle] || 0;
  }, [history, muscle]);

  // Previous week sets (for trend)
  const previousSets = useMemo(() => {
    const data = getSetsForWeek(history, -1);
    return data[muscle] || 0;
  }, [history, muscle]);

  const delta = currentSets - previousSets;
  const zone = landmarks ? getVolumeZone(currentSets, landmarks) : ('below_mv' as VolumeLandmarkZone);
  const zoneColor = getZoneColor(zone);
  const advice = getZoneAdvice(zone);

  // 12-week volume history
  const volumeHistory = useMemo(
    () => getWeeklyVolumeHistory(history, muscle, WEEKS),
    [history, muscle]
  );

  // Exercise breakdown for this week
  const exerciseBreakdown = useMemo(
    () => getExerciseBreakdown(history, muscle, 0),
    [history, muscle]
  );

  // Chart calculations
  const maxSets = useMemo(() => {
    const dataMax = Math.max(...volumeHistory.map((p) => p.sets), 0);
    const landmarkMax = landmarks?.mrv || 0;
    return Math.max(dataMax, landmarkMax, 1);
  }, [volumeHistory, landmarks]);

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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{muscleName}</Text>
            <View style={styles.headerBadges}>
              {/* Zone badge */}
              <View style={[styles.zoneBadge, { backgroundColor: zoneColor + '1A' }]}>
                <Text style={[styles.zoneBadgeText, { color: zoneColor }]}>
                  {ZONE_LABELS[zone]}
                </Text>
              </View>
              {/* Trend badge */}
              {delta !== 0 && (
                <View
                  style={[
                    styles.trendBadge,
                    {
                      backgroundColor:
                        delta > 0
                          ? 'rgba(74,222,128,0.12)'
                          : 'rgba(239,68,68,0.12)',
                    },
                  ]}
                >
                  {delta > 0 ? (
                    <TrendingUp size={10} color="#4ADE80" strokeWidth={2.5} />
                  ) : (
                    <TrendingDown size={10} color="#EF4444" strokeWidth={2.5} />
                  )}
                  <Text
                    style={[
                      styles.trendText,
                      { color: delta > 0 ? '#4ADE80' : '#EF4444' },
                    ]}
                  >
                    {delta > 0 ? '+' : ''}
                    {delta} {i18n.t('volume.vsWeek')}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.headerSets}>{currentSets}</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Advice Card */}
          <View style={[styles.adviceCard, { backgroundColor: zoneColor + '0F' }]}>
            <Lightbulb size={16} color={zoneColor} strokeWidth={2} />
            <Text style={[styles.adviceText, { color: zoneColor }]}>
              {advice}
            </Text>
          </View>

          {/* Volume Chart Section */}
          <Text style={styles.sectionTitle}>{i18n.t('volume.volumePerWeek')}</Text>
          <View style={styles.chartCard}>
            {/* Threshold lines */}
            {landmarks && (
              <View style={styles.chartArea}>
                {/* Threshold horizontal lines */}
                {[
                  { value: landmarks.mv, label: 'MV', color: '#6B7280' },
                  { value: landmarks.mev, label: 'MEV', color: '#3B82F6' },
                  { value: landmarks.mavHigh, label: 'MAV', color: '#4ADE80' },
                  { value: landmarks.mrv, label: 'MRV', color: '#EF4444' },
                ].map((line) => {
                  const pct = (line.value / maxSets) * 100;
                  return (
                    <View
                      key={line.label}
                      style={[
                        styles.thresholdLine,
                        { bottom: `${pct}%`, borderColor: line.color + '40' },
                      ]}
                    >
                      <Text style={[styles.thresholdLabel, { color: line.color + '80' }]}>
                        {line.label}
                      </Text>
                    </View>
                  );
                })}

                {/* Bars */}
                <View style={styles.barsContainer}>
                  {volumeHistory.map((point, i) => {
                    const barPct = maxSets > 0 ? (point.sets / maxSets) * 100 : 0;
                    const barColor = getZoneColor(point.zone);
                    const isCurrentWeek = point.weekOffset === 0;

                    return (
                      <View key={i} style={styles.barColumn}>
                        <View style={styles.barWrapper}>
                          <View
                            style={[
                              styles.chartBar,
                              {
                                height: `${Math.max(barPct, point.sets > 0 ? 3 : 0)}%`,
                                backgroundColor: barColor,
                                opacity: isCurrentWeek ? 1 : 0.6,
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.barLabel,
                            isCurrentWeek && styles.barLabelCurrent,
                          ]}
                        >
                          {isCurrentWeek
                            ? i18n.t('volume.currentWeek')
                            : `S${point.weekOffset}`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Exercise Breakdown */}
          <Text style={styles.sectionTitle}>{i18n.t('volume.exercisesThisWeek')}</Text>
          {exerciseBreakdown.length > 0 ? (
            exerciseBreakdown.map((item) => (
              <Pressable
                key={item.exerciseId}
                style={styles.exerciseCard}
                onPress={() => router.push(`/exercise/${item.exerciseId}`)}
              >
                <ExerciseIcon
                  exerciseName={item.exerciseName}
                  bodyPart={item.bodyPart}
                  size={18}
                  containerSize={40}
                />
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName} numberOfLines={1}>
                    {item.exerciseNameFr}
                  </Text>
                  <View style={styles.exerciseStats}>
                    <Text style={styles.exerciseStat}>
                      {item.sets}s
                    </Text>
                    {item.bestWeight > 0 && (
                      <Text style={styles.exerciseStat}>
                        {item.bestWeight}kg
                      </Text>
                    )}
                  </View>
                </View>
                <ExerciseSparkline
                  exerciseId={item.exerciseId}
                  width={80}
                  height={28}
                />
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {i18n.t('volume.noExerciseThisWeek')}
              </Text>
            </View>
          )}

          {/* Landmarks Reference */}
          {landmarks && (
            <>
              <Text style={styles.sectionTitle}>{i18n.t('volume.landmarksSectionTitle')}</Text>
              <View style={styles.landmarksCard}>
                {[
                  { label: 'MV', value: landmarks.mv, color: '#6B7280' },
                  { label: 'MEV', value: landmarks.mev, color: '#3B82F6' },
                  { label: 'MAV', value: landmarks.mavHigh, color: '#4ADE80' },
                  { label: 'MRV', value: landmarks.mrv, color: '#EF4444' },
                ].map((item, i) => (
                  <View key={item.label} style={styles.landmarkItem}>
                    {i > 0 && <Text style={styles.landmarkDot}>·</Text>}
                    <Text style={[styles.landmarkLabel, { color: item.color }]}>
                      {item.label}
                    </Text>
                    <Text style={styles.landmarkValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
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
  headerCenter: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSets: {
    color: '#fff',
    fontSize: 32,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  zoneBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  zoneBadgeText: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 10,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // Advice Card
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 24,
  },
  adviceText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Section title
  sectionTitle: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Chart
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginBottom: 24,
  },
  chartArea: {
    height: 180,
    position: 'relative',
  },
  thresholdLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
  },
  thresholdLabel: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    fontSize: 9,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    gap: 4,
    paddingBottom: 20,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: '70%',
    borderRadius: 3,
    minWidth: 6,
  },
  barLabel: {
    fontSize: 8,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(120,120,130,1)',
    marginTop: 4,
  },
  barLabelCurrent: {
    color: '#FF6B35',
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // Exercise Breakdown
  exerciseCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  exerciseStats: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseStat: {
    color: 'rgba(160,150,140,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Empty state
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    color: 'rgba(120,120,130,1)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Landmarks Reference
  landmarksCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  landmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  landmarkDot: {
    color: 'rgba(100,100,110,1)',
    fontSize: 16,
    marginHorizontal: 8,
  },
  landmarkLabel: {
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  landmarkValue: {
    color: 'rgba(160,150,140,1)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
});
