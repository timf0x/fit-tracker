/**
 * Steps Detail Page
 * Hero number, ruler time picker, SVG chart, metric strip
 * Uses real pedometer data via expo-sensors (iOS Core Motion)
 * with AsyncStorage cache for historical data beyond 7 days.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  AppState,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Target } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, {
  Path,
  Line,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import {
  getStepsHistory,
  isPedometerAvailable,
  DailySteps,
} from '@/services/pedometer';

type TimeFilter = 'week' | 'month' | 'year';

const GOAL_STEPS = 10000;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING_LEFT = 4;
const CHART_PADDING_RIGHT = 32;
const CHART_WIDTH = SCREEN_WIDTH - 40 - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
const CHART_HEIGHT = 200;

const TIME_FILTERS: { value: TimeFilter; label: string; days: number }[] = [
  { value: 'week', label: i18n.t('steps.timeFilters.week'), days: 7 },
  { value: 'month', label: i18n.t('steps.timeFilters.month'), days: 30 },
  { value: 'year', label: i18n.t('steps.timeFilters.year'), days: 365 },
];

export default function StepsScreen() {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [stepsData, setStepsData] = useState<DailySteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  const filterDays =
    TIME_FILTERS.find((f) => f.value === timeFilter)?.days || 7;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const isAvailable = await isPedometerAvailable();
    setAvailable(isAvailable);
    const data = await getStepsHistory(filterDays);
    setStepsData(data);
    setLoading(false);
  }, [filterDays]);

  useEffect(() => {
    fetchData();

    // Refresh when app comes to foreground
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchData();
    });

    return () => sub.remove();
  }, [fetchData]);

  const stats = useMemo(() => {
    if (stepsData.length === 0)
      return { average: 0, total: 0, best: 0, goalDays: 0, todaySteps: 0 };
    const steps = stepsData.map((d) => d.steps);
    const total = steps.reduce((a, b) => a + b, 0);
    const average = Math.round(total / steps.length);
    const best = Math.max(...steps);
    const goalDays = steps.filter((s) => s >= GOAL_STEPS).length;
    const todaySteps = stepsData[stepsData.length - 1]?.steps || 0;
    return { average, total, best, goalDays, todaySteps };
  }, [stepsData]);

  // Chart data
  const chartData = useMemo(() => {
    if (stepsData.length === 0)
      return { path: '', fillPath: '', points: [], maxSteps: GOAL_STEPS };

    const maxSteps =
      Math.max(GOAL_STEPS, ...stepsData.map((d) => d.steps)) * 1.15;
    const xStep = CHART_WIDTH / (stepsData.length - 1 || 1);

    const points = stepsData.map((d, i) => ({
      x: CHART_PADDING_LEFT + i * xStep,
      y: CHART_HEIGHT - (d.steps / maxSteps) * CHART_HEIGHT,
      steps: d.steps,
      date: d.date,
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const fillPath =
      path +
      ` L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`;

    return { path, fillPath, points, maxSteps };
  }, [stepsData]);

  const goalY =
    CHART_HEIGHT - (GOAL_STEPS / chartData.maxSteps) * CHART_HEIGHT;

  const formatDateLabel = (
    dateStr: string,
    index: number,
    total: number
  ): string => {
    const date = new Date(dateStr + 'T00:00:00');
    if (timeFilter === 'week') {
      const days = i18n.t('steps.dayAbbr') as unknown as string[];
      return days[date.getDay()];
    } else if (timeFilter === 'month') {
      if (index % 5 === 0 || index === total - 1)
        return date.getDate().toString();
      return '';
    } else {
      if (index % 30 === 0) {
        return date
          .toLocaleDateString('fr-FR', { month: 'short' })
          .substring(0, 3);
      }
      return '';
    }
  };

  const progressPercent = Math.min(
    (stats.todaySteps / GOAL_STEPS) * 100,
    100
  );
  const progressColor =
    progressPercent >= 100
      ? '#4ADE80'
      : progressPercent >= 50
        ? '#3B82F6'
        : '#F97316';

  const selectFilter = (value: TimeFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeFilter(value);
  };

  const formatTotal = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return n.toLocaleString();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.orbBlue} pointerEvents="none" />
      <View style={styles.orbOrange} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#fff" strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>{i18n.t('steps.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Unavailable notice ── */}
          {!available && !loading && (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>
                {i18n.t('steps.unavailable')}
              </Text>
            </View>
          )}

          {/* ── Hero ── */}
          <View style={styles.hero}>
            <View style={styles.heroRow}>
              {loading ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text style={styles.heroNumber}>
                  {stats.todaySteps.toLocaleString()}
                </Text>
              )}
              <Text style={styles.heroUnit}>{i18n.t('steps.stepsUnit')}</Text>
            </View>
            <View style={styles.heroProgressRow}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: progressColor,
                    },
                  ]}
                />
              </View>
              <View style={styles.heroGoal}>
                <Target size={11} color="#4ADE80" strokeWidth={2.5} />
                <Text style={styles.heroGoalText}>
                  {Math.round(progressPercent)}%
                </Text>
              </View>
            </View>
          </View>

          {/* ── Time Filter — ruler style ── */}
          <View style={styles.filterRow}>
            {TIME_FILTERS.map((f) => {
              const isActive = timeFilter === f.value;
              return (
                <Pressable
                  key={f.value}
                  style={styles.filterItem}
                  onPress={() => selectFilter(f.value)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isActive && styles.filterTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                  <View
                    style={[
                      styles.filterTick,
                      isActive && styles.filterTickActive,
                    ]}
                  />
                  {isActive && <View style={styles.filterAccent} />}
                </Pressable>
              );
            })}
          </View>

          {/* ── Chart ── */}
          <View style={styles.chartContainer}>
            <Svg
              width={CHART_WIDTH + CHART_PADDING_LEFT + CHART_PADDING_RIGHT}
              height={CHART_HEIGHT + 30}
            >
              <Defs>
                <LinearGradient
                  id="areaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <Stop
                    offset="0%"
                    stopColor="#3B82F6"
                    stopOpacity={0.3}
                  />
                  <Stop
                    offset="100%"
                    stopColor="#3B82F6"
                    stopOpacity={0}
                  />
                </LinearGradient>
              </Defs>

              {/* Goal line */}
              <Line
                x1={CHART_PADDING_LEFT}
                y1={goalY}
                x2={CHART_PADDING_LEFT + CHART_WIDTH}
                y2={goalY}
                stroke="rgba(74,222,128,0.3)"
                strokeWidth={1}
                strokeDasharray="6,4"
              />
              <SvgText
                x={CHART_PADDING_LEFT + CHART_WIDTH + 6}
                y={goalY + 4}
                fill="rgba(74,222,128,0.5)"
                fontSize={9}
              >
                10k
              </SvgText>

              {/* Area */}
              {chartData.fillPath ? (
                <Path d={chartData.fillPath} fill="url(#areaGradient)" />
              ) : null}

              {/* Line */}
              {chartData.path ? (
                <Path
                  d={chartData.path}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}

              {/* Dots — only show a subset to avoid clutter */}
              {chartData.points.map((point, index) => {
                const isLast = index === chartData.points.length - 1;
                const showDot =
                  timeFilter === 'week' ||
                  isLast ||
                  (timeFilter === 'month' && index % 5 === 0) ||
                  (timeFilter === 'year' && index % 30 === 0);
                if (!showDot) return null;
                return (
                  <Circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r={isLast ? 4 : 2.5}
                    fill={
                      point.steps >= GOAL_STEPS ? '#4ADE80' : '#3B82F6'
                    }
                    stroke="#0C0C0C"
                    strokeWidth={isLast ? 2 : 1}
                  />
                );
              })}

              {/* X labels */}
              {chartData.points.map((point, index) => {
                const label = formatDateLabel(
                  point.date,
                  index,
                  chartData.points.length
                );
                if (!label) return null;
                return (
                  <SvgText
                    key={`l-${index}`}
                    x={point.x}
                    y={CHART_HEIGHT + 18}
                    fill="rgba(120,120,130,1)"
                    fontSize={10}
                    textAnchor="middle"
                  >
                    {label}
                  </SvgText>
                );
              })}
            </Svg>
          </View>

          {/* ── Metric Strip ── */}
          <View style={styles.metricStrip}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {stats.average.toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>{i18n.t('steps.average')}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {stats.best.toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>{i18n.t('steps.record')}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: '#4ADE80' }]}>
                {stats.goalDays}
              </Text>
              <Text style={styles.metricLabel}>{i18n.t('steps.goals')}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{formatTotal(stats.total)}</Text>
              <Text style={styles.metricLabel}>{i18n.t('steps.total')}</Text>
            </View>
          </View>

          {/* ── Success Rate ── */}
          <View style={styles.successRow}>
            <View style={styles.successLeft}>
              <Text style={styles.successValue}>
                {filterDays > 0
                  ? Math.round((stats.goalDays / filterDays) * 100)
                  : 0}
                %
              </Text>
              <Text style={styles.successLabel}>{i18n.t('steps.successRate')}</Text>
            </View>
            <View style={styles.successBar}>
              {Array.from({ length: Math.min(filterDays, 30) }, (_, i) => {
                const dayData = stepsData[stepsData.length - 1 - i];
                const hit = dayData ? dayData.steps >= GOAL_STEPS : false;
                return (
                  <View
                    key={i}
                    style={[
                      styles.successTick,
                      {
                        backgroundColor: hit
                          ? '#4ADE80'
                          : 'rgba(255,255,255,0.06)',
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>

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
  orbBlue: {
    position: 'absolute',
    top: -96,
    right: -96,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(59, 130, 246, 0.10)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 100,
  },
  orbOrange: {
    position: 'absolute',
    top: '50%',
    left: -128,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(249, 115, 22, 0.04)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
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

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Unavailable notice
  noticeCard: {
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  noticeText: {
    color: '#FBBF24',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 18,
  },

  // ── Hero ──
  hero: {
    paddingTop: 8,
    paddingBottom: 20,
    gap: 14,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  heroNumber: {
    color: '#fff',
    fontSize: 52,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: -1,
  },
  heroUnit: {
    color: 'rgba(120,120,130,1)',
    fontSize: 18,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  heroProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  heroGoal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroGoalText: {
    color: 'rgba(120,120,130,1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // ── Time Filter — ruler style ──
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    paddingBottom: 8,
  },
  filterItem: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
  },
  filterText: {
    color: 'rgba(100,100,110,1)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginBottom: 6,
  },
  filterTextActive: {
    color: '#fff',
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  filterTick: {
    width: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  filterTickActive: {
    width: 2,
    height: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 1,
  },
  filterAccent: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#3B82F6',
    marginTop: 3,
  },

  // ── Chart ──
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

  // ── Metric Strip ──
  metricStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    color: '#fff',
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  metricLabel: {
    color: 'rgba(100,100,110,1)',
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // ── Success Rate ──
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  successLeft: {
    gap: 2,
  },
  successValue: {
    color: '#4ADE80',
    fontSize: 28,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  successLabel: {
    color: 'rgba(100,100,110,1)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  successBar: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  successTick: {
    width: 6,
    height: 6,
    borderRadius: 1.5,
  },
});
