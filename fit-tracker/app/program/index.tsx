import { useState, useMemo, Fragment } from 'react';
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
  LogOut,
  AlertTriangle,
  RefreshCw,
  Trophy,
  ChevronRight,
  Clock,
} from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { AnimatedStartButton } from '@/components/ui/AnimatedStartButton';
import { Fonts, Colors } from '@/constants/theme';
import { useProgramStore } from '@/stores/programStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { AmbientBackground } from '@/components/home/AmbientBackground';
import { MesocycleTimeline } from '@/components/program/MesocycleTimeline';
import { DayCard } from '@/components/program/DayCard';
import { ConfirmModal } from '@/components/program/ConfirmModal';
import { ReadinessCheck } from '@/components/program/ReadinessCheck';
import { buildProgramExercisesParam } from '@/lib/programSession';

export default function ProgramScreen() {
  const router = useRouter();
  const { program, activeState, clearProgram, isProgramComplete, saveReadiness } =
    useProgramStore();
  const startSession = useWorkoutStore((s) => s.startSession);
  const saveSessionReadiness = useWorkoutStore((s) => s.saveSessionReadiness);

  const [selectedWeek, setSelectedWeek] = useState(
    activeState?.currentWeek || 1,
  );
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showModifyConfirm, setShowModifyConfirm] = useState(false);
  const [showPacingWarning, setShowPacingWarning] = useState(false);
  const [showReadiness, setShowReadiness] = useState(false);

  if (!program || !activeState) {
    router.replace('/program/onboarding');
    return null;
  }

  const programComplete = isProgramComplete();

  const currentWeekData = program.weeks.find(
    (w) => w.weekNumber === selectedWeek,
  );
  const deloadWeekNum = program.weeks.find((w) => w.isDeload)?.weekNumber;
  const isCurrentWeek = selectedWeek === activeState.currentWeek;

  const todayDay = isCurrentWeek
    ? currentWeekData?.days[activeState.currentDayIndex]
    : null;

  const isDayDone = (dayIndex: number) =>
    activeState.completedDays.includes(`${selectedWeek}-${dayIndex}`);

  const completedWeeks = useMemo(() => {
    const result: number[] = [];
    for (const week of program.weeks) {
      const totalDays = week.days.length;
      const completedDays = activeState.completedDays.filter((k) =>
        k.startsWith(`${week.weekNumber}-`),
      ).length;
      if (completedDays >= totalDays) result.push(week.weekNumber);
    }
    return result;
  }, [program.weeks, activeState.completedDays]);

  // Week summary — just completed/total + total sets
  const weekSummary = useMemo(() => {
    if (!currentWeekData) return { done: 0, total: 0, sets: 0 };
    const done = activeState.completedDays.filter((k) =>
      k.startsWith(`${selectedWeek}-`),
    ).length;
    const sets = currentWeekData.days.reduce(
      (sum, d) => sum + d.exercises.reduce((s, e) => s + e.sets, 0),
      0,
    );
    return { done, total: currentWeekData.days.length, sets };
  }, [currentWeekData, selectedWeek, activeState.completedDays]);

  const handleSelectWeek = (week: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWeek(week);
  };

  // Pacing check — warn if already completed a session today
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
    setShowReadiness(true);
  };

  const startSessionNow = (readiness?: import('@/types/program').ReadinessCheck) => {
    if (!todayDay) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const workoutId = `program_${program.id}_w${activeState.currentWeek}_d${activeState.currentDayIndex}`;
    const sessionId = startSession(workoutId, todayDay.labelFr, {
      programId: program.id,
      programWeek: activeState.currentWeek,
      programDayIndex: activeState.currentDayIndex,
    });
    if (readiness) {
      saveReadiness(readiness);
      saveSessionReadiness(sessionId, readiness);
    }
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

  const sectionLabel = isCurrentWeek
    ? 'CETTE SEMAINE'
    : `SEMAINE ${selectedWeek}`;

  return (
    <View style={styles.screen}>
      <AmbientBackground />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* ─── Header — clean typography, no pills ─── */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
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
        </View>

        {/* ─── Mesocycle Timeline — keep as-is ─── */}
        <MesocycleTimeline
          totalWeeks={program.totalWeeks}
          currentWeek={activeState.currentWeek}
          selectedWeek={selectedWeek}
          onSelect={handleSelectWeek}
          deloadWeek={deloadWeekNum}
          completedWeeks={completedWeeks}
        />

        {/* ─── Deload banner ─── */}
        {currentWeekData?.isDeload && (
          <View style={styles.deloadBanner}>
            <Text style={styles.deloadTitle}>Semaine de deload</Text>
            <Text style={styles.deloadText}>
              Volume réduit pour la récupération et la supercompensation.
            </Text>
          </View>
        )}

        {/* ─── Program completion ─── */}
        {programComplete && (
          <View style={styles.completionCard}>
            <Trophy size={28} color="#FBBF24" />
            <View style={styles.completionTextWrap}>
              <Text style={styles.completionTitle}>Programme terminé !</Text>
              <Text style={styles.completionSubtitle}>
                {activeState.completedDays.length} séances complétées
              </Text>
            </View>
            <PressableScale
              style={styles.newProgramButton}
              activeScale={0.97}
              onPress={() => router.push('/program/onboarding')}
            >
              <Text style={styles.newProgramText}>Nouveau</Text>
              <ChevronRight size={14} color="#0C0C0C" />
            </PressableScale>
          </View>
        )}

        {/* ─── Week card: header + day rows ─── */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.weekCard}>
            {/* Card header — section label + summary */}
            <View style={styles.weekCardHeader}>
              <Text style={styles.weekCardLabel}>{sectionLabel}</Text>
              <Text style={styles.weekCardSummary}>
                {weekSummary.done}/{weekSummary.total} séances · {weekSummary.sets} séries
              </Text>
            </View>

            {/* Day rows with separators */}
            {currentWeekData?.days.map((day, dayIdx, arr) => {
              const isToday =
                isCurrentWeek && dayIdx === activeState.currentDayIndex;
              const completed = isDayDone(dayIdx);

              return (
                <Fragment key={dayIdx}>
                  <View style={styles.daySeparator} />
                  <DayCard
                    day={day}
                    dayNumber={dayIdx + 1}
                    isToday={isToday}
                    isCompleted={completed}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({
                        pathname: '/program/day',
                        params: {
                          week: String(selectedWeek),
                          day: String(dayIdx),
                        },
                      });
                    }}
                  />
                </Fragment>
              );
            })}
          </View>

          {/* ─── Management section ─── */}
          <View style={styles.managementSection}>
            <PressableScale
              style={styles.managementRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowModifyConfirm(true);
              }}
            >
              <RefreshCw size={16} color="rgba(255,255,255,0.4)" />
              <Text style={styles.managementText}>Modifier le programme</Text>
              <ChevronRight size={16} color="rgba(100,100,110,1)" />
            </PressableScale>

            <View style={styles.managementSep} />

            <PressableScale
              style={styles.managementRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowQuitConfirm(true);
              }}
            >
              <LogOut size={16} color="rgba(239,68,68,0.5)" />
              <Text
                style={[styles.managementText, { color: 'rgba(239,68,68,0.5)' }]}
              >
                Quitter le programme
              </Text>
              <ChevronRight size={16} color="rgba(100,100,110,1)" />
            </PressableScale>
          </View>
        </ScrollView>

        {/* ─── Bottom CTA ─── */}
        {todayDay &&
          !isDayDone(activeState.currentDayIndex) &&
          isCurrentWeek &&
          !programComplete && (
            <View style={styles.bottomCta}>
              <AnimatedStartButton
                onPress={handleStartToday}
                label="Commencer la séance"
                style={styles.startButton}
              />
            </View>
          )}
      </SafeAreaView>

      {/* ─── Modals ─── */}
      <ConfirmModal
        visible={showQuitConfirm}
        onClose={() => setShowQuitConfirm(false)}
        icon={<AlertTriangle size={28} color="#EF4444" />}
        title="Quitter le programme ?"
        description="Ta progression sera perdue. Tu pourras toujours en créer un nouveau."
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
        description="Ton programme actuel sera remplacé. Ta progression sera perdue."
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
        title="Déjà une séance aujourd'hui"
        description="Tu as déjà terminé une séance aujourd'hui. La récupération est essentielle pour la progression."
        cancelText="Reporter"
        confirmText="Continuer"
        confirmColor={Colors.primary}
        onConfirm={() => {
          setShowPacingWarning(false);
          setShowReadiness(true);
        }}
      />
      <ReadinessCheck
        visible={showReadiness}
        onSubmit={(check) => {
          setShowReadiness(false);
          startSessionNow(check);
        }}
        onSkip={() => {
          setShowReadiness(false);
          startSessionNow();
        }}
        onClose={() => setShowReadiness(false)}
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

  // ─── Header ───
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

  // ─── Deload banner ───
  deloadBanner: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: 'rgba(59,130,246,0.06)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.1)',
    gap: 4,
  },
  deloadTitle: {
    color: 'rgba(59,130,246,0.8)',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  deloadText: {
    color: 'rgba(59,130,246,0.5)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 17,
  },

  // ─── Completion ───
  completionCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: 'rgba(251,191,36,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.1)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completionTextWrap: {
    flex: 1,
    gap: 2,
  },
  completionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  completionSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  newProgramButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newProgramText: {
    color: '#0C0C0C',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // ─── Body ───
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 24,
  },

  // ─── Week card (single glass card wrapping all day rows) ───
  weekCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  weekCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  weekCardLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1,
  },
  weekCardSummary: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  daySeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: 16,
  },

  // ─── Management ───
  managementSection: {
    gap: 0,
  },
  managementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  managementText: {
    color: 'rgba(255,255,255,0.5)',
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

  // ─── Bottom CTA ───
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
