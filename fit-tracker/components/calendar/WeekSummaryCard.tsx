import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import { getMuscleLabel } from '@/lib/muscleMapping';
import {
  RP_VOLUME_LANDMARKS,
  getVolumeZone,
  getZoneColor,
} from '@/constants/volumeLandmarks';
import i18n from '@/lib/i18n';

interface WeekSummaryCardProps {
  sessions: number;
  totalVolumeKg: number;
  prCount: number;
  totalMinutes: number;
  weeklyVolume: Record<string, number>;
  currentWeek?: number;
  totalWeeks?: number;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg}${i18n.t('common.kgUnit')}`;
}

export function WeekSummaryCard({
  sessions,
  totalVolumeKg,
  prCount,
  totalMinutes,
  weeklyVolume,
  currentWeek,
  totalWeeks,
}: WeekSummaryCardProps) {
  // Only show muscles with >0 sets, sorted descending
  const muscleEntries = Object.entries(weeklyVolume)
    .filter(([, sets]) => sets > 0)
    .sort((a, b) => b[1] - a[1]);

  const avgDuration = sessions > 0 ? Math.round(totalMinutes / sessions) : 0;

  return (
    <View style={styles.card}>
      {/* Header */}
      <Text style={styles.header}>{i18n.t('calendar.weekSummary')}</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{sessions}</Text>
          <Text style={styles.statLabel}>{i18n.t('calendar.sessions')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatVolume(totalVolumeKg)}</Text>
          <Text style={styles.statLabel}>{i18n.t('calendar.volume')}</Text>
        </View>
        {prCount > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <View style={styles.prStatRow}>
                <Text style={styles.statValue}>{prCount}</Text>
                <Zap size={12} color={Colors.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.statLabel}>{i18n.t('calendar.prs')}</Text>
            </View>
          </>
        )}
        {avgDuration > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{avgDuration}{i18n.t('common.minAbbr')}</Text>
              <Text style={styles.statLabel}>{i18n.t('calendar.avgDuration')}</Text>
            </View>
          </>
        )}
      </View>

      {/* Volume bars by muscle */}
      {muscleEntries.length > 0 && (
        <View style={styles.volumeSection}>
          <Text style={styles.sectionLabel}>{i18n.t('calendar.volumeByMuscle')}</Text>
          {muscleEntries.map(([muscle, sets]) => {
            const landmarks = RP_VOLUME_LANDMARKS[muscle];
            const zone = landmarks ? getVolumeZone(sets, landmarks) : 'below_mv';
            const zoneColor = getZoneColor(zone);
            const mrv = landmarks?.mrv || 20;
            const barPct = Math.min((sets / mrv) * 100, 100);

            return (
              <View key={muscle} style={styles.volumeRow}>
                <Text style={styles.muscleName} numberOfLines={1}>
                  {getMuscleLabel(muscle)}
                </Text>
                <View style={styles.volumeBarBg}>
                  <View
                    style={[
                      styles.volumeBarFill,
                      { width: `${barPct}%`, backgroundColor: zoneColor },
                    ]}
                  />
                </View>
                <Text style={[styles.volumeSets, { color: zoneColor }]}>{sets}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Mesocycle progress */}
      {currentWeek != null && totalWeeks != null && totalWeeks > 0 && (
        <View style={styles.mesocycleSection}>
          <Text style={styles.mesocycleLabel}>
            {i18n.t('calendar.mesocycleProgress')}
          </Text>
          <View style={styles.mesocycleRow}>
            <View style={styles.mesocycleBarBg}>
              <View
                style={[
                  styles.mesocycleBarFill,
                  { width: `${Math.min((currentWeek / totalWeeks) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.mesocycleText}>
              {i18n.t('calendar.weekProgress', { n: currentWeek, total: totalWeeks })}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    gap: 14,
  },
  header: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  prStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  // Volume bars
  volumeSection: {
    gap: 8,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muscleName: {
    width: 70,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  volumeBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  volumeBarFill: {
    height: 4,
    borderRadius: 2,
  },
  volumeSets: {
    width: 24,
    textAlign: 'right',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Mesocycle
  mesocycleSection: {
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  mesocycleLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  mesocycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mesocycleBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  mesocycleBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  mesocycleText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
