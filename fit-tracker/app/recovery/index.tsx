/**
 * Recovery Screen — Premium Redesign
 * Scrollable dashboard: body map hero, metric strip, smart nudge,
 * muscle readiness list, lighter detail sheet. Real data from workout history.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Modal,
  ScrollView,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, RotateCcw, ChevronRight, Zap, BedDouble, Dumbbell, X, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Spacing, GlassStyle, Header, SectionLabel, PageLayout, IconStroke } from '@/constants/theme';
import i18n from '@/lib/i18n';
import {
  RECOVERY_COLORS,
  RECOVERY_LABELS,
  BODY_PART_LABELS,
  MUSCLE_RECOVERY_HOURS,
} from '@/constants/recovery';
import { BodyMap } from '@/components/recovery/BodyMap';
import { ScoreRing } from '@/components/recovery/ScoreRing';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProgramStore } from '@/stores/programStore';
import { MuscleRecoveryData, RecoveryBodyPart } from '@/types';
import {
  computeRecoveryOverview,
  getMuscleRecoveryDetail,
  getTrainingRecommendation,
  formatTimeSince,
} from '@/lib/recoveryHelpers';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STATUS_ORDER: Record<string, number> = { fresh: 0, fatigued: 1, undertrained: 2 };

export default function RecoveryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { history } = useWorkoutStore();
  const profileSex = useProgramStore((s) => s.userProfile?.sex);

  const overview = useMemo(() => computeRecoveryOverview(history), [history]);

  const recommendation = useMemo(() => getTrainingRecommendation(overview), [overview]);

  // Sort muscles: fresh first (ready to train), then fatigued, then undertrained
  const sortedMuscles = useMemo(() => {
    return [...overview.muscles].sort((a, b) => {
      const orderDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (orderDiff !== 0) return orderDiff;
      // Within same status, sort by hours since (most recently trained first for fatigued)
      if (a.status === 'fatigued') {
        return (a.hoursSinceTraining || 0) - (b.hoursSinceTraining || 0);
      }
      return (b.hoursSinceTraining || 0) - (a.hoursSinceTraining || 0);
    });
  }, [overview.muscles]);

  const [selectedMuscle, setSelectedMuscle] = useState<MuscleRecoveryData | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front');
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [bodyMapTouching, setBodyMapTouching] = useState(false);

  // Entry animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bodyMapScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(bodyMapScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const flipAnim = useRef(new Animated.Value(1)).current;

  const flipBody = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(flipAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(() => {
      setBodyView(bodyView === 'front' ? 'back' : 'front');
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }).start();
    });
  };

  const handleMusclePress = (muscle: MuscleRecoveryData) => {
    setSelectedMuscle(muscle);
    setDetailVisible(true);
  };

  const getStatusColor = () => {
    if (overview.overallScore >= 70) return '#22C55E';
    if (overview.overallScore >= 40) return '#FBBF24';
    return '#EF4444';
  };

  const getStatusMessage = () => {
    if (overview.overallScore >= 70) return i18n.t('recovery.excellent');
    if (overview.overallScore >= 40) return i18n.t('recovery.partial');
    return i18n.t('recovery.restNeeded');
  };

  const getRecommendationIcon = () => {
    if (recommendation.type === 'rest') return BedDouble;
    return Dumbbell;
  };
  const RecIcon = getRecommendationIcon();

  // ─── Bottom Sheet ───
  const dismissSheet = useCallback(() => {
    setDetailVisible(false);
    // Delay clearing data so the Modal's native slide-out animation still has content
    setTimeout(() => setSelectedMuscle(null), 350);
  }, []);

  // Detail data for selected muscle
  const muscleDetail = useMemo(() => {
    if (!selectedMuscle) return null;
    return getMuscleRecoveryDetail(history, selectedMuscle.bodyPart);
  }, [selectedMuscle, history]);

  // Recovery bar color
  const getRecoveryBarColor = (progress: number) => {
    if (progress >= 0.9) return '#22C55E';
    if (progress >= 0.5) return '#FBBF24';
    return '#EF4444';
  };

  return (
    <View style={styles.screen}>
      {/* Ambient orbs */}
      <View style={styles.orbOrange} />
      <View style={styles.orbGreen} />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#fff" strokeWidth={IconStroke.default} />
          </Pressable>
          <Text style={styles.headerTitle}>{i18n.t('recovery.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEnabled={!bodyMapTouching}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* ─── Body Map Hero ─── */}
        <Animated.View
          style={[styles.bodyMapSection, { opacity: fadeAnim }]}
          onTouchStart={() => setBodyMapTouching(true)}
          onTouchEnd={() => setBodyMapTouching(false)}
          onTouchCancel={() => setBodyMapTouching(false)}
        >
          <Animated.View style={[
            styles.bodyMapContainer,
            { opacity: flipAnim, transform: [{ scale: bodyMapScale }] }
          ]}>
            <BodyMap
              muscles={overview.muscles}
              onMusclePress={handleMusclePress}
              height={400}
              view={bodyView}
              showToggle={false}
              gender={profileSex ?? 'male'}
              showLegend={false}
            />
          </Animated.View>

          {/* Floating score — top right */}
          <Pressable
            style={styles.floatingScore}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowScoreInfo(true);
            }}
          >
            <ScoreRing score={overview.overallScore} size={64} />
            <Text style={[styles.floatingScoreLabel, { color: getStatusColor() }]}>
              {getStatusMessage()}
            </Text>
            <View style={styles.floatingScoreInfoHint}>
              <Info size={8} color="#6B7280" />
            </View>
          </Pressable>

          {/* Floating flip button — top left */}
          <Pressable style={styles.floatingFlip} onPress={flipBody}>
            <RotateCcw size={16} color="#D1D5DB" />
            <Text style={styles.floatingFlipText}>
              {bodyView === 'front' ? i18n.t('recovery.back') : i18n.t('recovery.front')}
            </Text>
          </Pressable>

        </Animated.View>

        {/* ─── Metric Strip ─── */}
        <View style={styles.metricStrip}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: '#22C55E' }]}>{overview.freshCount}</Text>
            <Text style={styles.metricLabel}>{i18n.t('recovery.fresh')}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: '#EF4444' }]}>{overview.fatiguedCount}</Text>
            <Text style={styles.metricLabel}>{i18n.t('recovery.fatigued')}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: '#6B7280' }]}>{overview.undertrainedCount}</Text>
            <Text style={styles.metricLabel}>{i18n.t('recovery.undertrained')}</Text>
          </View>
        </View>

        {/* ─── Smart Nudge ─── */}
        <View style={styles.nudgeContainer}>
          <View style={styles.nudgeIconWrap}>
            <RecIcon size={16} color={recommendation.type === 'rest' ? '#FBBF24' : '#22C55E'} />
          </View>
          <Text style={styles.nudgeText}>{recommendation.message}</Text>
        </View>

        {/* ─── Muscle Readiness ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{i18n.t('recovery.muscleStatus')}</Text>
        </View>

        {sortedMuscles.map((muscle) => {
          const thresholds = MUSCLE_RECOVERY_HOURS[muscle.bodyPart];
          const totalHours = thresholds?.freshMin || 48;
          let progress = 0;
          if (muscle.status === 'fresh') progress = 1;
          else if (muscle.status === 'fatigued' && muscle.hoursSinceTraining !== null) {
            progress = Math.min(muscle.hoursSinceTraining / totalHours, 0.95);
          }
          const statusColor = RECOVERY_COLORS[muscle.status];
          const label = BODY_PART_LABELS[muscle.bodyPart]?.fr || muscle.bodyPart;

          return (
            <Pressable
              key={muscle.bodyPart}
              style={styles.muscleRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedMuscle(muscle);
                setDetailVisible(true);
              }}
            >
              <View style={[styles.muscleStatusDot, { backgroundColor: statusColor }]} />
              <View style={styles.muscleInfo}>
                <Text style={styles.muscleName}>{label}</Text>
                <View style={styles.muscleBarBg}>
                  <View
                    style={[
                      styles.muscleBarFill,
                      {
                        width: `${(muscle.status === 'undertrained' ? 0 : progress) * 100}%`,
                        backgroundColor: muscle.status === 'fresh'
                          ? '#22C55E'
                          : getRecoveryBarColor(progress),
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.muscleTime}>
                {formatTimeSince(muscle.hoursSinceTraining)}
              </Text>
              <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ═══════ Score Info Modal ═══════ */}
      <Modal
        visible={showScoreInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScoreInfo(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowScoreInfo(false)}>
          <Pressable style={styles.infoModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>{i18n.t('recovery.scoreTitle')}</Text>
              <Pressable style={styles.infoModalClose} onPress={() => setShowScoreInfo(false)}>
                <X size={18} color="#9CA3AF" />
              </Pressable>
            </View>
            <Text style={styles.infoModalText}>
              {i18n.t('recovery.scoreExplanation')}
            </Text>
            <View style={styles.scoreRanges}>
              <View style={styles.scoreRange}>
                <View style={[styles.scoreRangeDot, { backgroundColor: '#22C55E' }]} />
                <View style={styles.scoreRangeContent}>
                  <Text style={styles.scoreRangeValue}>70-100</Text>
                  <Text style={styles.scoreRangeLabel}>{i18n.t('recovery.excellent')}</Text>
                  <Text style={styles.scoreRangeDesc}>
                    {i18n.t('recovery.scoreExcellent')}
                  </Text>
                </View>
              </View>
              <View style={styles.scoreRange}>
                <View style={[styles.scoreRangeDot, { backgroundColor: '#FBBF24' }]} />
                <View style={styles.scoreRangeContent}>
                  <Text style={styles.scoreRangeValue}>40-69</Text>
                  <Text style={styles.scoreRangeLabel}>{i18n.t('recovery.partial')}</Text>
                  <Text style={styles.scoreRangeDesc}>
                    {i18n.t('recovery.scorePartial')}
                  </Text>
                </View>
              </View>
              <View style={styles.scoreRange}>
                <View style={[styles.scoreRangeDot, { backgroundColor: '#EF4444' }]} />
                <View style={styles.scoreRangeContent}>
                  <Text style={styles.scoreRangeValue}>0-39</Text>
                  <Text style={styles.scoreRangeLabel}>{i18n.t('recovery.restNeeded')}</Text>
                  <Text style={styles.scoreRangeDesc}>
                    {i18n.t('recovery.scoreRest')}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.currentScoreBox}>
              <Text style={styles.currentScoreLabel}>{i18n.t('recovery.yourScore')}</Text>
              <Text style={[
                styles.currentScoreValue,
                { color: overview.overallScore >= 70 ? '#22C55E' :
                         overview.overallScore >= 40 ? '#FBBF24' : '#EF4444' }
              ]}>
                {overview.overallScore}
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ═══════ Muscle Detail Bottom Sheet ═══════ */}
      <Modal
        visible={detailVisible}
        transparent
        animationType="fade"
        onRequestClose={dismissSheet}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={dismissSheet} />

          <View style={styles.detailSheet}>
            <View style={styles.modalHandle} />

            {selectedMuscle && muscleDetail && (
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <View style={styles.detailHeader}>
                  <Text style={styles.detailName}>
                    {BODY_PART_LABELS[selectedMuscle.bodyPart]?.fr || selectedMuscle.bodyPart}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: `${RECOVERY_COLORS[selectedMuscle.status]}20` }
                  ]}>
                    <Text style={[styles.statusBadgeText, { color: RECOVERY_COLORS[selectedMuscle.status] }]}>
                      {RECOVERY_LABELS[selectedMuscle.status].fr}
                    </Text>
                  </View>
                </View>

                {/* Time since training */}
                <Text style={styles.detailTimeSince}>
                  {formatTimeSince(selectedMuscle.hoursSinceTraining)}
                </Text>

                {/* Recovery progress bar (for fatigued muscles) */}
                {selectedMuscle.status === 'fatigued' && muscleDetail.hoursSince !== null && (
                  <View style={styles.recoverySection}>
                    <Text style={styles.recoveryLabel}>{i18n.t('recovery.recoveryProgress')}</Text>
                    <View style={styles.recoveryBarBg}>
                      <View style={[
                        styles.recoveryBarFill,
                        {
                          width: `${muscleDetail.recoveryProgress * 100}%`,
                          backgroundColor: getRecoveryBarColor(muscleDetail.recoveryProgress),
                        },
                      ]} />
                    </View>
                    <View style={styles.recoveryTimeRow}>
                      <Text style={styles.recoveryTimeLeft}>
                        ~{Math.round(muscleDetail.hoursRemaining)}h restantes
                      </Text>
                      <Text style={styles.recoveryTimeRight}>
                        {Math.round(muscleDetail.hoursSince)}h / {muscleDetail.totalRecoveryHours}h
                      </Text>
                    </View>
                  </View>
                )}

                {/* Last session info */}
                {muscleDetail.exerciseNames.length > 0 && (
                  <View style={styles.lastSessionSection}>
                    <Text style={styles.lastSessionTitle}>{i18n.t('recovery.lastSession')}</Text>
                    <View style={styles.lastSessionRow}>
                      <Text style={styles.lastSessionSets}>{muscleDetail.totalSets} {i18n.t('common.sets')}</Text>
                      <Text style={styles.lastSessionDot}> · </Text>
                      <Text style={styles.lastSessionExercises} numberOfLines={1}>
                        {muscleDetail.exerciseNames.join(', ')}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Navigate to volume detail */}
                <Pressable
                  style={styles.detailLink}
                  onPress={() => {
                    dismissSheet();
                    setTimeout(() => {
                      router.push(`/volume/${selectedMuscle.bodyPart}`);
                    }, 300);
                  }}
                >
                  <Text style={styles.detailLinkText}>{i18n.t('recovery.viewVolumeHistory')}</Text>
                  <ChevronRight size={16} color="#FF6B35" />
                </Pressable>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  orbGreen: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 100,
  },

  // Safe area top
  safeTop: {
    backgroundColor: 'transparent',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PageLayout.paddingHorizontal,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    ...Header.backButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    ...Header.screenLabel,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  headerSpacer: { width: 40 },

  scrollContent: {
    paddingBottom: 40,
  },

  // ─── Body Map Section ───
  bodyMapSection: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: 4,
  },
  bodyMapContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Floating Score
  floatingScore: {
    position: 'absolute',
    top: 8,
    right: Spacing.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
  },
  floatingScoreLabel: {
    fontSize: 9,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  floatingScoreInfoHint: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Floating flip button — top left
  floatingFlip: {
    position: 'absolute',
    top: 8,
    left: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(12, 12, 12, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  floatingFlipText: {
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#D1D5DB',
  },


  // ─── Metric Strip ───
  metricStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // ─── Smart Nudge ───
  nudgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...GlassStyle.card,
    borderRadius: 12,
    gap: 10,
  },
  nudgeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#D1D5DB',
    lineHeight: 18,
  },

  // ─── Section Header ───
  sectionHeader: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    ...SectionLabel,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // ─── Muscle Row ───
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    gap: 10,
    minHeight: 56,
  },
  muscleStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  muscleInfo: {
    flex: 1,
    gap: 5,
  },
  muscleName: {
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  muscleBarBg: {
    height: 3,
    backgroundColor: GlassStyle.card.borderColor,
    borderRadius: 1.5,
  },
  muscleBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  muscleTime: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
    minWidth: 70,
    textAlign: 'right',
  },

  // ═══════ Modal ═══════
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },

  // ─── Detail Sheet ───
  detailSheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
    maxHeight: '60%',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailName: {
    fontSize: 22,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  detailTimeSince: {
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 16,
  },

  // Recovery progress
  recoverySection: {
    marginBottom: 16,
    gap: 8,
  },
  recoveryLabel: {
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  recoveryBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
  },
  recoveryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  recoveryTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recoveryTimeLeft: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  recoveryTimeRight: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Last session
  lastSessionSection: {
    marginBottom: 16,
    gap: 6,
  },
  lastSessionTitle: {
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  lastSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastSessionSets: {
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lastSessionDot: {
    fontSize: 14,
    color: '#6B7280',
  },
  lastSessionExercises: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#D1D5DB',
  },

  // Detail link
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 4,
  },
  detailLinkText: {
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#FF6B35',
  },

  // ─── Score Info Modal ───
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
  infoModalClose: {
    ...Header.backButton,
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
  scoreRanges: { gap: 16 },
  scoreRange: { flexDirection: 'row', gap: 12 },
  scoreRangeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  scoreRangeContent: { flex: 1 },
  scoreRangeValue: {
    fontSize: 13,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreRangeLabel: {
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#D1D5DB',
    marginTop: 1,
  },
  scoreRangeDesc: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  currentScoreBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: GlassStyle.card.backgroundColor,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  currentScoreLabel: {
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  currentScoreValue: {
    fontSize: 28,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
});
