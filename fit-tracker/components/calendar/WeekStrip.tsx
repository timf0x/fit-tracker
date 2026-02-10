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

        return (
          <Pressable
            key={day.date}
            style={styles.dayColumn}
            onPress={() => onSelectDate(day.date)}
          >
            <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
              {dayLabels[day.dayOfWeek]}
            </Text>
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
                  day.isToday && styles.dateNumToday,
                ]}
              >
                {dateNum}
              </Text>
            </View>
            {/* Status dot */}
            <View style={styles.dotWrap}>
              {hasSessions ? (
                <View style={styles.dotTrained} />
              ) : isScheduled ? (
                <View style={styles.dotScheduled} />
              ) : (
                <View style={styles.dotEmpty} />
              )}
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
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
    color: 'rgba(255,255,255,0.6)',
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
  dotWrap: {
    height: 6,
    justifyContent: 'center',
  },
  dotTrained: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  dotScheduled: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  dotEmpty: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
});
