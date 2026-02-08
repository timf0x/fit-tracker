import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Check, Clock, ChevronRight } from 'lucide-react-native';
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

export const FOCUS_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  push: { bg: 'rgba(255,107,53,0.12)', text: '#FF6B35', accent: 'rgba(255,107,53,0.5)' },
  pull: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6', accent: 'rgba(59,130,246,0.5)' },
  legs: { bg: 'rgba(74,222,128,0.12)', text: '#4ADE80', accent: 'rgba(74,222,128,0.5)' },
  upper: { bg: 'rgba(255,107,53,0.12)', text: '#FF6B35', accent: 'rgba(255,107,53,0.5)' },
  lower: { bg: 'rgba(74,222,128,0.12)', text: '#4ADE80', accent: 'rgba(74,222,128,0.5)' },
  full_body: { bg: 'rgba(168,85,247,0.12)', text: '#A855F7', accent: 'rgba(168,85,247,0.5)' },
};

const DEFAULT_FOCUS = { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.6)', accent: 'rgba(255,255,255,0.15)' };

export function DayCard({ day, dayNumber, isToday, isCompleted, onPress }: DayCardProps) {
  const duration = useMemo(() => estimateDuration(day), [day]);
  const totalSets = useMemo(
    () => day.exercises.reduce((sum, e) => sum + e.sets, 0),
    [day.exercises]
  );

  // Comma-separated muscle labels instead of pills
  const muscleText = useMemo(() => {
    const labels = day.muscleTargets.slice(0, 4).map((m) => MUSCLE_LABELS_FR[m] || m);
    let text = labels.join(', ');
    if (day.muscleTargets.length > 4) text += ` +${day.muscleTargets.length - 4}`;
    return text;
  }, [day.muscleTargets]);

  const focusStyle = FOCUS_COLORS[day.focus] || DEFAULT_FOCUS;

  return (
    <Pressable
      style={[
        styles.card,
        isToday && styles.cardToday,
        isCompleted && styles.cardCompleted,
      ]}
      onPress={onPress}
    >
      {/* Accent bar */}
      {isCompleted ? (
        <View style={styles.completedBar} />
      ) : (
        <View style={[styles.accentBar, { backgroundColor: focusStyle.accent }]} />
      )}

      <View style={styles.cardInner}>
        {/* Top row: day circle + label + focus tag + duration + chevron */}
        <View style={styles.topRow}>
          <View style={[
            styles.dayCircle,
            isCompleted && styles.dayCircleCompleted,
            isToday && !isCompleted && styles.dayCircleToday,
          ]}>
            {isCompleted ? (
              <Check size={12} color={Colors.success} strokeWidth={3} />
            ) : (
              <Text style={[
                styles.dayCircleText,
                isToday && styles.dayCircleTextToday,
              ]}>
                J{dayNumber}
              </Text>
            )}
          </View>
          <Text style={styles.label}>{day.labelFr}</Text>
          <View style={[styles.focusTag, { backgroundColor: focusStyle.bg }]}>
            <Text style={[styles.focusText, { color: focusStyle.text }]}>
              {day.focus}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          {isToday && !isCompleted && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayText}>Aujourd'hui</Text>
            </View>
          )}
          <ChevronRight size={16} color="rgba(100,100,110,1)" strokeWidth={2} />
        </View>

        {/* Bottom row: muscles + sets + duration */}
        <View style={styles.bottomRow}>
          <Text style={styles.muscleText} numberOfLines={1}>{muscleText}</Text>
          <View style={styles.bottomMeta}>
            <Text style={styles.metaText}>{totalSets} series</Text>
            <View style={styles.metaDot} />
            <Clock size={10} color="rgba(255,255,255,0.3)" />
            <Text style={styles.metaText}>~{duration} min</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardToday: {
    borderColor: 'rgba(255,107,53,0.3)',
    backgroundColor: 'rgba(255,107,53,0.04)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardCompleted: {
    borderColor: 'rgba(74,222,128,0.15)',
    backgroundColor: 'rgba(74,222,128,0.03)',
  },
  accentBar: {
    width: 3,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  completedBar: {
    width: 3,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: 'rgba(74,222,128,0.5)',
  },
  cardInner: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,53,0.3)',
  },
  dayCircleCompleted: {
    backgroundColor: 'rgba(74,222,128,0.12)',
  },
  dayCircleText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  dayCircleTextToday: {
    color: Colors.primary,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  focusTag: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  focusText: {
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  todayBadge: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  todayText: {
    color: Colors.primary,
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 36, // align with text after dayCircle
    gap: 8,
  },
  muscleText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },
  bottomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
