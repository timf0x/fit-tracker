import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { Colors, Fonts } from '@/constants/theme';
import { MUSCLE_LABELS_FR } from '@/lib/muscleMapping';
import { ProgramDay } from '@/types/program';
import { estimateDuration } from '@/lib/programGenerator';

interface DayCardProps {
  day: ProgramDay;
  dayNumber: number;
  isToday: boolean;
  isCompleted: boolean;
  onPress: () => void;
}

/**
 * Day row — minimal list item inside a single glass card.
 * Status dot (●/○/✓) + title + duration + muscle text + series.
 * No pills, no badges, no colored focus tags.
 */
export function DayCard({
  day,
  dayNumber,
  isToday,
  isCompleted,
  onPress,
}: DayCardProps) {
  const duration = useMemo(() => estimateDuration(day), [day]);
  const totalSets = useMemo(
    () => day.exercises.reduce((sum, e) => sum + e.sets, 0),
    [day.exercises],
  );

  const muscleText = useMemo(() => {
    const labels = day.muscleTargets
      .slice(0, 3)
      .map((m) => MUSCLE_LABELS_FR[m] || m);
    let text = labels.join(', ');
    if (day.muscleTargets.length > 3)
      text += ` +${day.muscleTargets.length - 3}`;
    return text;
  }, [day.muscleTargets]);

  return (
    <PressableScale
      style={[styles.row, isToday && styles.rowToday]}
      onPress={onPress}
    >
      {/* Today accent bar */}
      {isToday && !isCompleted && <View style={styles.todayAccent} />}

      {/* Status indicator */}
      <View style={styles.statusCol}>
        {isCompleted ? (
          <Check size={14} color={Colors.success} strokeWidth={2.5} />
        ) : (
          <View
            style={[
              styles.statusDot,
              isToday && styles.statusDotToday,
            ]}
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, isCompleted && styles.titleDone]}
            numberOfLines={1}
          >
            {day.labelFr}
          </Text>
          <Text style={styles.duration}>~{duration} min</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {muscleText} · {totalSets} séries
        </Text>
      </View>

      <ChevronRight size={14} color="rgba(100,100,110,1)" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 12,
    gap: 12,
    position: 'relative',
  },
  rowToday: {
    backgroundColor: 'rgba(255,107,53,0.03)',
  },
  todayAccent: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },

  // Status indicator
  statusCol: {
    width: 20,
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statusDotToday: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255,107,53,0.3)',
  },

  // Content
  content: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    flex: 1,
  },
  titleDone: {
    color: 'rgba(255,255,255,0.35)',
  },
  duration: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginLeft: 8,
  },
  meta: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
