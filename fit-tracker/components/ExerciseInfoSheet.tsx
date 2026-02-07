import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Image,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import type { Exercise } from '@/types';

const BODY_PART_LABELS: Record<string, string> = {
  back: 'Dos',
  shoulders: 'Épaules',
  chest: 'Pectoraux',
  'upper arms': 'Bras',
  'lower arms': 'Avant-bras',
  'upper legs': 'Jambes',
  'lower legs': 'Mollets',
  waist: 'Abdos',
  cardio: 'Cardio',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  dumbbell: 'Haltères',
  barbell: 'Barre',
  cable: 'Câble',
  machine: 'Machine',
  'body weight': 'Poids du corps',
  kettlebell: 'Kettlebell',
  'resistance band': 'Bande élastique',
  'ez bar': 'Barre EZ',
  'smith machine': 'Smith machine',
  'trap bar': 'Trap bar',
  other: 'Autre',
};

interface ExerciseInfoSheetProps {
  exercise: Exercise | null;
  onClose: () => void;
}

export function ExerciseInfoSheet({ exercise, onClose }: ExerciseInfoSheetProps) {
  const [tab, setTab] = useState<'about' | 'guide'>('about');
  const translateY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (exercise) {
      translateY.setValue(0);
      setTab('about');
    }
  }, [exercise]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 800,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onCloseRef.current();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={exercise !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <Pressable style={s.dismiss} onPress={onClose} />
        <Animated.View style={[s.sheet, { transform: [{ translateY }] }]}>
          {exercise && (
            <>
              {/* Draggable handle + header */}
              <View {...panResponder.panHandlers}>
                <View style={s.handleRow}>
                  <View style={s.handle} />
                </View>
                <View style={s.header}>
                  <Text style={s.name}>{exercise.nameFr}</Text>
                </View>
              </View>

              {/* Exercise visual */}
              <View style={s.visual}>
                {exercise.gifUrl ? (
                  <Image
                    source={{ uri: exercise.gifUrl }}
                    style={s.gif}
                    resizeMode="contain"
                  />
                ) : (
                  <ExerciseIcon
                    exerciseName={exercise.name}
                    bodyPart={exercise.bodyPart}
                    size={48}
                    containerSize={120}
                  />
                )}
              </View>

              {/* Tabs */}
              <View style={s.tabRow}>
                <Pressable
                  style={[s.tab, tab === 'about' && s.tabActive]}
                  onPress={() => setTab('about')}
                >
                  <Text style={[s.tabText, tab === 'about' && s.tabTextActive]}>
                    À propos
                  </Text>
                </Pressable>
                <Pressable
                  style={[s.tab, tab === 'guide' && s.tabActive]}
                  onPress={() => setTab('guide')}
                >
                  <Text style={[s.tabText, tab === 'guide' && s.tabTextActive]}>
                    Guide
                  </Text>
                </Pressable>
              </View>

              {/* Scrollable content */}
              <ScrollView
                style={s.scroll}
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                {tab === 'about' ? (
                  <>
                    <View style={s.row}>
                      <Text style={s.rowLabel}>Muscle cible</Text>
                      <Text style={s.rowValue}>{exercise.target}</Text>
                    </View>
                    <View style={s.rowDivider} />
                    <View style={s.row}>
                      <Text style={s.rowLabel}>Groupe musculaire</Text>
                      <Text style={s.rowValue}>
                        {BODY_PART_LABELS[exercise.bodyPart] || exercise.bodyPart}
                      </Text>
                    </View>
                    <View style={s.rowDivider} />
                    <View style={s.row}>
                      <Text style={s.rowLabel}>Équipement</Text>
                      <Text style={s.rowValue}>
                        {EQUIPMENT_LABELS[exercise.equipment] || exercise.equipment}
                      </Text>
                    </View>
                    <View style={s.rowDivider} />
                    <View style={s.row}>
                      <Text style={s.rowLabel}>Type</Text>
                      <Text style={s.rowValue}>
                        {exercise.isUnilateral ? 'Unilatéral' : 'Bilatéral'}
                      </Text>
                    </View>
                    {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                      <>
                        <View style={s.rowDivider} />
                        <View style={s.row}>
                          <Text style={s.rowLabel}>Muscles secondaires</Text>
                          <Text style={s.rowValue}>
                            {exercise.secondaryMuscles.join(', ')}
                          </Text>
                        </View>
                      </>
                    )}
                    {exercise.description ? (
                      <View style={s.tipCard}>
                        <Text style={s.tipLabel}>CONSEILS DE FORME</Text>
                        <Text style={s.tipText}>{exercise.description}</Text>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <>
                    {(exercise.instructions && exercise.instructions.length > 0
                      ? exercise.instructions
                      : exercise.description
                          .split('.')
                          .map((step) => step.trim())
                          .filter((step) => step.length > 0)
                          .map((step) => `${step}.`)
                    ).map((step, i) => (
                      <View key={i} style={s.guideStep}>
                        <View style={s.guideStepNumber}>
                          <Text style={s.guideStepNumberText}>{i + 1}</Text>
                        </View>
                        <Text style={s.guideStepText}>{step}</Text>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  dismiss: {
    height: '15%',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#111111',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 0,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  name: {
    color: Colors.text,
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  visual: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    height: 240,
    marginBottom: 16,
    overflow: 'hidden',
  },
  gif: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabText: {
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: 'rgba(120,120,130,1)',
  },
  tabTextActive: {
    color: Colors.text,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowLabel: {
    color: 'rgba(120,120,130,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  rowValue: {
    color: 'rgba(220,220,230,1)',
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tipCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 18,
    gap: 8,
    marginTop: 16,
  },
  tipLabel: {
    color: 'rgba(120,120,130,1)',
    fontSize: 10,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  tipText: {
    color: 'rgba(200,200,210,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 22,
  },
  guideStep: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  guideStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,107,53,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  guideStepNumberText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  guideStepText: {
    flex: 1,
    color: 'rgba(200,200,210,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 22,
  },
});
