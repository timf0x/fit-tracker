import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Play,
  LogOut,
  AlertTriangle,
  RefreshCw,
  Trophy,
  ChevronRight,
  Clock,
  Flame,
} from 'lucide-react-native';
import { Fonts, Colors } from '@/constants/theme';
import { useProgramStore } from '@/stores/programStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { MesocycleTimeline } from '@/components/program/MesocycleTimeline';
import { DayCard } from '@/components/program/DayCard';
import { ConfirmModal } from '@/components/program/ConfirmModal';
import { CircularProgress } from '@/components/CircularProgress';
import { MUSCLE_LABELS_FR } from '@/lib/muscleMapping';
import { buildProgramExercisesParam } from '@/lib/programSession';
import { RP_VOLUME_LANDMARKS, getVolumeZone, getZoneColor } from '@/constants/volumeLandmarks';

const SPLIT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ppl: { label: 'PPL', color: '#FF6B35', bg: 'rgba(255,107,53,0.15)' },
  upper_lower: { label: 'Haut/Bas', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  full_body: { label: 'Full Body', color: '#A855F7', bg: 'rgba(168,85,247,0.15)' },
};

export default function ProgramScreen() {
  const router = useRouter();
  const { program, activeState, clearProgram, isProgramComplete, getStreakCount } = useProgramStore();
  const startSession = useWorkoutStore((s) => s.startSession);

  const [selectedWeek, setSelectedWeek] = useState(
    activeState?.currentWeek || 1
  );
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showModifyConfirm, setShowModifyConfirm] = useState(false);
  const [showPacingWarning, setShowPacingWarning] = useState(false);

  if (!program || !activeState) {
    router.replace('/program/onboarding');
    return null;
  }

  const programComplete = isProgramComplete();
  const streakCount = getStreakCount();

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

  // Compute which weeks are fully completed
  const completedWeeks = useMemo(() => {
    const result: number[] = [];
    for (const week of program.weeks) {
      const totalDays = week.days.length;
      const completedDays = activeState.completedDays.filter(
        (k) => k.startsWith(`${week.weekNumber}-`)
      ).length;
      if (completedDays >= totalDays) result.push(week.weekNumber);
    }
    return result;
  }, [program.weeks, activeState.completedDays]);

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

  // Volume targets with zone colors
  const volumeTargetPills = useMemo(() => {
    if (!currentWeekData?.volumeTargets) return { items: [], rest: 0 };
    const entries = Object.entries(currentWeekData.volumeTargets)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a);
    const items = entries.slice(0, 4).map(([muscle, sets]) => {
      const landmarks = RP_VOLUME_LANDMARKS[muscle];
      const zone = landmarks ? getVolumeZone(sets, landmarks) : 'below_mv';
      const color = getZoneColor(zone);
      return { muscle, sets, zoneColor: color };
    });
    const rest = entries.length - 4;
    return { items, rest: rest > 0 ? rest : 0 };
  }, [currentWeekData]);

  const splitStyle = SPLIT_LABELS[program.splitType] || SPLIT_LABELS.ppl;

  const handleSelectWeek = (week: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWeek(week);
  };

  // Check same-day pacing
  const isLastCompletionToday = useMemo(() => {
    if (!activeState.lastCompletedAt) return false;
    const last = new Date(activeState.lastCompletedAt);
    const now = new Date();
    return last.toDateString() === now.toDateString();
  }, [activeState.lastCompletedAt]);

  const handleStartToday = () => {
    if (!todayDay) return;
    if (isLastCompletionToday) {
      setShowPacingWarning(true);
      return;
    }
    startSessionNow();
  };

  const startSessionNow = () => {
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

  const sectionLabel = isCurrentWeek ? 'CETTE SEMAINE' : `SEMAINE ${selectedWeek}`;

  return (
    <View style={styles.screen}>
      <View style={styles.orbOrange} pointerEvents="none" />
      <View style={styles.orbBlue} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#fff" strokeWidth={2} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {program.nameFr}
              </Text>
              <View style={[styles.splitBadge, { backgroundColor: splitStyle.bg }]}>
                <Text style={[styles.splitBadgeText, { color: splitStyle.color }]}>
                  {splitStyle.label}
                </Text>
              </View>
            </View>
            <Text style={styles.headerSub}>
              Semaine {activeState.currentWeek}/{program.totalWeeks}
            </Text>
          </View>
        </View>

        {/* Mesocycle Timeline */}
        <MesocycleTimeline
          totalWeeks={program.totalWeeks}
          currentWeek={activeState.currentWeek}
          selectedWeek={selectedWeek}
          onSelect={handleSelectWeek}
          deloadWeek={deloadWeekNum}
          completedWeeks={completedWeeks}
        />

        {/* Deload banner */}
        {currentWeekData?.isDeload && (
          <View style={styles.deloadBanner}>
            <Text style={styles.deloadTitle}>Semaine de deload</Text>
            <Text style={styles.deloadText}>
              Volume reduit pour permettre la recuperation et la supercompensation. Essentiel pour progresser sur le long terme.
            </Text>
          </View>
        )}

        {/* Program completion celebration */}
        {programComplete && (
          <View style={styles.completionCard}>
            <View style={styles.completionRingWrap}>
              <CircularProgress progress={1} size={72} strokeWidth={5} color="#FBBF24" />
              <View style={styles.completionRingCenter}>
                <Trophy size={24} color="#FBBF24" />
              </View>
            </View>
            <Text style={styles.completionTitle}>Programme termine !</Text>
            <Text style={styles.completionSubtitle}>
              {activeState.completedDays.length} seances completees
            </Text>
            <Pressable
              style={styles.newProgramButton}
              onPress={() => router.push('/program/onboarding')}
            >
              <Text style={styles.newProgramText}>Nouveau programme</Text>
              <ChevronRight size={16} color="#0C0C0C" />
            </Pressable>
          </View>
        )}

        {/* Inline metrics strip (no card wrapper) */}
        <View style={styles.metricsStrip}>
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

        {/* Day completion dots */}
        <View style={styles.dayDotsRow}>
          {currentWeekData?.days.map((_, dayIdx) => {
            const done = isDayDone(dayIdx);
            const isTodayDot = isCurrentWeek && dayIdx === activeState.currentDayIndex;
            return (
              <View
                key={dayIdx}
                style={[
                  styles.dayDot,
                  done && styles.dayDotDone,
                  isTodayDot && !done && styles.dayDotToday,
                ]}
              />
            );
          })}
        </View>

        {/* Volume pills with zone dots */}
        {volumeTargetPills.items.length > 0 && (
          <View style={styles.volumeRow}>
            {volumeTargetPills.items.map(({ muscle, sets, zoneColor }) => (
              <View key={muscle} style={styles.volumePill}>
                <View style={[styles.zoneDot, { backgroundColor: zoneColor }]} />
                <Text style={styles.volumePillText}>
                  {MUSCLE_LABELS_FR[muscle] || muscle} {sets}s
                </Text>
              </View>
            ))}
            {volumeTargetPills.rest > 0 && (
              <Text style={styles.volumeMore}>+{volumeTargetPills.rest}</Text>
            )}
          </View>
        )}

        {/* Streak counter */}
        {streakCount > 0 && (
          <View style={styles.streakRow}>
            <Flame size={14} color={Colors.primary} />
            <Text style={styles.streakText}>
              {streakCount} seance{streakCount > 1 ? 's' : ''} d'affilee
            </Text>
          </View>
        )}

        {/* Section divider */}
        <View style={styles.sectionDivider}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionLabel}>{sectionLabel}</Text>
          <View style={styles.sectionLine} />
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
                dayNumber={dayIdx + 1}
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

          {/* Management section — iOS settings rows */}
          <View style={styles.managementSection}>
            <View style={styles.sectionDivider}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionLabel}>GESTION</Text>
              <View style={styles.sectionLine} />
            </View>

            <Pressable
              style={styles.managementRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowModifyConfirm(true);
              }}
            >
              <RefreshCw size={16} color={Colors.primary} />
              <Text style={styles.managementText}>Modifier le programme</Text>
              <ChevronRight size={16} color="rgba(100,100,110,1)" />
            </Pressable>

            <View style={styles.managementSep} />

            <Pressable
              style={styles.managementRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowQuitConfirm(true);
              }}
            >
              <LogOut size={16} color="rgba(239,68,68,0.7)" />
              <Text style={[styles.managementText, { color: 'rgba(239,68,68,0.7)' }]}>
                Quitter le programme
              </Text>
              <ChevronRight size={16} color="rgba(100,100,110,1)" />
            </Pressable>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        {todayDay && !isDayDone(activeState.currentDayIndex) && isCurrentWeek && !programComplete && (
          <View style={styles.bottomCta}>
            <Pressable style={styles.startButton} onPress={handleStartToday}>
              <Play size={18} color="#0C0C0C" fill="#0C0C0C" />
              <Text style={styles.startText}>Commencer la seance</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      {/* Modals */}
      <ConfirmModal
        visible={showQuitConfirm}
        onClose={() => setShowQuitConfirm(false)}
        icon={<AlertTriangle size={28} color="#EF4444" />}
        title="Quitter le programme ?"
        description="Ta progression sera perdue. Tu pourras toujours en creer un nouveau."
        confirmText="Quitter"
        onConfirm={() => {
          clearProgram();
          router.replace('/');
        }}
      />
      <ConfirmModal
        visible={showModifyConfirm}
        onClose={() => setShowModifyConfirm(false)}
        icon={<RefreshCw size={28} color={Colors.primary} />}
        iconBgColor="rgba(255,107,53,0.12)"
        title="Modifier le programme ?"
        description="Ton programme actuel sera remplace. Ta progression sera perdue."
        cancelText="Annuler"
        confirmText="Modifier"
        confirmColor={Colors.primary}
        onConfirm={() => {
          setShowModifyConfirm(false);
          router.push('/program/onboarding');
        }}
      />
      <ConfirmModal
        visible={showPacingWarning}
        onClose={() => setShowPacingWarning(false)}
        icon={<Clock size={28} color="#FBBF24" />}
        iconBgColor="rgba(251,191,36,0.12)"
        title="Deja une seance aujourd'hui"
        description="Tu as deja termine une seance aujourd'hui. La recuperation est essentielle pour la progression."
        cancelText="Reporter"
        confirmText="Continuer"
        confirmColor={Colors.primary}
        onConfirm={() => {
          setShowPacingWarning(false);
          startSessionNow();
        }}
      />
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  splitBadge: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  splitBadgeText: {
    fontSize: 11,
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

  // Deload banner
  deloadBanner: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    gap: 4,
  },
  deloadTitle: {
    color: 'rgba(59,130,246,0.9)',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  deloadText: {
    color: 'rgba(59,130,246,0.6)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 17,
  },

  // Completion
  completionCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: 'rgba(251,191,36,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.15)',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  completionRingWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionRingCenter: {
    position: 'absolute',
  },
  completionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  completionSubtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginBottom: 4,
  },
  newProgramButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newProgramText: {
    color: '#0C0C0C',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Inline metrics strip (no card)
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
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

  // Day dots
  dayDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dayDotDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayDotToday: {
    backgroundColor: 'transparent',
    borderColor: Colors.primary,
    borderWidth: 2,
  },

  // Volume pills with zone dots
  volumeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  volumePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  zoneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  volumePillText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  volumeMore: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Streak
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  streakText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Section divider — line-label-line
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
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

  // Management — iOS settings rows
  managementSection: {
    marginTop: 16,
    gap: 0,
  },
  managementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  managementText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },
  managementSep: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 28,
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
});
