import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, {
  Polyline,
  Circle,
  Line as SvgLine,
  Text as SvgText,
} from 'react-native-svg';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react-native';
import { Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { getExerciseById } from '@/data/exercises';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { useWorkoutStore } from '@/stores/workoutStore';
import {
  getExerciseAllTimeStats,
  getExerciseFullHistory,
  TimePeriod,
  ExerciseSessionDetail,
} from '@/lib/exerciseStats';

// ─── Constants ───

const PERIODS: { key: TimePeriod; label: string }[] = [
  { key: '3m', label: i18n.t('exercise.periods.3m') },
  { key: '6m', label: i18n.t('exercise.periods.6m') },
  { key: '1y', label: i18n.t('exercise.periods.1y') },
];

const BODY_PART_FR: Record<string, string> = {
  back: i18n.t('bodyParts.back'),
  shoulders: i18n.t('bodyParts.shoulders'),
  chest: i18n.t('bodyParts.chest'),
  'upper arms': i18n.t('bodyParts.upperArms'),
  'lower arms': i18n.t('bodyParts.forearms'),
  'upper legs': i18n.t('bodyParts.upperLegs'),
  'lower legs': i18n.t('bodyParts.lowerLegs'),
  waist: i18n.t('bodyParts.waist'),
  cardio: i18n.t('bodyParts.cardio'),
};

const CHART_W = 320;
const CHART_H = 180;
const PAD_LEFT = 40;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

// ─── Helpers ───

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg}kg`;
}

// ─── Chart Component ───

function LineChart({
  data,
  getValue,
  unit,
  color,
}: {
  data: ExerciseSessionDetail[];
  getValue: (d: ExerciseSessionDetail) => number;
  unit: string;
  color: string;
}) {
  if (data.length === 0) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={styles.chartEmptyText}>{i18n.t('exercise.noData')}</Text>
      </View>
    );
  }

  const values = data.map(getValue);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const chartW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const chartH = CHART_H - PAD_TOP - PAD_BOTTOM;

  const points = values.map((v, i) => {
    const x =
      PAD_LEFT +
      (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
    const y = PAD_TOP + chartH - ((v - minVal) / range) * chartH;
    return { x, y };
  });

  const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Y-axis gridlines (4 levels)
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount }, (_, i) => {
    const frac = i / (gridCount - 1);
    const val = minVal + frac * range;
    const y = PAD_TOP + chartH - frac * chartH;
    return { y, label: unit === 'kg' ? `${Math.round(val)}` : formatVolume(Math.round(val)) };
  });

  // X-axis labels (first, middle, last)
  const xLabels: { x: number; label: string }[] = [];
  if (data.length >= 1) {
    xLabels.push({ x: points[0].x, label: formatDate(data[0].date) });
  }
  if (data.length >= 3) {
    const mid = Math.floor(data.length / 2);
    xLabels.push({ x: points[mid].x, label: formatDate(data[mid].date) });
  }
  if (data.length >= 2) {
    xLabels.push({
      x: points[points.length - 1].x,
      label: formatDate(data[data.length - 1].date),
    });
  }

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {/* Grid lines */}
      {gridLines.map((gl, i) => (
        <SvgLine
          key={`grid-${i}`}
          x1={PAD_LEFT}
          y1={gl.y}
          x2={CHART_W - PAD_RIGHT}
          y2={gl.y}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}
      {/* Y labels */}
      {gridLines.map((gl, i) => (
        <SvgText
          key={`ylabel-${i}`}
          x={PAD_LEFT - 6}
          y={gl.y + 4}
          textAnchor="end"
          fill="rgba(160,150,140,0.6)"
          fontSize={10}
        >
          {gl.label}
        </SvgText>
      ))}
      {/* Line */}
      {data.length > 1 ? (
        <Polyline
          points={pointsStr}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {/* Dots */}
      {points.map((p, i) => (
        <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}
      {/* X labels */}
      {xLabels.map((xl, i) => (
        <SvgText
          key={`xlabel-${i}`}
          x={xl.x}
          y={CHART_H - 4}
          textAnchor="middle"
          fill="rgba(160,150,140,0.6)"
          fontSize={10}
        >
          {xl.label}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── Main Screen ───

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { history } = useWorkoutStore();
  const [period, setPeriod] = useState<TimePeriod>('3m');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    null
  );

  const exercise = useMemo(() => getExerciseById(id || ''), [id]);

  const allTimeStats = useMemo(
    () => getExerciseAllTimeStats(history, id || ''),
    [history, id]
  );

  const sessionHistory = useMemo(
    () => getExerciseFullHistory(history, id || '', period),
    [history, id, period]
  );

  const toggleSession = (sessionId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSessionId((prev) =>
      prev === sessionId ? null : sessionId
    );
  };

  if (!exercise) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color="#fff" strokeWidth={2} />
            </Pressable>
            <Text style={styles.headerTitle}>{i18n.t('exercise.notFound')}</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const hasData = sessionHistory.length > 0;

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
            <ExerciseIcon
              exerciseName={exercise.name}
              bodyPart={exercise.bodyPart}
              gifUrl={exercise.gifUrl}
              size={18}
              containerSize={36}
            />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {exercise.nameFr}
              </Text>
              <Text style={styles.headerSub}>
                {BODY_PART_FR[exercise.bodyPart] || exercise.bodyPart}
              </Text>
            </View>
          </View>

          {/* Period Picker */}
          <View style={styles.periodRow}>
            {PERIODS.map((p) => (
              <Pressable
                key={p.key}
                style={[
                  styles.periodChip,
                  period === p.key && styles.periodChipActive,
                ]}
                onPress={() => setPeriod(p.key)}
              >
                <Text
                  style={[
                    styles.periodChipText,
                    period === p.key && styles.periodChipTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {!hasData && allTimeStats.totalSessions === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>{i18n.t('exercise.noData')}</Text>
              <Text style={styles.emptySubtitle}>
                {i18n.t('exercise.addToNext')}
              </Text>
            </View>
          ) : (
            <>
              {/* Weight Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>{i18n.t('exercise.weightChart')}</Text>
                <View style={styles.chartContainer}>
                  <LineChart
                    data={sessionHistory}
                    getValue={(d) => d.bestWeight}
                    unit="kg"
                    color="#FF6B35"
                  />
                </View>
              </View>

              {/* Volume Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>{i18n.t('exercise.volumeChart')}</Text>
                <View style={styles.chartContainer}>
                  <LineChart
                    data={sessionHistory}
                    getValue={(d) => d.totalVolume}
                    unit="vol"
                    color="#4ADE80"
                  />
                </View>
              </View>

              {/* Stats Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>{i18n.t('exercise.summary')}</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {allTimeStats.bestWeight > 0
                        ? `${allTimeStats.bestWeight}kg`
                        : '—'}
                    </Text>
                    <Text style={styles.summaryLabel}>{i18n.t('exercise.bestWeight')}</Text>
                    {allTimeStats.bestWeightDate && (
                      <Text style={styles.summaryDate}>
                        {formatDate(allTimeStats.bestWeightDate)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {allTimeStats.bestSessionVolume > 0
                        ? formatVolume(allTimeStats.bestSessionVolume)
                        : '—'}
                    </Text>
                    <Text style={styles.summaryLabel}>{i18n.t('exercise.bestVolume')}</Text>
                    {allTimeStats.bestSessionVolumeDate && (
                      <Text style={styles.summaryDate}>
                        {formatDate(allTimeStats.bestSessionVolumeDate)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {allTimeStats.totalSessions}
                    </Text>
                    <Text style={styles.summaryLabel}>{i18n.t('exercise.totalSessions')}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {allTimeStats.lastPerformedDate
                        ? formatDate(allTimeStats.lastPerformedDate)
                        : '—'}
                    </Text>
                    <Text style={styles.summaryLabel}>{i18n.t('exercise.lastSession')}</Text>
                  </View>
                </View>
              </View>

              {/* Session History */}
              {sessionHistory.length > 0 && (
                <View style={styles.historySection}>
                  <Text style={styles.sectionLabel}>{i18n.t('exercise.history')}</Text>
                  {[...sessionHistory].reverse().map((session) => {
                    const isExpanded = expandedSessionId === session.sessionId;
                    return (
                      <Pressable
                        key={session.sessionId}
                        style={styles.historyCard}
                        onPress={() => toggleSession(session.sessionId)}
                      >
                        <View style={styles.historyTop}>
                          <View style={styles.historyInfo}>
                            <Text
                              style={styles.historyDate}
                              numberOfLines={1}
                            >
                              {formatDateLong(session.date)}
                            </Text>
                            <Text
                              style={styles.historyMeta}
                              numberOfLines={1}
                            >
                              {session.workoutName} ·{' '}
                              {session.bestWeight > 0
                                ? `${session.bestWeight}kg`
                                : i18n.t('exercise.bodyweight')}{' '}
                              · {formatVolume(session.totalVolume)}
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
                          <View style={styles.historySets}>
                            {session.sets.map((set, si) => (
                              <View key={si} style={styles.historySetRow}>
                                <Text style={styles.historySetLabel}>
                                  {i18n.t('exercise.set')} {si + 1}
                                </Text>
                                <Text style={styles.historySetValue}>
                                  {set.weight > 0
                                    ? `${set.weight}kg`
                                    : i18n.t('exercise.bodyweight')}{' '}
                                  × {set.reps}
                                </Text>
                              </View>
                            ))}
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

// ─── Styles ───

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
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: 'rgba(200,200,210,1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerSub: {
    color: 'rgba(120,120,130,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 2,
  },

  // Period Picker
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  periodChipActive: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderColor: 'rgba(255,107,53,0.3)',
  },
  periodChipText: {
    color: 'rgba(160,150,140,1)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  periodChipTextActive: {
    color: '#FF6B35',
  },

  // Charts
  chartCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginBottom: 12,
  },
  chartTitle: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartEmpty: {
    height: CHART_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartEmptyText: {
    color: 'rgba(120,120,130,1)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Summary
  summaryCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginBottom: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    width: '46%',
    gap: 2,
  },
  summaryValue: {
    color: '#FF6B35',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  summaryLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  summaryDate: {
    color: 'rgba(100,100,110,1)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // History
  historySection: {
    paddingHorizontal: 20,
    gap: 8,
  },
  sectionLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  historyCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyDate: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  historyMeta: {
    color: 'rgba(120,120,130,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  historySets: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  historySetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historySetLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  historySetValue: {
    color: '#fff',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: 'rgba(160,150,140,1)',
    fontSize: 14,
    fontFamily: Fonts?.sans,
    textAlign: 'center',
    lineHeight: 20,
  },
});
