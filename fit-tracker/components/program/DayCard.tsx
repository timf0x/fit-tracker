import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Check, Dumbbell, Clock, ChevronRight } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import { MUSCLE_LABELS_FR } from '@/lib/muscleMapping';
import { ProgramDay } from '@/types/program';
import { estimateDuration } from '@/lib/programGenerator';

interface DayCardProps {
  day: ProgramDay;
  isToday: boolean;
  isCompleted: boolean;
  onPress: () => void;
}

const FOCUS_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  push: { bg: 'rgba(255,107,53,0.12)', text: '#FF6B35', accent: 'rgba(255,107,53,0.5)' },
  pull: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6', accent: 'rgba(59,130,246,0.5)' },
  legs: { bg: 'rgba(74,222,128,0.12)', text: '#4ADE80', accent: 'rgba(74,222,128,0.5)' },
  upper: { bg: 'rgba(255,107,53,0.12)', text: '#FF6B35', accent: 'rgba(255,107,53,0.5)' },
  lower: { bg: 'rgba(74,222,128,0.12)', text: '#4ADE80', accent: 'rgba(74,222,128,0.5)' },
  full_body: { bg: 'rgba(168,85,247,0.12)', text: '#A855F7', accent: 'rgba(168,85,247,0.5)' },
};

const DEFAULT_FOCUS = { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.6)', accent: 'rgba(255,255,255,0.15)' };

export function DayCard({ day, isToday, isCompleted, onPress }: DayCardProps) {
  const duration = useMemo(() => estimateDuration(day), [day]);
  const totalSets = useMemo(
    () => day.exercises.reduce((sum, e) => sum + e.sets, 0),
    [day.exercises]
  );
  const muscleLabels = useMemo(
    () => day.muscleTargets.slice(0, 4).map((m) => MUSCLE_LABELS_FR[m] || m),
    [day.muscleTargets]
  );

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
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: focusStyle.accent }]} />

      <View style={styles.cardInner}>
        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.label}>{day.labelFr}</Text>
            <View style={[styles.focusTag, { backgroundColor: focusStyle.bg }]}>
              <Text style={[styles.focusText, { color: focusStyle.text }]}>
                {day.focus}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {isCompleted && (
              <View style={styles.checkWrap}>
                <Check size={14} color={Colors.success} strokeWidth={3} />
              </View>
            )}
            {isToday && !isCompleted && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayText}>Aujourd'hui</Text>
              </View>
            )}
            <ChevronRight size={16} color="rgba(100,100,110,1)" strokeWidth={2} />
          </View>
        </View>

        {/* Muscle pills */}
        <View style={styles.muscleRow}>
          {muscleLabels.map((label) => (
            <View key={label} style={styles.musclePill}>
              <Text style={styles.musclePillText}>{label}</Text>
            </View>
          ))}
          {day.muscleTargets.length > 4 && (
            <Text style={styles.moreText}>+{day.muscleTargets.length - 4}</Text>
          )}
        </View>

        {/* Footer stats */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Dumbbell size={11} color="rgba(255,255,255,0.3)" />
            <Text style={styles.footerText}>
              {day.exercises.length} exercices
            </Text>
          </View>
          <View style={styles.footerDot} />
          <View style={styles.footerItem}>
            <Text style={styles.footerText}>{totalSets} series</Text>
          </View>
          <View style={styles.footerDot} />
          <View style={styles.footerItem}>
            <Clock size={11} color="rgba(255,255,255,0.3)" />
            <Text style={styles.footerText}>~{duration} min</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
    opacity: 0.55,
  },
  accentBar: {
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardInner: {
    flex: 1,
    padding: 14,
    paddingLeft: 13,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  focusTag: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  focusText: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(74,222,128,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBadge: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  todayText: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  musclePill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  musclePillText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  moreText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  footerText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
