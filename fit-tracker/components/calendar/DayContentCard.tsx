import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  Dumbbell,
  Zap,
  Clock,
  Moon,
  SkipForward,
} from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import { TimelineDay } from '@/lib/timelineEngine';
import { getTimelineNudge } from '@/lib/timelineNudges';
import { resolveDayLabel } from '@/lib/programLabels';
import { getMuscleLabel, TARGET_TO_MUSCLE } from '@/lib/muscleMapping';
import { RECOVERY_COLORS } from '@/constants/recovery';
import { exercises } from '@/data/exercises';
import { detectPRs } from '@/lib/progressiveOverload';
import { WorkoutSession } from '@/types';
import i18n from '@/lib/i18n';
import { formatWeight, getWeightUnitLabel } from '@/stores/settingsStore';
import {
  RP_VOLUME_LANDMARKS,
  getVolumeZone,
  getZoneColor,
} from '@/constants/volumeLandmarks';

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

interface DayContentCardProps {
  day: TimelineDay;
  weekHistory?: WorkoutSession[];
  weeklySets?: Record<string, number>;
  onStartSession?: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  return `${mins} ${i18n.t('common.minAbbr')}`;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${formatWeight(kg)}${getWeightUnitLabel()}`;
}

/** Group a session's completed exercises by muscle, returning set counts per muscle */
function getSessionMuscleSets(session: WorkoutSession): Record<string, number> {
  const result: Record<string, number> = {};
  for (const compEx of session.completedExercises) {
    const ex = exerciseMap.get(compEx.exerciseId);
    if (!ex) continue;
    const muscle = TARGET_TO_MUSCLE[ex.target];
    if (!muscle) continue;
    const completedSets = compEx.sets.filter((s) => s.completed).length;
    // Fallback: if no sets have completed flag but sets have reps, count all sets with reps > 0
    // This handles older sessions where the completed flag may be missing
    const effectiveSets = completedSets > 0
      ? completedSets
      : compEx.sets.filter((s) => s.reps > 0).length;
    result[muscle] = (result[muscle] || 0) + effectiveSets;
  }
  return result;
}

/** Get enriched PR details for a session */
function getSessionPRDetails(
  session: WorkoutSession,
  allHistory: WorkoutSession[],
): { exerciseName: string; type: string; value: number; prev: number }[] {
  const sorted = [...allHistory]
    .filter((s) => s.endTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const prior = sorted.filter(
    (s) => new Date(s.startTime).getTime() < new Date(session.startTime).getTime(),
  );
  const prs = detectPRs(session, prior);
  return prs.map((pr) => {
    const ex = exerciseMap.get(pr.exerciseId);
    return {
      exerciseName: ex?.nameFr || ex?.name || pr.exerciseId,
      type: pr.type,
      value: pr.value,
      prev: pr.previousValue,
    };
  });
}

export function DayContentCard({
  day,
  weekHistory,
  weeklySets,
  onStartSession,
}: DayContentCardProps) {
  const nudge = getTimelineNudge(day);

  // ─── State 1: Past trained day (or today with completed session) ───
  if ((day.isPast || day.isToday) && day.sessions.length > 0) {
    const session = day.sessions[0];
    const label = day.programDay
      ? resolveDayLabel(day.programDay)
      : session.workoutName || i18n.t('common.done');

    // Per-muscle set breakdown
    const muscleSets = getSessionMuscleSets(session);
    const sortedMuscles = Object.entries(muscleSets)
      .filter(([, sets]) => sets > 0)
      .sort((a, b) => b[1] - a[1]);

    // Compute duration: use session durationSeconds, fallback to endTime - startTime
    let durationSec = session.durationSeconds || 0;
    if (durationSec === 0 && session.endTime && session.startTime) {
      durationSec = Math.round(
        (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000,
      );
    }

    // Compute total sets: prefer day.totalSets, fallback to sum of muscle sets
    const totalSets = day.totalSets > 0
      ? day.totalSets
      : Object.values(muscleSets).reduce((sum, s) => sum + s, 0);

    // PR details
    const prDetails = weekHistory
      ? getSessionPRDetails(session, weekHistory)
      : [];

    return (
      <View style={styles.cardPast}>
        {/* Header: title + PR badge */}
        <View style={styles.pastHeaderRow}>
          <Text style={[styles.title, { flex: 1 }]} numberOfLines={1}>
            {label}
          </Text>
          {day.prs > 0 && (
            <View style={styles.prBadge}>
              <Zap size={10} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.prText}>{day.prs} {i18n.t('calendar.prs')}</Text>
            </View>
          )}
        </View>

        {/* Meta line */}
        <Text style={styles.meta}>
          {formatDuration(durationSec)}
          {' · '}{totalSets} {i18n.t('common.sets')}
          {day.totalVolume > 0 && ` · ${formatVolume(day.totalVolume)}`}
        </Text>

        {/* Compact muscle dots — 2-column wrap */}
        {sortedMuscles.length > 0 && (
          <View style={styles.muscleDotGrid}>
            {sortedMuscles.slice(0, 6).map(([muscle, sets]) => {
              const weekTotal = weeklySets?.[muscle] || sets;
              const landmarks = RP_VOLUME_LANDMARKS[muscle];
              const zone = landmarks
                ? getVolumeZone(weekTotal, landmarks)
                : 'mev_mav';
              const dotColor = getZoneColor(zone);
              return (
                <View key={muscle} style={styles.muscleDotItem}>
                  <View style={[styles.muscleDot, { backgroundColor: dotColor }]} />
                  <Text style={styles.muscleDotName} numberOfLines={1}>
                    {getMuscleLabel(muscle)}
                  </Text>
                  <Text style={styles.muscleDotSets}>{sets}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* PR details */}
        {prDetails.length > 0 && (
          <View style={styles.prRow}>
            {prDetails.slice(0, 2).map((pr, idx) => {
              const diff = pr.prev > 0
                ? pr.type === 'weight'
                  ? `+${formatWeight(pr.value - pr.prev)}${getWeightUnitLabel()}`
                  : `+${pr.value - pr.prev}`
                : '';
              return (
                <View key={idx} style={styles.prDetail}>
                  <Zap size={10} color={Colors.primary} strokeWidth={2.5} />
                  <Text style={styles.prDetailText} numberOfLines={1}>
                    {pr.exerciseName}{diff ? ` (${diff})` : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  }

  // ─── State 2: Today with scheduled workout ───
  if (day.isToday && day.programDay) {
    const label = resolveDayLabel(day.programDay);
    const targetMuscles = day.programDay.muscleTargets || [];
    const recovery = day.recoveryProjection;

    return (
      <View style={[styles.card, styles.cardToday]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, styles.iconBoxToday]}>
            <Dumbbell size={16} color={Colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{label}</Text>
            <Text style={styles.meta}>
              {day.programDay.exercises.length} {i18n.t('common.exosAbbr')}
              {' · '}{day.programDay.exercises.reduce((s, e) => s + e.sets, 0)} {i18n.t('common.sets')}
            </Text>
          </View>
        </View>

        {/* Muscle readiness */}
        {targetMuscles.length > 0 && recovery && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {i18n.t('calendar.muscleReadiness')}
            </Text>
            <View style={styles.readinessRows}>
              {targetMuscles.slice(0, 5).map((muscle) => {
                const isFresh = recovery.freshMuscles.includes(muscle);
                const isFatigued = recovery.fatiguedMuscles.includes(muscle);
                const statusColor = isFatigued
                  ? RECOVERY_COLORS.fatigued
                  : isFresh
                    ? RECOVERY_COLORS.fresh
                    : '#FBBF24';
                const statusLabel = isFatigued
                  ? i18n.t('calendar.fatigued')
                  : isFresh
                    ? i18n.t('calendar.fresh')
                    : i18n.t('calendar.recovering');
                const weekSets = weeklySets?.[muscle] || 0;

                return (
                  <View key={muscle} style={styles.readinessRow}>
                    <View style={[styles.readinessDot, { backgroundColor: statusColor }]} />
                    <Text style={styles.readinessName} numberOfLines={1}>
                      {getMuscleLabel(muscle)}
                    </Text>
                    <Text style={[styles.readinessStatus, { color: statusColor }]}>
                      {statusLabel}
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

  // ─── State 3: Future scheduled day ───
  if (!day.isPast && !day.isToday && day.programDay) {
    const label = resolveDayLabel(day.programDay);
    const daysAway = Math.ceil(
      (new Date(day.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );
    const targetMuscles = day.programDay.muscleTargets || [];
    const recovery = day.recoveryProjection;

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
        {targetMuscles.length > 0 && recovery && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {i18n.t('calendar.recoveryProjection')}
            </Text>
            <View style={styles.readinessRows}>
              {targetMuscles.slice(0, 4).map((muscle) => {
                const isFresh = recovery.freshMuscles.includes(muscle);
                const isFatigued = recovery.fatiguedMuscles.includes(muscle);
                const statusColor = isFatigued
                  ? RECOVERY_COLORS.fatigued
                  : isFresh
                    ? RECOVERY_COLORS.fresh
                    : '#FBBF24';
                const statusLabel = isFatigued
                  ? i18n.t('calendar.fatigued')
                  : isFresh
                    ? i18n.t('calendar.fresh')
                    : i18n.t('calendar.recovering');

                return (
                  <View key={muscle} style={styles.readinessRow}>
                    <View style={[styles.readinessDot, { backgroundColor: statusColor }]} />
                    <Text style={styles.readinessName} numberOfLines={1}>
                      {getMuscleLabel(muscle)}
                    </Text>
                    <Text style={[styles.readinessStatus, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                );
              })}
            </View>
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

  // ─── State 4: Skipped day ───
  if (day.isSkipped && day.scheduledDay) {
    const label = day.programDay ? resolveDayLabel(day.programDay) : '';
    const reasonKey = day.scheduledDay.skippedReason === 'merged'
      ? 'missedDay.mergedLabel'
      : 'missedDay.skippedLabel';
    return (
      <View style={styles.cardSkipped}>
        <SkipForward size={14} color="rgba(255,255,255,0.2)" strokeWidth={2} />
        <View style={styles.skippedContent}>
          <Text style={styles.skippedTitle}>{label}</Text>
          <Text style={styles.skippedReason}>{i18n.t(reasonKey)}</Text>
        </View>
      </View>
    );
  }

  // ─── State 5: Rest / empty day ───
  const recovery = day.recoveryProjection;
  const freshCount = recovery?.freshMuscles.length || 0;
  const fatiguedCount = recovery?.fatiguedMuscles.length || 0;
  const recoveringCount = 14 - freshCount - fatiguedCount;

  return (
    <View style={styles.cardRest}>
      <View style={styles.restHeader}>
        <Moon size={14} color="rgba(255,255,255,0.2)" strokeWidth={2} />
        <Text style={styles.restText}>
          {day.scheduledDay ? i18n.t('calendar.restDay') : i18n.t('calendar.nothingPlanned')}
        </Text>
      </View>

      {/* Recovery summary for rest days */}
      {recovery && !day.isPast && (
        <View style={styles.recoverySummary}>
          {freshCount > 0 && (
            <View style={styles.recoveryBucket}>
              <View style={[styles.readinessDot, { backgroundColor: RECOVERY_COLORS.fresh }]} />
              <Text style={styles.recoveryBucketText}>
                {i18n.t('calendar.musclesFresh', { count: freshCount })}
              </Text>
            </View>
          )}
          {recoveringCount > 0 && (
            <View style={styles.recoveryBucket}>
              <View style={[styles.readinessDot, { backgroundColor: '#FBBF24' }]} />
              <Text style={styles.recoveryBucketText}>
                {i18n.t('calendar.musclesRecovering', { count: recoveringCount })}
              </Text>
            </View>
          )}
          {fatiguedCount > 0 && (
            <View style={styles.recoveryBucket}>
              <View style={[styles.readinessDot, { backgroundColor: RECOVERY_COLORS.fatigued }]} />
              <Text style={styles.recoveryBucketText}>
                {i18n.t('calendar.musclesFatigued', { count: fatiguedCount })}
              </Text>
            </View>
          )}
        </View>
      )}

      {nudge && !day.isPast && (
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
    gap: 14,
  },
  cardPast: {
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
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  restHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  pastHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // Section layout
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingLeft: 2,
  },

  // Compact muscle dot grid (for trained days)
  muscleDotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  muscleDotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    gap: 6,
    paddingVertical: 4,
  },
  muscleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  muscleDotName: {
    flex: 1,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  muscleDotSets: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginRight: 8,
  },

  // PR detail row
  prRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingLeft: 2,
  },
  prDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prDetailText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Readiness rows (today / future)
  readinessRows: {
    gap: 6,
  },
  readinessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readinessDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  readinessName: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },
  readinessStatus: {
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  readinessSets: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

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

  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 2,
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

  restText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Recovery summary
  recoverySummary: {
    gap: 5,
    paddingLeft: 22,
  },
  recoveryBucket: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recoveryBucketText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Skipped day
  cardSkipped: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    opacity: 0.6,
  },
  skippedContent: {
    flex: 1,
    gap: 1,
  },
  skippedTitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  skippedReason: {
    color: 'rgba(255,255,255,0.15)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
