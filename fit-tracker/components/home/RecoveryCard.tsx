import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Fonts, Spacing } from '@/constants/theme';
import { ScoreRing } from '@/components/recovery/ScoreRing';
import { useWorkoutStore } from '@/stores/workoutStore';
import { computeRecoveryOverview } from '@/lib/recoveryHelpers';
import i18n from '@/lib/i18n';

function getRecoveryNudge(score: number): string {
  if (score >= 85) return i18n.t('recoveryCard.nudgeGood');
  if (score >= 60) return i18n.t('recoveryCard.nudgeModerate');
  return i18n.t('recoveryCard.nudgeLow');
}

export function RecoveryCard() {
  const router = useRouter();
  const { history } = useWorkoutStore();

  const recoveryScore = useMemo(() => {
    const hasData = history.some((s) => s.endTime && s.completedExercises.length > 0);
    if (!hasData) return 100;
    return computeRecoveryOverview(history).overallScore;
  }, [history]);

  const nudge = getRecoveryNudge(recoveryScore);

  return (
    <View style={styles.container}>
      <PressableScale activeScale={0.975} onPress={() => router.push('/recovery')}>
        <View style={styles.card}>
          <View style={styles.row}>
            <ScoreRing score={recoveryScore} size={64} />
            <View style={styles.info}>
              <View style={styles.topRow}>
                <Text style={styles.label}>{i18n.t('recoveryCard.label')}</Text>
                <ChevronRight size={14} color="rgba(255,255,255,0.25)" strokeWidth={2} />
              </View>
              <Text style={styles.nudge} numberOfLines={1}>
                {nudge}
              </Text>
            </View>
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: 'rgba(156, 163, 175, 1)',
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  nudge: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
