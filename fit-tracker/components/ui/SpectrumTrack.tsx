import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Fonts } from '@/constants/theme';

// ─── Types ───

export interface SpectrumTrackProps {
  label: string;
  color: string;
  selected: 1 | 2 | 3;
  onSelect: (v: 1 | 2 | 3) => void;
  labels: [string, string, string];
}

// ─── Spectrum Node ───

function SpectrumNode({
  isSelected,
  color,
  label,
  onPress,
}: {
  isSelected: boolean;
  color: string;
  label: string;
  onPress: () => void;
}) {
  const progress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isSelected ? 1 : 0, { duration: 250 });
  }, [isSelected]);

  const nodeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.25 }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', color],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.15)', color],
    ),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + progress.value * 0.7,
  }));

  return (
    <Pressable style={styles.nodeHitArea} onPress={onPress}>
      <Animated.View style={[styles.node, nodeStyle]} />
      <Animated.Text
        style={[
          styles.nodeLabel,
          { color: isSelected ? color : 'rgba(255,255,255,0.3)' },
          isSelected && { fontFamily: Fonts?.semibold, fontWeight: '600' as const },
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

// ─── Spectrum Track ───

export function SpectrumTrack({
  label,
  color,
  selected,
  onSelect,
  labels,
}: SpectrumTrackProps) {
  const fillProgress = useSharedValue(selected === 1 ? 0 : selected === 2 ? 0.5 : 1);

  useEffect(() => {
    fillProgress.value = withTiming(selected === 1 ? 0 : selected === 2 ? 0.5 : 1, { duration: 300 });
  }, [selected]);

  const trackFillStyle = useAnimatedStyle(() => ({
    width: `${fillProgress.value * 100}%` as any,
  }));

  return (
    <View style={styles.spectrumSection}>
      {/* Label with colored dot */}
      <View style={styles.spectrumHeader}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.spectrumLabel}>{label}</Text>
      </View>

      {/* Track + Nodes */}
      <View style={styles.trackContainer}>
        {/* Background track */}
        <View style={styles.trackBg} />

        {/* Filled track */}
        <Animated.View
          style={[styles.trackFill, { backgroundColor: color }, trackFillStyle]}
        />

        {/* Three nodes */}
        <View style={styles.nodesRow}>
          {([1, 2, 3] as const).map((v) => (
            <SpectrumNode
              key={v}
              isSelected={selected === v}
              color={color}
              label={labels[v - 1]}
              onPress={() => onSelect(v)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  spectrumSection: {
    gap: 10,
  },
  spectrumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  spectrumLabel: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.2,
  },
  trackContainer: {
    height: 44,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  trackBg: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 1,
  },
  trackFill: {
    position: 'absolute',
    top: 20,
    left: 0,
    height: 2,
    borderRadius: 1,
  },
  nodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nodeHitArea: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    minWidth: 64,
    minHeight: 48,
  },
  node: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  nodeLabel: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.3)',
  },
});
