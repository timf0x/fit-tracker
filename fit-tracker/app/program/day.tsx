import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Play,
  Repeat,
  Timer,
  Weight,
  Check,
  ChevronRight,
  Zap,
  Target,
} from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import { useProgramStore } from '@/stores/programStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getExerciseById } from '@/data/exercises';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { MUSCLE_LABELS_FR } from '@/lib/muscleMapping';
import { estimateDuration, isCompound } from '@/lib/programGenerator';
import { buildProgramExercisesParam } from '@/lib/programSession';
import type { ProgramExercise } from '@/types/program';

// Focus color mapping
const FOCUS_COLORS: Record<string, { bg: string; text: string }> = {
  push: { bg: 'rgba(255,107,53,0.12)', text: '#FF6B35' },
  pull: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6' },
  legs: { bg: 'rgba(74,222,128,0.12)', text: '#4ADE80' },
  upper: { bg: 'rgba(255,107,53,0.12)', text: '#FF6B35' },
  lower: { bg: 'rgba(74,222,128,0.12)', text: '#4ADE80' },
  full_body: { bg: 'rgba(168,85,247,0.12)', text: '#A855F7' },
};

export default function ProgramDayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ week: string; day: string }>();
  const weekNum = parseInt(params.week || '1', 10);
  const dayIdx = parseInt(params.day || '0', 10);

  const { program, activeState } = useProgramStore();
  const startSession = useWorkoutStore((s) => s.startSession);

  if (!program || !activeState) {
    router.replace('/program/onboarding');
    return null;
  }

  const weekData = program.weeks.find((w) => w.weekNumber === weekNum);
  const day = weekData?.days[dayIdx];

  if (!day) {
    router.back();
    return null;
  }

  const duration = useMemo(() => estimateDuration(day), [day]);
  const isDone = activeState.completedDays.includes(`${weekNum}-${dayIdx}`);
  const isToday =
    weekNum === activeState.currentWeek &&
    dayIdx === activeState.currentDayIndex;

  const totalSets = useMemo(
    () => day.exercises.reduce((sum, e) => sum + e.sets, 0),
    [day.exercises]
  );

  // Split exercises into compounds and isolations
  const { compounds, isolations } = useMemo(() => {
    const c: { pex: ProgramExercise; idx: number }[] = [];
    const iso: { pex: ProgramExercise; idx: number }[] = [];
    day.exercises.forEach((pex, idx) => {
      if (isCompound(pex.exerciseId)) {
        c.push({ pex, idx });
      } else {
        iso.push({ pex, idx });
      }
    });
    return { compounds: c, isolations: iso };
  }, [day.exercises]);

  const focusStyle = FOCUS_COLORS[day.focus] || { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.6)' };

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const workoutId = `program_${program.id}_w${weekNum}_d${dayIdx}`;
    const sessionId = startSession(workoutId, day.labelFr, {
      programId: program.id,
      programWeek: weekNum,
      programDayIndex: dayIdx,
    });
    router.push({
      pathname: '/workout/session',
      params: {
        workoutId,
        sessionId,
        workoutName: day.labelFr,
        exercises: buildProgramExercisesParam(day),
      },
    });
  };

  const renderExercise = (pex: ProgramExercise, globalIdx: number) => {
    const ex = getExerciseById(pex.exerciseId);
    if (!ex) return null;
    const compound = isCompound(pex.exerciseId);

    return (
      <Pressable
        key={`${pex.exerciseId}-${globalIdx}`}
        style={styles.exCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: '/exercise/[id]',
            params: { id: pex.exerciseId },
          });
        }}
      >
        {/* Exercise number */}
        <View style={[styles.exNumber, compound && styles.exNumberCompound]}>
          <Text style={[styles.exNumberText, compound && styles.exNumberTextCompound]}>
            {String(globalIdx + 1).padStart(2, '0')}
          </Text>
        </View>

        <ExerciseIcon
          exerciseName={ex.name}
          bodyPart={ex.bodyPart}
          gifUrl={ex.gifUrl}
          size={20}
          containerSize={44}
        />

        <View style={styles.exInfo}>
          <Text style={styles.exName} numberOfLines={1}>
            {ex.nameFr}
          </Text>
          <View style={styles.exMeta}>
            <View style={styles.exMetaPill}>
              <Repeat size={10} color="rgba(255,255,255,0.4)" />
              <Text style={styles.exMetaText}>
                {pex.sets} x {pex.reps}
              </Text>
            </View>
            {pex.suggestedWeight != null && pex.suggestedWeight > 0 && (
              <View style={[styles.exMetaPill, styles.exWeightPill]}>
                <Weight size={10} color={Colors.primary} />
                <Text style={[styles.exMetaText, styles.exWeightText]}>
                  {pex.suggestedWeight}kg
                </Text>
              </View>
            )}
            <View style={styles.exMetaPill}>
              <Timer size={10} color="rgba(255,255,255,0.4)" />
              <Text style={styles.exMetaText}>{pex.restTime}s</Text>
            </View>
          </View>
        </View>

        <ChevronRight size={14} color="rgba(100,100,110,1)" strokeWidth={2} />
      </Pressable>
    );
  };

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
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>{day.labelFr}</Text>
              <View style={[styles.focusTag, { backgroundColor: focusStyle.bg }]}>
                <Text style={[styles.focusTagText, { color: focusStyle.text }]}>
                  {day.focus}
                </Text>
              </View>
            </View>
            <Text style={styles.headerSub}>Semaine {weekNum}</Text>
          </View>
          {isDone && (
            <View style={styles.doneBadge}>
              <Check size={14} color={Colors.success} strokeWidth={3} />
              <Text style={styles.doneBadgeText}>Fait</Text>
            </View>
          )}
          {isToday && !isDone && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Aujourd'hui</Text>
            </View>
          )}
        </View>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{day.exercises.length}</Text>
              <Text style={styles.summaryLabel}>exercices</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalSets}</Text>
              <Text style={styles.summaryLabel}>series</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>~{duration}</Text>
              <Text style={styles.summaryLabel}>minutes</Text>
            </View>
          </View>

          {/* Muscle targets inside summary */}
          <View style={styles.summaryMuscles}>
            {day.muscleTargets.map((m) => (
              <Pressable
                key={m}
                style={styles.musclePill}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/volume/${m}`);
                }}
              >
                <Text style={styles.musclePillText}>
                  {MUSCLE_LABELS_FR[m] || m}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Exercise list */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Compound exercises */}
          {compounds.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <Zap size={12} color={Colors.primary} />
                </View>
                <Text style={styles.sectionLabel}>COMPOSES</Text>
                <View style={styles.sectionLine} />
                <Text style={styles.sectionCount}>{compounds.length}</Text>
              </View>
              {compounds.map(({ pex, idx }) => renderExercise(pex, idx))}
            </>
          )}

          {/* Isolation exercises */}
          {isolations.length > 0 && (
            <>
              <View style={[styles.sectionHeader, compounds.length > 0 && { marginTop: 20 }]}>
                <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(168,85,247,0.1)' }]}>
                  <Target size={12} color="#A855F7" />
                </View>
                <Text style={styles.sectionLabel}>ISOLATION</Text>
                <View style={styles.sectionLine} />
                <Text style={styles.sectionCount}>{isolations.length}</Text>
              </View>
              {isolations.map(({ pex, idx }) => renderExercise(pex, idx))}
            </>
          )}

          {weekData?.isDeload && (
            <View style={styles.deloadNote}>
              <Text style={styles.deloadNoteText}>
                Semaine de deload : volume reduit pour favoriser la recuperation et la supercompensation.
              </Text>
            </View>
          )}

          {/* Weight note */}
          {day.exercises.some((e) => e.suggestedWeight && e.suggestedWeight > 0) && (
            <View style={styles.weightNote}>
              <Weight size={13} color="rgba(255,107,53,0.6)" />
              <Text style={styles.weightNoteText}>
                Les charges sont estimees a partir de ton poids de corps. Ajuste selon ton ressenti.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        {!isDone && (
          <View style={styles.bottomCta}>
            <Pressable style={styles.startButton} onPress={handleStart}>
              <Play size={18} color="#0C0C0C" fill="#0C0C0C" />
              <Text style={styles.startText}>Commencer</Text>
            </Pressable>
          </View>
        )}
        {isDone && (
          <View style={styles.bottomCta}>
            <View style={styles.doneBar}>
              <Check size={16} color={Colors.success} strokeWidth={2.5} />
              <Text style={styles.doneBarText}>Seance terminee</Text>
            </View>
          </View>
        )}
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
    gap: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  focusTag: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  focusTagText: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  headerSub: {
    color: 'rgba(120,120,130,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74,222,128,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  doneBadgeText: {
    color: Colors.success,
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  todayBadge: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  todayBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Summary card
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    gap: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  summaryLabel: {
    color: 'rgba(100,100,110,1)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  summaryMuscles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  musclePill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  musclePillText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255,107,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sectionCount: {
    color: 'rgba(120,120,130,1)',
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
    gap: 8,
    paddingBottom: 120,
  },

  // Exercise cards
  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  exNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exNumberCompound: {
    backgroundColor: 'rgba(255,107,53,0.1)',
  },
  exNumberText: {
    color: 'rgba(120,120,130,1)',
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  exNumberTextCompound: {
    color: Colors.primary,
  },
  exInfo: {
    flex: 1,
    gap: 6,
  },
  exName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  exMeta: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  exMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  exWeightPill: {
    backgroundColor: 'rgba(255,107,53,0.1)',
  },
  exMetaText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  exWeightText: {
    color: Colors.primary,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Deload note
  deloadNote: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.12)',
    marginTop: 8,
  },
  deloadNoteText: {
    color: 'rgba(59,130,246,0.7)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 19,
  },

  // Weight note
  weightNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  weightNoteText: {
    flex: 1,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 17,
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
  doneBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  doneBarText: {
    color: Colors.success,
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
