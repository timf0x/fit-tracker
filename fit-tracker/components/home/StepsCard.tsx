import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { useRouter } from 'expo-router';
import { Footprints } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import { getTodaySteps, watchTodaySteps } from '@/services/pedometer';

export function StepsCard() {
  const router = useRouter();
  const [steps, setSteps] = useState(0);

  const fetchSteps = useCallback(async () => {
    const count = await getTodaySteps();
    setSteps(count);
  }, []);

  useEffect(() => {
    fetchSteps();

    // Live updates (incremental)
    const unsub = watchTodaySteps((incremental) => {
      // watchStepCount returns steps since subscription, add to initial
      setSteps((prev) => Math.max(prev, prev + incremental));
    });

    // Refresh when app comes to foreground
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchSteps();
    });

    return () => {
      unsub();
      sub.remove();
    };
  }, [fetchSteps]);

  const display = steps >= 1000
    ? `${(steps / 1000).toFixed(1).replace(/\.0$/, '')}k`
    : steps.toLocaleString();

  return (
    <PressableScale style={styles.card} onPress={() => router.push('/steps')}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Footprints size={16} color="#3b82f6" strokeWidth={2.5} />
        </View>
        <Text style={styles.label}>STEPS</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.valueWhite}>{display}</Text>
        <Text style={styles.unit}> /10k</Text>
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
    justifyContent: 'space-between' as const,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: 'rgba(156, 163, 175, 1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueWhite: {
    color: Colors.text,
    fontSize: 32,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  unit: {
    color: 'rgba(120, 120, 130, 1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
