import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { getMuscleLabel, MUSCLE_TO_BODYPART } from '@/lib/muscleMapping';
import { BODY_ICONS, DEFAULT_BODY_ICON } from '@/components/home/ActiveProgramCard';
import {
  RP_VOLUME_LANDMARKS,
  getVolumeZone,
  getZoneColor,
} from '@/constants/volumeLandmarks';
import i18n from '@/lib/i18n';

/**
 * Body-part specific dot colors for the WeekStrip and MuscleZoneChip.
 * Distinct enough to be useful at small sizes, not so loud as to be noisy.
 */
export const BODYPART_DOT_COLORS: Record<string, string> = {
  chest: '#FF6B35',       // warm orange
  back: '#3B82F6',        // cool blue
  'upper legs': '#4ADE80', // electric green
  'lower legs': '#4ADE80',
  'upper arms': '#A78BFA', // neutral purple
  'lower arms': '#A78BFA',
  shoulders: '#FBBF24',   // accent amber
  waist: '#6B7280',       // dim gray
  cardio: '#EF4444',
  neck: '#9CA3AF',
};

interface MuscleZoneChipProps {
  muscle: string;          // canonical key ('chest', 'upper back', etc.)
  sets: number;            // sets in this context (session or week)
  weeklyTotal?: number;    // total weekly sets for zone calculation
}

export function MuscleZoneChip({ muscle, sets, weeklyTotal }: MuscleZoneChipProps) {
  const bodyPart = MUSCLE_TO_BODYPART[muscle] || 'chest';
  const iconData = BODY_ICONS[bodyPart] || DEFAULT_BODY_ICON;
  const { Icon } = iconData;

  const landmarks = RP_VOLUME_LANDMARKS[muscle];
  const volumeForZone = weeklyTotal ?? sets;
  const zone = landmarks ? getVolumeZone(volumeForZone, landmarks) : 'below_mv';
  const zoneColor = getZoneColor(zone);

  // Bar width: sets / MRV as percentage, capped at 100%
  const mrv = landmarks?.mrv || 20;
  const barPct = Math.min((volumeForZone / mrv) * 100, 100);

  return (
    <View style={styles.chip}>
      <View style={[styles.iconBox, { backgroundColor: `${zoneColor}15` }]}>
        <Icon size={14} color={zoneColor} strokeWidth={2} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label} numberOfLines={1}>{getMuscleLabel(muscle)}</Text>
        <Text style={styles.sets}>
          {sets} {i18n.t('common.sets')}
        </Text>
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              { width: `${barPct}%`, backgroundColor: zoneColor },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 90,
    maxWidth: 120,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  sets: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  barBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginTop: 2,
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
});
