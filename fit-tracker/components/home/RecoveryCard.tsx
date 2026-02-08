import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { mockRecoveryOverview } from '@/lib/mock-data';
import { ScoreRing } from '@/components/recovery/ScoreRing';
import { useWorkoutStore } from '@/stores/workoutStore';
import { computeRecoveryOverview } from '@/lib/recoveryHelpers';

export function RecoveryCard() {
  const router = useRouter();
  const { history } = useWorkoutStore();

  const recoveryScore = useMemo(() => {
    const hasData = history.some((s) => s.endTime && s.completedExercises.length > 0);
    if (!hasData) return mockRecoveryOverview.overallScore;
    return computeRecoveryOverview(history).overallScore;
  }, [history]);

  return (
    <Pressable style={styles.card} onPress={() => router.push('/recovery')}>
      <View style={styles.content}>
        <ScoreRing score={recoveryScore} size={72} />
        <Text style={styles.label}>RECUP</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
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
