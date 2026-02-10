import { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, {
  Line as SvgLine,
  Text as SvgText,
  Polygon,
  Circle,
} from 'react-native-svg';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Dumbbell,
  Trophy,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { useWorkoutStore } from '@/stores/workoutStore';
import { RP_VOLUME_LANDMARKS } from '@/constants/volumeLandmarks';
import { getExerciseById } from '@/data/exercises';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { ExerciseSparkline } from '@/components/ExerciseSparkline';
import {
  getWeekSummary,
  getWeekPRs,
  getMuscleFrequency,
} from '@/lib/statsHelpers';
import { getSetsForWeek, getWeekBounds, getWeekLabel } from '@/lib/weeklyVolume';

const WEEKS_AVAILABLE = 12;

/** Radar chart muscle groups (abbreviated labels) */
const RADAR_GROUPS: { label: string; muscles: string[] }[] = [
  { label: i18n.t('stats.radarGroups.legs'), muscles: ['quads', 'hamstrings', 'glutes'] },
  { label: i18n.t('stats.radarGroups.back'), muscles: ['lats', 'upper back', 'lower back'] },
  { label: i18n.t('stats.radarGroups.abs'), muscles: ['abs', 'obliques'] },
  { label: i18n.t('stats.radarGroups.forearms'), muscles: ['forearms'] },
  { label: i18n.t('stats.radarGroups.biceps'), muscles: ['biceps'] },
  { label: i18n.t('stats.radarGroups.triceps'), muscles: ['triceps'] },
  { label: i18n.t('stats.radarGroups.calves'), muscles: ['calves'] },
  { label: i18n.t('stats.radarGroups.shoulders'), muscles: ['shoulders'] },
  { label: i18n.t('stats.radarGroups.chest'), muscles: ['chest'] },
];

const RADAR_SIZE = 280;
const RADAR_CX = RADAR_SIZE / 2;
const RADAR_CY = RADAR_SIZE / 2;
const RADAR_R = 95;
const RADAR_RINGS = [0.25, 0.5, 0.75, 1.0];

const MUSCLE_ABBR: Record<string, string> = {
  chest: i18n.t('stats.muscleAbbr.chest'),
  shoulders: i18n.t('stats.muscleAbbr.shoulders'),
  lats: i18n.t('stats.muscleAbbr.lats'),
  'upper back': i18n.t('stats.muscleAbbr.upperBack'),
  biceps: i18n.t('stats.muscleAbbr.biceps'),
  triceps: i18n.t('stats.muscleAbbr.triceps'),
  quads: i18n.t('stats.muscleAbbr.quads'),
  hamstrings: i18n.t('stats.muscleAbbr.hamstrings'),
  glutes: i18n.t('stats.muscleAbbr.glutes'),
  calves: i18n.t('stats.muscleAbbr.calves'),
  abs: i18n.t('stats.muscleAbbr.abs'),
  forearms: i18n.t('stats.muscleAbbr.forearms'),
  'lower back': i18n.t('stats.muscleAbbr.lowerBack'),
  obliques: i18n.t('stats.muscleAbbr.obliques'),
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg}kg`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const locale = i18n.locale === 'fr' ? 'fr-FR' : 'en-US';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function formatSessionDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

function getShortWeekLabel(offset: number): string {
  const { start } = getWeekBounds(offset);
  const day = start.getDate();
  const locale = i18n.locale === 'fr' ? 'fr-FR' : 'en-US';
  const month = start
    .toLocaleDateString(locale, { month: 'short' })
    .replace('.', '');
  return `${day} ${month}`;
}

export default function StatsScreen() {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    null
  );
  const [weekOffset, setWeekOffset] = useState(0);
  const router = useRouter();
  const { history } = useWorkoutStore();
  const weekStripRef = useRef<FlatList>(null);

  // Weeks array for picker
  const weeks = useMemo(
    () => Array.from({ length: WEEKS_AVAILABLE }, (_, i) => -i),
    []
  );

  // Global week label
  const currentWeekLabel = useMemo(
    () => getWeekLabel(weekOffset),
    [weekOffset]
  );

  // All sections respond to weekOffset
  const weekSummary = useMemo(
    () => getWeekSummary(history, weekOffset),
    [history, weekOffset]
  );

  const muscleFreq = useMemo(
    () => getMuscleFrequency(history, weekOffset),
    [history, weekOffset]
  );

  const weekSetsData = useMemo(
    () => getSetsForWeek(history, weekOffset),
    [history, weekOffset]
  );

  const weekPRs = useMemo(
    () => getWeekPRs(history, weekOffset),
    [history, weekOffset]
  );

  // Radar uses the selected week's data
  const muscleData = useMemo(() => weekSetsData, [weekSetsData]);

  // Volume shortcut data
  const volumeShortcut = useMemo(() => {
    const totalSets = Object.values(weekSetsData).reduce((a, b) => a + b, 0);
    const muscleCount = Object.values(weekSetsData).filter((v) => v > 0).length;
    return { totalSets, muscleCount };
  }, [weekSetsData]);

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

  const radarMaxNorm = Math.max(
    ...radarData.map((d) => d.normalized),
    0.01
  );
  const radarPoints = radarData
    .map((d, i) => {
      const angle =
        (2 * Math.PI * i) / radarData.length - Math.PI / 2;
      const r = Math.min(d.normalized / radarMaxNorm, 1) * RADAR_R;
      return `${RADAR_CX + r * Math.cos(angle)},${RADAR_CY + r * Math.sin(angle)}`;
    })
    .join(' ');

  // Recent sessions filtered to selected week
  const recentSessions = useMemo(() => {
    const { start, end } = getWeekBounds(weekOffset);
    const startMs = start.getTime();
    const endMs = end.getTime();
    return history.filter((s) => {
      if (!s.endTime) return false;
      const ms = new Date(s.startTime).getTime();
      return ms >= startMs && ms <= endMs;
    });
  }, [history, weekOffset]);

  const isEmpty = history.filter((s) => s.endTime).length === 0;


  const toggleSession = (sessionId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSessionId((prev) =>
      prev === sessionId ? null : sessionId
    );
  };

  const selectWeek = useCallback((offset: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeekOffset(offset);
    setExpandedSessionId(null);
  }, []);

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

  return (
    <View style={styles.screen}>
      <View style={styles.orbOrange} pointerEvents="none" />
      <View style={styles.orbBlue} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color="#fff" strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>{i18n.t('stats.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Sticky Week Picker ── */}
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.weekLabel}>{currentWeekLabel}</Text>

          {isEmpty ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <BarChart3
                  size={48}
                  color="rgba(255,255,255,0.15)"
                  strokeWidth={1.5}
                />
              </View>
              <Text style={styles.emptyTitle}>{i18n.t('stats.noData')}</Text>
              <Text style={styles.emptySubtitle}>
                {i18n.t('stats.noDataDesc')}
              </Text>
              <Pressable
                style={styles.emptyCta}
                onPress={() => {
                  router.back();
                  setTimeout(
                    () => router.push('/(tabs)/workouts'),
                    100
                  );
                }}
              >
                <Dumbbell size={18} color="#fff" strokeWidth={2.2} />
                <Text style={styles.emptyCtaText}>
                  {i18n.t('stats.viewWorkouts')}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* ── Metric Strip ── */}
              <View style={styles.metricStrip}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>
                    {weekSummary.sessions}
                  </Text>
                  <Text style={styles.metricLabel}>{i18n.t('stats.sessions')}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>
                    {formatDuration(weekSummary.totalMinutes)}
                  </Text>
                  <Text style={styles.metricLabel}>{i18n.t('stats.duration')}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>
                    {formatVolume(weekSummary.totalVolumeKg)}
                  </Text>
                  <Text style={styles.metricLabel}>{i18n.t('stats.volume')}</Text>
                </View>
              </View>

              {/* ── Frequency — compact ── */}
              {Object.keys(muscleFreq.perMuscle).length > 0 && (
                <View style={styles.freqStrip}>
                  {Object.entries(muscleFreq.perMuscle)
                    .sort((a, b) => b[1] - a[1])
                    .map(([muscle, count]) => {
                      const isLow = count < 2;
                      const color = isLow ? '#f97316' : '#22C55E';
                      return (
                        <View key={muscle} style={styles.freqItem}>
                          <Text style={[styles.freqCount, { color }]}>
                            {count}x
                          </Text>
                          <Text
                            style={[
                              styles.freqLabel,
                              { color: isLow ? 'rgba(249,115,22,0.6)' : 'rgba(120,120,130,1)' },
                            ]}
                          >
                            {MUSCLE_ABBR[muscle] || muscle}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              )}

              {/* ── PR Section with Week Picker ── */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Text style={styles.sectionLabel}>
                    {i18n.t('stats.personalRecords')}
                  </Text>
                  {weekPRs.total > 0 && (
                    <View style={styles.prCountBadge}>
                      <Trophy
                        size={11}
                        color="#f97316"
                        strokeWidth={2.5}
                      />
                      <Text style={styles.prCountText}>
                        {weekPRs.total} PR
                      </Text>
                    </View>
                  )}
                </View>
                <Pressable onPress={() => router.push('/exercise')}>
                  <Text style={styles.seeAllLink}>{i18n.t('stats.viewAll')}</Text>
                </Pressable>
              </View>

              {weekPRs.prs.length > 0 ? (
                <View style={styles.prList}>
                  {weekPRs.prs.slice(0, 10).map((pr) => {
                    const exercise = getExerciseById(pr.exerciseId);
                    const typeLabelFr =
                      pr.type === 'weight'
                        ? i18n.t('stats.prWeight')
                        : pr.type === 'reps'
                          ? i18n.t('stats.prReps')
                          : i18n.t('stats.prVolume');
                    const oldVal =
                      pr.type === 'weight'
                        ? `${pr.previousValue}kg`
                        : pr.type === 'reps'
                          ? `${pr.previousValue} reps`
                          : formatVolume(pr.previousValue);
                    const newVal =
                      pr.type === 'weight'
                        ? `${pr.value}kg`
                        : pr.type === 'reps'
                          ? `${pr.value} reps`
                          : formatVolume(pr.value);
                    return (
                      <Pressable
                        key={`${pr.exerciseId}_${pr.type}`}
                        style={styles.prCard}
                        onPress={() => router.push(`/exercise/${pr.exerciseId}`)}
                      >
                        <ExerciseIcon
                          exerciseName={exercise?.name}
                          bodyPart={exercise?.bodyPart}
                          gifUrl={exercise?.gifUrl}
                          size={18}
                          containerSize={40}
                        />
                        <View style={styles.prInfo}>
                          <Text
                            style={styles.prName}
                            numberOfLines={1}
                          >
                            {pr.exerciseNameFr}
                          </Text>
                          <View style={styles.prDetails}>
                            <View
                              style={[
                                styles.prTypePill,
                                pr.type === 'weight'
                                  ? styles.prTypePillWeight
                                  : pr.type === 'reps'
                                    ? styles.prTypePillReps
                                    : styles.prTypePillVolume,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.prTypePillText,
                                  pr.type === 'weight'
                                    ? styles.prTypePillTextWeight
                                    : pr.type === 'reps'
                                      ? styles.prTypePillTextReps
                                      : styles.prTypePillTextVolume,
                                ]}
                              >
                                {typeLabelFr}
                              </Text>
                            </View>
                            <Text style={styles.prOldVal}>
                              {oldVal}
                            </Text>
                            <Text style={styles.prArrow}>→</Text>
                            <Text style={styles.prNewVal}>
                              {newVal}
                            </Text>
                          </View>
                        </View>
                        <ExerciseSparkline
                          exerciseId={pr.exerciseId}
                          width={64}
                          height={28}
                          metric={
                            pr.type === 'weight'
                              ? 'bestWeight'
                              : pr.type === 'reps'
                                ? 'bestReps'
                                : 'totalVolume'
                          }
                        />
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.prEmptyCard}>
                  <Text style={styles.prEmptyText}>
                    {i18n.t('stats.noPrThisPeriod')}
                  </Text>
                  <Text style={styles.prEmptySubtext}>
                    {i18n.t('stats.keepPushing')}
                  </Text>
                </View>
              )}

              {/* ── Radar Chart — Muscle Balance ── */}
              {hasRadarData && (
                <View style={styles.radarCard}>
                  <View style={styles.radarHeader}>
                    <Text style={styles.sectionTitle}>{i18n.t('stats.balance')}</Text>
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
                        {isBalanced
                          ? i18n.t('stats.wellBalanced')
                          : i18n.t('stats.imbalanced')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.radarContainer}>
                    <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
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
                      {radarData.map((_, i) => {
                        const angle =
                          (2 * Math.PI * i) / radarData.length -
                          Math.PI / 2;
                        return (
                          <SvgLine
                            key={`spoke-${i}`}
                            x1={RADAR_CX}
                            y1={RADAR_CY}
                            x2={
                              RADAR_CX + RADAR_R * Math.cos(angle)
                            }
                            y2={
                              RADAR_CY + RADAR_R * Math.sin(angle)
                            }
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth={1}
                          />
                        );
                      })}
                      <Polygon
                        points={radarPoints}
                        fill="rgba(249, 115, 22, 0.2)"
                        stroke="#f97316"
                        strokeWidth={2}
                      />
                      {radarData.map((d, i) => {
                        const angle =
                          (2 * Math.PI * i) / radarData.length -
                          Math.PI / 2;
                        const r =
                          Math.min(d.normalized / radarMaxNorm, 1) *
                          RADAR_R;
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
                      {radarData.map((d, i) => {
                        const angle =
                          (2 * Math.PI * i) / radarData.length -
                          Math.PI / 2;
                        const labelR = RADAR_R + 24;
                        const lx =
                          RADAR_CX + labelR * Math.cos(angle);
                        const ly =
                          RADAR_CY + labelR * Math.sin(angle);
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

              {/* ── Volume Hebdo Shortcut ── */}
              <Pressable
                style={styles.volumeShortcut}
                onPress={() => router.push('/volume')}
              >
                <View style={styles.volumeShortcutIcon}>
                  <Dumbbell
                    size={18}
                    color="#FF6B35"
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.volumeShortcutInfo}>
                  <Text style={styles.volumeShortcutTitle}>
                    {i18n.t('stats.weeklyVolume')}
                  </Text>
                  <Text style={styles.volumeShortcutSub}>
                    {volumeShortcut.totalSets} {i18n.t('volume.totalSets')} ·{' '}
                    {volumeShortcut.muscleCount} {i18n.t('volume.activeMuscles')}
                  </Text>
                </View>
                <ChevronRight
                  size={18}
                  color="rgba(120,120,130,1)"
                  strokeWidth={2}
                />
              </Pressable>

              {/* ── Recent Sessions (expandable) ── */}
              {recentSessions.length > 0 && (
                <View style={styles.recentSection}>
                  <Text style={styles.sectionTitle}>
                    {i18n.t('stats.recentSessions')}
                  </Text>
                  {recentSessions.map((session) => {
                    const isExpanded =
                      expandedSessionId === session.id;
                    return (
                      <Pressable
                        key={session.id}
                        style={styles.recentCard}
                        onPress={() => toggleSession(session.id)}
                      >
                        <View style={styles.recentTop}>
                          <View style={styles.recentInfo}>
                            <Text
                              style={styles.recentName}
                              numberOfLines={1}
                            >
                              {session.workoutName}
                            </Text>
                            <Text style={styles.recentMeta}>
                              {formatDate(session.startTime)} ·{' '}
                              {formatSessionDuration(
                                session.durationSeconds
                              )}{' '}
                              ·{' '}
                              {session.completedExercises.length}{' '}
                              {i18n.t('common.exosAbbr')}
                            </Text>
                          </View>
                          {isExpanded ? (
                            <ChevronDown
                              size={18}
                              color="rgba(120,120,130,1)"
                              strokeWidth={2}
                            />
                          ) : (
                            <ChevronRight
                              size={18}
                              color="rgba(120,120,130,1)"
                              strokeWidth={2}
                            />
                          )}
                        </View>
                        {isExpanded && (
                          <View style={styles.recentExercises}>
                            {session.completedExercises.map(
                              (compEx, idx) => {
                                const exercise = getExerciseById(
                                  compEx.exerciseId
                                );
                                const completedSets =
                                  compEx.sets.filter(
                                    (s) => s.completed
                                  );
                                if (completedSets.length === 0)
                                  return null;
                                return (
                                  <View
                                    key={idx}
                                    style={styles.recentExRow}
                                  >
                                    <Text
                                      style={styles.recentExName}
                                      numberOfLines={1}
                                    >
                                      {exercise?.nameFr ||
                                        exercise?.name ||
                                        compEx.exerciseId}
                                    </Text>
                                    <View
                                      style={styles.recentSetsList}
                                    >
                                      {completedSets.map(
                                        (set, si) => (
                                          <Text
                                            key={si}
                                            style={
                                              styles.recentSetText
                                            }
                                          >
                                            {set.weight
                                              ? `${set.weight}kg`
                                              : i18n.t('stats.bodyweight')}{' '}
                                            × {set.reps}
                                          </Text>
                                        )
                                      )}
                                    </View>
                                  </View>
                                );
                              }
                            )}
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
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

  // ── Metric Strip ──
  metricStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 20,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    color: '#fff',
    fontSize: 22,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  metricLabel: {
    color: 'rgba(100,100,110,1)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // ── Section Headers ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeAllLink: {
    color: '#FF6B35',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  sectionLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // ── Frequency Strip ──
  freqStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 24,
  },
  freqItem: {
    alignItems: 'center',
    gap: 1,
  },
  freqCount: {
    fontSize: 13,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  freqLabel: {
    fontSize: 9,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ── PR Section ──
  prCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249,115,22,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  prCountText: {
    color: '#f97316',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  weekStripContainer: {
    marginTop: 4,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  weekStripContent: {
    paddingHorizontal: 20,
    gap: 0,
  },
  weekLabel: {
    color: 'rgba(120,120,130,1)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    paddingHorizontal: 24,
    marginTop: 12,
    marginBottom: 8,
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
  prList: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  prInfo: {
    flex: 1,
    gap: 4,
  },
  prName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  prDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prTypePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  prTypePillWeight: {
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  prTypePillVolume: {
    backgroundColor: 'rgba(74,222,128,0.12)',
  },
  prTypePillReps: {
    backgroundColor: 'rgba(251,191,36,0.12)',
  },
  prTypePillText: {
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  prTypePillTextWeight: {
    color: '#3B82F6',
  },
  prTypePillTextVolume: {
    color: '#4ADE80',
  },
  prTypePillTextReps: {
    color: '#FBBF24',
  },
  prOldVal: {
    color: 'rgba(120,120,130,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  prArrow: {
    color: 'rgba(100,100,110,1)',
    fontSize: 11,
  },
  prNewVal: {
    color: '#f97316',
    fontSize: 13,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  prEmptyCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 24,
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  prEmptyText: {
    color: 'rgba(160,150,140,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  prEmptySubtext: {
    color: 'rgba(100,100,110,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
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

  // Volume Shortcut
  volumeShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 16,
  },
  volumeShortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,53,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeShortcutInfo: {
    flex: 1,
    gap: 2,
  },
  volumeShortcutTitle: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  volumeShortcutSub: {
    color: 'rgba(120,120,130,1)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Recent sessions
  recentSection: {
    marginHorizontal: 20,
    gap: 12,
  },
  recentCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  recentTop: {
    flexDirection: 'row',
    alignItems: 'center',
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
  recentExercises: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  recentExRow: {
    gap: 4,
  },
  recentExName: {
    color: 'rgba(200,200,210,1)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  recentSetsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recentSetText: {
    color: 'rgba(140,140,150,1)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
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
