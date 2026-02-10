import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  Dumbbell,
  Zap,
  Clock,
  ChevronRight,
  Moon,
} from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import { TimelineDay } from '@/lib/timelineEngine';
import { getTimelineNudge } from '@/lib/timelineNudges';
import { resolveDayLabel } from '@/lib/programLabels';
import { TARGET_TO_MUSCLE, getMuscleLabel } from '@/lib/muscleMapping';
import { MuscleZoneChip } from '@/components/calendar/MuscleZoneChip';
import { exercises } from '@/data/exercises';
import { detectPRs } from '@/lib/progressiveOverload';
import { WorkoutSession } from '@/types';
import i18n from '@/lib/i18n';

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

interface DayContentCardProps {
  day: TimelineDay;
  weeklyVolume?: Record<string, number>;
  allHistory?: WorkoutSession[];
  onPressSession?: (sessionId: string) => void;
  onStartSession?: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  return `${mins} ${i18n.t('common.minAbbr')}`;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg}${i18n.t('common.kgUnit')}`;
}

/** Get per-muscle set counts from a single session */
function getSessionMuscleBreakdown(session: WorkoutSession): Record<string, number> {
  const result: Record<string, number> = {};
  for (const compEx of session.completedExercises) {
    const exercise = exerciseMap.get(compEx.exerciseId);
    if (!exercise) continue;
    const muscle = TARGET_TO_MUSCLE[exercise.target];
    if (!muscle) continue;
    const sets = compEx.sets.filter((s) => s.completed).length;
    result[muscle] = (result[muscle] || 0) + sets;
  }
  return result;
}

/** Get enriched PR details for a session */
function getSessionPRDetails(
  session: WorkoutSession,
  allHistory: WorkoutSession[],
): Array<{ exerciseName: string; improvement: string }> {
  const sorted = [...allHistory]
    .filter((s) => s.endTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const priorHistory = sorted.filter(
    (s) => new Date(s.startTime).getTime() < new Date(session.startTime).getTime(),
  );

  const prs = detectPRs(session, priorHistory);
  return prs.slice(0, 3).map((pr) => {
    const ex = exerciseMap.get(pr.exerciseId);
    const name = ex?.nameFr || ex?.name || pr.exerciseId;
    const diff = pr.previousValue > 0
      ? `+${(pr.value - pr.previousValue).toFixed(pr.type === 'weight' ? 1 : 0)}${pr.type === 'weight' ? 'kg' : ''}`
      : '';
    return { exerciseName: name, improvement: diff };
  });
}

export function DayContentCard({
  day,
  weeklyVolume,
  allHistory,
  onPressSession,
  onStartSession,
}: DayContentCardProps) {
  const nudge = getTimelineNudge(day);

  // ─── State 1: Past Trained Day ───
  if ((day.isPast || day.isToday) && day.sessions.length > 0) {
    const session = day.sessions[0];
    const muscleBreakdown = getSessionMuscleBreakdown(session);
    const sortedMuscles = Object.entries(muscleBreakdown)
      .sort((a, b) => b[1] - a[1]);

    // PR details
    const prDetails = allHistory && day.prs > 0
      ? getSessionPRDetails(session, allHistory)
      : [];

    return (
      <PressableScale
        style={styles.card}
        onPress={() => onPressSession?.(session.id)}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.iconBox}>
            <Dumbbell size={16} color={Colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.title} numberOfLines={1}>
              {session.workoutName || i18n.t('common.done')}
            </Text>
            <Text style={styles.meta}>
              {formatDuration(session.durationSeconds || 0)}
              {' · '}{day.totalSets} {i18n.t('common.sets')}
              {day.totalVolume > 0 && ` · ${formatVolume(day.totalVolume)}`}
            </Text>
          </View>
          {day.prs > 0 && (
            <View style={styles.prBadge}>
              <Zap size={10} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.prText}>{day.prs} {i18n.t('calendar.prs')}</Text>
            </View>
          )}
          <ChevronRight size={14} color="rgba(100,100,110,1)" />
        </View>

        {/* Muscles trained section */}
        {sortedMuscles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{i18n.t('calendar.musclesTrained')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.muscleChipsRow}
            >
              {sortedMuscles.map(([muscle, sets]) => (
                <MuscleZoneChip
                  key={muscle}
                  muscle={muscle}
                  sets={sets}
                  weeklyTotal={weeklyVolume?.[muscle]}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* PR details */}
        {prDetails.length > 0 && (
          <View style={styles.prSection}>
            {prDetails.map((pr, idx) => (
              <View key={idx} style={styles.prRow}>
                <Zap size={12} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.prDetailText} numberOfLines={1}>
                  {pr.exerciseName}
                  {pr.improvement ? ` (${pr.improvement})` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </PressableScale>
    );
  }

  // ─── State 2: Today with Scheduled Session ───
  if (day.isToday && day.programDay) {
    const label = resolveDayLabel(day.programDay);
    const totalExercises = day.programDay.exercises.length;
    const totalSets = day.programDay.exercises.reduce((s, e) => s + e.sets, 0);

    return (
      <View style={[styles.card, styles.cardToday]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, styles.iconBoxToday]}>
            <Dumbbell size={16} color={Colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{label}</Text>
            <Text style={styles.meta}>
              {totalExercises} {i18n.t('common.exosAbbr')}
              {' · '}{totalSets} {i18n.t('common.sets')}
            </Text>
          </View>
          <Text style={styles.todayBadge}>{i18n.t('programDay.today')}</Text>
        </View>

        {/* Muscle readiness rows */}
        {day.programDay.muscleTargets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{i18n.t('calendar.muscleReadiness')}</Text>
            {day.programDay.muscleTargets.slice(0, 5).map((muscle) => {
              const isFresh = day.recoveryProjection?.freshMuscles.includes(muscle) ?? true;
              const isFatigued = day.recoveryProjection?.fatiguedMuscles.includes(muscle) ?? false;
              const weekSets = weeklyVolume?.[muscle] || 0;

              return (
                <View key={muscle} style={styles.readinessRow}>
                  <View
                    style={[
                      styles.recoveryDot,
                      {
                        backgroundColor: isFatigued
                          ? '#EF4444'
                          : isFresh
                            ? '#4ADE80'
                            : '#FBBF24',
                      },
                    ]}
                  />
                  <Text style={styles.readinessMuscleName}>{getMuscleLabel(muscle)}</Text>
                  <Text style={styles.readinessStatus}>
                    {isFatigued
                      ? i18n.t('calendar.fatigued')
                      : isFresh
                        ? i18n.t('calendar.fresh')
                        : i18n.t('calendar.recovering')}
                  </Text>
                  {weekSets > 0 && (
                    <Text style={styles.readinessSets}>
                      {weekSets} {i18n.t('common.sets')}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {onStartSession && (
          <PressableScale style={styles.startButton} onPress={onStartSession} activeScale={0.97}>
            <Text style={styles.startButtonText}>{i18n.t('calendar.startSession')}</Text>
          </PressableScale>
        )}
      </View>
    );
  }

  // ─── State 3: Future Scheduled Day ───
  if (!day.isPast && !day.isToday && day.programDay) {
    const label = resolveDayLabel(day.programDay);
    const daysAway = Math.ceil(
      (new Date(day.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconBox}>
            <Clock size={16} color="rgba(255,255,255,0.35)" strokeWidth={2} />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{label}</Text>
            <Text style={styles.meta}>
              {day.programDay.exercises.length} {i18n.t('common.exosAbbr')}
              {' · '}{day.programDay.exercises.reduce((s, e) => s + e.sets, 0)} {i18n.t('common.sets')}
            </Text>
          </View>
          <Text style={styles.futureBadge}>
            {i18n.t('calendar.inDays', { count: daysAway })}
          </Text>
        </View>

        {/* Recovery projection */}
        {day.recoveryProjection && day.programDay.muscleTargets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{i18n.t('calendar.recoveryProjection')}</Text>
            {day.programDay.muscleTargets.slice(0, 5).map((muscle) => {
              const isFresh = day.recoveryProjection!.freshMuscles.includes(muscle);
              const isFatigued = day.recoveryProjection!.fatiguedMuscles.includes(muscle);

              return (
                <View key={muscle} style={styles.readinessRow}>
                  <View
                    style={[
                      styles.recoveryDot,
                      {
                        backgroundColor: isFatigued
                          ? '#EF4444'
                          : isFresh
                            ? '#4ADE80'
                            : '#FBBF24',
                      },
                    ]}
                  />
                  <Text style={styles.readinessMuscleName}>{getMuscleLabel(muscle)}</Text>
                  <Text style={styles.readinessStatus}>
                    {isFatigued
                      ? i18n.t('calendar.fatigued')
                      : isFresh
                        ? i18n.t('calendar.fresh')
                        : i18n.t('calendar.recovering')}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {nudge && (
          <View style={styles.nudgeRow}>
            <View
              style={[
                styles.nudgeAccent,
                nudge.includes('Attention') || nudge.includes('Warning')
                  ? { backgroundColor: '#FBBF24' }
                  : { backgroundColor: '#4ADE80' },
              ]}
            />
            <Text style={styles.nudgeText}>{nudge}</Text>
          </View>
        )}
      </View>
    );
  }

  // ─── State 4: Rest Day ───
  const recoveryProjection = day.recoveryProjection;
  const freshCount = recoveryProjection?.freshMuscles.length || 0;
  const fatiguedCount = recoveryProjection?.fatiguedMuscles.length || 0;
  // Recovering = total trackable - fresh - fatigued
  const totalMuscles = freshCount + fatiguedCount;
  const recoveringCount = totalMuscles > 0 ? 0 : 0; // simplified: no "recovering" bucket in engine

  return (
    <View style={[styles.card, styles.cardRest]}>
      <View style={styles.headerRow}>
        <View style={styles.iconBoxRest}>
          <Moon size={16} color="rgba(255,255,255,0.25)" strokeWidth={2} />
        </View>
        <Text style={styles.restTitle}>{i18n.t('calendar.restDayTitle')}</Text>
      </View>

      {/* Recovery summary buckets */}
      {recoveryProjection && (freshCount > 0 || fatiguedCount > 0) && (
        <View style={styles.recoveryBuckets}>
          {freshCount > 0 && (
            <View style={styles.bucketRow}>
              <View style={[styles.recoveryDot, { backgroundColor: '#4ADE80' }]} />
              <Text style={styles.bucketText}>
                {i18n.t('calendar.musclesFresh', { count: freshCount })}
              </Text>
            </View>
          )}
          {fatiguedCount > 0 && (
            <View style={styles.bucketRow}>
              <View style={[styles.recoveryDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.bucketText}>
                {i18n.t('calendar.musclesFatigued', { count: fatiguedCount })}
              </Text>
            </View>
          )}
        </View>
      )}

      {nudge && (
        <View style={styles.nudgeRow}>
          <View style={[styles.nudgeAccent, { backgroundColor: '#4ADE80' }]} />
          <Text style={styles.nudgeText}>{nudge}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    gap: 12,
  },
  cardToday: {
    borderColor: 'rgba(255,107,53,0.15)',
  },
  cardRest: {
    gap: 10,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxToday: {
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
  iconBoxRest: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  meta: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  todayBadge: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  futureBadge: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,107,53,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  prText: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Section
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  muscleChipsRow: {
    gap: 12,
    paddingRight: 8,
  },

  // PR details
  prSection: {
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prDetailText: {
    flex: 1,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Readiness rows
  readinessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  recoveryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  readinessMuscleName: {
    flex: 1,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  readinessStatus: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  readinessSets: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Start button
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#0C0C0C',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Nudge
  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  nudgeAccent: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
    marginTop: 1,
  },
  nudgeText: {
    flex: 1,
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 16,
  },

  // Rest day
  restTitle: {
    flex: 1,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  recoveryBuckets: {
    gap: 6,
    paddingLeft: 48,
  },
  bucketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bucketText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
