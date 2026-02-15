import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { X, ArrowLeftRight } from 'lucide-react-native';
import { Colors, Fonts, GlassStyle, IconStroke } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { getExerciseById } from '@/data/exercises';
import { EXERCISE_POOLS } from '@/constants/programTemplates';
import { MUSCLE_LABELS_FR } from '@/lib/muscleMapping';
import type { Equipment } from '@/types';

interface ExerciseSwapSheetProps {
  visible: boolean;
  onClose: () => void;
  currentExerciseId: string;
  muscleTargets: string[];
  allowedEquipment: Equipment[];
  onSwap: (newExerciseId: string) => void;
}

export function ExerciseSwapSheet({
  visible,
  onClose,
  currentExerciseId,
  muscleTargets,
  allowedEquipment,
  onSwap,
}: ExerciseSwapSheetProps) {
  const currentEx = getExerciseById(currentExerciseId);

  // Find alternatives from the same muscle pool
  const alternatives = useMemo(() => {
    const results: Array<{ id: string; name: string; nameFr: string; equipment: string; bodyPart: string; gifUrl?: string }> = [];
    const seen = new Set<string>();
    seen.add(currentExerciseId);

    for (const muscle of muscleTargets) {
      const pool = EXERCISE_POOLS[muscle] || [];
      for (const id of pool) {
        if (seen.has(id)) continue;
        const ex = getExerciseById(id);
        if (!ex) continue;
        if (!allowedEquipment.includes(ex.equipment)) continue;
        seen.add(id);
        results.push({
          id: ex.id,
          name: ex.name,
          nameFr: ex.nameFr,
          equipment: ex.equipment,
          bodyPart: ex.bodyPart,
          gifUrl: ex.gifUrl,
        });
        if (results.length >= 8) break;
      }
      if (results.length >= 8) break;
    }
    return results;
  }, [currentExerciseId, muscleTargets, allowedEquipment]);

  // Find which muscle this exercise belongs to
  const muscleName = useMemo(() => {
    if (!currentEx) return '';
    for (const muscle of muscleTargets) {
      const pool = EXERCISE_POOLS[muscle] || [];
      if (pool.includes(currentExerciseId)) {
        return MUSCLE_LABELS_FR[muscle] || muscle;
      }
    }
    return '';
  }, [currentExerciseId, muscleTargets]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <ArrowLeftRight size={18} color={Colors.primary} />
            <Text style={styles.title}>{i18n.t('exerciseSwap.title')}</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="rgba(255,255,255,0.5)" />
            </Pressable>
          </View>

          {/* Current exercise */}
          {currentEx && (
            <View style={styles.currentRow}>
              <ExerciseIcon
                exerciseName={currentEx.name}
                bodyPart={currentEx.bodyPart}
                gifUrl={currentEx.gifUrl}
                size={16}
                containerSize={36}
              />
              <View style={styles.currentInfo}>
                <Text style={styles.currentName}>{currentEx.nameFr}</Text>
                <Text style={styles.currentMeta}>{muscleName} · {currentEx.equipment}</Text>
              </View>
              <Text style={styles.currentLabel}>{i18n.t('common.currentLabel')}</Text>
            </View>
          )}

          <View style={styles.separator} />

          {/* Alternatives */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {alternatives.length === 0 ? (
              <Text style={styles.emptyText}>{i18n.t('exerciseSwap.noAlternatives')}</Text>
            ) : (
              alternatives.map((alt, idx) => (
                <View key={alt.id}>
                  <Pressable
                    style={styles.altRow}
                    onPress={() => {
                      onSwap(alt.id);
                      onClose();
                    }}
                  >
                    <ExerciseIcon
                      exerciseName={alt.name}
                      bodyPart={alt.bodyPart}
                      gifUrl={alt.gifUrl}
                      size={16}
                      containerSize={36}
                    />
                    <View style={styles.altInfo}>
                      <Text style={styles.altName}>{alt.nameFr}</Text>
                      <Text style={styles.altMeta}>{alt.equipment}</Text>
                    </View>
                    <Text style={styles.swapLabel}>{i18n.t('exerciseSwap.choose')}</Text>
                  </Pressable>
                  {idx < alternatives.length - 1 && <View style={styles.altSep} />}
                </View>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: GlassStyle.card.borderWidth,
    borderBottomWidth: 0,
    borderColor: GlassStyle.card.borderColor,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    flex: 1,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GlassStyle.card.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: GlassStyle.card.backgroundColor,
  },
  currentInfo: {
    flex: 1,
    gap: 2,
  },
  currentName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  currentMeta: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  currentLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: GlassStyle.card.borderColor,
    marginVertical: 8,
  },
  list: {
    paddingHorizontal: 20,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 20,
  },
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  altInfo: {
    flex: 1,
    gap: 2,
  },
  altName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  altMeta: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  swapLabel: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  altSep: {
    height: 1,
    backgroundColor: GlassStyle.card.backgroundColor,
    marginLeft: 46,
  },
});
