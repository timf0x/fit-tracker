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
import { SpectrumTrack } from '@/components/ui/SpectrumTrack';
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
        <SpectrumTrack
          key={m.field}
          label={m.label}
          color={m.color}
          selected={value[m.field]}
          onSelect={(v) => handleSelect(m.field, v)}
          labels={m.labels}
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
  // Joint pain
  jointSection: {
    gap: 0,
  },
  jointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    minHeight: 48,
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
