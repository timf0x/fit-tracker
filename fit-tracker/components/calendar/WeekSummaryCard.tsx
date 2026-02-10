import { View, Text, StyleSheet } from 'react-native';
import { Zap, Calendar } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import { getMuscleLabel, MUSCLE_TO_BODYPART } from '@/lib/muscleMapping';
import { BODY_ICONS } from '@/components/home/ActiveProgramCard';
import {
  RP_VOLUME_LANDMARKS,
  getVolumeZone,
  getZoneColor,
} from '@/constants/volumeLandmarks';
import { WeekSummary, WeekPRs } from '@/lib/statsHelpers';
import i18n from '@/lib/i18n';
import { formatWeight, getWeightUnitLabel } from '@/stores/settingsStore';

interface WeekSummaryCardProps {
  summary: WeekSummary;
  prs: WeekPRs;
  setsPerMuscle: Record<string, number>;
  currentWeek?: number;
  totalWeeks?: number;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${formatWeight(kg)}${getWeightUnitLabel()}`;
}

export function WeekSummaryCard({
  summary,
  prs,
  setsPerMuscle,
  currentWeek,
  totalWeeks,
}: WeekSummaryCardProps) {
  // Sort muscles by set count descending, filter out zero
  const sortedMuscles = Object.entries(setsPerMuscle)
    .filter(([_, sets]) => sets > 0)
    .sort((a, b) => b[1] - a[1]);

  if (summary.sessions === 0 && sortedMuscles.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.headerLabel}>{i18n.t('calendar.weekSummary')}</Text>
        <Text style={styles.emptyText}>{i18n.t('calendar.noTraining')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header stats */}
      <Text style={styles.headerLabel}>{i18n.t('calendar.weekSummary')}</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.sessions}</Text>
          <Text style={styles.statLabel}>{i18n.t('calendar.sessions')}</Text>
        </View>

        {summary.totalVolumeKg > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatVolume(summary.totalVolumeKg)}</Text>
              <Text style={styles.statLabel}>{i18n.t('calendar.volume')}</Text>
            </View>
          </>
        )}

        {prs.total > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <View style={styles.prStatRow}>
                <Zap size={12} color={Colors.primary} strokeWidth={2.5} />
                <Text style={[styles.statValue, { color: Colors.primary }]}>{prs.total}</Text>
              </View>
              <Text style={styles.statLabel}>{i18n.t('calendar.prs')}</Text>
            </View>
          </>
        )}

        {summary.totalMinutes > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {summary.totalMinutes}{i18n.t('common.minAbbr')}
              </Text>
              <Text style={styles.statLabel}>{i18n.t('calendar.avgDuration')}</Text>
            </View>
          </>
        )}
      </View>

      {/* Volume bars per muscle */}
      {sortedMuscles.length > 0 && (
        <View style={styles.volumeSection}>
          <Text style={styles.sectionLabel}>{i18n.t('calendar.volumeByMuscle')}</Text>
          {sortedMuscles.slice(0, 8).map(([muscle, sets]) => {
            const landmarks = RP_VOLUME_LANDMARKS[muscle];
            const zone = landmarks ? getVolumeZone(sets, landmarks) : 'below_mv';
            const zoneColor = getZoneColor(zone);
            const mrv = landmarks?.mrv || 20;
            const barPercent = Math.min(sets / mrv, 1);

            const bodyPart = MUSCLE_TO_BODYPART[muscle] || 'waist';
            const iconData = BODY_ICONS[bodyPart] || BODY_ICONS.waist;
            const Icon = iconData.Icon;

            return (
              <View key={muscle} style={styles.volumeRow}>
                <Icon size={12} color={zoneColor} strokeWidth={2.5} />
                <Text style={styles.volumeLabel} numberOfLines={1}>
                  {getMuscleLabel(muscle)}
                </Text>
                <View style={styles.volumeBarTrack}>
                  <View
                    style={[
                      styles.volumeBarFill,
                      { width: `${barPercent * 100}%`, backgroundColor: zoneColor },
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
        <View style={styles.mesoRow}>
          <Calendar size={12} color="rgba(255,255,255,0.3)" strokeWidth={2} />
          <Text style={styles.mesoLabel}>
            {i18n.t('calendar.mesocycleProgress')}
          </Text>
          <Text style={styles.mesoWeek}>
            {i18n.t('calendar.weekProgress', { n: currentWeek, total: totalWeeks })}
          </Text>
          <View style={styles.mesoBar}>
            {Array.from({ length: totalWeeks }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.mesoSegment,
                  i < currentWeek && styles.mesoSegmentFilled,
                ]}
              />
            ))}
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
  headerLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
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
    gap: 3,
  },

  // Volume section
  volumeSection: {
    gap: 8,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    width: 70,
  },
  volumeBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  volumeBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  volumeSets: {
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    width: 24,
    textAlign: 'right',
  },

  // Mesocycle
  mesoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  mesoLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  mesoWeek: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  mesoBar: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  mesoSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  mesoSegmentFilled: {
    backgroundColor: Colors.primary,
  },
});
