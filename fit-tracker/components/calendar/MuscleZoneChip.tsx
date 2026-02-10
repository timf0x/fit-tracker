import { View, Text, StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';
import { getMuscleLabel, MUSCLE_TO_BODYPART } from '@/lib/muscleMapping';
import { BODY_ICONS } from '@/components/home/ActiveProgramCard';
import {
  RP_VOLUME_LANDMARKS,
  getVolumeZone,
  getZoneColor,
} from '@/constants/volumeLandmarks';
import i18n from '@/lib/i18n';

interface MuscleZoneChipProps {
  muscle: string;
  sets: number;
  weeklyTotal?: number;
}

/**
 * Compact muscle chip with icon, label, set count, and a thin zone-colored bar.
 * Used in DayContentCard and WeekSummaryCard.
 */
export function MuscleZoneChip({ muscle, sets, weeklyTotal }: MuscleZoneChipProps) {
  const bodyPart = MUSCLE_TO_BODYPART[muscle] || 'waist';
  const iconData = BODY_ICONS[bodyPart] || BODY_ICONS.waist;
  const Icon = iconData.Icon;

  const volumeForZone = weeklyTotal ?? sets;
  const landmarks = RP_VOLUME_LANDMARKS[muscle];
  const zone = landmarks ? getVolumeZone(volumeForZone, landmarks) : 'below_mv';
  const zoneColor = getZoneColor(zone);
  const mrv = landmarks?.mrv || 20;
  const barPercent = Math.min(volumeForZone / mrv, 1);

  return (
    <View style={styles.chip}>
      <View style={[styles.iconBox, { backgroundColor: `${zoneColor}15` }]}>
        <Icon size={13} color={zoneColor} strokeWidth={2.5} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label} numberOfLines={1}>{getMuscleLabel(muscle)}</Text>
        <Text style={styles.sets}>{sets} {i18n.t('common.sets')}</Text>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${barPercent * 100}%`, backgroundColor: zoneColor },
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
    alignItems: 'center',
    gap: 8,
    minWidth: 90,
    flex: 1,
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
    gap: 1,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  sets: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  barTrack: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});
