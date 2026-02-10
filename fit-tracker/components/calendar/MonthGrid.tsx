import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { MonthDayData } from '@/lib/timelineEngine';
import i18n from '@/lib/i18n';

interface MonthGridProps {
  year: number;
  month: number; // 0-indexed
  monthData: MonthDayData[];
  onSelectDate: (date: string) => void;
}

const DOT_COLORS: Record<MonthDayData['type'], string> = {
  trained: Colors.primary,
  scheduled: 'transparent',
  rest: 'transparent',
  today: '#4ADE80',
};

export function MonthGrid({ year, month, monthData, onSelectDate }: MonthGridProps) {
  const dayLabels = i18n.t('scheduling.dayLabels') as unknown as string[];

  // Build the grid: first day of month's weekday (Mon=0)
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid rows
  const cells: (MonthDayData | null)[] = [];
  // Padding for days before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  // Actual days
  for (let d = 0; d < daysInMonth; d++) {
    cells.push(monthData[d] || null);
  }
  // Pad to complete last row
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rows: (MonthDayData | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      {/* Day labels header */}
      <View style={styles.headerRow}>
        {dayLabels.map((label, i) => (
          <View key={i} style={styles.headerCell}>
            <Text style={styles.headerLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Grid rows */}
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.gridRow}>
          {row.map((cell, colIdx) => {
            if (!cell) {
              return <View key={colIdx} style={styles.gridCell} />;
            }

            const dateNum = parseInt(cell.date.split('-')[2], 10);
            const isToday = cell.type === 'today';
            const isTrained = cell.type === 'trained';
            const isScheduled = cell.type === 'scheduled';
            const hasContent = isTrained || isScheduled || isToday;

            return (
              <Pressable
                key={colIdx}
                style={styles.gridCell}
                onPress={() => hasContent ? onSelectDate(cell.date) : null}
              >
                <Text
                  style={[
                    styles.dateText,
                    isToday && styles.dateTextToday,
                    isTrained && styles.dateTextTrained,
                  ]}
                >
                  {dateNum}
                </Text>
                {/* Dot */}
                {isTrained && <View style={[styles.dot, { backgroundColor: Colors.primary }]} />}
                {isScheduled && <View style={[styles.dot, styles.dotHollow]} />}
                {isToday && !isTrained && <View style={[styles.dot, { backgroundColor: '#4ADE80' }]} />}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
  },
  headerLabel: {
    color: 'rgba(120,120,130,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 3,
  },
  dateText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  dateTextToday: {
    color: '#4ADE80',
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  dateTextTrained: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotHollow: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
});
