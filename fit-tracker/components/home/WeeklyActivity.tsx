import { View, Text, StyleSheet } from 'react-native';
import { Calendar, Flame } from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { mockWeekly } from '@/lib/mock-data';
import i18n from '@/lib/i18n';
import fr from '@/lib/translations/fr';

const DAYS = fr.home.weekly.days;

export function WeeklyActivity() {
  const { completedDays, currentDayIndex, streak } = mockWeekly;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.calendarIconBox}>
              <Calendar size={15} color="#4ade80" strokeWidth={2} />
            </View>
            <Text style={styles.headerLabel}>
              {i18n.t('home.weekly.title')}
            </Text>
          </View>
          <View style={styles.streakBadge}>
            <Flame size={12} color="#f97316" strokeWidth={2.5} />
            <Text style={styles.streakText}>
              {streak} {i18n.t('home.weekly.streak')}
            </Text>
          </View>
        </View>

        {/* Day circles + labels below */}
        <View style={styles.daysRow}>
          {DAYS.map((day, index) => {
            const isCompleted = completedDays[index];
            const isToday = index === currentDayIndex;

            return (
              <View key={index} style={styles.dayColumn}>
                <View
                  style={[
                    styles.dayCircle,
                    isCompleted && styles.dayCompleted,
                    isToday && !isCompleted && styles.dayToday,
                  ]}
                />
                <Text
                  style={[
                    styles.dayLabel,
                    isCompleted && styles.dayLabelActive,
                    isToday && !isCompleted && styles.dayLabelToday,
                  ]}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 20,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLabel: {
    color: 'rgba(200,200,210,1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  streakText: {
    color: 'rgba(180,180,190,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 8,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  dayCompleted: {
    backgroundColor: '#f97316',
    borderWidth: 0,
  },
  dayToday: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.5)',
  },
  dayLabel: {
    color: 'rgba(120,120,130,1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  dayLabelActive: {
    color: 'rgba(200,200,210,1)',
  },
  dayLabelToday: {
    color: '#f97316',
  },
});
