import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { MUSCLE_TO_BODYPART } from '@/lib/muscleMapping';
import { BODY_ICONS, DEFAULT_BODY_ICON } from '@/components/home/ActiveProgramCard';
import { resolveDayLabel } from '@/lib/programLabels';
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
 * Status dot (●/○/✓) + title + duration + body part icons + series.
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

  const bodyIcons = useMemo(() => {
    const seen = new Set<string>();
    return day.muscleTargets
      .map((m) => MUSCLE_TO_BODYPART[m])
      .filter((bp): bp is string => !!bp && !seen.has(bp) && (seen.add(bp), true))
      .map((bp) => ({ key: bp, ...(BODY_ICONS[bp] || DEFAULT_BODY_ICON) }));
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
            {resolveDayLabel(day)}
          </Text>
          <Text style={styles.duration}>~{duration} {i18n.t('common.minAbbr')}</Text>
        </View>
        <View style={styles.iconRow}>
          <View style={styles.iconGroup}>
            {bodyIcons.map((icon) => (
              <View key={icon.key} style={[styles.iconBox, { backgroundColor: icon.bg }]}>
                <icon.Icon size={11} color={icon.color} strokeWidth={2.5} />
              </View>
            ))}
          </View>
          <Text style={styles.setsText}>
            {totalSets} {i18n.t('common.sets')}
          </Text>
        </View>
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
    gap: 5,
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
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setsText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
