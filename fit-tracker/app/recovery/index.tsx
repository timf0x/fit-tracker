/**
 * Recovery Screen
 * Score ring + body map side by side, stats row, weekly volume section
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, RotateCcw, X, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { RECOVERY_COLORS, RECOVERY_LABELS, BODY_PART_LABELS } from '@/constants/recovery';
import { RP_VOLUME_LANDMARKS, getVolumeZone, getZoneColor } from '@/constants/volumeLandmarks';
import { ScoreRing } from '@/components/recovery/ScoreRing';
import { BodyMap } from '@/components/recovery/BodyMap';
import { mockRecoveryOverview, mockWeeklyVolume } from '@/lib/mock-data';
import { MuscleRecoveryData } from '@/types';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pectoraux',
  'upper back': 'Haut dos',
  lats: 'Dorsaux',
  'lower back': 'Bas dos',
  shoulders: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Avant-bras',
  quads: 'Quadriceps',
  hamstrings: 'Ischio',
  glutes: 'Fessiers',
  calves: 'Mollets',
  abs: 'Abdos',
  obliques: 'Obliques',
};

export default function RecoveryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const overview = mockRecoveryOverview;
  const weeklyVolume = mockWeeklyVolume;

  const [selectedMuscle, setSelectedMuscle] = useState<MuscleRecoveryData | null>(null);
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front');
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [showVolumeInfo, setShowVolumeInfo] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(1)).current;
  const bodyMapScale = useRef(new Animated.Value(0.95)).current;

  const volumeKeys = Object.keys(RP_VOLUME_LANDMARKS);
  const volumeCardAnims = useRef(volumeKeys.map(() => new Animated.Value(0))).current;

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

    setTimeout(() => {
      Animated.stagger(
        60,
        volumeCardAnims.map((anim) =>
          Animated.spring(anim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true })
        )
      ).start();
    }, 500);
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main: Body Map + Score */}
        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
          {/* Body Map */}
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
              showLegend={false}
            />
          </Animated.View>

          {/* Score Panel */}
          <View style={styles.scorePanel}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowScoreInfo(true);
              }}
              style={styles.scoreTappable}
            >
              <ScoreRing score={overview.overallScore} size={100} />
              <View style={styles.scoreInfoHint}>
                <Info size={12} color="#6B7280" />
              </View>
            </Pressable>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.statusMessage}>{getStatusMessage()}</Text>

            {/* Flip button */}
            <Pressable style={styles.flipButton} onPress={flipBody}>
              <RotateCcw size={14} color="#9CA3AF" />
              <Text style={styles.flipButtonText}>
                {bodyView === 'front' ? 'Dos' : 'Face'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: RECOVERY_COLORS.fresh }]} />
            <Text style={styles.statCount}>{overview.freshCount}</Text>
            <Text style={styles.statLabel}>{RECOVERY_LABELS.fresh.fr}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: RECOVERY_COLORS.fatigued }]} />
            <Text style={styles.statCount}>{overview.fatiguedCount}</Text>
            <Text style={styles.statLabel}>{RECOVERY_LABELS.fatigued.fr}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: RECOVERY_COLORS.undertrained }]} />
            <Text style={styles.statCount}>{overview.undertrainedCount}</Text>
            <Text style={styles.statLabel}>{RECOVERY_LABELS.undertrained.fr}</Text>
          </View>
        </Animated.View>

        {/* Weekly Volume */}
        <Animated.View style={[styles.volumeSection, { opacity: fadeAnim }]}>
          <View style={styles.volumeHeader}>
            <Pressable
              style={styles.volumeTitleRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowVolumeInfo(true);
              }}
            >
              <Text style={styles.volumeSectionTitle}>VOLUME HEBDO</Text>
              <Info size={14} color="#6B7280" />
            </Pressable>
            <Pressable
              style={styles.volumeLegendRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowVolumeInfo(true);
              }}
            >
              <View style={styles.volumeLegendItem}>
                <View style={[styles.volumeLegendDot, { backgroundColor: '#6B7280' }]} />
                <Text style={styles.volumeLegendText}>MV</Text>
              </View>
              <View style={styles.volumeLegendItem}>
                <View style={[styles.volumeLegendDot, { backgroundColor: '#4ADE80' }]} />
                <Text style={styles.volumeLegendText}>MAV</Text>
              </View>
              <View style={styles.volumeLegendItem}>
                <View style={[styles.volumeLegendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.volumeLegendText}>MRV</Text>
              </View>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.volumeList}
          >
            {Object.entries(RP_VOLUME_LANDMARKS).map(([muscle, landmarks], index) => {
              const currentSets = weeklyVolume[muscle] || 0;
              const zone = getVolumeZone(currentSets, landmarks);
              const zoneColor = getZoneColor(zone);
              const progress = Math.min(currentSets / landmarks.mrv, 1);
              const label = MUSCLE_LABELS[muscle] || muscle;
              const cardAnim = volumeCardAnims[index];

              return (
                <Animated.View
                  key={muscle}
                  style={[
                    styles.volumeCard,
                    {
                      opacity: cardAnim,
                      transform: [
                        { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                        { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.volumeMuscleName}>{label}</Text>
                  <View style={styles.volumeBarContainer}>
                    <View style={[styles.volumeZoneMarker, { left: `${(landmarks.mv / landmarks.mrv) * 100}%` }]} />
                    <View style={[styles.volumeZoneMarker, styles.volumeZoneMarkerGreen, { left: `${(landmarks.mev / landmarks.mrv) * 100}%` }]} />
                    <View style={[styles.volumeZoneMarker, styles.volumeZoneMarkerYellow, { left: `${(landmarks.mavHigh / landmarks.mrv) * 100}%` }]} />
                    <View style={[styles.volumeBarFill, { width: `${progress * 100}%`, backgroundColor: zoneColor }]} />
                  </View>
                  <View style={styles.volumeValues}>
                    <Text style={[styles.volumeCurrent, { color: zoneColor }]}>{currentSets}</Text>
                    <Text style={styles.volumeTarget}>/{landmarks.mavHigh}</Text>
                  </View>
                </Animated.View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </ScrollView>

      {/* Muscle Detail Bottom Sheet */}
      <Modal
        visible={selectedMuscle !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMuscle(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedMuscle(null)}>
          <Pressable style={styles.muscleDetailModal} onPress={(e) => e.stopPropagation()}>
            {selectedMuscle && (
              <>
                <View style={styles.modalHandle} />
                <View style={styles.muscleDetailHeader}>
                  <View style={styles.muscleDetailLeft}>
                    <View style={[
                      styles.muscleStatusDot,
                      { backgroundColor: RECOVERY_COLORS[selectedMuscle.status] }
                    ]} />
                    <Text style={styles.muscleDetailName}>
                      {BODY_PART_LABELS[selectedMuscle.bodyPart]?.fr || selectedMuscle.bodyPart}
                    </Text>
                  </View>
                  <Pressable style={styles.modalClose} onPress={() => setSelectedMuscle(null)}>
                    <X size={18} color="#9CA3AF" />
                  </Pressable>
                </View>
                <View style={styles.muscleDetailStats}>
                  <View style={styles.muscleDetailStat}>
                    <Text style={styles.muscleDetailStatLabel}>Statut</Text>
                    <Text style={[
                      styles.muscleDetailStatValue,
                      { color: RECOVERY_COLORS[selectedMuscle.status] }
                    ]}>
                      {RECOVERY_LABELS[selectedMuscle.status].fr}
                    </Text>
                  </View>
                  <View style={styles.muscleDetailDivider} />
                  <View style={styles.muscleDetailStat}>
                    <Text style={styles.muscleDetailStatLabel}>Dernière séance</Text>
                    <Text style={styles.muscleDetailStatValue}>
                      {selectedMuscle.hoursSinceTraining
                        ? `${Math.round(selectedMuscle.hoursSinceTraining)}h`
                        : '—'}
                    </Text>
                  </View>
                  <View style={styles.muscleDetailDivider} />
                  <View style={styles.muscleDetailStat}>
                    <Text style={styles.muscleDetailStatLabel}>Séries (sem.)</Text>
                    <Text style={styles.muscleDetailStatValue}>
                      {selectedMuscle.totalSets}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
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

      {/* Volume Info Modal */}
      <Modal
        visible={showVolumeInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVolumeInfo(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowVolumeInfo(false)}>
          <Pressable style={styles.infoModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>Repères de Volume</Text>
              <Pressable style={styles.modalClose} onPress={() => setShowVolumeInfo(false)}>
                <X size={18} color="#9CA3AF" />
              </Pressable>
            </View>
            <Text style={styles.infoModalText}>
              Le volume (nombre de séries par semaine) détermine vos gains musculaires. Ces repères vous aident à optimiser votre entraînement.
            </Text>
            <View style={styles.volumeLandmarks}>
              {[
                { abbr: 'MV', name: 'Volume de Maintien', desc: 'Minimum pour conserver vos gains actuels sans progresser.', color: '#6B7280' },
                { abbr: 'MEV', name: 'Volume Minimum Efficace', desc: 'Seuil à partir duquel vous commencez à progresser.', color: '#3B82F6' },
                { abbr: 'MAV', name: 'Volume Adaptatif Max', desc: 'Zone optimale pour la croissance musculaire. Visez cette plage !', color: '#4ADE80' },
                { abbr: 'MRV', name: 'Volume Max Récupérable', desc: 'Au-delà, vous risquez le surentraînement et la régression.', color: '#EF4444' },
              ].map((item) => (
                <View key={item.abbr} style={styles.volumeLandmark}>
                  <View style={styles.volumeLandmarkHeader}>
                    <View style={[styles.volumeLandmarkDot, { backgroundColor: item.color }]} />
                    <Text style={styles.volumeLandmarkAbbr}>{item.abbr}</Text>
                    <Text style={styles.volumeLandmarkName}>{item.name}</Text>
                  </View>
                  <Text style={styles.volumeLandmarkDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
            <View style={styles.volumeVisualGuide}>
              <Text style={styles.volumeVisualLabel}>PROGRESSION IDÉALE</Text>
              <View style={styles.volumeVisualBar}>
                <View style={[styles.volumeVisualZone, { flex: 1, backgroundColor: '#6B7280' }]} />
                <View style={[styles.volumeVisualZone, { flex: 1, backgroundColor: '#3B82F6' }]} />
                <View style={[styles.volumeVisualZone, { flex: 2, backgroundColor: '#4ADE80' }]} />
                <View style={[styles.volumeVisualZone, { flex: 1, backgroundColor: '#FBBF24' }]} />
                <View style={[styles.volumeVisualZone, { flex: 0.5, backgroundColor: '#EF4444' }]} />
              </View>
              <View style={styles.volumeVisualLabels}>
                <Text style={styles.volumeVisualMarker}>MV</Text>
                <Text style={styles.volumeVisualMarker}>MEV</Text>
                <Text style={[styles.volumeVisualMarker, { color: '#4ADE80' }]}>MAV</Text>
                <Text style={styles.volumeVisualMarker}>MRV</Text>
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
    backgroundColor: '#050505',
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
  headerSpacer: {
    width: 44,
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },

  // Main Content
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 4,
  },
  bodyMapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Score Panel
  scorePanel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    width: 120,
  },
  scoreTappable: {
    position: 'relative',
  },
  scoreInfoHint: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 2,
    marginTop: 8,
  },
  statusMessage: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  flipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  flipButtonText: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 14,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statCount: {
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Volume Section
  volumeSection: {
    marginTop: 14,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  volumeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  volumeSectionTitle: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: 'rgba(160, 150, 140, 1)',
    letterSpacing: 2,
  },
  volumeLegendRow: {
    flexDirection: 'row',
    gap: 12,
  },
  volumeLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  volumeLegendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  volumeLegendText: {
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
  },
  volumeList: {
    gap: 8,
    paddingRight: 20,
  },
  volumeCard: {
    width: 84,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  volumeMuscleName: {
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  volumeBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'visible',
    position: 'relative',
  },
  volumeZoneMarker: {
    position: 'absolute',
    top: -2,
    width: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  volumeZoneMarkerGreen: {
    backgroundColor: 'rgba(74, 222, 128, 0.4)',
  },
  volumeZoneMarkerYellow: {
    backgroundColor: 'rgba(251, 191, 36, 0.4)',
  },
  volumeBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  volumeValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
  },
  volumeCurrent: {
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  volumeTarget: {
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Modals shared
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

  // Muscle Detail Modal
  muscleDetailModal: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
  },
  muscleDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  muscleDetailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  muscleStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  muscleDetailName: {
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  muscleDetailStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  muscleDetailStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  muscleDetailStatLabel: {
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
  },
  muscleDetailStatValue: {
    fontSize: 16,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  muscleDetailDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Info Modals (Score / Volume)
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

  // Score Ranges
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

  // Volume Landmarks Modal
  volumeLandmarks: { gap: 16 },
  volumeLandmark: { gap: 4 },
  volumeLandmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeLandmarkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  volumeLandmarkAbbr: {
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
    width: 36,
  },
  volumeLandmarkName: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#D1D5DB',
    flex: 1,
  },
  volumeLandmarkDesc: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 54,
    lineHeight: 16,
  },
  volumeVisualGuide: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 16,
  },
  volumeVisualLabel: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  volumeVisualBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  volumeVisualZone: {
    height: '100%',
  },
  volumeVisualLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  volumeVisualMarker: {
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#6B7280',
  },
});
