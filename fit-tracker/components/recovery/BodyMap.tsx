import { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Body, { Slug, ExtendedBodyPart } from 'react-native-body-highlighter';
import * as Haptics from 'expo-haptics';
import { MuscleRecoveryData, RecoveryBodyPart, RecoveryLevel } from '@/types';
import { Fonts } from '@/constants/theme';

interface BodyMapProps {
  muscles: MuscleRecoveryData[];
  onMusclePress?: (muscle: MuscleRecoveryData) => void;
  height?: number;
  view?: 'front' | 'back';
  showToggle?: boolean;
  showLegend?: boolean;
}

const STATUS_TO_INTENSITY: Record<RecoveryLevel, number> = {
  undertrained: 1,
  fresh: 2,
  fatigued: 3,
};

const BODY_COLORS = ['#6B7280', '#22C55E', '#EF4444'];

const BODY_PART_TO_SLUGS: Record<RecoveryBodyPart, { front: string[]; back: string[] }> = {
  'upper back': { front: [], back: ['trapezius', 'upper-back'] },
  lats:         { front: [], back: ['upper-back'] },
  'lower back': { front: [], back: ['lower-back'] },
  shoulders:    { front: ['deltoids'], back: ['deltoids'] },
  chest:        { front: ['chest'], back: [] },
  biceps:       { front: ['biceps'], back: [] },
  triceps:      { front: [], back: ['triceps'] },
  forearms:     { front: ['forearm'], back: ['forearm'] },
  quads:        { front: ['quadriceps'], back: [] },
  hamstrings:   { front: ['adductors'], back: ['hamstring'] },
  glutes:       { front: [], back: ['gluteal'] },
  calves:       { front: ['tibialis'], back: ['calves'] },
  abs:          { front: ['abs'], back: [] },
  obliques:     { front: ['obliques'], back: [] },
  cardio:       { front: [], back: [] },
};

const SLUG_TO_BODY_PART: Record<string, RecoveryBodyPart> = {};
Object.entries(BODY_PART_TO_SLUGS).forEach(([bodyPart, { front, back }]) => {
  [...front, ...back].forEach((slug) => {
    if (!SLUG_TO_BODY_PART[slug]) {
      SLUG_TO_BODY_PART[slug] = bodyPart as RecoveryBodyPart;
    }
  });
});

export function BodyMap({
  muscles,
  onMusclePress,
  height = 380,
  view: externalView,
  showToggle = true,
  showLegend = true,
}: BodyMapProps) {
  const [internalView, setInternalView] = useState<'front' | 'back'>('front');
  const view = externalView ?? internalView;
  const setView = setInternalView;

  const bodyData = useMemo((): ExtendedBodyPart[] => {
    const data: ExtendedBodyPart[] = [];
    muscles.forEach((muscle) => {
      const slugs = BODY_PART_TO_SLUGS[muscle.bodyPart];
      if (!slugs) return;
      const relevantSlugs = view === 'front' ? slugs.front : slugs.back;
      const intensity = STATUS_TO_INTENSITY[muscle.status];
      relevantSlugs.forEach((slug) => {
        data.push({ slug: slug as Slug, intensity });
      });
    });
    return data;
  }, [muscles, view]);

  const handleBodyPress = (pressedPart: ExtendedBodyPart) => {
    if (!pressedPart.slug) return;
    const bodyPart = SLUG_TO_BODY_PART[pressedPart.slug];
    if (bodyPart) {
      const muscleData = muscles.find((m) => m.bodyPart === bodyPart);
      if (muscleData) {
        const intensity = muscleData.status === 'fatigued'
          ? Haptics.ImpactFeedbackStyle.Heavy
          : muscleData.status === 'fresh'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light;
        Haptics.impactAsync(intensity);
        onMusclePress?.(muscleData);
      }
    }
  };

  const scale = height / 300;

  return (
    <View style={styles.container}>
      {showToggle && (
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleButton, view === 'front' && styles.toggleButtonActive]}
            onPress={() => setView('front')}
          >
            <Text style={[styles.toggleText, view === 'front' && styles.toggleTextActive]}>
              Avant
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, view === 'back' && styles.toggleButtonActive]}
            onPress={() => setView('back')}
          >
            <Text style={[styles.toggleText, view === 'back' && styles.toggleTextActive]}>
              Arrière
            </Text>
          </Pressable>
        </View>
      )}

      <View style={[styles.bodyContainer, { minHeight: height }]}>
        <Body
          data={bodyData}
          gender="male"
          side={view}
          scale={scale}
          border="none"
          colors={BODY_COLORS}
          onBodyPartPress={handleBodyPress}
        />
      </View>

      {showLegend && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444', shadowColor: '#EF4444', shadowRadius: 6, shadowOpacity: 0.8 }]} />
            <Text style={styles.legendText}>Fatigué</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22C55E', shadowColor: '#22C55E', shadowRadius: 4, shadowOpacity: 0.5 }]} />
            <Text style={styles.legendText}>Frais</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
            <Text style={styles.legendText}>Sous-entraîné</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: '#F97316',
  },
  toggleText: {
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  bodyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  legendText: {
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#D1D5DB',
  },
});
