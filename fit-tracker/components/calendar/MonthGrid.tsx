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

/** Map totalSets → heatmap background opacity */
function getHeatmapBg(totalSets: number, type: MonthDayData['type']): string {
  if (type === 'scheduled') return 'rgba(255,107,53,0.08)';
  if (totalSets === 0) return 'transparent';
  if (totalSets <= 8) return 'rgba(255,107,53,0.12)';
  if (totalSets <= 16) return 'rgba(255,107,53,0.25)';
  if (totalSets <= 24) return 'rgba(255,107,53,0.45)';
  return 'rgba(255,107,53,0.65)';
}

export function MonthGrid({ year, month, monthData, onSelectDate }: MonthGridProps) {
  const dayLabels = i18n.t('scheduling.dayLabels') as unknown as string[];

  // Build the grid: first day of month's weekday (Mon=0)
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid cells
  const cells: (MonthDayData | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 0; d < daysInMonth; d++) {
    cells.push(monthData[d] || null);
  }
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

      {/* Grid rows — no gap, cells use flex:1 for even spacing */}
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.gridRow}>
          {row.map((cell, colIdx) => {
            if (!cell) {
              return <View key={colIdx} style={styles.dayCell} />;
            }

            const dateNum = parseInt(cell.date.split('-')[2], 10);
            const isToday = cell.type === 'today';
            const isTrained = cell.type === 'trained';
            const isScheduled = cell.type === 'scheduled';
            const heatBg = getHeatmapBg(cell.totalSets, cell.type);

            return (
              <Pressable
                key={colIdx}
                style={styles.dayCell}
                onPress={() => onSelectDate(cell.date)}
              >
                <View
                  style={[
                    styles.circle,
                    { backgroundColor: heatBg },
                    isToday && styles.circleToday,
                    isScheduled && styles.circleScheduled,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateText,
                      isToday && styles.dateTextToday,
                      isTrained && styles.dateTextTrained,
                      cell.totalSets > 16 && styles.dateTextHot,
                    ]}
                  >
                    {dateNum}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const CIRCLE_SIZE = 34;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 6,
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
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleToday: {
    borderWidth: 2,
    borderColor: '#4ADE80',
  },
  circleScheduled: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,107,53,0.25)',
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
  dateTextHot: {
    color: '#FFFFFF',
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
});
