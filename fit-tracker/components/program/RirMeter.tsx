import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';

interface RirMeterProps {
  rir: number | null;
  isDeload: boolean;
}

const TOTAL_SEGMENTS = 5;

/** Maps RIR value (or deload) to visual config */
function getMeterConfig(rir: number | null, isDeload: boolean) {
  if (isDeload) {
    return {
      filled: 1,
      color: '#3B82F6',
      labelKey: 'programOverview.phaseRecovery' as const,
    };
  }
  switch (rir) {
    case 0:
      return { filled: 5, color: '#EF4444', labelKey: 'programOverview.phaseFailure' as const };
    case 1:
      return { filled: 4, color: '#FBBF24', labelKey: 'programOverview.phasePeak' as const };
    case 2:
      return { filled: 3, color: '#FF6B35', labelKey: 'programOverview.phaseIntensification' as const };
    case 3:
      return { filled: 2, color: '#3B82F6', labelKey: 'programOverview.phaseAccumulation' as const };
    case 4:
    default:
      return { filled: 1, color: 'rgba(255,255,255,0.25)', labelKey: 'programOverview.phaseAdaptation' as const };
  }
}

function getTooltipText(rir: number | null, isDeload: boolean): string {
  if (isDeload) return i18n.t('programOverview.rirTooltipDeload');
  if (rir === 0) return i18n.t('programOverview.rirTooltipFailure');
  return i18n.t('programOverview.rirTooltip', { rir: rir ?? 4 });
}

/**
 * 5-segment horizontal intensity meter with phase label.
 * Tappable — shows a tooltip bubble explaining RIR in context.
 */
export function RirMeter({ rir, isDeload }: RirMeterProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipOpacity = useSharedValue(0);

  const config = getMeterConfig(rir, isDeload);

  const handlePress = useCallback(() => {
    const next = !showTooltip;
    setShowTooltip(next);
    tooltipOpacity.value = withTiming(next ? 1 : 0, { duration: 200 });
  }, [showTooltip]);

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
  }));

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.meterRow} onPress={handlePress}>
        {/* Segments */}
        <View style={styles.segments}>
          {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                i < config.filled
                  ? { backgroundColor: config.color }
                  : styles.segmentEmpty,
              ]}
            />
          ))}
        </View>

        {/* Phase label */}
        <Text style={[styles.phaseLabel, { color: config.color }]}>
          {i18n.t(config.labelKey)}
        </Text>
      </Pressable>

      {/* Tooltip bubble */}
      {showTooltip && (
        <Animated.View style={[styles.tooltip, tooltipStyle]}>
          <Text style={styles.tooltipText}>
            {getTooltipText(rir, isDeload)}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segments: {
    flexDirection: 'row',
    gap: 3,
  },
  segment: {
    width: 16,
    height: 4,
    borderRadius: 2,
  },
  segmentEmpty: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  phaseLabel: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  tooltip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tooltipText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 16,
  },
});
