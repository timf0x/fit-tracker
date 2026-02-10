import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { useRouter } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { ScoreRing } from '@/components/recovery/ScoreRing';
import { useWorkoutStore } from '@/stores/workoutStore';
import { computeRecoveryOverview } from '@/lib/recoveryHelpers';
import i18n from '@/lib/i18n';

export function RecoveryCard() {
  const router = useRouter();
  const { history } = useWorkoutStore();

  const recoveryScore = useMemo(() => {
    const hasData = history.some((s) => s.endTime && s.completedExercises.length > 0);
    if (!hasData) return 100; // Fully recovered — no training yet
    return computeRecoveryOverview(history).overallScore;
  }, [history]);

  return (
    <PressableScale style={styles.card} onPress={() => router.push('/recovery')}>
      <View style={styles.content}>
        <ScoreRing score={recoveryScore} size={72} />
        <Text style={styles.label}>{i18n.t('recoveryCard.label')}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
    minHeight: 132,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    color: 'rgba(156, 163, 175, 1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
});
