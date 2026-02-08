import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Dumbbell,
  Play,
  Target,
} from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useProgramStore } from '@/stores/programStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getExerciseById } from '@/data/exercises';
import { estimateDuration } from '@/lib/programGenerator';
import { buildProgramExercisesParam } from '@/lib/programSession';

export function ActiveProgramCard() {
  const router = useRouter();
  const { userProfile, program, activeState } = useProgramStore();
  const startSession = useWorkoutStore((s) => s.startSession);

  // State 1: No profile — show CTA
  if (!userProfile || !program || !activeState) {
    return (
      <View style={styles.container}>
        <Pressable
          style={styles.card}
          onPress={() => router.push('/program/onboarding')}
        >
          <View style={styles.ctaContent}>
            <View style={styles.ctaIconWrap}>
              <Target size={24} color={Colors.primary} />
            </View>
            <View style={styles.ctaTextWrap}>
              <Text style={styles.ctaTitle}>Cree ton programme sur mesure</Text>
              <Text style={styles.ctaSubtitle}>
                Un plan d'entrainement base sur la science, adapte a ton niveau
              </Text>
            </View>
          </View>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Commencer</Text>
            <ChevronRight size={16} color="#0C0C0C" />
          </View>
        </Pressable>
      </View>
    );
  }

  // State 2: Active program — show today's workout
  const currentWeek = program.weeks.find(
    (w) => w.weekNumber === activeState.currentWeek
  );
  const todayDay = currentWeek?.days[activeState.currentDayIndex];

  const exercisePreview = useMemo(() => {
    if (!todayDay) return [];
    return todayDay.exercises.slice(0, 3).map((e) => {
      const ex = getExerciseById(e.exerciseId);
      return ex?.nameFr || ex?.name || '';
    }).filter(Boolean);
  }, [todayDay]);

  const completedInWeek = activeState.completedDays.filter(
    (k) => k.startsWith(`${activeState.currentWeek}-`)
  ).length;
  const totalDaysInWeek = currentWeek?.days.length || 0;
  const progressPct = totalDaysInWeek > 0 ? completedInWeek / totalDaysInWeek : 0;
  const duration = todayDay ? estimateDuration(todayDay) : 0;
  const isDayDone = activeState.completedDays.includes(
    `${activeState.currentWeek}-${activeState.currentDayIndex}`
  );

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
      <Pressable style={styles.card} onPress={() => router.push('/program')}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.programName}>{program.nameFr}</Text>
            <View style={styles.weekBadge}>
              <Text style={styles.weekBadgeText}>
                Semaine {activeState.currentWeek}/{program.totalWeeks}
                {currentWeek?.isDeload ? ' — Deload' : ''}
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color="rgba(120,120,130,1)" />
        </View>

        {/* Today's workout */}
        {todayDay && (
          <View style={styles.todaySection}>
            <View style={styles.todayHeader}>
              <Dumbbell size={16} color={Colors.primary} />
              <Text style={styles.todayLabel}>{todayDay.labelFr}</Text>
              <View style={styles.focusTag}>
                <Text style={styles.focusTagText}>{todayDay.focus}</Text>
              </View>
            </View>
            {exercisePreview.length > 0 && (
              <Text style={styles.exerciseList} numberOfLines={2}>
                {exercisePreview.join(' · ')}
              </Text>
            )}
            {duration > 0 && (
              <Text style={styles.duration}>~{duration} min</Text>
            )}
          </View>
        )}

        {/* Progress bar */}
        <View style={styles.progressRow}>
          <View style={styles.progressBg}>
            <View
              style={[styles.progressFill, { width: `${progressPct * 100}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {completedInWeek}/{totalDaysInWeek}
          </Text>
        </View>

        {/* CTA */}
        {!isDayDone && todayDay && (
          <Pressable style={styles.startButton} onPress={handleStart}>
            <Play size={16} color="#0C0C0C" fill="#0C0C0C" />
            <Text style={styles.startButtonText}>Commencer</Text>
          </Pressable>
        )}
        {isDayDone && (
          <View style={styles.doneLabel}>
            <Text style={styles.doneLabelText}>Seance terminee</Text>
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
    gap: 14,
  },

  // CTA state
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ctaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTextWrap: {
    flex: 1,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginBottom: 4,
  },
  ctaSubtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 17,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaButtonText: {
    color: '#0C0C0C',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Active state
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginBottom: 4,
  },
  weekBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  weekBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  todaySection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  focusTag: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  focusTagText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  exerciseList: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 18,
  },
  duration: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
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
  doneLabel: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  doneLabelText: {
    color: Colors.success,
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
