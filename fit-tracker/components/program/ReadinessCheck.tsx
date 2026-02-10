import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Moon, Zap, Activity, X } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import type { ReadinessCheck as ReadinessCheckType } from '@/types/program';

interface ReadinessCheckProps {
  visible: boolean;
  onSubmit: (check: ReadinessCheckType) => void;
  onSkip: () => void;
  onClose?: () => void;
}

const SCALE_POINTS = [1, 2, 3, 4, 5] as const;

export function ReadinessCheck({ visible, onSubmit, onSkip, onClose }: ReadinessCheckProps) {
  const [sleep, setSleep] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [soreness, setSoreness] = useState<1 | 2 | 3 | 4 | 5>(3);

  const avg = useMemo(() => (sleep + energy + (6 - soreness)) / 3, [sleep, energy, soreness]);

  const recommendation = useMemo(() => {
    if (avg < 2.5) return { text: i18n.t('readiness.recLow'), color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' };
    if (avg >= 4) return { text: i18n.t('readiness.recHigh'), color: '#4ADE80', bg: 'rgba(74,222,128,0.1)' };
    return null;
  }, [avg]);

  const handleSubmit = () => {
    onSubmit({
      sleep,
      energy,
      soreness,
      timestamp: new Date().toISOString(),
    });
  };

  const getPointColor = (value: number, selected: number, inverted?: boolean) => {
    if (value !== selected) return 'rgba(255,255,255,0.04)';
    if (inverted) {
      // Lower is better (soreness)
      if (selected <= 2) return 'rgba(74,222,128,0.2)';
      if (selected >= 4) return 'rgba(239,68,68,0.2)';
      return 'rgba(255,107,53,0.15)';
    }
    // Higher is better (sleep, energy)
    if (selected >= 4) return 'rgba(74,222,128,0.2)';
    if (selected <= 2) return 'rgba(239,68,68,0.2)';
    return 'rgba(255,107,53,0.15)';
  };

  const getPointBorder = (value: number, selected: number, inverted?: boolean) => {
    if (value !== selected) return 'rgba(255,255,255,0.06)';
    if (inverted) {
      if (selected <= 2) return 'rgba(74,222,128,0.4)';
      if (selected >= 4) return 'rgba(239,68,68,0.4)';
      return Colors.primary;
    }
    if (selected >= 4) return 'rgba(74,222,128,0.4)';
    if (selected <= 2) return 'rgba(239,68,68,0.4)';
    return Colors.primary;
  };

  const renderScale = (
    icon: React.ReactNode,
    label: string,
    value: 1 | 2 | 3 | 4 | 5,
    onChange: (v: 1 | 2 | 3 | 4 | 5) => void,
    inverted?: boolean
  ) => (
    <View style={styles.scaleSection}>
      <View style={styles.scaleLabelRow}>
        {icon}
        <Text style={styles.scaleLabel}>{label}</Text>
      </View>
      <View style={styles.pointsRow}>
        {SCALE_POINTS.map((p) => (
          <Pressable
            key={p}
            style={[
              styles.point,
              { backgroundColor: getPointColor(p, value, inverted), borderColor: getPointBorder(p, value, inverted) },
            ]}
            onPress={() => onChange(p as 1 | 2 | 3 | 4 | 5)}
          >
            <Text style={[
              styles.pointText,
              p === value && styles.pointTextActive,
            ]}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

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

          {renderScale(
            <Moon size={14} color="#3B82F6" />,
            i18n.t('readiness.sleep'),
            sleep,
            setSleep,
          )}
          {renderScale(
            <Zap size={14} color={Colors.primary} />,
            i18n.t('readiness.energy'),
            energy,
            setEnergy,
          )}
          {renderScale(
            <Activity size={14} color="#A855F7" />,
            i18n.t('readiness.soreness'),
            soreness,
            setSoreness,
            true,
          )}

          {recommendation && (
            <View style={[styles.recBanner, { backgroundColor: recommendation.bg }]}>
              <Text style={[styles.recText, { color: recommendation.color }]}>
                {recommendation.text}
              </Text>
            </View>
          )}

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
  scaleSection: {
    gap: 10,
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
  pointsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  point: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  pointTextActive: {
    color: '#FFFFFF',
  },
  recBanner: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  recText: {
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
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
