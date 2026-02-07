/**
 * Recovery Screen — Option B
 * Full-screen body map with floating score ring overlay
 * Rich muscle detail modal matching MVP design
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
  PanResponder,
  Dimensions,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, RotateCcw, X, Info, AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Fonts, Spacing } from '@/constants/theme';
import {
  RECOVERY_COLORS,
  RECOVERY_LABELS,
  BODY_PART_LABELS,
  MUSCLE_RECOVERY_HOURS,
} from '@/constants/recovery';
import {
  RP_VOLUME_LANDMARKS,
  getVolumeZone,
  getZoneColor,
} from '@/constants/volumeLandmarks';
import { ScoreRing } from '@/components/recovery/ScoreRing';
import { BodyMap } from '@/components/recovery/BodyMap';
import { mockRecoveryOverview, mockWeeklyVolume } from '@/lib/mock-data';
import { exercises } from '@/data/exercises';
import { MuscleRecoveryData, RecoveryBodyPart } from '@/types';

// Map muscle groups back to exercise targets for "recent exercises"
const MUSCLE_TO_TARGETS: Record<string, string[]> = {};
const TARGET_TO_MUSCLE: Record<string, string> = {
  pecs: 'chest', 'upper chest': 'chest', 'lower chest': 'chest',
  lats: 'lats', 'upper back': 'upper back', 'middle back': 'upper back',
  'lower back': 'lower back', 'rear delts': 'shoulders',
  delts: 'shoulders', 'front delts': 'shoulders', 'lateral delts': 'shoulders', traps: 'shoulders',
  biceps: 'biceps', brachialis: 'biceps', triceps: 'triceps',
  'forearm flexors': 'forearms', 'forearm extensors': 'forearms', brachioradialis: 'forearms', grip: 'forearms',
  quads: 'quads', hamstrings: 'hamstrings', glutes: 'glutes',
  calves: 'calves', gastrocnemius: 'calves', soleus: 'calves',
  abs: 'abs', 'lower abs': 'abs', 'core stability': 'abs', obliques: 'obliques',
};
Object.entries(TARGET_TO_MUSCLE).forEach(([target, muscle]) => {
  if (!MUSCLE_TO_TARGETS[muscle]) MUSCLE_TO_TARGETS[muscle] = [];
  if (!MUSCLE_TO_TARGETS[muscle].includes(target)) MUSCLE_TO_TARGETS[muscle].push(target);
});

function getExercisesForMuscle(bodyPart: string): string[] {
  const targets = MUSCLE_TO_TARGETS[bodyPart] || [];
  return exercises
    .filter((e) => targets.includes(e.target))
    .slice(0, 6)
    .map((e) => e.nameFr || e.name);
}

function formatTimeAgo(hours: number | null): string {
  if (!hours) return '—';
  if (hours < 24) return `il y a ${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'il y a 1 jour' : `il y a ${days} jours`;
}

function getRecoveryAdvice(status: string): string {
  if (status === 'fatigued')
    return 'Muscle récemment entraîné, encore en récupération. Concentrez-vous sur d\'autres groupes musculaires aujourd\'hui.';
  if (status === 'fresh')
    return 'Muscle bien récupéré et prêt pour l\'entraînement. Idéal pour une séance intensive.';
  return 'Muscle non entraîné récemment. Pensez à l\'inclure dans votre prochaine séance.';
}

function getZoneLabelFr(zone: string): string {
  switch (zone) {
    case 'below_mv': return 'Sous le maintien';
    case 'mv_mev': return 'Maintien';
    case 'mev_mav': return 'Croissance optimale';
    case 'mav_mrv': return 'Volume élevé';
    case 'above_mrv': return 'Surentraînement';
    default: return '';
  }
}

export default function RecoveryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const overview = mockRecoveryOverview;

  const [selectedMuscle, setSelectedMuscle] = useState<MuscleRecoveryData | null>(null);
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front');
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(1)).current;
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

  const handleMusclePress = (muscle: MuscleRecoveryData) => {
    setSelectedMuscle(muscle);
  };

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

  const getStatusMessage = () => {
    if (overview.overallScore >= 70) return 'Excellent état';
    if (overview.overallScore >= 40) return 'Récup. partielle';
    return 'Repos conseillé';
  };

  const getStatusColor = () => {
    if (overview.overallScore >= 70) return '#22C55E';
    if (overview.overallScore >= 40) return '#FBBF24';
    return '#EF4444';
  };

  // Drag-to-dismiss for detail sheet
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  const dismissSheet = useCallback(() => {
    Animated.timing(sheetTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease),
    }).start(() => {
      setSelectedMuscle(null);
      sheetTranslateY.setValue(0);
    });
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down
        if (gestureState.dy > 0) {
          sheetTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.4) {
          dismissSheet();
        } else {
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // Animate in when muscle selected
  useEffect(() => {
    if (selectedMuscle) {
      sheetTranslateY.setValue(SCREEN_HEIGHT);
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 65,
      }).start();
    }
  }, [selectedMuscle]);

  // Computed data for the selected muscle detail
  const muscleDetail = useMemo(() => {
    if (!selectedMuscle) return null;
    const bp = selectedMuscle.bodyPart;
    const recoveryThresholds = MUSCLE_RECOVERY_HOURS[bp];
    const landmarks = RP_VOLUME_LANDMARKS[bp];
    const currentSets = mockWeeklyVolume[bp] || 0;
    const zone = landmarks ? getVolumeZone(currentSets, landmarks) : 'below_mv';
    const zoneColor = getZoneColor(zone);
    const recentExercises = getExercisesForMuscle(bp);

    // Recovery progress (0→1)
    let recoveryProgress = 1;
    let hoursRemaining = 0;
    const totalRecoveryHours = recoveryThresholds?.freshMin || 48;
    if (selectedMuscle.hoursSinceTraining !== null && selectedMuscle.status === 'fatigued') {
      recoveryProgress = Math.min(selectedMuscle.hoursSinceTraining / totalRecoveryHours, 0.95);
      hoursRemaining = Math.max(0, totalRecoveryHours - selectedMuscle.hoursSinceTraining);
    } else if (selectedMuscle.status === 'fresh') {
      recoveryProgress = 1;
    } else {
      recoveryProgress = 0; // undertrained — no recent data
    }

    // Mock weekly stats for this muscle
    const mockReps = currentSets * 10;
    const mockKg = currentSets > 0 ? Math.round(currentSets * 10 * 22.5) : 0;

    return {
      landmarks,
      currentSets,
      zone,
      zoneColor,
      zoneLabelFr: getZoneLabelFr(zone),
      recentExercises,
      recoveryProgress,
      hoursRemaining,
      totalRecoveryHours,
      daysTotal: Math.round(totalRecoveryHours / 24),
      daysSince: selectedMuscle.hoursSinceTraining ? Math.round(selectedMuscle.hoursSinceTraining / 24) : 0,
      mockReps,
      mockKg,
    };
  }, [selectedMuscle]);

  return (
    <View style={styles.screen}>
      {/* Ambient orbs */}
      <View style={styles.orbOrange} />
      <View style={styles.orbGreen} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Récupération</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Full-screen body map area */}
      <Animated.View style={[styles.bodyMapArea, { opacity: fadeAnim }]}>
        <Animated.View style={[
          styles.bodyMapContainer,
          { opacity: flipAnim, transform: [{ scale: bodyMapScale }] }
        ]}>
          <BodyMap
            muscles={overview.muscles}
            onMusclePress={handleMusclePress}
            height={520}
            view={bodyView}
            showToggle={false}
            showLegend={false}
          />
        </Animated.View>

        {/* Floating Score Ring — top right */}
        <Pressable
          style={styles.floatingScore}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowScoreInfo(true);
          }}
        >
          <ScoreRing score={overview.overallScore} size={80} />
          <Text style={[styles.floatingScoreStatus, { color: getStatusColor() }]}>
            {getStatusMessage()}
          </Text>
          <View style={styles.floatingScoreInfoHint}>
            <Info size={10} color="#6B7280" />
          </View>
        </Pressable>

        {/* Bottom bar — flip button + legend */}
        <View style={[styles.bottomBar, { marginBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
          <Pressable style={styles.flipPill} onPress={flipBody}>
            <RotateCcw size={14} color="#9CA3AF" />
            <Text style={styles.flipPillText}>
              {bodyView === 'front' ? 'Dos' : 'Face'}
            </Text>
          </Pressable>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Fatigué</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.legendText}>Frais</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
              <Text style={styles.legendText}>Sous-entraîné</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ═══════ Muscle Detail Bottom Sheet ═══════ */}
      <Modal
        visible={selectedMuscle !== null}
        transparent
        animationType="none"
        onRequestClose={dismissSheet}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop — tap to dismiss */}
          <Pressable style={{ flex: 1 }} onPress={dismissSheet} />

          {/* Sheet */}
          <Animated.View
            style={[styles.detailSheet, { transform: [{ translateY: sheetTranslateY }] }]}
          >
            {/* Drag handle area */}
            <View {...panResponder.panHandlers}>
              <View style={styles.modalHandle} />
            </View>

            {selectedMuscle && muscleDetail && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {/* Header: name */}
                <View style={styles.detailHeader}>
                  <Text style={styles.detailName}>
                    {BODY_PART_LABELS[selectedMuscle.bodyPart]?.fr || selectedMuscle.bodyPart}
                  </Text>
                </View>

                {/* Status badge + time ago */}
                <View style={styles.statusRow}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: `${RECOVERY_COLORS[selectedMuscle.status]}20` }
                  ]}>
                    {selectedMuscle.status === 'fatigued' && (
                      <AlertTriangle size={12} color={RECOVERY_COLORS[selectedMuscle.status]} strokeWidth={2.5} />
                    )}
                    <Text style={[styles.statusBadgeText, { color: RECOVERY_COLORS[selectedMuscle.status] }]}>
                      {RECOVERY_LABELS[selectedMuscle.status].fr}
                    </Text>
                  </View>
                  <Text style={styles.timeAgo}>
                    {formatTimeAgo(selectedMuscle.hoursSinceTraining)}
                  </Text>
                </View>

                {/* Recovery insight card */}
                <View style={styles.insightCard}>
                  <Text style={styles.insightText}>
                    {getRecoveryAdvice(selectedMuscle.status)}
                  </Text>
                  {selectedMuscle.status === 'fatigued' && selectedMuscle.hoursSinceTraining !== null && (
                    <>
                      <View style={styles.recoveryBarBg}>
                        <View style={[
                          styles.recoveryBarFill,
                          {
                            width: `${muscleDetail.recoveryProgress * 100}%`,
                            backgroundColor: muscleDetail.recoveryProgress > 0.7 ? '#FBBF24' : '#EF4444',
                          },
                        ]} />
                      </View>
                      <View style={styles.recoveryTimeRow}>
                        <Text style={styles.recoveryTimeLeft}>
                          ~{Math.round(muscleDetail.hoursRemaining)}h restantes
                        </Text>
                        <Text style={styles.recoveryTimeRight}>
                          {muscleDetail.daysSince}j / {muscleDetail.daysTotal}j
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Volume this week */}
                {muscleDetail.landmarks && (
                  <View style={styles.volumeSection}>
                    <View style={styles.volumeHeader}>
                      <Text style={styles.volumeTitle}>Volume cette semaine</Text>
                      <View style={[styles.zoneBadge, { backgroundColor: `${muscleDetail.zoneColor}20` }]}>
                        <Text style={[styles.zoneBadgeText, { color: muscleDetail.zoneColor }]}>
                          {muscleDetail.zoneLabelFr}
                        </Text>
                      </View>
                    </View>

                    {/* Volume bar */}
                    <View style={styles.volumeBarBg}>
                      <View style={[
                        styles.volumeBarFill,
                        {
                          width: `${Math.min(muscleDetail.currentSets / muscleDetail.landmarks.mrv, 1) * 100}%`,
                          backgroundColor: muscleDetail.zoneColor,
                        },
                      ]} />
                      {/* MV marker */}
                      <View style={[styles.volumeMarker, { left: `${(muscleDetail.landmarks.mv / muscleDetail.landmarks.mrv) * 100}%` }]} />
                      {/* MEV marker */}
                      <View style={[styles.volumeMarker, styles.volumeMarkerBlue, { left: `${(muscleDetail.landmarks.mev / muscleDetail.landmarks.mrv) * 100}%` }]} />
                      {/* MAV marker */}
                      <View style={[styles.volumeMarker, styles.volumeMarkerYellow, { left: `${(muscleDetail.landmarks.mavHigh / muscleDetail.landmarks.mrv) * 100}%` }]} />
                    </View>

                    {/* Marker labels */}
                    <View style={styles.markerLabelsRow}>
                      <Text style={[styles.markerLabel, { left: `${(muscleDetail.landmarks.mv / muscleDetail.landmarks.mrv) * 100}%` }]}>MV</Text>
                      <Text style={[styles.markerLabel, { left: `${(muscleDetail.landmarks.mev / muscleDetail.landmarks.mrv) * 100}%` }]}>MEV</Text>
                      <Text style={[styles.markerLabel, { left: `${(muscleDetail.landmarks.mavHigh / muscleDetail.landmarks.mrv) * 100}%` }]}>MAV</Text>
                    </View>

                    {/* Big number */}
                    <View style={styles.volumeNumberRow}>
                      <Text style={[styles.volumeNumberBig, { color: muscleDetail.zoneColor }]}>
                        {muscleDetail.currentSets}
                      </Text>
                      <Text style={styles.volumeNumberTarget}>
                        / {muscleDetail.landmarks.mavHigh} séries
                      </Text>
                    </View>

                    {/* Landmark values row */}
                    <View style={styles.landmarksRow}>
                      <View style={styles.landmarkCell}>
                        <Text style={styles.landmarkValue}>{muscleDetail.landmarks.mv}</Text>
                        <Text style={styles.landmarkLabel}>MV</Text>
                      </View>
                      <View style={styles.landmarkDivider} />
                      <View style={styles.landmarkCell}>
                        <Text style={styles.landmarkValue}>{muscleDetail.landmarks.mev}</Text>
                        <Text style={styles.landmarkLabel}>MEV</Text>
                      </View>
                      <View style={styles.landmarkDivider} />
                      <View style={styles.landmarkCell}>
                        <Text style={[styles.landmarkValue, { color: '#4ADE80' }]}>
                          {muscleDetail.landmarks.mavLow}–{muscleDetail.landmarks.mavHigh}
                        </Text>
                        <Text style={[styles.landmarkLabel, { color: '#4ADE80' }]}>MAV</Text>
                      </View>
                      <View style={styles.landmarkDivider} />
                      <View style={styles.landmarkCell}>
                        <Text style={[styles.landmarkValue, { color: '#EF4444' }]}>
                          {muscleDetail.landmarks.mrv}
                        </Text>
                        <Text style={[styles.landmarkLabel, { color: '#EF4444' }]}>MRV</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* This week stats */}
                <View style={styles.weekStatsCard}>
                  <Text style={styles.weekStatsTitle}>CETTE SEMAINE</Text>
                  <View style={styles.weekStatsRow}>
                    <View style={styles.weekStat}>
                      <Text style={styles.weekStatValue}>{muscleDetail.currentSets}</Text>
                      <Text style={styles.weekStatLabel}>séries</Text>
                    </View>
                    <View style={styles.weekStatDivider} />
                    <View style={styles.weekStat}>
                      <Text style={styles.weekStatValue}>{muscleDetail.mockReps}</Text>
                      <Text style={styles.weekStatLabel}>reps</Text>
                    </View>
                    <View style={styles.weekStatDivider} />
                    <View style={styles.weekStat}>
                      <Text style={styles.weekStatValue}>
                        {muscleDetail.mockKg >= 1000
                          ? `${(muscleDetail.mockKg / 1000).toFixed(1)}k`
                          : muscleDetail.mockKg}
                      </Text>
                      <Text style={styles.weekStatLabel}>kg</Text>
                    </View>
                    <View style={styles.weekStatDivider} />
                    <View style={styles.weekStat}>
                      <Text style={styles.weekStatValue}>
                        {selectedMuscle.totalSets > 0 ? Math.ceil(selectedMuscle.totalSets / 6) : 0}
                      </Text>
                      <Text style={styles.weekStatLabel}>sessions</Text>
                    </View>
                  </View>
                </View>

                {/* Recent exercises */}
                {muscleDetail.recentExercises.length > 0 && (
                  <View style={styles.recentSection}>
                    <Text style={styles.recentTitle}>Exercices récents</Text>
                    <View style={styles.recentPills}>
                      {muscleDetail.recentExercises.map((name, i) => (
                        <View key={i} style={styles.recentPill}>
                          <Text style={styles.recentPillText}>{name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Score Info Modal */}
      <Modal
        visible={showScoreInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScoreInfo(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowScoreInfo(false)}>
          <Pressable style={styles.infoModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>Score de Récupération</Text>
              <Pressable style={styles.modalClose} onPress={() => setShowScoreInfo(false)}>
                <X size={18} color="#9CA3AF" />
              </Pressable>
            </View>
            <Text style={styles.infoModalText}>
              Ce score indique l'état de récupération global de vos muscles, basé sur vos dernières séances.
            </Text>
            <View style={styles.scoreRanges}>
              <View style={styles.scoreRange}>
                <View style={[styles.scoreRangeDot, { backgroundColor: '#22C55E' }]} />
                <View style={styles.scoreRangeContent}>
                  <Text style={styles.scoreRangeValue}>70-100</Text>
                  <Text style={styles.scoreRangeLabel}>Excellent</Text>
                  <Text style={styles.scoreRangeDesc}>
                    Vos muscles sont bien récupérés. Idéal pour un entraînement intensif.
                  </Text>
                </View>
              </View>
              <View style={styles.scoreRange}>
                <View style={[styles.scoreRangeDot, { backgroundColor: '#FBBF24' }]} />
                <View style={styles.scoreRangeContent}>
                  <Text style={styles.scoreRangeValue}>40-69</Text>
                  <Text style={styles.scoreRangeLabel}>Partiel</Text>
                  <Text style={styles.scoreRangeDesc}>
                    Récupération en cours. Entraînez les muscles frais uniquement.
                  </Text>
                </View>
              </View>
              <View style={styles.scoreRange}>
                <View style={[styles.scoreRangeDot, { backgroundColor: '#EF4444' }]} />
                <View style={styles.scoreRangeContent}>
                  <Text style={styles.scoreRangeValue}>0-39</Text>
                  <Text style={styles.scoreRangeLabel}>Repos conseillé</Text>
                  <Text style={styles.scoreRangeDesc}>
                    La plupart des muscles sont fatigués. Privilégiez le repos ou une séance légère.
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.currentScoreBox}>
              <Text style={styles.currentScoreLabel}>Votre score actuel</Text>
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

  // Body Map Area
  bodyMapArea: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyMapContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Floating Score Ring
  floatingScore: {
    position: 'absolute',
    top: 8,
    right: Spacing.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.75)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  floatingScoreStatus: {
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  floatingScoreInfoHint: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(12, 12, 12, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  flipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flipPillText: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#D1D5DB',
  },

  // ═══════ Modals shared ═══════
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
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ═══════ Muscle Detail Sheet ═══════
  detailSheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
    maxHeight: '85%',
  },
  detailHeader: {
    marginBottom: 12,
  },
  detailName: {
    fontSize: 24,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Status badge + time
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
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
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Recovery insight card
  insightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  insightText: {
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#D1D5DB',
    lineHeight: 19,
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

  // Volume section
  volumeSection: {
    marginBottom: 16,
    gap: 12,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  volumeTitle: {
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  zoneBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  zoneBadgeText: {
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Volume bar
  volumeBarBg: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 5,
    position: 'relative',
  },
  volumeBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: 5,
  },
  volumeMarker: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 1,
  },
  volumeMarkerBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.85)',
  },
  volumeMarkerYellow: {
    backgroundColor: 'rgba(251, 191, 36, 0.85)',
  },

  // Marker labels
  markerLabelsRow: {
    position: 'relative',
    height: 16,
  },
  markerLabel: {
    position: 'absolute',
    fontSize: 9,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
    transform: [{ translateX: -10 }],
  },

  // Volume big number
  volumeNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  volumeNumberBig: {
    fontSize: 36,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  volumeNumberTarget: {
    fontSize: 16,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Landmark values row
  landmarksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 12,
  },
  landmarkCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  landmarkValue: {
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  landmarkLabel: {
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#6B7280',
  },
  landmarkDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // This week stats
  weekStatsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  weekStatsTitle: {
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
  },
  weekStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  weekStatValue: {
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weekStatLabel: {
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
  },
  weekStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Recent exercises
  recentSection: {
    gap: 10,
  },
  recentTitle: {
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recentPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recentPillText: {
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#D1D5DB',
  },

  // ═══════ Score Info Modal ═══════
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
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
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
