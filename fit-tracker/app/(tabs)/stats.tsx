import { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  Dumbbell,
  Trophy,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, GlassStyle, Header, SectionLabel, PageLayout, IconStroke, CTAButton } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getExerciseById } from '@/data/exercises';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { ExerciseSparkline } from '@/components/ExerciseSparkline';
import {
  getWeekSummary,
  getWeekPRs,
} from '@/lib/statsHelpers';
import { getWeekBounds, getWeekLabel } from '@/lib/weeklyVolume';

const WEEKS_AVAILABLE = 12;

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
  const insets = useSafeAreaInsets();
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

  const weekPRs = useMemo(
    () => getWeekPRs(history, weekOffset),
    [history, weekOffset]
  );

  const isEmpty = history.filter((s) => s.endTime).length === 0;

  const selectWeek = useCallback((offset: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeekOffset(offset);
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
          <Text style={styles.headerTitle}>{i18n.t('stats.header')}</Text>
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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + PageLayout.scrollPaddingBottom }]}
        >
          <Text style={styles.weekLabel}>{currentWeekLabel}</Text>

          {isEmpty ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <BarChart3
                  size={48}
                  color="rgba(255,255,255,0.15)"
                  strokeWidth={IconStroke.light}
                />
              </View>
              <Text style={styles.emptyTitle}>{i18n.t('stats.noData')}</Text>
              <Text style={styles.emptySubtitle}>
                {i18n.t('stats.noDataDesc')}
              </Text>
              <Pressable
                style={styles.emptyCta}
                onPress={() => router.push('/(tabs)/workouts')}
              >
                <Dumbbell size={18} color="#fff" strokeWidth={IconStroke.default} />
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
                        strokeWidth={IconStroke.emphasis}
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
    backgroundColor: Colors.background,
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
  scrollContent: {},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PageLayout.paddingHorizontal,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    flex: 1,
    color: Header.screenLabel.color,
    fontSize: Header.screenLabel.fontSize,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: Header.screenLabel.letterSpacing,
    textTransform: Header.screenLabel.textTransform,
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
    color: SectionLabel.color,
    fontSize: SectionLabel.fontSize,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: SectionLabel.letterSpacing,
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
    paddingHorizontal: PageLayout.paddingHorizontal,
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
    color: SectionLabel.color,
    fontSize: SectionLabel.fontSize,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: SectionLabel.letterSpacing,
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
    paddingHorizontal: PageLayout.paddingHorizontal,
    marginTop: 12,
    marginBottom: 8,
  },
  weekChip: {
    width: 56,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 48,
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
    paddingHorizontal: PageLayout.paddingHorizontal,
    gap: 8,
    marginBottom: 20,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    ...GlassStyle.card,
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
    marginHorizontal: PageLayout.paddingHorizontal,
    ...GlassStyle.card,
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
    backgroundColor: GlassStyle.card.backgroundColor,
    borderWidth: 1,
    borderColor: GlassStyle.card.borderColor,
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
