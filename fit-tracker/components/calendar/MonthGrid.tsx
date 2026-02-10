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

      {/* Grid rows */}
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.gridRow}>
          {row.map((cell, colIdx) => {
            if (!cell) {
              return <View key={colIdx} style={styles.gridCellOuter} />;
            }

            const dateNum = parseInt(cell.date.split('-')[2], 10);
            const isToday = cell.type === 'today';
            const isTrained = cell.type === 'trained';
            const isScheduled = cell.type === 'scheduled';
            const heatBg = getHeatmapBg(cell.totalSets, cell.type);

            return (
              <Pressable
                key={colIdx}
                style={styles.gridCellOuter}
                onPress={() => onSelectDate(cell.date)}
              >
                <View
                  style={[
                    styles.gridCell,
                    { backgroundColor: heatBg },
                    isToday && styles.gridCellToday,
                    isScheduled && styles.gridCellScheduled,
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
                  {/* Small dot below number for trained days */}
                  {isTrained && <View style={styles.dot} />}
                  {isScheduled && <View style={styles.dotHollow} />}
                  {isToday && !isTrained && <View style={styles.dotToday} />}
                </View>
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
    paddingHorizontal: 16,
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
    gap: 3,
  },
  gridCellOuter: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  gridCell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  gridCellToday: {
    borderWidth: 1.5,
    borderColor: '#4ADE80',
  },
  gridCellScheduled: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,107,53,0.25)',
  },
  dateText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
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
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  dotHollow: {
    width: 4,
    height: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  dotToday: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4ADE80',
  },
});
