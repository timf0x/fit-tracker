/**
 * Steps Detail Page
 * Today's hero card, SVG line chart with goal line, stats grid, goal card
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Footprints,
  Target,
  TrendingUp,
  Calendar,
  Flame,
} from 'lucide-react-native';
import Svg, {
  Path,
  Line,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Fonts, Spacing } from '@/constants/theme';
import { generateMockStepsHistory } from '@/lib/mock-data';

type TimeFilter = 'week' | 'month' | 'year';

const GOAL_STEPS = 10000;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = 40;
const CHART_WIDTH = SCREEN_WIDTH - 48 - CHART_PADDING;
const CHART_HEIGHT = 180;

const TIME_FILTERS: { value: TimeFilter; label: string; days: number }[] = [
  { value: 'week', label: 'Semaine', days: 7 },
  { value: 'month', label: 'Mois', days: 30 },
  { value: 'year', label: 'Année', days: 365 },
];

export default function StepsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const filterDays = TIME_FILTERS.find((f) => f.value === timeFilter)?.days || 7;
  const stepsData = useMemo(() => generateMockStepsHistory(filterDays), [filterDays]);

  // Stats
  const stats = useMemo(() => {
    if (stepsData.length === 0) {
      return { average: 0, total: 0, best: 0, goalDays: 0, todaySteps: 0 };
    }
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
    if (stepsData.length === 0) return { path: '', fillPath: '', points: [], maxSteps: GOAL_STEPS };

    const maxSteps = Math.max(GOAL_STEPS, ...stepsData.map((d) => d.steps)) * 1.1;
    const xStep = CHART_WIDTH / (stepsData.length - 1 || 1);

    const points = stepsData.map((d, i) => ({
      x: i * xStep,
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

    const fillPath = path + ` L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`;

    return { path, fillPath, points, maxSteps };
  }, [stepsData]);

  const goalY = CHART_HEIGHT - (GOAL_STEPS / chartData.maxSteps) * CHART_HEIGHT;

  const formatDateLabel = (dateStr: string, index: number, total: number): string => {
    const date = new Date(dateStr);
    if (timeFilter === 'week') {
      const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
      return days[date.getDay()];
    } else if (timeFilter === 'month') {
      if (index % 5 === 0 || index === total - 1) return date.getDate().toString();
      return '';
    } else {
      if (index % 30 === 0) {
        return date.toLocaleDateString('fr-FR', { month: 'short' }).substring(0, 3);
      }
      return '';
    }
  };

  const getProgressColor = () => {
    const progress = stats.todaySteps / GOAL_STEPS;
    if (progress >= 1) return '#4ADE80';
    if (progress >= 0.5) return '#3B82F6';
    return '#F97316';
  };

  const progressColor = getProgressColor();
  const progressPercent = Math.min((stats.todaySteps / GOAL_STEPS) * 100, 100);

  return (
    <View style={styles.screen}>
      {/* Ambient orbs */}
      <View style={styles.orbBlue} />
      <View style={styles.orbOrange} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Pas</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Animated.View
          style={[styles.heroCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroIconContainer}>
              <Footprints size={28} color="#3B82F6" />
            </View>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroLabel}>AUJOURD'HUI</Text>
              <View style={styles.heroValueRow}>
                <Text style={styles.heroValue}>
                  {stats.todaySteps.toLocaleString()}
                </Text>
                <Text style={styles.heroUnit}>pas</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%`, backgroundColor: progressColor },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>{Math.round(progressPercent)}%</Text>
              <View style={styles.goalLabel}>
                <Target size={12} color="#4ADE80" />
                <Text style={styles.goalLabelText}>
                  {GOAL_STEPS.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Time Filter */}
        <Animated.View
          style={[styles.filterContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {TIME_FILTERS.map((filter) => (
            <Pressable
              key={filter.value}
              style={[
                styles.filterButton,
                timeFilter === filter.value && styles.filterButtonActive,
              ]}
              onPress={() => setTimeFilter(filter.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  timeFilter === filter.value && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Chart */}
        <Animated.View
          style={[styles.chartCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Progression</Text>
            <Text style={styles.chartHint}>Avec objectif</Text>
          </View>

          <View style={styles.chartContainer}>
            <Svg width={CHART_WIDTH + CHART_PADDING} height={CHART_HEIGHT + 40}>
              <Defs>
                <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <Stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </LinearGradient>
              </Defs>

              {/* Goal line */}
              <Line
                x1={0}
                y1={goalY}
                x2={CHART_WIDTH}
                y2={goalY}
                stroke="#4ADE80"
                strokeWidth={1.5}
                strokeDasharray="6,4"
              />
              <SvgText
                x={CHART_WIDTH + 5}
                y={goalY + 4}
                fill="#4ADE80"
                fontSize={10}
                fontFamily={Fonts?.medium}
              >
                10k
              </SvgText>

              {/* Area fill */}
              {chartData.fillPath ? (
                <Path d={chartData.fillPath} fill="url(#areaGradient)" />
              ) : null}

              {/* Line */}
              {chartData.path ? (
                <Path
                  d={chartData.path}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}

              {/* Data points */}
              {chartData.points.map((point, index) => (
                <Circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={index === chartData.points.length - 1 ? 5 : 3}
                  fill={point.steps >= GOAL_STEPS ? '#4ADE80' : '#3B82F6'}
                  stroke="#0C0C0C"
                  strokeWidth={2}
                />
              ))}

              {/* X-axis labels */}
              {chartData.points.map((point, index) => {
                const label = formatDateLabel(point.date, index, chartData.points.length);
                if (!label) return null;
                return (
                  <SvgText
                    key={`label-${index}`}
                    x={point.x}
                    y={CHART_HEIGHT + 20}
                    fill="#6B7280"
                    fontSize={10}
                    fontFamily={Fonts?.medium}
                    textAnchor="middle"
                  >
                    {label}
                  </SvgText>
                );
              })}
            </Svg>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View
          style={[styles.statsGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
              <TrendingUp size={18} color="#F97316" />
            </View>
            <Text style={styles.statValue}>{stats.average.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Moyenne</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Flame size={18} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{stats.best.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Record</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}>
              <Target size={18} color="#4ADE80" />
            </View>
            <Text style={styles.statValue}>{stats.goalDays}</Text>
            <Text style={styles.statLabel}>Objectifs</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(147, 51, 234, 0.1)' }]}>
              <Calendar size={18} color="#9333EA" />
            </View>
            <Text style={styles.statValue}>
              {stats.total >= 1000000
                ? `${(stats.total / 1000000).toFixed(1)}M`
                : stats.total >= 1000
                ? `${(stats.total / 1000).toFixed(0)}k`
                : stats.total.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </Animated.View>

        {/* Goal Card */}
        <Animated.View
          style={[styles.goalCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.goalHeader}>
            <View style={styles.goalIconContainer}>
              <Target size={20} color="#4ADE80" />
            </View>
            <View>
              <Text style={styles.goalTitle}>Objectif quotidien</Text>
              <Text style={styles.goalSubtitle}>
                {GOAL_STEPS.toLocaleString()} pas/jour
              </Text>
            </View>
          </View>
          <Text style={styles.goalDescription}>
            Vous avez atteint votre objectif {stats.goalDays} fois sur les {filterDays} derniers jours.
          </Text>
          <View style={styles.goalStreak}>
            <Text style={styles.goalStreakValue}>
              {filterDays > 0 ? Math.round((stats.goalDays / filterDays) * 100) : 0}%
            </Text>
            <Text style={styles.goalStreakLabel}>taux de réussite</Text>
          </View>
        </Animated.View>
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

  // Ambient orbs — blue theme for steps
  orbBlue: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(59, 130, 246, 0.10)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 80,
  },
  orbOrange: {
    position: 'absolute',
    top: '55%',
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(249, 115, 22, 0.04)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: { width: 44 },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    gap: 16,
  },

  // Hero Card — blue-tinted glass
  heroCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    padding: 22,
    gap: 20,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextContainer: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: 'rgba(160, 150, 140, 1)',
    letterSpacing: 2,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  heroValue: {
    fontSize: 40,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  heroUnit: {
    fontSize: 16,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  progressContainer: { gap: 8 },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  goalLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalLabelText: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#4ADE80',
  },

  // Time Filter
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 4,
    gap: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Chart Card
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 20,
    gap: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  chartTitle: {
    fontSize: 17,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chartHint: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
  },
  chartContainer: {
    alignItems: 'center',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - 48 - 12) / 2 - 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Goal Card — green-tinted glass
  goalCard: {
    backgroundColor: 'rgba(74, 222, 128, 0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.12)',
    padding: 22,
    gap: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  goalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#4ADE80',
  },
  goalSubtitle: {
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(74, 222, 128, 0.7)',
    marginTop: 2,
  },
  goalDescription: {
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#9CA3AF',
    lineHeight: 22,
  },
  goalStreak: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  goalStreakValue: {
    fontSize: 32,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  goalStreakLabel: {
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
  },
});
