import { View, Text, StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';
import { PressableScale } from '@/components/ui/PressableScale';
import { RECOVERY_COLORS } from '@/constants/recovery';
import type { RecoveryLevel } from '@/types';

interface MuscleChipProps {
  muscle: string;
  labelFr: string;
  recoveryStatus: RecoveryLevel;
  zoneColor?: string;
  zoneLabelShort?: string;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
}

export function MuscleChip({
  labelFr,
  recoveryStatus,
  zoneColor,
  zoneLabelShort,
  selected = false,
  onPress,
  compact = false,
}: MuscleChipProps) {
  const dotColor = selected ? (zoneColor || RECOVERY_COLORS[recoveryStatus]) : RECOVERY_COLORS[recoveryStatus];
  const bgColor = selected
    ? 'rgba(255,255,255,0.07)'
    : 'transparent';

  const content = (
    <View style={[styles.chip, { backgroundColor: bgColor }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>{labelFr}</Text>
      {!compact && selected && zoneLabelShort ? (
        <Text style={[styles.zone, { color: zoneColor || 'rgba(255,255,255,0.35)' }]}>
          {zoneLabelShort}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress} activeScale={0.97}>
        {content}
      </PressableScale>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  labelSelected: {
    color: 'rgba(255,255,255,0.9)',
  },
  zone: {
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginLeft: 2,
  },
});
