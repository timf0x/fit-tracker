import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { TimelineDay } from '@/lib/timelineEngine';
import { MUSCLE_TO_BODYPART } from '@/lib/muscleMapping';
import i18n from '@/lib/i18n';

/** Body-part → dot color for week strip muscle indicators */
const BODYPART_DOT_COLORS: Record<string, string> = {
  chest: '#FF6B35',
  back: '#3B82F6',
  shoulders: '#A78BFA',
  'upper arms': '#F59E0B',
  'lower arms': '#F59E0B',
  'upper legs': '#4ADE80',
  'lower legs': '#4ADE80',
  waist: '#6B7280',
};

function getDotColor(muscle: string): string {
  const bp = MUSCLE_TO_BODYPART[muscle];
  return BODYPART_DOT_COLORS[bp] || 'rgba(255,255,255,0.25)';
}

/** Map total sets to intensity bar color */
function getIntensityColor(totalSets: number): string {
  if (totalSets === 0) return 'transparent';
  if (totalSets <= 8) return 'rgba(255,255,255,0.15)';
  if (totalSets <= 16) return '#3B82F6';
  if (totalSets <= 24) return '#4ADE80';
  return '#FBBF24';
}

interface WeekStripProps {
  days: TimelineDay[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function WeekStrip({ days, selectedDate, onSelectDate }: WeekStripProps) {
  const dayLabels = i18n.t('scheduling.dayLabels') as unknown as string[];

  return (
    <View style={styles.container}>
      {days.map((day) => {
        const isSelected = day.date === selectedDate;
        const hasSessions = day.sessions.length > 0;
        const isScheduled = !!day.scheduledDay && !day.scheduledDay.completedDate;
        const dateNum = parseInt(day.date.split('-')[2], 10);
        const isScheduledFuture = !day.isPast && !day.isToday && isScheduled && day.programDay;
        const isSkipped = !!day.isSkipped;

        // Muscle dots (up to 3 unique body-part colors)
        const dotColors: string[] = [];
        if (hasSessions && day.musclesTrained.length > 0) {
          const seen = new Set<string>();
          for (const m of day.musclesTrained) {
            const color = getDotColor(m);
            if (!seen.has(color)) {
              seen.add(color);
              dotColors.push(color);
              if (dotColors.length >= 3) break;
            }
          }
        } else if (isScheduledFuture && day.programDay) {
          // Show dim dots for scheduled muscles (from muscleTargets)
          const seen = new Set<string>();
          for (const muscle of day.programDay.muscleTargets || []) {
            const color = getDotColor(muscle);
            if (!seen.has(color)) {
              seen.add(color);
              dotColors.push(color);
              if (dotColors.length >= 3) break;
            }
          }
        }

        const intensityColor = hasSessions
          ? getIntensityColor(day.totalSets)
          : 'transparent';

        return (
          <Pressable
            key={day.date}
            style={styles.dayColumn}
            onPress={() => onSelectDate(day.date)}
          >
            {/* Day label */}
            <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
              {dayLabels[day.dayOfWeek]}
            </Text>

            {/* Date circle */}
            <View
              style={[
                styles.dateCircle,
                isSelected && styles.dateCircleSelected,
                day.isToday && !isSelected && styles.dateCircleToday,
              ]}
            >
              <Text
                style={[
                  styles.dateNum,
                  isSelected && styles.dateNumSelected,
                  day.isToday && !isSelected && styles.dateNumToday,
                  !hasSessions && !day.isToday && !isSelected && styles.dateNumDim,
                ]}
              >
                {dateNum}
              </Text>
            </View>

            {/* Intensity bar */}
            <View style={styles.barSlot}>
              {hasSessions ? (
                <View style={[styles.intensityBar, { backgroundColor: intensityColor }]} />
              ) : isScheduledFuture ? (
                <View style={styles.scheduledBar} />
              ) : isSkipped ? (
                <View style={styles.skippedBar} />
              ) : null}
            </View>

            {/* Muscle dots */}
            <View style={styles.dotRow}>
              {dotColors.map((color, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.muscleDot,
                    {
                      backgroundColor: hasSessions ? color : 'transparent',
                      borderColor: color,
                      borderWidth: hasSessions ? 0 : 1,
                      opacity: hasSessions ? 1 : 0.35,
                    },
                  ]}
                />
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    paddingVertical: 4,
  },
  dayLabel: {
    color: 'rgba(120,120,130,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  dayLabelToday: {
    color: Colors.primary,
  },
  dateCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleSelected: {
    backgroundColor: Colors.primary,
  },
  dateCircleToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dateNum: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  dateNumSelected: {
    color: '#0C0C0C',
  },
  dateNumToday: {
    color: Colors.primary,
  },
  dateNumDim: {
    color: 'rgba(255,255,255,0.3)',
  },

  // Intensity bar
  barSlot: {
    height: 4,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
  },
  scheduledBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,107,53,0.25)',
  },
  skippedBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Muscle dots
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 8,
  },
  muscleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
