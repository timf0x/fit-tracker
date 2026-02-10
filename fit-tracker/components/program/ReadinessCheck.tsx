import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { SpectrumTrack } from '@/components/ui/SpectrumTrack';
import {
  computeReadinessScore,
  getReadinessLevel,
  getReadinessColor,
  computeSessionAdjustments,
  getReadinessNudge,
  getReadinessLevelLabel,
  getAdjustmentPreview,
} from '@/lib/readinessEngine';
import type { ReadinessCheck as ReadinessCheckType } from '@/types/program';

interface ReadinessCheckProps {
  visible: boolean;
  onSubmit: (check: ReadinessCheckType) => void;
  onSkip: () => void;
  onClose?: () => void;
}

export function ReadinessCheck({ visible, onSubmit, onSkip, onClose }: ReadinessCheckProps) {
  const [sleep, setSleep] = useState<1 | 2 | 3>(2);
  const [energy, setEnergy] = useState<1 | 2 | 3>(2);
  const [stress, setStress] = useState<1 | 2 | 3>(2);
  const [soreness, setSoreness] = useState<1 | 2 | 3>(2);

  const score = useMemo(
    () => computeReadinessScore({ sleep, energy, stress, soreness, timestamp: '' }),
    [sleep, energy, stress, soreness],
  );

  const level = useMemo(() => getReadinessLevel(score), [score]);
  const color = useMemo(() => getReadinessColor(level), [level]);
  const adjustments = useMemo(() => computeSessionAdjustments(score), [score]);
  const nudge = useMemo(() => getReadinessNudge(level), [level]);
  const levelLabel = useMemo(() => getReadinessLevelLabel(level), [level]);
  const adjustmentPreview = useMemo(() => getAdjustmentPreview(adjustments), [adjustments]);

  // Animated score bar
  const barProgress = useSharedValue(score / 100);
  useEffect(() => {
    barProgress.value = withTiming(score / 100, { duration: 400 });
  }, [score]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barProgress.value * 100}%` as any,
  }));

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit({
      sleep,
      energy,
      stress,
      soreness,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSelect = (setter: (v: 1 | 2 | 3) => void) => (v: 1 | 2 | 3) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(v);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          {onClose && (
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
              <X size={20} color="rgba(255,255,255,0.5)" />
            </Pressable>
          )}

          <Text style={styles.title}>{i18n.t('readiness.title')}</Text>

          {/* 4 Spectrum Tracks */}
          <View style={styles.tracksContainer}>
            <SpectrumTrack
              label={i18n.t('readiness.sleep').toUpperCase()}
              color="#3B82F6"
              selected={sleep}
              onSelect={handleSelect(setSleep)}
              labels={[
                i18n.t('readiness.sleepBad'),
                i18n.t('readiness.sleepOk'),
                i18n.t('readiness.sleepGood'),
              ]}
            />
            <SpectrumTrack
              label={i18n.t('readiness.energy').toUpperCase()}
              color={Colors.primary}
              selected={energy}
              onSelect={handleSelect(setEnergy)}
              labels={[
                i18n.t('readiness.energyLow'),
                i18n.t('readiness.energyMid'),
                i18n.t('readiness.energyHigh'),
              ]}
            />
            <SpectrumTrack
              label={i18n.t('readiness.stress').toUpperCase()}
              color="#A855F7"
              selected={stress}
              onSelect={handleSelect(setStress)}
              labels={[
                i18n.t('readiness.stressHigh'),
                i18n.t('readiness.stressMid'),
                i18n.t('readiness.stressLow'),
              ]}
            />
            <SpectrumTrack
              label={i18n.t('readiness.soreness').toUpperCase()}
              color="#EF4444"
              selected={soreness}
              onSelect={handleSelect(setSoreness)}
              labels={[
                i18n.t('readiness.sorenessHigh'),
                i18n.t('readiness.sorenessMid'),
                i18n.t('readiness.sorenessLow'),
              ]}
            />
          </View>

          {/* Score Bar + Level */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreLabel}>{i18n.t('readiness.score')}</Text>
              <Text style={[styles.scoreValue, { color }]}>{score}</Text>
            </View>
            <View style={styles.scoreBarBg}>
              <Animated.View style={[styles.scoreBarFill, { backgroundColor: color }, barStyle]} />
            </View>
            <Text style={[styles.levelText, { color }]}>{levelLabel} — {nudge}</Text>
          </View>

          {/* Adjustment Preview (only for moderate/low) */}
          {adjustmentPreview && (
            <View style={[styles.adjustmentCard, { borderColor: `${color}30` }]}>
              <Text style={[styles.adjustmentText, { color }]}>{adjustmentPreview}</Text>
            </View>
          )}

          {/* Actions */}
          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>{i18n.t('readiness.submit')}</Text>
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
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    textAlign: 'center',
  },
  tracksContainer: {
    gap: 20,
  },
  // Score
  scoreSection: {
    gap: 8,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  scoreBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: 4,
    borderRadius: 2,
  },
  levelText: {
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 18,
  },
  // Adjustment preview
  adjustmentCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  adjustmentText: {
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Actions
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
