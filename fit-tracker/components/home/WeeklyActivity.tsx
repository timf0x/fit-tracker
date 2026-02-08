import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { useRouter } from 'expo-router';
import { Calendar, Flame, ChevronRight, Zap } from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getWeekSummary, getWeekPRs } from '@/lib/statsHelpers';
import { mockWeekly } from '@/lib/mock-data';
import i18n from '@/lib/i18n';
import fr from '@/lib/translations/fr';

const DAYS = fr.home.weekly.days;

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg}kg`;
}


export function WeeklyActivity() {
  const router = useRouter();
  const { history, stats } = useWorkoutStore();

  const weekSummary = useMemo(
    () => getWeekSummary(history, 0),
    [history]
  );

  const weekPRs = useMemo(
    () => getWeekPRs(history, 0),
    [history]
  );

  const hasRealData = history.filter((s) => s.endTime).length > 0;

  const completedDays = hasRealData
    ? weekSummary.completedDays
    : mockWeekly.completedDays;
  const currentDayIndex = weekSummary.currentDayIndex;
  const streak = hasRealData ? stats.currentStreak : mockWeekly.streak;

  return (
    <PressableScale style={styles.container} onPress={() => router.push('/stats')}>
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
          <ChevronRight size={16} color="rgba(120,120,130,1)" strokeWidth={2} />
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
                    isToday && styles.dayLabelToday,
                  ]}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Stats Chips Row */}
        <View style={styles.chipsRow}>
          {hasRealData && (
            <>
              <View style={styles.chip}>
                <Text style={styles.chipValue}>{weekSummary.sessions}</Text>
                <Text style={styles.chipLabel}> séances</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipValue}>
                  {formatVolume(weekSummary.totalVolumeKg)}
                </Text>
              </View>
              {weekPRs.total > 0 && (
                <View style={[styles.chip, styles.chipPR]}>
                  <Text style={styles.chipValuePR}>{weekPRs.total} PR</Text>
                  <Zap size={10} color="#FF6B35" strokeWidth={2.5} />
                </View>
              )}
            </>
          )}
          {streak > 0 && (
            <View style={[styles.chip, styles.chipStreak]}>
              <Flame size={10} color="#f97316" strokeWidth={2.5} />
              <Text style={styles.chipValueStreak}>
                {streak} {i18n.t('home.weekly.streak')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </PressableScale>
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
    borderColor: '#f97316',
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

  // Stats Chips
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipPR: {
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
  chipValue: {
    color: '#fff',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  chipLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  chipValuePR: {
    color: '#FF6B35',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginRight: 3,
  },
  chipStreak: {
    backgroundColor: 'rgba(249,115,22,0.10)',
    gap: 4,
  },
  chipValueStreak: {
    color: '#f97316',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
});
