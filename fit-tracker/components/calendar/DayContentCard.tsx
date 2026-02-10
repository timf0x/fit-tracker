import { View, Text, StyleSheet } from 'react-native';
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
import i18n from '@/lib/i18n';

interface DayContentCardProps {
  day: TimelineDay;
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

export function DayContentCard({ day, onPressSession, onStartSession }: DayContentCardProps) {
  const nudge = getTimelineNudge(day);

  // ─── Past trained day ───
  if ((day.isPast || day.isToday) && day.sessions.length > 0) {
    const session = day.sessions[0];
    return (
      <PressableScale
        style={styles.card}
        onPress={() => onPressSession?.(session.id)}
      >
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

        {/* Muscle dots */}
        {day.musclesTrained.length > 0 && (
          <View style={styles.muscleDots}>
            {day.musclesTrained.slice(0, 6).map((m) => (
              <View key={m} style={styles.muscleDot} />
            ))}
            {day.musclesTrained.length > 6 && (
              <Text style={styles.muscleMore}>+{day.musclesTrained.length - 6}</Text>
            )}
          </View>
        )}
      </PressableScale>
    );
  }

  // ─── Today with scheduled workout ───
  if (day.isToday && day.programDay) {
    const label = resolveDayLabel(day.programDay);

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

        {onStartSession && (
          <PressableScale style={styles.startButton} onPress={onStartSession} activeScale={0.97}>
            <Text style={styles.startButtonText}>{i18n.t('calendar.startSession')}</Text>
          </PressableScale>
        )}
      </View>
    );
  }

  // ─── Future scheduled day ───
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

  // ─── Rest / empty day ───
  return (
    <View style={styles.cardRest}>
      <Moon size={14} color="rgba(255,255,255,0.15)" strokeWidth={2} />
      <Text style={styles.restText}>
        {day.scheduledDay ? i18n.t('calendar.restDay') : i18n.t('calendar.nothingPlanned')}
      </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
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

  muscleDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 48,
  },
  muscleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,107,53,0.4)',
  },
  muscleMore: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginLeft: 2,
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
    paddingLeft: 48,
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
});
