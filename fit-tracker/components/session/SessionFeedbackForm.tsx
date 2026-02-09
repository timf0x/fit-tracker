import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import {
  Droplet,
  Flame,
  Zap,
  CircleCheck,
  Minus,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Activity,
  Lightbulb,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import i18n from '@/lib/i18n';
import type { SessionFeedback } from '@/types/program';

// ─── Types ───

interface SessionFeedbackFormProps {
  value: SessionFeedback;
  onChange: (feedback: SessionFeedback) => void;
}

// ─── Option Configs ───

interface FeedbackOption {
  value: 1 | 2 | 3;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  borderColor: string;
}

function getPumpOptions(): FeedbackOption[] {
  return [
    {
      value: 1,
      label: i18n.t('workoutSession.feedbackPumpLow'),
      icon: <Droplet size={20} color="#6B7280" strokeWidth={2} />,
      color: '#6B7280',
      bg: 'rgba(107,114,128,0.12)',
      borderColor: 'rgba(107,114,128,0.3)',
    },
    {
      value: 2,
      label: i18n.t('workoutSession.feedbackPumpMed'),
      icon: <Flame size={20} color={Colors.primary} strokeWidth={2} />,
      color: Colors.primary,
      bg: 'rgba(255,107,53,0.12)',
      borderColor: `${Colors.primary}50`,
    },
    {
      value: 3,
      label: i18n.t('workoutSession.feedbackPumpHigh'),
      icon: <Zap size={20} color="#EF4444" strokeWidth={2} />,
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.12)',
      borderColor: 'rgba(239,68,68,0.3)',
    },
  ];
}

function getSorenessOptions(): FeedbackOption[] {
  return [
    {
      value: 1,
      label: i18n.t('workoutSession.feedbackSorenessLow'),
      icon: <CircleCheck size={20} color="#4ADE80" strokeWidth={2} />,
      color: '#4ADE80',
      bg: 'rgba(74,222,128,0.12)',
      borderColor: 'rgba(74,222,128,0.3)',
    },
    {
      value: 2,
      label: i18n.t('workoutSession.feedbackSorenessMed'),
      icon: <Activity size={20} color="#FBBF24" strokeWidth={2} />,
      color: '#FBBF24',
      bg: 'rgba(251,191,36,0.12)',
      borderColor: 'rgba(251,191,36,0.3)',
    },
    {
      value: 3,
      label: i18n.t('workoutSession.feedbackSorenessHigh'),
      icon: <AlertTriangle size={20} color="#EF4444" strokeWidth={2} />,
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.12)',
      borderColor: 'rgba(239,68,68,0.3)',
    },
  ];
}

function getPerformanceOptions(): FeedbackOption[] {
  return [
    {
      value: 1,
      label: i18n.t('workoutSession.feedbackPerfLow'),
      icon: <TrendingDown size={20} color="#EF4444" strokeWidth={2} />,
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.12)',
      borderColor: 'rgba(239,68,68,0.3)',
    },
    {
      value: 2,
      label: i18n.t('workoutSession.feedbackPerfMed'),
      icon: <Minus size={20} color="#FBBF24" strokeWidth={2} />,
      color: '#FBBF24',
      bg: 'rgba(251,191,36,0.12)',
      borderColor: 'rgba(251,191,36,0.3)',
    },
    {
      value: 3,
      label: i18n.t('workoutSession.feedbackPerfHigh'),
      icon: <TrendingUp size={20} color="#4ADE80" strokeWidth={2} />,
      color: '#4ADE80',
      bg: 'rgba(74,222,128,0.12)',
      borderColor: 'rgba(74,222,128,0.3)',
    },
  ];
}

// ─── Smart Nudge ───

function getSmartNudge(feedback: SessionFeedback): { text: string; color: string; bg: string } | null {
  // Joint pain takes priority
  if (feedback.jointPain) {
    return {
      text: i18n.t('workoutSession.feedbackNudgeJoint'),
      color: '#FBBF24',
      bg: 'rgba(251,191,36,0.08)',
    };
  }
  // Overreached: high soreness + declining performance
  if (feedback.soreness === 3 && feedback.performance === 1) {
    return {
      text: i18n.t('workoutSession.feedbackNudgeOverreached'),
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.08)',
    };
  }
  // Under-stimulated: low pump + no soreness + good performance
  if (feedback.pump === 1 && feedback.soreness === 1 && feedback.performance >= 2) {
    return {
      text: i18n.t('workoutSession.feedbackNudgeUnder'),
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.08)',
    };
  }
  // Optimal: decent pump + not too sore + stable or improving
  if (feedback.pump >= 2 && feedback.soreness <= 2 && feedback.performance >= 2) {
    return {
      text: i18n.t('workoutSession.feedbackNudgeOptimal'),
      color: '#4ADE80',
      bg: 'rgba(74,222,128,0.08)',
    };
  }
  return null;
}

// ─── Component ───

export function SessionFeedbackForm({ value, onChange }: SessionFeedbackFormProps) {
  const pumpOptions = useMemo(() => getPumpOptions(), []);
  const sorenessOptions = useMemo(() => getSorenessOptions(), []);
  const performanceOptions = useMemo(() => getPerformanceOptions(), []);
  const nudge = useMemo(() => getSmartNudge(value), [value]);

  const handleSelect = (field: 'pump' | 'soreness' | 'performance', v: 1 | 2 | 3) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange({ ...value, [field]: v });
  };

  const handleToggleJointPain = (v: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange({ ...value, jointPain: v });
  };

  const renderRow = (
    sectionIcon: React.ReactNode,
    sectionLabel: string,
    options: FeedbackOption[],
    selected: 1 | 2 | 3,
    field: 'pump' | 'soreness' | 'performance',
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {sectionIcon}
        <Text style={styles.sectionLabel}>{sectionLabel}</Text>
      </View>
      <View style={styles.optionsRow}>
        {options.map((opt) => {
          const isSelected = opt.value === selected;
          return (
            <Pressable
              key={opt.value}
              style={[
                styles.optionCard,
                isSelected && {
                  backgroundColor: opt.bg,
                  borderColor: opt.borderColor,
                },
              ]}
              onPress={() => handleSelect(field, opt.value)}
            >
              <View style={[
                styles.optionIconBox,
                isSelected && { backgroundColor: `${opt.color}18` },
              ]}>
                {opt.icon}
              </View>
              <Text
                style={[
                  styles.optionLabel,
                  isSelected && { color: opt.color, fontFamily: Fonts?.semibold, fontWeight: '600' },
                ]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <Text style={styles.title}>{i18n.t('workoutSession.feedbackTitle')}</Text>

      {/* Pump */}
      {renderRow(
        <Flame size={14} color={Colors.primary} strokeWidth={2.5} />,
        i18n.t('workoutSession.feedbackPump'),
        pumpOptions,
        value.pump,
        'pump',
      )}

      {/* Soreness */}
      {renderRow(
        <Activity size={14} color="#A855F7" strokeWidth={2.5} />,
        i18n.t('workoutSession.feedbackSoreness'),
        sorenessOptions,
        value.soreness,
        'soreness',
      )}

      {/* Performance */}
      {renderRow(
        <TrendingUp size={14} color="#3B82F6" strokeWidth={2.5} />,
        i18n.t('workoutSession.feedbackPerformance'),
        performanceOptions,
        value.performance,
        'performance',
      )}

      {/* Joint Pain Toggle */}
      <View style={styles.jointPainRow}>
        <View style={styles.jointPainLeft}>
          <AlertTriangle size={14} color="#FBBF24" strokeWidth={2.5} />
          <Text style={styles.sectionLabel}>
            {i18n.t('workoutSession.feedbackJointPain')}
          </Text>
        </View>
        <Switch
          value={value.jointPain}
          onValueChange={handleToggleJointPain}
          trackColor={{ false: 'rgba(255,255,255,0.08)', true: 'rgba(251,191,36,0.35)' }}
          thumbColor={value.jointPain ? '#FBBF24' : 'rgba(255,255,255,0.3)'}
          ios_backgroundColor="rgba(255,255,255,0.08)"
        />
      </View>

      {/* Smart Nudge */}
      {nudge && (
        <View style={[styles.nudgeBanner, { backgroundColor: nudge.bg }]}>
          <Lightbulb size={14} color={nudge.color} strokeWidth={2.5} />
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
    gap: 18,
  },
  title: {
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  optionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
  },
  jointPainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  jointPainLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nudgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  nudgeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 18,
  },
});
