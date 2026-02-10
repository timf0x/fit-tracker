import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProgramStore } from '@/stores/programStore';
import { AmbientBackground } from '@/components/home/AmbientBackground';
import { WeekStrip } from '@/components/calendar/WeekStrip';
import { DayContentCard } from '@/components/calendar/DayContentCard';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import {
  buildWeekTimeline,
  buildMonthSummary,
  TimelineDay,
} from '@/lib/timelineEngine';
import { getWeekBounds } from '@/lib/weeklyVolume';

type ViewMode = 'week' | 'month';

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekLabel(weekOffset: number): string {
  const { start } = getWeekBounds(weekOffset);
  const day = start.getDate();
  const locale = i18n.locale === 'fr' ? 'fr-FR' : 'en-US';
  const month = start.toLocaleDateString(locale, { month: 'long' });
  return i18n.t('calendar.weekOf', { date: `${day} ${month}` });
}

function getMonthLabel(year: number, month: number): string {
  const locale = i18n.locale === 'fr' ? 'fr-FR' : 'en-US';
  const d = new Date(year, month, 1);
  const monthName = d.toLocaleDateString(locale, { month: 'long' });
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const history = useWorkoutStore((s) => s.history);
  const { program, activeState } = useProgramStore();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));

  // Month navigation
  const now = new Date();
  const [monthYear, setMonthYear] = useState(now.getFullYear());
  const [monthMonth, setMonthMonth] = useState(now.getMonth());

  const schedule = activeState?.schedule || null;

  // Build week timeline
  const weekDays = useMemo(
    () => buildWeekTimeline(history, schedule, program || null, weekOffset),
    [history, schedule, program, weekOffset],
  );

  // Build month summary
  const monthData = useMemo(
    () => buildMonthSummary(history, schedule, monthYear, monthMonth),
    [history, schedule, monthYear, monthMonth],
  );

  // Get selected day data
  const selectedDay = useMemo(
    () => weekDays.find((d) => d.date === selectedDate) || null,
    [weekDays, selectedDate],
  );

  // Month stats
  const monthStats = useMemo(() => {
    let sessions = 0;
    let totalVolume = 0;
    for (const s of history) {
      if (!s.endTime) continue;
      const d = new Date(s.startTime);
      if (d.getFullYear() === monthYear && d.getMonth() === monthMonth) {
        sessions++;
        for (const ex of s.completedExercises) {
          for (const set of ex.sets) {
            if (set.completed) totalVolume += (set.weight || 0) * set.reps;
          }
        }
      }
    }
    return { sessions, totalVolume: Math.round(totalVolume) };
  }, [history, monthYear, monthMonth]);

  const handleWeekNav = useCallback((direction: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeekOffset((prev) => prev + direction);
  }, []);

  const handleMonthNav = useCallback((direction: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMonthMonth((prev) => {
      const newMonth = prev + direction;
      if (newMonth < 0) {
        setMonthYear((y) => y - 1);
        return 11;
      }
      if (newMonth > 11) {
        setMonthYear((y) => y + 1);
        return 0;
      }
      return newMonth;
    });
  }, []);

  const handleMonthDateSelect = useCallback((date: string) => {
    // Switch to week view showing the selected date's week
    const selectedD = new Date(date.split('-').map(Number).join('/'));
    const [y, m, d] = date.split('-').map(Number);
    const selected = new Date(y, m - 1, d);
    const today = new Date();
    const diffMs = selected.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const newWeekOffset = Math.floor(diffDays / 7);

    setWeekOffset(newWeekOffset);
    setSelectedDate(date);
    setViewMode('week');
  }, []);

  return (
    <View style={styles.screen}>
      <AmbientBackground />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#fff" strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>{i18n.t('calendar.title')}</Text>
          <View style={styles.viewToggle}>
            <Pressable
              style={[styles.viewTab, viewMode === 'week' && styles.viewTabActive]}
              onPress={() => setViewMode('week')}
            >
              <Text style={[styles.viewTabText, viewMode === 'week' && styles.viewTabTextActive]}>
                {i18n.t('calendar.weekView')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.viewTab, viewMode === 'month' && styles.viewTabActive]}
              onPress={() => setViewMode('month')}
            >
              <Text style={[styles.viewTabText, viewMode === 'month' && styles.viewTabTextActive]}>
                {i18n.t('calendar.monthView')}
              </Text>
            </Pressable>
          </View>
        </View>

        {viewMode === 'week' ? (
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Week navigation */}
            <View style={styles.weekNav}>
              <Pressable onPress={() => handleWeekNav(-1)} hitSlop={12}>
                <ChevronLeft size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>
              <Text style={styles.weekLabel}>{getWeekLabel(weekOffset)}</Text>
              <Pressable onPress={() => handleWeekNav(1)} hitSlop={12}>
                <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>

            {/* Week strip */}
            <WeekStrip
              days={weekDays}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedDate(date);
              }}
            />

            {/* Day content */}
            <View style={styles.dayContent}>
              {selectedDay ? (
                <DayContentCard day={selectedDay} />
              ) : (
                <Text style={styles.emptyText}>{i18n.t('calendar.nothingPlanned')}</Text>
              )}
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Month navigation */}
            <View style={styles.weekNav}>
              <Pressable onPress={() => handleMonthNav(-1)} hitSlop={12}>
                <ChevronLeft size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>
              <Text style={styles.weekLabel}>{getMonthLabel(monthYear, monthMonth)}</Text>
              <Pressable onPress={() => handleMonthNav(1)} hitSlop={12}>
                <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>

            {/* Month grid */}
            <MonthGrid
              year={monthYear}
              month={monthMonth}
              monthData={monthData}
              onSelectDate={handleMonthDateSelect}
            />

            {/* Month summary stats */}
            <View style={styles.monthStats}>
              <View style={styles.monthStat}>
                <Text style={styles.monthStatValue}>{monthStats.sessions}</Text>
                <Text style={styles.monthStatLabel}>
                  {i18n.t('calendar.monthSessions', { count: monthStats.sessions })}
                </Text>
              </View>
              {monthStats.totalVolume > 0 && (
                <>
                  <View style={styles.monthStatDivider} />
                  <View style={styles.monthStat}>
                    <Text style={styles.monthStatValue}>
                      {monthStats.totalVolume >= 1000
                        ? `${(monthStats.totalVolume / 1000).toFixed(1)}t`
                        : `${monthStats.totalVolume}kg`}
                    </Text>
                    <Text style={styles.monthStatLabel}>{i18n.t('common.kgUnit')}</Text>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0C0C0C',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'rgba(200,200,210,1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
    flex: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  viewTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewTabActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  viewTabText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  viewTabTextActive: {
    color: '#FFFFFF',
  },

  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 100,
    gap: 8,
  },

  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  weekLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  dayContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 40,
  },

  monthStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    gap: 24,
  },
  monthStat: {
    alignItems: 'center',
    gap: 2,
  },
  monthStatValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  monthStatLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  monthStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
