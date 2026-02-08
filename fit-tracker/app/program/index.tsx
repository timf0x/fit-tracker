import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Play,
  Sparkles,
  X,
  TrendingUp,
  Moon,
  Apple,
  LogOut,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';
import { Fonts, Colors } from '@/constants/theme';
import { useProgramStore } from '@/stores/programStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { WeekSelector } from '@/components/program/WeekSelector';
import { DayCard } from '@/components/program/DayCard';
import { buildProgramExercisesParam } from '@/lib/programSession';

export default function ProgramScreen() {
  const router = useRouter();
  const { program, activeState, clearProgram } = useProgramStore();
  const startSession = useWorkoutStore((s) => s.startSession);

  const [selectedWeek, setSelectedWeek] = useState(
    activeState?.currentWeek || 1
  );
  const [showAICoach, setShowAICoach] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  if (!program || !activeState) {
    router.replace('/program/onboarding');
    return null;
  }

  const currentWeekData = program.weeks.find(
    (w) => w.weekNumber === selectedWeek
  );
  const deloadWeekNum = program.weeks.find((w) => w.isDeload)?.weekNumber;
  const isCurrentWeek = selectedWeek === activeState.currentWeek;

  const todayDay = isCurrentWeek
    ? currentWeekData?.days[activeState.currentDayIndex]
    : null;

  const isDayDone = (dayIndex: number) =>
    activeState.completedDays.includes(`${selectedWeek}-${dayIndex}`);

  // Metrics for selected week
  const weekMetrics = useMemo(() => {
    if (!currentWeekData) return { totalExercises: 0, totalSets: 0, completedDays: 0, totalDays: 0 };
    const totalExercises = currentWeekData.days.reduce((sum, d) => sum + d.exercises.length, 0);
    const totalSets = currentWeekData.days.reduce(
      (sum, d) => sum + d.exercises.reduce((s, e) => s + e.sets, 0), 0
    );
    const completedDays = activeState.completedDays.filter(
      (k) => k.startsWith(`${selectedWeek}-`)
    ).length;
    return { totalExercises, totalSets, completedDays, totalDays: currentWeekData.days.length };
  }, [currentWeekData, selectedWeek, activeState.completedDays]);

  const handleSelectWeek = (week: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWeek(week);
  };

  const handleStartToday = () => {
    if (!todayDay) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const workoutId = `program_${program.id}_w${activeState.currentWeek}_d${activeState.currentDayIndex}`;
    const sessionId = startSession(workoutId, todayDay.labelFr, {
      programId: program.id,
      programWeek: activeState.currentWeek,
      programDayIndex: activeState.currentDayIndex,
    });
    router.push({
      pathname: '/workout/session',
      params: {
        workoutId,
        sessionId,
        workoutName: todayDay.labelFr,
        exercises: buildProgramExercisesParam(todayDay),
      },
    });
  };

  const progressPct = weekMetrics.totalDays > 0
    ? weekMetrics.completedDays / weekMetrics.totalDays
    : 0;

  return (
    <View style={styles.screen}>
      {/* Ambient orbs */}
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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {program.nameFr}
            </Text>
            <Text style={styles.headerSub}>
              Semaine {activeState.currentWeek}/{program.totalWeeks}
            </Text>
          </View>
          <Pressable
            style={styles.aiPill}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAICoach(true);
            }}
          >
            <Sparkles size={14} color="rgba(255,255,255,0.5)" />
            <Text style={styles.aiPillText}>Coach IA</Text>
          </Pressable>
        </View>

        {/* Week Selector */}
        <WeekSelector
          totalWeeks={program.totalWeeks}
          currentWeek={activeState.currentWeek}
          selectedWeek={selectedWeek}
          onSelect={handleSelectWeek}
          deloadWeek={deloadWeekNum}
        />

        {/* Deload banner */}
        {currentWeekData?.isDeload && (
          <View style={styles.deloadBanner}>
            <Text style={styles.deloadText}>
              Semaine de deload — volume reduit pour recuperer
            </Text>
          </View>
        )}

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.metricStrip}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{weekMetrics.completedDays}/{weekMetrics.totalDays}</Text>
              <Text style={styles.metricLabel}>seances</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{weekMetrics.totalExercises}</Text>
              <Text style={styles.metricLabel}>exercices</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{weekMetrics.totalSets}</Text>
              <Text style={styles.metricLabel}>series</Text>
            </View>
          </View>

          {/* Week progress bar inside card */}
          <View style={styles.progressRow}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
            </View>
          </View>
        </View>

        {/* Section label */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>SEANCES</Text>
          {isCurrentWeek && todayDay && !isDayDone(activeState.currentDayIndex) && (
            <View style={styles.todayIndicator}>
              <View style={styles.todayDot} />
              <Text style={styles.todayIndicatorText}>A faire</Text>
            </View>
          )}
        </View>

        {/* Day cards */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {currentWeekData?.days.map((day, dayIdx) => {
            const isToday = isCurrentWeek && dayIdx === activeState.currentDayIndex;
            const completed = isDayDone(dayIdx);

            return (
              <DayCard
                key={dayIdx}
                day={day}
                isToday={isToday}
                isCompleted={completed}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: '/program/day',
                    params: { week: String(selectedWeek), day: String(dayIdx) },
                  });
                }}
              />
            );
          })}

          {/* Program management */}
          <View style={styles.managementSection}>
            <Text style={styles.managementLabel}>GESTION</Text>
            <View style={styles.managementRow}>
              <Pressable
                style={styles.managementButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/program/onboarding');
                }}
              >
                <View style={styles.managementIconWrap}>
                  <RefreshCw size={14} color={Colors.primary} />
                </View>
                <Text style={styles.managementText}>Modifier le programme</Text>
              </Pressable>
              <Pressable
                style={styles.managementButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowQuitConfirm(true);
                }}
              >
                <View style={[styles.managementIconWrap, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                  <LogOut size={14} color="rgba(239,68,68,0.7)" />
                </View>
                <Text style={[styles.managementText, { color: 'rgba(239,68,68,0.7)' }]}>
                  Quitter le programme
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        {todayDay && !isDayDone(activeState.currentDayIndex) && isCurrentWeek && (
          <View style={styles.bottomCta}>
            <Pressable style={styles.startButton} onPress={handleStartToday}>
              <Play size={18} color="#0C0C0C" fill="#0C0C0C" />
              <Text style={styles.startText}>Commencer la seance</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      {/* Quit Confirmation Modal */}
      <Modal
        visible={showQuitConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuitConfirm(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowQuitConfirm(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalIconWrap}>
              <AlertTriangle size={28} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Quitter le programme ?</Text>
            <Text style={styles.modalDesc}>
              Ta progression sera perdue. Tu pourras toujours en creer un nouveau.
            </Text>
            <View style={styles.quitActions}>
              <Pressable
                style={styles.quitCancel}
                onPress={() => setShowQuitConfirm(false)}
              >
                <Text style={styles.quitCancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={styles.quitConfirm}
                onPress={() => {
                  clearProgram();
                  router.replace('/');
                }}
              >
                <Text style={styles.quitConfirmText}>Quitter</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* AI Coach Modal */}
      <Modal
        visible={showAICoach}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAICoach(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAICoach(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Pressable
              style={styles.modalClose}
              onPress={() => setShowAICoach(false)}
            >
              <X size={18} color="rgba(255,255,255,0.5)" />
            </Pressable>
            <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(255,107,53,0.12)' }]}>
              <Sparkles size={28} color={Colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Coach IA</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Bientot disponible</Text>
            </View>
            <Text style={styles.modalDesc}>
              Le coach IA analysera tes donnees pour optimiser ton programme en temps reel.
            </Text>
            <View style={styles.featureList}>
              <FeatureRow
                icon={<TrendingUp size={16} color={Colors.primary} />}
                text="Detection de plateaux"
              />
              <FeatureRow
                icon={<Moon size={16} color={Colors.primary} />}
                text="Correlation sommeil & performance"
              />
              <FeatureRow
                icon={<Apple size={16} color={Colors.primary} />}
                text="Recommandations nutrition"
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconWrap}>{icon}</View>
      <Text style={styles.featureText}>{text}</Text>
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
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  headerSub: {
    color: 'rgba(120,120,130,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  aiPillText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Deload banner
  deloadBanner: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
  },
  deloadText: {
    color: 'rgba(59,130,246,0.8)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Summary card
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    gap: 14,
  },
  metricStrip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    color: '#fff',
    fontSize: 20,
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

  // Progress bar
  progressRow: {
  },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1,
  },
  todayIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  todayIndicatorText: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Body
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 120,
  },

  // Bottom CTA
  bottomCta: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(12,12,12,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startText: {
    color: '#0C0C0C',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Modal shared
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 28,
    alignItems: 'center',
    width: '100%',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    marginTop: 16,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  comingSoonText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  modalDesc: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 20,
  },

  // AI Coach features
  featureList: {
    width: '100%',
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },

  // Management section
  managementSection: {
    marginTop: 16,
    gap: 10,
  },
  managementLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  managementRow: {
    gap: 8,
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  managementIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  managementText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },
  quitActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 20,
  },
  quitCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  quitCancelText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  quitConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  quitConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
});
