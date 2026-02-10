import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Flame, Activity, TrendingUp, AlertCircle } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import type { SessionFeedback as SessionFeedbackType } from '@/types/program';

interface SessionFeedbackProps {
  visible: boolean;
  onSubmit: (feedback: SessionFeedbackType) => void;
  onSkip: () => void;
}

function getPumpOptions() {
  return [
    { value: 1 as const, label: i18n.t('sessionFeedbackModal.pumpLow') },
    { value: 2 as const, label: i18n.t('sessionFeedbackModal.pumpMed') },
    { value: 3 as const, label: i18n.t('sessionFeedbackModal.pumpHigh') },
  ];
}

function getSorenessOptions() {
  return [
    { value: 1 as const, label: i18n.t('sessionFeedbackModal.sorenessLow') },
    { value: 2 as const, label: i18n.t('sessionFeedbackModal.sorenessMed') },
    { value: 3 as const, label: i18n.t('sessionFeedbackModal.sorenessHigh') },
  ];
}

function getPerformanceOptions() {
  return [
    { value: 1 as const, label: i18n.t('sessionFeedbackModal.perfLow') },
    { value: 2 as const, label: i18n.t('sessionFeedbackModal.perfMed') },
    { value: 3 as const, label: i18n.t('sessionFeedbackModal.perfHigh') },
  ];
}

export function SessionFeedback({ visible, onSubmit, onSkip }: SessionFeedbackProps) {
  const [pump, setPump] = useState<1 | 2 | 3>(2);
  const [soreness, setSoreness] = useState<1 | 2 | 3>(1);
  const [performance, setPerformance] = useState<1 | 2 | 3>(2);
  const [jointPain, setJointPain] = useState(false);

  const handleSubmit = () => {
    onSubmit({ pump, soreness, performance, jointPain });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{i18n.t('sessionFeedbackModal.title')}</Text>

          {/* Pump */}
          <View style={styles.scaleSection}>
            <View style={styles.scaleLabelRow}>
              <Flame size={14} color={Colors.primary} />
              <Text style={styles.scaleLabel}>{i18n.t('sessionFeedbackModal.pump')}</Text>
            </View>
            <View style={styles.optionRow}>
              {getPumpOptions().map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.option, pump === opt.value && styles.optionActive]}
                  onPress={() => setPump(opt.value)}
                >
                  <Text style={[styles.optionText, pump === opt.value && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Soreness */}
          <View style={styles.scaleSection}>
            <View style={styles.scaleLabelRow}>
              <Activity size={14} color="#A855F7" />
              <Text style={styles.scaleLabel}>{i18n.t('sessionFeedbackModal.soreness')}</Text>
            </View>
            <View style={styles.optionRow}>
              {getSorenessOptions().map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.option, soreness === opt.value && styles.optionActive]}
                  onPress={() => setSoreness(opt.value)}
                >
                  <Text style={[styles.optionText, soreness === opt.value && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Performance */}
          <View style={styles.scaleSection}>
            <View style={styles.scaleLabelRow}>
              <TrendingUp size={14} color="#4ADE80" />
              <Text style={styles.scaleLabel}>{i18n.t('sessionFeedbackModal.performance')}</Text>
            </View>
            <View style={styles.optionRow}>
              {getPerformanceOptions().map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.option, performance === opt.value && styles.optionActive]}
                  onPress={() => setPerformance(opt.value)}
                >
                  <Text style={[styles.optionText, performance === opt.value && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Joint pain */}
          <View style={styles.scaleSection}>
            <View style={styles.scaleLabelRow}>
              <AlertCircle size={14} color="#FBBF24" />
              <Text style={styles.scaleLabel}>{i18n.t('sessionFeedbackModal.jointPain')}</Text>
            </View>
            <View style={styles.optionRow}>
              <Pressable
                style={[styles.option, !jointPain && styles.optionActive]}
                onPress={() => setJointPain(false)}
              >
                <Text style={[styles.optionText, !jointPain && styles.optionTextActive]}>{i18n.t('common.no')}</Text>
              </Pressable>
              <Pressable
                style={[styles.option, jointPain && styles.optionActiveWarning]}
                onPress={() => setJointPain(true)}
              >
                <Text style={[styles.optionText, jointPain && styles.optionTextActiveWarning]}>{i18n.t('common.yes')}</Text>
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>{i18n.t('common.validate')}</Text>
          </Pressable>
          <Pressable style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipText}>{i18n.t('common.skip')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    width: '100%',
    gap: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    textAlign: 'center',
  },
  scaleSection: {
    gap: 8,
  },
  scaleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scaleLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderColor: 'rgba(255,107,53,0.3)',
  },
  optionActiveWarning: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderColor: 'rgba(251,191,36,0.3)',
  },
  optionText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  optionTextActive: {
    color: Colors.primary,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  optionTextActiveWarning: {
    color: '#FBBF24',
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: {
    color: '#0C0C0C',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
