import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { TimelineDay } from '@/lib/timelineEngine';
import i18n from '@/lib/i18n';

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

            {/* Trained dot */}
            <View style={styles.dotSlot}>
              {hasSessions ? (
                <View style={styles.trainedDot} />
              ) : isScheduledFuture ? (
                <View style={styles.scheduledDot} />
              ) : null}
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
  dotSlot: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  scheduledDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.35)',
  },
});
