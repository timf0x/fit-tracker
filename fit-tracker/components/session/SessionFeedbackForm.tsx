import { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import type { SessionFeedback } from '@/types/program';

// ─── Types ───

interface SessionFeedbackFormProps {
  value: SessionFeedback;
  onChange: (feedback: SessionFeedback) => void;
}

interface MetricConfig {
  field: 'pump' | 'soreness' | 'performance';
  label: string;
  color: string;
  labels: [string, string, string];
}

// ─── Spectrum Row ───

function SpectrumRow({
  config,
  selected,
  onSelect,
}: {
  config: MetricConfig;
  selected: 1 | 2 | 3;
  onSelect: (v: 1 | 2 | 3) => void;
}) {
  // Track fill: 0%, 50%, 100% based on selected (1, 2, 3)
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
        <View style={[styles.dot, { backgroundColor: config.color }]} />
        <Text style={styles.spectrumLabel}>{config.label}</Text>
      </View>

      {/* Track + Nodes */}
      <View style={styles.trackContainer}>
        {/* Background track */}
        <View style={styles.trackBg} />

        {/* Filled track */}
        <Animated.View
          style={[styles.trackFill, { backgroundColor: config.color }, trackFillStyle]}
        />

        {/* Three nodes */}
        <View style={styles.nodesRow}>
          {([1, 2, 3] as const).map((v) => (
            <SpectrumNode
              key={v}
              isSelected={selected === v}
              color={config.color}
              label={config.labels[v - 1]}
              onPress={() => onSelect(v)}
            />
          ))}
        </View>
      </View>
    </View>
  );
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

// ─── Joint Pain Toggle ───

function JointPainToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 250 });
  }, [active]);

  const circleStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.06)', '#FBBF24'],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.12)', '#FBBF24'],
    ),
    transform: [{ scale: 1 + progress.value * 0.08 }],
  }));

  const underlineStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <View style={styles.jointSection}>
      <Pressable style={styles.jointRow} onPress={onToggle}>
        <View style={styles.jointLeft}>
          <View style={[styles.dot, { backgroundColor: '#FBBF24' }]} />
          <Text style={styles.spectrumLabel}>
            {i18n.t('workoutSession.feedbackJointPain').toUpperCase()}
          </Text>
        </View>
        <Animated.View style={[styles.toggleCircle, circleStyle]}>
          {active && <View style={styles.toggleCheck} />}
        </Animated.View>
      </Pressable>
      <Animated.View style={[styles.jointUnderline, underlineStyle]} />
    </View>
  );
}

// ─── Smart Nudge ───

function getSmartNudge(feedback: SessionFeedback): { text: string; color: string } | null {
  if (feedback.jointPain) {
    return { text: i18n.t('workoutSession.feedbackNudgeJoint'), color: '#FBBF24' };
  }
  if (feedback.soreness === 3 && feedback.performance === 1) {
    return { text: i18n.t('workoutSession.feedbackNudgeOverreached'), color: '#EF4444' };
  }
  if (feedback.pump === 1 && feedback.soreness === 1 && feedback.performance >= 2) {
    return { text: i18n.t('workoutSession.feedbackNudgeUnder'), color: '#3B82F6' };
  }
  if (feedback.pump >= 2 && feedback.soreness <= 2 && feedback.performance >= 2) {
    return { text: i18n.t('workoutSession.feedbackNudgeOptimal'), color: '#4ADE80' };
  }
  return null;
}

// ─── Main Component ───

export function SessionFeedbackForm({ value, onChange }: SessionFeedbackFormProps) {
  const metrics: MetricConfig[] = useMemo(() => [
    {
      field: 'pump',
      label: i18n.t('workoutSession.feedbackPump').toUpperCase(),
      color: Colors.primary,
      labels: [
        i18n.t('workoutSession.feedbackPumpLow'),
        i18n.t('workoutSession.feedbackPumpMed'),
        i18n.t('workoutSession.feedbackPumpHigh'),
      ],
    },
    {
      field: 'soreness',
      label: i18n.t('workoutSession.feedbackSoreness').toUpperCase(),
      color: '#A855F7',
      labels: [
        i18n.t('workoutSession.feedbackSorenessLow'),
        i18n.t('workoutSession.feedbackSorenessMed'),
        i18n.t('workoutSession.feedbackSorenessHigh'),
      ],
    },
    {
      field: 'performance',
      label: i18n.t('workoutSession.feedbackPerformance').toUpperCase(),
      color: '#3B82F6',
      labels: [
        i18n.t('workoutSession.feedbackPerfLow'),
        i18n.t('workoutSession.feedbackPerfMed'),
        i18n.t('workoutSession.feedbackPerfHigh'),
      ],
    },
  ], []);

  const nudge = useMemo(() => getSmartNudge(value), [value]);

  const handleSelect = (field: 'pump' | 'soreness' | 'performance', v: 1 | 2 | 3) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange({ ...value, [field]: v });
  };

  const handleToggleJointPain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange({ ...value, jointPain: !value.jointPain });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('workoutSession.feedbackTitle')}</Text>

      {metrics.map((m) => (
        <SpectrumRow
          key={m.field}
          config={m}
          selected={value[m.field]}
          onSelect={(v) => handleSelect(m.field, v)}
        />
      ))}

      <JointPainToggle active={value.jointPain} onToggle={handleToggleJointPain} />

      {nudge && (
        <View style={styles.nudgeRow}>
          <View style={[styles.nudgeAccent, { backgroundColor: nudge.color }]} />
          <Text style={[styles.nudgeText, { color: nudge.color }]}>
            {nudge.text}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  title: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
  },

  // Spectrum row
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

  // Track
  trackContainer: {
    height: 44,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  trackBg: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 1,
  },
  trackFill: {
    position: 'absolute',
    top: 12,
    left: 0,
    height: 2,
    borderRadius: 1,
  },
  nodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  // Node
  nodeHitArea: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 0,
    minWidth: 64,
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

  // Joint pain
  jointSection: {
    gap: 0,
  },
  jointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  jointLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCheck: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#050505',
  },
  jointUnderline: {
    height: 2,
    backgroundColor: '#FBBF24',
    borderRadius: 1,
    marginTop: 4,
    opacity: 0,
  },

  // Nudge
  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  nudgeAccent: {
    width: 3,
    minHeight: 18,
    borderRadius: 1.5,
    marginTop: 1,
  },
  nudgeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 18,
  },
});
