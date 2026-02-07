import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, {
  Rect,
  Line as SvgLine,
  Text as SvgText,
  Polygon,
  Circle,
} from 'react-native-svg';
import {
  ArrowLeft,
  Flame,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Dumbbell,
  Info,
  X,
} from 'lucide-react-native';
import { Fonts } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getSetsPerMuscle, MUSCLE_LABELS_FR } from '@/lib/muscleMapping';
import {
  RP_VOLUME_LANDMARKS,
  getVolumeZone,
  getZoneColor,
} from '@/constants/volumeLandmarks';
import { mockWeeklyVolume } from '@/lib/mock-data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

type TimeFilter = 'week' | '3months' | 'year';
const FILTERS: { key: TimeFilter; label: string; days: number }[] = [
  { key: 'week', label: 'Semaine', days: 7 },
  { key: '3months', label: '3 Mois', days: 90 },
  { key: 'year', label: 'Année', days: 365 },
];

/** Radar chart muscle groups (abbreviated French labels) */
const RADAR_GROUPS: { label: string; muscles: string[] }[] = [
  { label: 'Jamb', muscles: ['quads', 'hamstrings', 'glutes'] },
  { label: 'Dos', muscles: ['lats', 'upper back', 'lower back'] },
  { label: 'Abdo', muscles: ['abs', 'obliques'] },
  { label: 'Avan', muscles: ['forearms'] },
  { label: 'Bice', muscles: ['biceps'] },
  { label: 'Tric', muscles: ['triceps'] },
  { label: 'Moll', muscles: ['calves'] },
  { label: 'Épau', muscles: ['shoulders'] },
  { label: 'Poit', muscles: ['chest'] },
];

// Radar chart layout
const RADAR_SIZE = 280;
const RADAR_CX = RADAR_SIZE / 2;
const RADAR_CY = RADAR_SIZE / 2;
const RADAR_R = 95;
const RADAR_RINGS = [0.25, 0.5, 0.75, 1.0];

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg}kg`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatSessionDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

function streakInWeeks(days: number): number {
  return Math.floor(days / 7);
}

export default function StatsScreen() {
  const [filter, setFilter] = useState<TimeFilter>('week');
  const [volumeExpanded, setVolumeExpanded] = useState(false);
  const [showVolumeInfo, setShowVolumeInfo] = useState(false);
  const router = useRouter();
  const { stats, history } = useWorkoutStore();

  const filterDays = FILTERS.find((f) => f.key === filter)!.days;

  const filteredHistory = useMemo(() => {
    const cutoff = Date.now() - filterDays * 86400000;
    return history.filter(
      (s) => s.endTime && new Date(s.startTime).getTime() >= cutoff
    );
  }, [filter, history, filterDays]);

  const periodStats = useMemo(() => {
    const totalWorkouts = filteredHistory.length;
    const totalMinutes = Math.round(
      filteredHistory.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60
    );
    const totalVolume = Math.round(
      filteredHistory.reduce((acc, session) => {
        return (
          acc +
          session.completedExercises.reduce((exAcc, ex) => {
            return (
              exAcc +
              ex.sets.reduce(
                (setAcc, s) => setAcc + (s.weight || 0) * s.reps,
                0
              )
            );
          }, 0)
        );
      }, 0)
    );
    return { totalWorkouts, totalMinutes, totalVolume };
  }, [filteredHistory]);

  // Raw muscle data (shared by volume bars and radar)
  const muscleData = useMemo(() => {
    const fromHistory = getSetsPerMuscle(history, filterDays);
    const hasData = Object.values(fromHistory).some((v) => v > 0);
    return hasData ? fromHistory : mockWeeklyVolume;
  }, [history, filterDays]);

  // Volume bar entries (sorted, only > 0)
  const muscleVolume = useMemo(() => {
    return Object.entries(RP_VOLUME_LANDMARKS)
      .map(([muscle, landmarks]) => ({
        muscle,
        label: MUSCLE_LABELS_FR[muscle] || muscle,
        sets: muscleData[muscle] || 0,
        landmarks,
      }))
      .filter((e) => e.sets > 0)
      .sort((a, b) => b.sets - a.sets);
  }, [muscleData]);

  // Radar chart data
  const radarData = useMemo(() => {
    return RADAR_GROUPS.map((group) => {
      const totalSets = group.muscles.reduce(
        (sum, m) => sum + (muscleData[m] || 0),
        0
      );
      const totalMav = group.muscles.reduce((sum, m) => {
        const lm = RP_VOLUME_LANDMARKS[m];
        return sum + (lm ? lm.mavHigh : 0);
      }, 0);
      return {
        label: group.label,
        sets: totalSets,
        normalized: totalMav > 0 ? totalSets / totalMav : 0,
      };
    });
  }, [muscleData]);

  // Balance score (coefficient of variation)
  const isBalanced = useMemo(() => {
    const vals = radarData.map((d) => d.normalized);
    const max = Math.max(...vals);
    if (max === 0) return true;
    const norm = vals.map((v) => v / max);
    const mean = norm.reduce((a, b) => a + b, 0) / norm.length;
    const variance =
      norm.reduce((sum, v) => sum + (v - mean) ** 2, 0) / norm.length;
    return variance < 0.12;
  }, [radarData]);

  const hasRadarData = radarData.some((d) => d.sets > 0);

  // Radar polygon points
  const radarMaxNorm = Math.max(...radarData.map((d) => d.normalized), 0.01);
  const radarPoints = radarData
    .map((d, i) => {
      const angle =
        (2 * Math.PI * i) / radarData.length - Math.PI / 2;
      const r = Math.min(d.normalized / radarMaxNorm, 1) * RADAR_R;
      return `${RADAR_CX + r * Math.cos(angle)},${RADAR_CY + r * Math.sin(angle)}`;
    })
    .join(' ');

  // Weekly bar chart data
  const weeklyData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today.getTime() - mondayOffset * 86400000);

    return DAY_LABELS.map((label, i) => {
      const dayStart = new Date(monday.getTime() + i * 86400000);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const count = history.filter((s) => {
        if (!s.endTime) return false;
        const d = new Date(s.startTime);
        return d >= dayStart && d < dayEnd;
      }).length;
      const isToday = dayStart.getTime() === today.getTime();
      return { label, count, isToday };
    });
  }, [history]);

  const maxBarCount = Math.max(...weeklyData.map((d) => d.count), 1);

  const recentSessions = useMemo(() => {
    return history.filter((s) => s.endTime).slice(0, 5);
  }, [history]);

  const isEmpty = history.filter((s) => s.endTime).length === 0;

  const chartWidth = SCREEN_WIDTH - 80;
  const chartHeight = 120;
  const barWidth = (chartWidth - (7 - 1) * 8) / 7;

  return (
    <View style={styles.screen}>
      <View style={styles.orbOrange} pointerEvents="none" />
      <View style={styles.orbBlue} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color="#fff" strokeWidth={2} />
            </Pressable>
            <Text style={styles.headerTitle}>Cette Semaine</Text>
            <View style={{ width: 40 }} />
          </View>

          {isEmpty ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <BarChart3
                  size={48}
                  color="rgba(255,255,255,0.15)"
                  strokeWidth={1.5}
                />
              </View>
              <Text style={styles.emptyTitle}>Aucune donnée</Text>
              <Text style={styles.emptySubtitle}>
                Complète ta première séance pour voir tes statistiques ici.
              </Text>
              <Pressable
                style={styles.emptyCta}
                onPress={() => {
                  router.back();
                  setTimeout(() => router.push('/(tabs)/workouts'), 100);
                }}
              >
                <Dumbbell size={18} color="#fff" strokeWidth={2.2} />
                <Text style={styles.emptyCtaText}>Voir les workouts</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Time Filter */}
              <View style={styles.filterRow}>
                {FILTERS.map((f) => (
                  <Pressable
                    key={f.key}
                    style={[
                      styles.filterPill,
                      filter === f.key && styles.filterPillActive,
                    ]}
                    onPress={() => setFilter(f.key)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        filter === f.key && styles.filterTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Summary Row */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {periodStats.totalWorkouts}
                  </Text>{' '}
                  séances
                </Text>
                <Text style={styles.summaryDot}>·</Text>
                <Text style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {formatDuration(periodStats.totalMinutes)}
                  </Text>
                </Text>
                <Text style={styles.summaryDot}>·</Text>
                <Text style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {formatVolume(periodStats.totalVolume)}
                  </Text>{' '}
                  volume
                </Text>
              </View>

              {/* Streak */}
              <View style={styles.streakRow}>
                <Flame size={16} color="#f97316" strokeWidth={2.5} />
                <Text style={styles.streakText}>
                  Série:{' '}
                  <Text style={styles.streakHighlight}>
                    {streakInWeeks(stats.currentStreak)} sem
                  </Text>
                </Text>
                <View style={styles.streakSep} />
                <Text style={styles.streakText}>
                  Record:{' '}
                  <Text style={styles.streakMuted}>
                    {streakInWeeks(stats.longestStreak)} sem
                  </Text>
                </Text>
              </View>

              {/* Radar Chart — Muscle Balance */}
              {hasRadarData && (
                <View style={styles.radarCard}>
                  <View style={styles.radarHeader}>
                    <Text style={styles.sectionTitle}>Équilibre</Text>
                    <View
                      style={[
                        styles.balanceBadge,
                        !isBalanced && styles.balanceBadgeWarn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.balanceBadgeText,
                          !isBalanced && styles.balanceBadgeTextWarn,
                        ]}
                      >
                        {isBalanced ? 'Bon équilibre' : 'Déséquilibré'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.radarContainer}>
                    <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
                      {/* Concentric rings */}
                      {RADAR_RINGS.map((pct) => (
                        <Circle
                          key={pct}
                          cx={RADAR_CX}
                          cy={RADAR_CY}
                          r={RADAR_R * pct}
                          fill="none"
                          stroke="rgba(255,255,255,0.06)"
                          strokeWidth={1}
                        />
                      ))}
                      {/* Spoke lines */}
                      {radarData.map((_, i) => {
                        const angle =
                          (2 * Math.PI * i) / radarData.length - Math.PI / 2;
                        return (
                          <SvgLine
                            key={`spoke-${i}`}
                            x1={RADAR_CX}
                            y1={RADAR_CY}
                            x2={RADAR_CX + RADAR_R * Math.cos(angle)}
                            y2={RADAR_CY + RADAR_R * Math.sin(angle)}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth={1}
                          />
                        );
                      })}
                      {/* Filled polygon */}
                      <Polygon
                        points={radarPoints}
                        fill="rgba(249, 115, 22, 0.2)"
                        stroke="#f97316"
                        strokeWidth={2}
                      />
                      {/* Data point dots */}
                      {radarData.map((d, i) => {
                        const angle =
                          (2 * Math.PI * i) / radarData.length - Math.PI / 2;
                        const r =
                          Math.min(d.normalized / radarMaxNorm, 1) * RADAR_R;
                        return (
                          <Circle
                            key={`dot-${i}`}
                            cx={RADAR_CX + r * Math.cos(angle)}
                            cy={RADAR_CY + r * Math.sin(angle)}
                            r={4}
                            fill="#f97316"
                          />
                        );
                      })}
                      {/* Labels */}
                      {radarData.map((d, i) => {
                        const angle =
                          (2 * Math.PI * i) / radarData.length - Math.PI / 2;
                        const labelR = RADAR_R + 24;
                        const lx = RADAR_CX + labelR * Math.cos(angle);
                        const ly = RADAR_CY + labelR * Math.sin(angle);
                        const anchor =
                          Math.abs(lx - RADAR_CX) < 5
                            ? 'middle'
                            : lx > RADAR_CX
                              ? 'start'
                              : 'end';
                        return (
                          <SvgText
                            key={`label-${i}`}
                            x={lx}
                            y={ly + 4}
                            textAnchor={anchor}
                            fill="rgba(160,150,140,1)"
                            fontSize={12}
                            fontWeight="600"
                          >
                            {d.label}
                          </SvgText>
                        );
                      })}
                    </Svg>
                  </View>
                </View>
              )}

              {/* Volume par muscle — Horizontal Bars */}
              {muscleVolume.length > 0 && (
                <View style={styles.volumeSection}>
                  <View style={styles.volumeTitleRow}>
                    <Text style={styles.sectionTitle}>Volume par muscle</Text>
                    <Pressable
                      style={styles.volumeInfoBtn}
                      onPress={() => setShowVolumeInfo(true)}
                    >
                      <Info size={16} color="#6B7280" />
                    </Pressable>
                  </View>
                  <View style={styles.volumeList}>
                    {(volumeExpanded
                      ? muscleVolume
                      : muscleVolume.slice(0, 3)
                    ).map((item) => {
                      const zone = getVolumeZone(item.sets, item.landmarks);
                      const zoneColor = getZoneColor(zone);
                      const fillPct = Math.min(
                        item.sets / item.landmarks.mrv,
                        1
                      );
                      const mvPct = item.landmarks.mv / item.landmarks.mrv;
                      const mevPct = item.landmarks.mev / item.landmarks.mrv;
                      const mavPct =
                        item.landmarks.mavHigh / item.landmarks.mrv;

                      return (
                        <View key={item.muscle} style={styles.volumeRow}>
                          <Text style={styles.volumeLabel}>{item.label}</Text>
                          <View style={styles.volumeBarBg}>
                            <View
                              style={[
                                styles.volumeBarFill,
                                {
                                  width: `${fillPct * 100}%`,
                                  backgroundColor: zoneColor,
                                },
                              ]}
                            />
                            <View
                              style={[
                                styles.volumeMarker,
                                { left: `${mvPct * 100}%` },
                              ]}
                            />
                            <View
                              style={[
                                styles.volumeMarker,
                                styles.volumeMarkerGreen,
                                { left: `${mevPct * 100}%` },
                              ]}
                            />
                            <View
                              style={[
                                styles.volumeMarker,
                                styles.volumeMarkerYellow,
                                { left: `${mavPct * 100}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.volumeValue}>
                            <Text style={{ color: zoneColor }}>
                              {item.sets}
                            </Text>
                            <Text style={styles.volumeTarget}>
                              /{item.landmarks.mavHigh}
                            </Text>
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  {muscleVolume.length > 3 && (
                    <Pressable
                      style={styles.volumeExpandBtn}
                      onPress={() => setVolumeExpanded(!volumeExpanded)}
                    >
                      <Text style={styles.volumeExpandText}>
                        {volumeExpanded
                          ? 'Réduire'
                          : `Voir tout (${muscleVolume.length})`}
                      </Text>
                      {volumeExpanded ? (
                        <ChevronUp
                          size={14}
                          color="rgba(160,150,140,1)"
                          strokeWidth={2}
                        />
                      ) : (
                        <ChevronDown
                          size={14}
                          color="rgba(160,150,140,1)"
                          strokeWidth={2}
                        />
                      )}
                    </Pressable>
                  )}
                </View>
              )}

              {/* Weekly Bar Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.sectionTitle}>Activité</Text>
                <View style={styles.chartContainer}>
                  <Svg width={chartWidth} height={chartHeight + 24}>
                    <SvgLine
                      x1={0}
                      y1={chartHeight}
                      x2={chartWidth}
                      y2={chartHeight}
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth={1}
                    />
                    {weeklyData.map((day, i) => {
                      const x = i * (barWidth + 8);
                      const bh =
                        day.count > 0
                          ? (day.count / maxBarCount) * (chartHeight - 8)
                          : 0;
                      const y = chartHeight - bh;
                      const barColor = day.isToday
                        ? '#FF6B35'
                        : 'rgba(255,255,255,0.15)';

                      return (
                        <View key={i}>
                          {day.count === 0 && (
                            <Rect
                              x={x}
                              y={chartHeight - 3}
                              width={barWidth}
                              height={3}
                              rx={1.5}
                              fill="rgba(255,255,255,0.06)"
                            />
                          )}
                          {day.count > 0 && (
                            <Rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={bh}
                              rx={barWidth / 2}
                              fill={barColor}
                            />
                          )}
                          <SvgText
                            x={x + barWidth / 2}
                            y={chartHeight + 16}
                            textAnchor="middle"
                            fill={
                              day.isToday
                                ? '#FF6B35'
                                : 'rgba(120,120,130,1)'
                            }
                            fontSize={11}
                            fontWeight={day.isToday ? '700' : '500'}
                          >
                            {day.label}
                          </SvgText>
                        </View>
                      );
                    })}
                  </Svg>
                </View>
              </View>

              {/* Recent Sessions */}
              {recentSessions.length > 0 && (
                <View style={styles.recentSection}>
                  <Text style={styles.sectionTitle}>Dernières séances</Text>
                  {recentSessions.map((session) => (
                    <View key={session.id} style={styles.recentCard}>
                      <View style={styles.recentInfo}>
                        <Text style={styles.recentName} numberOfLines={1}>
                          {session.workoutName}
                        </Text>
                        <Text style={styles.recentMeta}>
                          {formatDate(session.startTime)} ·{' '}
                          {formatSessionDuration(session.durationSeconds)}
                        </Text>
                      </View>
                      <ChevronRight
                        size={18}
                        color="rgba(120,120,130,1)"
                        strokeWidth={2}
                      />
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Volume Info Modal */}
      <Modal
        visible={showVolumeInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVolumeInfo(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowVolumeInfo(false)}
        >
          <Pressable
            style={styles.infoModal}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>Repères de Volume</Text>
              <Pressable
                style={styles.modalClose}
                onPress={() => setShowVolumeInfo(false)}
              >
                <X size={18} color="#9CA3AF" />
              </Pressable>
            </View>
            <Text style={styles.infoModalText}>
              Le volume (séries par semaine) détermine vos gains musculaires.
              Ces repères vous aident à optimiser votre entraînement.
            </Text>
            <View style={styles.landmarkList}>
              {[
                {
                  abbr: 'MV',
                  name: 'Volume de Maintien',
                  desc: 'Minimum pour conserver vos gains sans progresser.',
                  color: '#6B7280',
                },
                {
                  abbr: 'MEV',
                  name: 'Volume Minimum Efficace',
                  desc: 'Seuil à partir duquel vous commencez à progresser.',
                  color: '#3B82F6',
                },
                {
                  abbr: 'MAV',
                  name: 'Volume Adaptatif Max',
                  desc: 'Zone optimale pour la croissance musculaire. Visez cette plage !',
                  color: '#4ADE80',
                },
                {
                  abbr: 'MRV',
                  name: 'Volume Max Récupérable',
                  desc: "Au-delà, vous risquez le surentraînement et la régression.",
                  color: '#EF4444',
                },
              ].map((item) => (
                <View key={item.abbr} style={styles.landmarkItem}>
                  <View style={styles.landmarkHeader}>
                    <View
                      style={[
                        styles.landmarkDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text style={styles.landmarkAbbr}>{item.abbr}</Text>
                    <Text style={styles.landmarkName}>{item.name}</Text>
                  </View>
                  <Text style={styles.landmarkDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
            <View style={styles.progressionBox}>
              <Text style={styles.progressionLabel}>PROGRESSION IDÉALE</Text>
              <View style={styles.progressionBar}>
                <View
                  style={[
                    styles.progressionZone,
                    { flex: 1, backgroundColor: '#6B7280' },
                  ]}
                />
                <View
                  style={[
                    styles.progressionZone,
                    { flex: 1, backgroundColor: '#3B82F6' },
                  ]}
                />
                <View
                  style={[
                    styles.progressionZone,
                    { flex: 2, backgroundColor: '#4ADE80' },
                  ]}
                />
                <View
                  style={[
                    styles.progressionZone,
                    { flex: 1, backgroundColor: '#FBBF24' },
                  ]}
                />
                <View
                  style={[
                    styles.progressionZone,
                    { flex: 0.5, backgroundColor: '#EF4444' },
                  ]}
                />
              </View>
              <View style={styles.progressionLabels}>
                <Text style={styles.progressionMarker}>MV</Text>
                <Text style={styles.progressionMarker}>MEV</Text>
                <Text style={[styles.progressionMarker, { color: '#4ADE80' }]}>
                  MAV
                </Text>
                <Text style={styles.progressionMarker}>MRV</Text>
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
  scrollContent: { paddingBottom: 40 },

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

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderColor: 'rgba(255,107,53,0.3)',
  },
  filterText: {
    color: 'rgba(160,150,140,1)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FF6B35',
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
    gap: 6,
  },
  summaryItem: {
    color: 'rgba(160,150,140,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  summaryValue: {
    color: '#fff',
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    fontSize: 15,
  },
  summaryDot: {
    color: 'rgba(100,100,110,1)',
    fontSize: 14,
  },

  // Streak
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  streakText: {
    color: 'rgba(160,150,140,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  streakHighlight: {
    color: '#f97316',
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  streakMuted: {
    color: 'rgba(120,120,130,1)',
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  streakSep: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Radar chart
  radarCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginBottom: 16,
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  radarContainer: {
    alignItems: 'center',
  },
  balanceBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  balanceBadgeWarn: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  balanceBadgeText: {
    color: '#22C55E',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  balanceBadgeTextWarn: {
    color: '#FBBF24',
  },

  // Volume bars
  volumeSection: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    gap: 14,
    marginBottom: 16,
  },
  volumeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  volumeInfoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeList: {
    gap: 10,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  volumeLabel: {
    width: 80,
    color: 'rgba(180,180,190,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  volumeBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    position: 'relative',
  },
  volumeBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: 4,
  },
  volumeMarker: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
  },
  volumeMarkerGreen: {
    backgroundColor: 'rgba(74, 222, 128, 0.85)',
  },
  volumeMarkerYellow: {
    backgroundColor: 'rgba(251, 191, 36, 0.85)',
  },
  volumeValue: {
    width: 46,
    textAlign: 'right',
    fontSize: 12,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  volumeTarget: {
    color: 'rgba(100,100,110,1)',
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  volumeExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 4,
  },
  volumeExpandText: {
    color: 'rgba(160,150,140,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Chart
  chartCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    gap: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
  },

  // Recent
  recentSection: {
    marginHorizontal: 20,
    gap: 12,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  recentInfo: {
    flex: 1,
    gap: 2,
  },
  recentName: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  recentMeta: {
    color: 'rgba(120,120,130,1)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
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
  landmarkHeader: {
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
  progressionBox: {
    marginTop: 24,
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
  progressionMarker: {
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: 'rgba(160,150,140,1)',
    fontSize: 15,
    fontFamily: Fonts?.sans,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyCtaText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
});
