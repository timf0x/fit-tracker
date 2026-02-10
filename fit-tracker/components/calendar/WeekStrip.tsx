import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { TimelineDay } from '@/lib/timelineEngine';
import { MUSCLE_TO_BODYPART } from '@/lib/muscleMapping';
import i18n from '@/lib/i18n';

const BODYPART_DOT_COLORS: Record<string, string> = {
  chest: '#FF6B35',
  back: '#3B82F6',
  'upper legs': '#4ADE80',
  'lower legs': '#4ADE80',
  'upper arms': '#A78BFA',
  'lower arms': '#A78BFA',
  shoulders: '#FBBF24',
  waist: '#6B7280',
  cardio: '#EF4444',
  neck: '#9CA3AF',
};

interface WeekStripProps {
  days: TimelineDay[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

/** Map totalSets → intensity color for the bar */
function getIntensityColor(totalSets: number): string {
  if (totalSets === 0) return 'transparent';
  if (totalSets <= 8) return '#6B7280';        // low — gray
  if (totalSets <= 16) return '#3B82F6';       // med — blue
  if (totalSets <= 24) return '#4ADE80';       // high — green
  return '#FBBF24';                             // very high — amber
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

        // Intensity bar
        const intensityColor = getIntensityColor(day.totalSets);
        const hasBar = day.totalSets > 0;

        // Muscle dots (up to 3, colored by body part)
        const muscleDots = day.musclesTrained.slice(0, 3).map((m) => {
          const bp = MUSCLE_TO_BODYPART[m] || 'chest';
          return BODYPART_DOT_COLORS[bp] || 'rgba(255,255,255,0.25)';
        });

        // Scheduled future day: show planned muscle targets as dim dots
        const isScheduledFuture = !day.isPast && !day.isToday && isScheduled && day.programDay;
        const scheduledDots = isScheduledFuture
          ? (day.programDay!.muscleTargets || []).slice(0, 3).map((target) => {
              const bp = MUSCLE_TO_BODYPART[target] || 'chest';
              return BODYPART_DOT_COLORS[bp] || 'rgba(255,255,255,0.15)';
            })
          : [];

        const dotsToShow = muscleDots.length > 0 ? muscleDots : scheduledDots;

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
              {hasBar ? (
                <View style={[styles.bar, { backgroundColor: intensityColor }]} />
              ) : isScheduledFuture ? (
                <View style={styles.barDashed} />
              ) : null}
            </View>

            {/* Muscle dots */}
            <View style={styles.dotsRow}>
              {dotsToShow.map((color, i) => (
                <View
                  key={i}
                  style={[
                    styles.muscleDot,
                    {
                      backgroundColor: muscleDots.length > 0 ? color : `${color}40`,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 15,
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
    color: 'rgba(255,255,255,0.35)',
  },
  barSlot: {
    height: 4,
    width: '60%',
    justifyContent: 'center',
  },
  bar: {
    height: 4,
    borderRadius: 2,
  },
  barDashed: {
    height: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
    alignItems: 'center',
  },
  muscleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
