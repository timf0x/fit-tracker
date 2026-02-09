import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Info,
  X,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { useWorkoutStore } from '@/stores/workoutStore';
import { MUSCLE_LABELS_FR } from '@/lib/muscleMapping';
import {
  RP_VOLUME_LANDMARKS,
  VolumeLandmarks,
  VolumeLandmarkZone,
  getVolumeZone,
  getZoneColor,
} from '@/constants/volumeLandmarks';
import { getWeekLabel, getSetsForWeek, getWeekBounds } from '@/lib/weeklyVolume';
import { getMuscleTrends } from '@/lib/progressiveOverload';

const WEEKS_AVAILABLE = 12;

const ZONE_LABELS: Record<VolumeLandmarkZone, string> = {
  below_mv: i18n.t('zones.belowMv'),
  mv_mev: i18n.t('zones.maintenance'),
  mev_mav: i18n.t('zones.growth'),
  mav_mrv: i18n.t('zones.overload'),
  above_mrv: i18n.t('zones.danger'),
};

interface MuscleRowItem {
  muscle: string;
  label: string;
  sets: number;
  landmarks: VolumeLandmarks;
}

function getShortWeekLabel(offset: number): string {
  const { start } = getWeekBounds(offset);
  const day = start.getDate();
  const month = start.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
  return `${day} ${month}`;
}

export default function VolumeScreen() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const router = useRouter();
  const { history, muscleOrder, setMuscleOrder } = useWorkoutStore();
  const weekStripRef = useRef<FlatList>(null);

  // Generate weeks array: [0, -1, -2, ..., -(WEEKS_AVAILABLE-1)]
  const weeks = useMemo(
    () => Array.from({ length: WEEKS_AVAILABLE }, (_, i) => -i),
    []
  );

  const weekLabel = useMemo(() => getWeekLabel(weekOffset), [weekOffset]);

  const weekData = useMemo(() => {
    return getSetsForWeek(history, weekOffset);
  }, [history, weekOffset]);

  // Trends: compare selected week vs previous week
  const trends = useMemo(
    () => getMuscleTrends(history, weekOffset),
    [history, weekOffset]
  );

  const muscleRows = useMemo(() => {
    const allMuscles = Object.entries(RP_VOLUME_LANDMARKS).map(
      ([muscle, landmarks]) => ({
        muscle,
        label: MUSCLE_LABELS_FR[muscle] || muscle,
        sets: weekData[muscle] || 0,
        landmarks,
      })
    );

    // If user has a custom order, use it
    if (muscleOrder.length > 0) {
      const orderMap = new Map(muscleOrder.map((m, i) => [m, i]));
      return allMuscles.sort((a, b) => {
        const aIdx = orderMap.get(a.muscle);
        const bIdx = orderMap.get(b.muscle);
        // Custom-ordered muscles first, in their order
        if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
        if (aIdx !== undefined) return -1;
        if (bIdx !== undefined) return 1;
        // Fallback: active first, then alpha
        if (a.sets > 0 && b.sets === 0) return -1;
        if (a.sets === 0 && b.sets > 0) return 1;
        return a.label.localeCompare(b.label);
      });
    }

    // Default sort: active muscles first (by sets desc), then alphabetical
    return allMuscles.sort((a, b) => {
      if (a.sets > 0 && b.sets === 0) return -1;
      if (a.sets === 0 && b.sets > 0) return 1;
      if (a.sets > 0 && b.sets > 0) return b.sets - a.sets;
      return a.label.localeCompare(b.label);
    });
  }, [weekData, muscleOrder]);

  const totalSets = useMemo(
    () => muscleRows.reduce((sum, m) => sum + m.sets, 0),
    [muscleRows]
  );
  const activeMuscles = useMemo(
    () => muscleRows.filter((m) => m.sets > 0).length,
    [muscleRows]
  );

  const selectWeek = useCallback((offset: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeekOffset(offset);
  }, []);

  // Scroll the week strip to selected week when it changes
  useEffect(() => {
    const index = weeks.indexOf(weekOffset);
    if (index >= 0) {
      weekStripRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [weekOffset, weeks]);

  const renderWeekChip = useCallback(
    ({ item }: { item: number }) => {
      const isSelected = item === weekOffset;
      const isCurrent = item === 0;
      return (
        <Pressable
          style={styles.weekChip}
          onPress={() => selectWeek(item)}
        >
          <Text
            style={[
              styles.weekChipText,
              isSelected && styles.weekChipTextActive,
              isCurrent && !isSelected && styles.weekChipTextCurrent,
            ]}
          >
            {getShortWeekLabel(item)}
          </Text>
          <View style={styles.weekChipTickRow}>
            <View
              style={[
                styles.weekChipTick,
                isSelected && styles.weekChipTickActive,
              ]}
            />
            {isCurrent && !isSelected && (
              <View style={styles.weekChipCurrentDot} />
            )}
          </View>
          {isSelected && <View style={styles.weekChipAccent} />}
        </Pressable>
      );
    },
    [weekOffset, selectWeek]
  );

  const handleDragEnd = useCallback(
    ({ data }: { data: MuscleRowItem[] }) => {
      const newOrder = data.map((item) => item.muscle);
      setMuscleOrder(newOrder);
    },
    [setMuscleOrder]
  );

  const renderMuscleRow = useCallback(
    ({ item, drag, isActive }: RenderItemParams<MuscleRowItem>) => {
      const isEmpty = item.sets === 0;
      const zone = getVolumeZone(item.sets, item.landmarks);
      const zoneColor = getZoneColor(zone);
      const fillPct = Math.min(item.sets / item.landmarks.mrv, 1);
      const mvPct = item.landmarks.mv / item.landmarks.mrv;
      const mevPct = item.landmarks.mev / item.landmarks.mrv;
      const mavPct = item.landmarks.mavHigh / item.landmarks.mrv;

      const trend = trends[item.muscle];
      const hasTrend = trend && trend.direction !== 0 && !isEmpty;

      return (
        <ScaleDecorator>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/volume/${item.muscle}`);
            }}
            onLongPress={drag}
            disabled={isActive}
            style={[
              styles.muscleRow,
              isEmpty && styles.muscleRowEmpty,
              isActive && styles.muscleRowDragging,
            ]}
          >
            <View style={styles.muscleHeader}>
              <Text style={[styles.muscleName, isEmpty && styles.muscleNameEmpty]}>
                {item.label}
              </Text>

              {/* Trend indicator */}
              {hasTrend && (
                <View
                  style={[
                    styles.trendBadge,
                    {
                      backgroundColor:
                        trend.direction === 1
                          ? 'rgba(74,222,128,0.12)'
                          : 'rgba(239,68,68,0.12)',
                    },
                  ]}
                >
                  {trend.direction === 1 ? (
                    <TrendingUp size={10} color="#4ADE80" strokeWidth={2.5} />
                  ) : (
                    <TrendingDown size={10} color="#EF4444" strokeWidth={2.5} />
                  )}
                  <Text
                    style={[
                      styles.trendText,
                      {
                        color:
                          trend.direction === 1 ? '#4ADE80' : '#EF4444',
                      },
                    ]}
                  >
                    {trend.direction === 1 ? '+' : ''}
                    {trend.delta}
                  </Text>
                </View>
              )}

              {!isEmpty && (
                <View style={[styles.zoneBadge, { backgroundColor: zoneColor + '1A' }]}>
                  <Text style={[styles.zoneBadgeText, { color: zoneColor }]}>
                    {ZONE_LABELS[zone]}
                  </Text>
                </View>
              )}
              <Text style={styles.setsText}>
                <Text style={{ color: isEmpty ? 'rgba(60,60,70,1)' : zoneColor, fontFamily: Fonts?.bold, fontWeight: '700' }}>
                  {item.sets}
                </Text>
                <Text style={styles.setsTarget}>/{item.landmarks.mavHigh}</Text>
              </Text>
              <ChevronRight size={14} color="rgba(100,100,110,1)" strokeWidth={2} />
            </View>

            {/* Bar */}
            <View style={styles.barBg}>
              {!isEmpty && (
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${fillPct * 100}%`,
                      backgroundColor: zoneColor,
                    },
                  ]}
                />
              )}
              {/* Markers */}
              <View style={[styles.marker, { left: `${mvPct * 100}%` }]} />
              <View
                style={[styles.marker, styles.markerGreen, { left: `${mevPct * 100}%` }]}
              />
              <View
                style={[styles.marker, styles.markerYellow, { left: `${mavPct * 100}%` }]}
              />
              <View style={[styles.marker, styles.markerRed, { left: '100%' }]} />
            </View>

            {/* Marker labels under bar */}
            {!isEmpty && (
              <View style={styles.markerLabelsRow}>
                <Text style={[styles.markerLabel, { left: `${mvPct * 100}%` }]}>
                  {item.landmarks.mv}
                </Text>
                <Text style={[styles.markerLabel, { left: `${mevPct * 100}%` }]}>
                  {item.landmarks.mev}
                </Text>
                <Text style={[styles.markerLabel, { left: `${mavPct * 100}%` }]}>
                  {item.landmarks.mavHigh}
                </Text>
                <Text style={[styles.markerLabel, { left: '100%' }]}>
                  {item.landmarks.mrv}
                </Text>
              </View>
            )}
          </Pressable>
        </ScaleDecorator>
      );
    },
    [trends, router]
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
          <Text style={styles.headerTitle}>{i18n.t('volume.title')}</Text>
          <Pressable
            style={styles.infoBtn}
            onPress={() => setShowInfo(true)}
          >
            <Info size={16} color="rgba(160,150,140,1)" />
          </Pressable>
        </View>

        {/* Week Strip */}
        <View style={styles.weekStripContainer}>
          <FlatList
            ref={weekStripRef}
            data={weeks}
            keyExtractor={(item) => String(item)}
            horizontal
            inverted
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekStripContent}
            renderItem={renderWeekChip}
            getItemLayout={(_, index) => ({
              length: 56,
              offset: 56 * index,
              index,
            })}
            initialScrollIndex={0}
          />
        </View>

        {/* Week Label + Summary */}
        <View style={styles.weekInfo}>
          <Text style={styles.weekLabel}>{weekLabel}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>{totalSets}</Text>
            <Text style={styles.summaryUnit}> {i18n.t('volume.totalSets')}</Text>
            <Text style={styles.summaryDot}> · </Text>
            <Text style={styles.summaryValue}>{activeMuscles}</Text>
            <Text style={styles.summaryUnit}> {i18n.t('volume.activeMuscles')}</Text>
          </View>
        </View>

        {/* Muscle List — Draggable */}
        <DraggableFlatList
          data={muscleRows}
          keyExtractor={(item) => item.muscle}
          renderItem={renderMuscleRow}
          onDragEnd={handleDragEnd}
          onDragBegin={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          activationDistance={20}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      </SafeAreaView>

      {/* Volume Info Modal */}
      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowInfo(false)}>
          <Pressable style={styles.infoModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>{i18n.t('volume.landmarks.title')}</Text>
              <Pressable style={styles.modalClose} onPress={() => setShowInfo(false)}>
                <X size={18} color="#9CA3AF" />
              </Pressable>
            </View>
            <Text style={styles.infoModalText}>
              {i18n.t('volume.landmarks.description')}
            </Text>
            <View style={styles.landmarkList}>
              {[
                { abbr: 'MV', name: i18n.t('volume.landmarks.mv'), desc: i18n.t('volume.landmarks.mvDesc'), color: '#6B7280' },
                { abbr: 'MEV', name: i18n.t('volume.landmarks.mev'), desc: i18n.t('volume.landmarks.mevDesc'), color: '#3B82F6' },
                { abbr: 'MAV', name: i18n.t('volume.landmarks.mav'), desc: i18n.t('volume.landmarks.mavDesc'), color: '#4ADE80' },
                { abbr: 'MRV', name: i18n.t('volume.landmarks.mrv'), desc: i18n.t('volume.landmarks.mrvDesc'), color: '#EF4444' },
              ].map((item) => (
                <View key={item.abbr} style={styles.landmarkItem}>
                  <View style={styles.landmarkItemHeader}>
                    <View style={[styles.landmarkDot, { backgroundColor: item.color }]} />
                    <Text style={styles.landmarkAbbr}>{item.abbr}</Text>
                    <Text style={styles.landmarkName}>{item.name}</Text>
                  </View>
                  <Text style={styles.landmarkDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
            {/* Trend arrows explanation */}
            <View style={styles.trendExplainBox}>
              <Text style={styles.trendExplainTitle}>{i18n.t('volume.trends.title')}</Text>
              <Text style={styles.trendExplainDesc}>
                {i18n.t('volume.trends.description')}
              </Text>
              <View style={styles.trendExplainRow}>
                <View style={[styles.trendExplainBadge, { backgroundColor: 'rgba(74,222,128,0.12)' }]}>
                  <TrendingUp size={10} color="#4ADE80" strokeWidth={2.5} />
                  <Text style={{ color: '#4ADE80', fontSize: 10, fontFamily: Fonts?.bold, fontWeight: '700' }}>+3</Text>
                </View>
                <Text style={styles.trendExplainLabel}>{i18n.t('volume.trends.volumeUp')}</Text>
              </View>
              <View style={styles.trendExplainRow}>
                <View style={[styles.trendExplainBadge, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                  <TrendingDown size={10} color="#EF4444" strokeWidth={2.5} />
                  <Text style={{ color: '#EF4444', fontSize: 10, fontFamily: Fonts?.bold, fontWeight: '700' }}>-2</Text>
                </View>
                <Text style={styles.trendExplainLabel}>{i18n.t('volume.trends.volumeDown')}</Text>
              </View>
            </View>

            <View style={styles.progressionBox}>
              <Text style={styles.progressionLabel}>{i18n.t('volume.progression.title')}</Text>
              <View style={styles.progressionBar}>
                <View style={[styles.progressionZone, { flex: 1, backgroundColor: '#6B7280' }]} />
                <View style={[styles.progressionZone, { flex: 1, backgroundColor: '#3B82F6' }]} />
                <View style={[styles.progressionZone, { flex: 2, backgroundColor: '#4ADE80' }]} />
                <View style={[styles.progressionZone, { flex: 1, backgroundColor: '#FBBF24' }]} />
                <View style={[styles.progressionZone, { flex: 0.5, backgroundColor: '#EF4444' }]} />
              </View>
              <View style={styles.progressionLabels}>
                <Text style={styles.progressionMarkerText}>MV</Text>
                <Text style={styles.progressionMarkerText}>MEV</Text>
                <Text style={[styles.progressionMarkerText, { color: '#4ADE80' }]}>MAV</Text>
                <Text style={styles.progressionMarkerText}>MRV</Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  infoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Week strip
  weekStripContainer: {
    marginTop: 12,
  },
  weekStripContent: {
    paddingHorizontal: 20,
    gap: 0,
  },
  weekChip: {
    width: 56,
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 2,
  },
  weekChipText: {
    color: 'rgba(100,100,110,1)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginBottom: 6,
  },
  weekChipTextActive: {
    color: '#fff',
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    fontSize: 12,
  },
  weekChipTextCurrent: {
    color: 'rgba(160,150,140,1)',
  },
  weekChipTickRow: {
    alignItems: 'center',
    height: 8,
  },
  weekChipTick: {
    width: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  weekChipTickActive: {
    width: 2,
    height: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 1,
  },
  weekChipCurrentDot: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(160,150,140,0.5)',
  },
  weekChipAccent: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FF6B35',
    marginTop: 3,
  },

  // Week info
  weekInfo: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    gap: 4,
  },
  weekLabel: {
    color: '#fff',
    fontSize: 17,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  summaryUnit: {
    color: 'rgba(160,150,140,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  summaryDot: {
    color: 'rgba(100,100,110,1)',
    fontSize: 14,
  },

  // Muscle rows
  muscleRow: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  muscleRowEmpty: {
    opacity: 0.35,
    gap: 8,
  },
  muscleRowDragging: {
    opacity: 0.9,
    borderColor: 'rgba(255,107,53,0.3)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  muscleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muscleName: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  muscleNameEmpty: {
    color: 'rgba(120,120,130,1)',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 10,
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
  setsText: {
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  setsTarget: {
    color: 'rgba(100,100,110,1)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Bar
  barBg: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 5,
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: 5,
  },
  marker: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 1,
  },
  markerGreen: {
    backgroundColor: 'rgba(74, 222, 128, 0.7)',
  },
  markerYellow: {
    backgroundColor: 'rgba(251, 191, 36, 0.7)',
  },
  markerRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.7)',
  },

  // Marker labels
  markerLabelsRow: {
    position: 'relative',
    height: 14,
  },
  markerLabel: {
    position: 'absolute',
    top: 0,
    fontSize: 9,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(120,120,130,1)',
    transform: [{ translateX: -8 }],
  },

  // Volume Info Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  infoModal: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
    maxHeight: '85%',
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoModalTitle: {
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalText: {
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 20,
  },
  landmarkList: { gap: 16 },
  landmarkItem: { gap: 4 },
  landmarkItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  landmarkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  landmarkAbbr: {
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
    width: 36,
  },
  landmarkName: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#D1D5DB',
    flex: 1,
  },
  landmarkDesc: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 54,
    lineHeight: 16,
  },
  trendExplainBox: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  trendExplainTitle: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  trendExplainDesc: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 16,
  },
  trendExplainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trendExplainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trendExplainLabel: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#D1D5DB',
  },
  progressionBox: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 16,
  },
  progressionLabel: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  progressionBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressionZone: {
    height: '100%',
  },
  progressionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  progressionMarkerText: {
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#6B7280',
  },
});
