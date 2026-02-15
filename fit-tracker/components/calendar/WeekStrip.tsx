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
        const dateNum = parseInt(day.date.split('-')[2], 10);

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
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    paddingVertical: 6,
  },
  dayLabel: {
    color: 'rgba(120,120,130,1)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  dayLabelToday: {
    color: Colors.primary,
  },
  dateCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleSelected: {
    backgroundColor: Colors.primary,
  },
  dateCircleToday: {
    borderWidth: 2.5,
    borderColor: Colors.primary,
  },
  dateNum: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 20,
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
});
