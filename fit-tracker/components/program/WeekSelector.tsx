import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

interface WeekSelectorProps {
  totalWeeks: number;
  currentWeek: number;
  selectedWeek: number;
  onSelect: (week: number) => void;
  deloadWeek?: number; // week number that's deload
}

export function WeekSelector({
  totalWeeks,
  currentWeek,
  selectedWeek,
  onSelect,
  deloadWeek,
}: WeekSelectorProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to selected week
    const offset = (selectedWeek - 1) * 68;
    scrollRef.current?.scrollTo({ x: Math.max(0, offset - 100), animated: true });
  }, [selectedWeek]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      {Array.from({ length: totalWeeks }).map((_, i) => {
        const week = i + 1;
        const isSelected = week === selectedWeek;
        const isCurrent = week === currentWeek;
        const isDeload = week === deloadWeek;

        return (
          <Pressable
            key={week}
            style={[
              styles.pill,
              isSelected && styles.pillSelected,
              isDeload && !isSelected && styles.pillDeload,
            ]}
            onPress={() => onSelect(week)}
          >
            <Text
              style={[
                styles.pillText,
                isSelected && styles.pillTextSelected,
                isDeload && !isSelected && styles.pillTextDeload,
              ]}
            >
              S{week}
            </Text>
            {isDeload && (
              <Text
                style={[
                  styles.pillSub,
                  isSelected && styles.pillSubSelected,
                ]}
              >
                Deload
              </Text>
            )}
            {isCurrent && !isSelected && (
              <View style={styles.currentDot} />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  pill: {
    minWidth: 56,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillDeload: {
    borderColor: 'rgba(59,130,246,0.3)',
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  pillText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: '#0C0C0C',
  },
  pillTextDeload: {
    color: 'rgba(59,130,246,0.8)',
  },
  pillSub: {
    color: 'rgba(59,130,246,0.6)',
    fontSize: 9,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  pillSubSelected: {
    color: 'rgba(12,12,12,0.6)',
  },
  currentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
});
