import { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import {
  ChevronRight,
  Play,
  Trophy,
  Check,
} from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useProgramStore } from '@/stores/programStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getExerciseById } from '@/data/exercises';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { estimateDuration } from '@/lib/programGenerator';
import { buildProgramExercisesParam } from '@/lib/programSession';
import { FOCUS_COLORS } from '@/components/program/DayCard';

const SPLIT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ppl: { label: 'PPL', color: '#FF6B35', bg: 'rgba(255,107,53,0.15)' },
  upper_lower: { label: 'Haut/Bas', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  full_body: { label: 'Full Body', color: '#A855F7', bg: 'rgba(168,85,247,0.15)' },
};

// Ghost split preview — shows a PPL sample to tease the feature
const GHOST_DAYS = [
  { label: 'Push A', focus: 'push' },
  { label: 'Pull A', focus: 'pull' },
  { label: 'Legs A', focus: 'legs' },
  { label: 'Push B', focus: 'push' },
  { label: 'Pull B', focus: 'pull' },
  { label: 'Legs B', focus: 'legs' },
];

const GHOST_WEEKS = 5; // 4 training + 1 deload

export function ActiveProgramCard() {
  const router = useRouter();
  const { userProfile, program, activeState, isProgramComplete } = useProgramStore();
  const startSession = useWorkoutStore((s) => s.startSession);

  // Pulsing glow for start button
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(pulse.value, [0, 1], [0.15, 0.4]),
    shadowRadius: interpolate(pulse.value, [0, 1], [8, 20]),
  }));

  // Shimmer for ghost mesocycle
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.06, 0.12, 0.06]),
  }));

  const programComplete = useMemo(() => isProgramComplete(), [activeState?.completedDays, program]);

  // ─── State 1: No program — Ghost Preview CTA ───
  if (!userProfile || !program || !activeState) {
    return (
      <View style={styles.container}>
        <Pressable
          style={styles.card}
          onPress={() => router.push('/program/onboarding')}
        >
          {/* Section header — matching VolumeCard pattern */}
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>PROGRAMME</Text>
            <ChevronRight size={16} color="rgba(120,120,130,1)" strokeWidth={2} />
          </View>

          {/* Ghost split days — 2 rows of 3 */}
          <View style={styles.ghostSplitWrap}>
            <View style={styles.ghostSplitRow}>
              {GHOST_DAYS.slice(0, 3).map((day) => {
                const colors = FOCUS_COLORS[day.focus] || FOCUS_COLORS.full_body;
                return (
                  <View key={day.label} style={[styles.ghostDay, { backgroundColor: colors.bg }]}>
                    <View style={[styles.ghostDayDot, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.ghostDayText, { color: colors.text }]}>{day.label}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.ghostSplitRow}>
              {GHOST_DAYS.slice(3, 6).map((day) => {
                const colors = FOCUS_COLORS[day.focus] || FOCUS_COLORS.full_body;
                return (
                  <View key={day.label} style={[styles.ghostDay, { backgroundColor: colors.bg }]}>
                    <View style={[styles.ghostDayDot, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.ghostDayText, { color: colors.text }]}>{day.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Ghost mesocycle bar */}
          <View style={styles.ghostMesoWrap}>
            <View style={styles.ghostMesoBar}>
              {Array.from({ length: GHOST_WEEKS }).map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.ghostMesoSegment,
                    i === GHOST_WEEKS - 1 && styles.ghostMesoDeload,
                    shimmerStyle,
                  ]}
                />
              ))}
            </View>
            <View style={styles.ghostMesoLabels}>
              {Array.from({ length: GHOST_WEEKS }).map((_, i) => (
                <Text key={i} style={[styles.ghostMesoLabel, i === GHOST_WEEKS - 1 && styles.ghostMesoLabelDeload]}>
                  {i === GHOST_WEEKS - 1 ? 'DL' : `S${i + 1}`}
                </Text>
              ))}
            </View>
          </View>

          {/* Features teaser */}
          <View style={styles.ghostFeatures}>
            <Text style={styles.ghostFeatureText}>4-6 sem</Text>
            <View style={styles.ghostFeatureDot} />
            <Text style={styles.ghostFeatureText}>Periodise</Text>
            <View style={styles.ghostFeatureDot} />
            <Text style={styles.ghostFeatureText}>Volume RP</Text>
          </View>

          {/* Elegant CTA — outlined pill, not full-width block */}
          <Pressable
            style={styles.ghostCta}
            onPress={() => router.push('/program/onboarding')}
          >
            <Text style={styles.ghostCtaText}>Créer mon programme</Text>
            <ChevronRight size={14} color={Colors.primary} strokeWidth={2.5} />
          </Pressable>
        </Pressable>
      </View>
    );
  }

  // ─── State 3: Program Complete ───
  if (programComplete) {
    const totalSessions = activeState.completedDays.length;
    const splitInfo = SPLIT_LABELS[program.splitType] || SPLIT_LABELS.ppl;
    return (
      <View style={styles.container}>
        <Pressable style={styles.card} onPress={() => router.push('/program')}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>PROGRAMME</Text>
            <ChevronRight size={16} color="rgba(120,120,130,1)" strokeWidth={2} />
          </View>

          <View style={styles.completeContent}>
            <View style={styles.trophyWrap}>
              <Trophy size={24} color="#FBBF24" />
            </View>
            <View style={styles.completeTextWrap}>
              <Text style={styles.completeTitle}>Programme terminé !</Text>
              <Text style={styles.completeSubtitle}>
                {splitInfo.label} · {program.totalWeeks} semaines
              </Text>
            </View>
          </View>

          {/* Completion stats */}
          <View style={styles.completeStats}>
            <View style={styles.completeStat}>
              <Text style={styles.completeStatValue}>{totalSessions}</Text>
              <Text style={styles.completeStatLabel}>séances</Text>
            </View>
            <View style={styles.completeStatDivider} />
            <View style={styles.completeStat}>
              <Text style={styles.completeStatValue}>{program.totalWeeks}</Text>
              <Text style={styles.completeStatLabel}>semaines</Text>
            </View>
            <View style={styles.completeStatDivider} />
            <View style={styles.completeStat}>
              <Text style={[styles.completeStatValue, { color: splitInfo.color }]}>
                {splitInfo.label}
              </Text>
              <Text style={styles.completeStatLabel}>split</Text>
            </View>
          </View>

          {/* Completed mesocycle bar */}
          <View style={styles.mesoBar}>
            {program.weeks.map((week) => (
              <View
                key={week.weekNumber}
                style={[
                  styles.mesoSegment,
                  week.isDeload ? styles.mesoSegmentDeload : styles.mesoSegmentDone,
                ]}
              />
            ))}
          </View>

          <Pressable
            style={styles.ghostCta}
            onPress={() => router.push('/program/onboarding')}
          >
            <Text style={styles.ghostCtaText}>Nouveau programme</Text>
            <ChevronRight size={14} color={Colors.primary} strokeWidth={2.5} />
          </Pressable>
        </Pressable>
      </View>
    );
  }

  // ─── State 2: Active program ───
  const currentWeek = program.weeks.find(
    (w) => w.weekNumber === activeState.currentWeek
  );
  const todayDay = currentWeek?.days[activeState.currentDayIndex];

  const exercisePreview = useMemo(() => {
    if (!todayDay) return [];
    return todayDay.exercises.slice(0, 3).map((e) => {
      const ex = getExerciseById(e.exerciseId);
      if (!ex) return null;
      return {
        id: ex.id,
        nameFr: ex.nameFr || ex.name,
        bodyPart: ex.bodyPart,
        gifUrl: ex.gifUrl,
        sets: e.sets,
        reps: e.reps,
      };
    }).filter(Boolean) as Array<{ id: string; nameFr: string; bodyPart: string; gifUrl?: string; sets: number; reps: number }>;
  }, [todayDay]);

  const duration = todayDay ? estimateDuration(todayDay) : 0;
  const isDayDone = activeState.completedDays.includes(
    `${activeState.currentWeek}-${activeState.currentDayIndex}`
  );

  const splitStyle = SPLIT_LABELS[program.splitType] || SPLIT_LABELS.ppl;

  const handleStart = () => {
    if (!todayDay || isDayDone) return;

    const workoutId = `program_${program.id}_w${activeState.currentWeek}_d${activeState.currentDayIndex}`;
    const sessionId = startSession(workoutId, todayDay.labelFr, {
      programId: program.id,
      programWeek: activeState.currentWeek,
      programDayIndex: activeState.currentDayIndex,
    });

    const exercisesJson = buildProgramExercisesParam(todayDay);

    router.push({
      pathname: '/workout/session',
      params: {
        workoutId,
        sessionId,
        workoutName: todayDay.labelFr,
        exercises: exercisesJson,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.card,
          !isDayDone && styles.cardActive,
        ]}
        onPress={() => router.push('/program')}
      >
        {/* Top row: split badge + week + chevron */}
        <View style={styles.topRow}>
          <View style={[styles.splitPill, { backgroundColor: splitStyle.bg }]}>
            <Text style={[styles.splitPillText, { color: splitStyle.color }]}>
              {splitStyle.label}
            </Text>
          </View>
          <View style={styles.weekPill}>
            <Text style={styles.weekPillText}>
              Semaine {activeState.currentWeek}/{program.totalWeeks}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <ChevronRight size={16} color="rgba(120,120,130,1)" />
        </View>

        {/* Center: today's workout */}
        {todayDay && (
          <View style={styles.todaySection}>
            <View style={styles.todayRow}>
              <View style={[styles.focusDot, { backgroundColor: splitStyle.color }]} />
              <Text style={styles.todayLabel}>{todayDay.labelFr}</Text>
              {duration > 0 && (
                <View style={styles.durationPill}>
                  <Text style={styles.durationText}>~{duration} min</Text>
                </View>
              )}
            </View>

            {exercisePreview.length > 0 && (
              <View style={styles.exercisePreviewList}>
                {exercisePreview.map((ex) => (
                  <View key={ex.id} style={styles.exercisePreviewRow}>
                    <ExerciseIcon
                      exerciseName={ex.nameFr}
                      bodyPart={ex.bodyPart}
                      gifUrl={ex.gifUrl}
                      size={14}
                      containerSize={28}
                    />
                    <Text style={styles.exercisePreviewName} numberOfLines={1}>
                      {ex.nameFr}
                    </Text>
                    <Text style={styles.exercisePreviewMeta}>
                      {ex.sets}×{ex.reps}
                    </Text>
                  </View>
                ))}
                {todayDay.exercises.length > 3 && (
                  <Text style={styles.exerciseMoreText}>
                    +{todayDay.exercises.length - 3} exercices
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Mesocycle bar */}
        <View style={styles.mesoBar}>
          {program.weeks.map((week) => {
            const weekDays = week.days.length;
            const completedInWeek = activeState.completedDays.filter(
              (k) => k.startsWith(`${week.weekNumber}-`)
            ).length;
            const isCurrentWeek = week.weekNumber === activeState.currentWeek;
            const weekComplete = completedInWeek >= weekDays;
            const hasProgress = completedInWeek > 0 && !weekComplete;

            return (
              <View
                key={week.weekNumber}
                style={[
                  styles.mesoSegment,
                  weekComplete && !week.isDeload && styles.mesoSegmentDone,
                  weekComplete && week.isDeload && styles.mesoSegmentDeload,
                  isCurrentWeek && !weekComplete && styles.mesoSegmentCurrent,
                  hasProgress && isCurrentWeek && {
                    backgroundColor: `rgba(255,107,53,${0.15 + (completedInWeek / weekDays) * 0.35})`,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Bottom CTA */}
        {!isDayDone && todayDay && (
          <Animated.View style={[styles.startButtonWrap, pulseStyle]}>
            <Pressable style={styles.startButton} onPress={handleStart}>
              <Play size={14} color="#0C0C0C" fill="#0C0C0C" />
              <Text style={styles.startButtonText}>Commencer</Text>
            </Pressable>
          </Animated.View>
        )}
        {isDayDone && (
          <View style={styles.doneRow}>
            <Check size={14} color={Colors.success} strokeWidth={2.5} />
            <Text style={styles.doneText}>Séance terminée</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    gap: 16,
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: 'rgba(255,107,53,0.12)',
  },

  // ─── Section header (shared by CTA + complete states) ───
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: 'rgba(200,200,210,1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  // ─── Ghost CTA State ───
  ghostSplitWrap: {
    gap: 6,
  },
  ghostSplitRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ghostDay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
    opacity: 0.55,
  },
  ghostDayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  ghostDayText: {
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  ghostMesoWrap: {
    gap: 6,
  },
  ghostMesoBar: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
  },
  ghostMesoSegment: {
    flex: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(255,107,53,0.15)',
  },
  ghostMesoDeload: {
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  ghostMesoLabels: {
    flexDirection: 'row',
    gap: 3,
  },
  ghostMesoLabel: {
    flex: 1,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.2)',
    fontSize: 9,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  ghostMesoLabelDeload: {
    color: 'rgba(59,130,246,0.35)',
  },

  ghostFeatures: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ghostFeatureText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  ghostFeatureDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  ghostCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.25)',
    backgroundColor: 'rgba(255,107,53,0.06)',
  },
  ghostCtaText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // ─── Complete State ───
  completeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trophyWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTextWrap: {
    flex: 1,
    gap: 2,
  },
  completeTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  completeSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  completeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  completeStat: {
    alignItems: 'center',
    gap: 2,
  },
  completeStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  completeStatLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completeStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // ─── Active State ───
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  splitPill: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  splitPillText: {
    fontSize: 12,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  weekPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  weekPillText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  todaySection: {
    gap: 10,
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  todayLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  durationPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  durationText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  exercisePreviewList: {
    gap: 8,
    paddingLeft: 16,
  },
  exercisePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exercisePreviewName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },
  exercisePreviewMeta: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  exerciseMoreText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    paddingLeft: 38,
  },

  // Mesocycle bar
  mesoBar: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
  },
  mesoSegment: {
    flex: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  mesoSegmentDone: {
    backgroundColor: Colors.primary,
  },
  mesoSegmentDeload: {
    backgroundColor: '#3B82F6',
  },
  mesoSegmentCurrent: {
    backgroundColor: 'rgba(255,107,53,0.25)',
  },

  // Bottom CTA
  startButtonWrap: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    color: '#0C0C0C',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  doneText: {
    color: Colors.success,
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
