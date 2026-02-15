import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, AppState, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { PressableScale } from '@/components/ui/PressableScale';
import { useRouter } from 'expo-router';
import { Footprints, ChevronRight } from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { getTodaySteps, watchTodaySteps } from '@/services/pedometer';
import { useHomeRefreshKey } from '@/lib/refreshContext';

const GOAL = 10000;

export function StepsCard() {
  const router = useRouter();
  const [steps, setSteps] = useState(0);
  const baseStepsRef = useRef(0);
  const refreshKey = useHomeRefreshKey();
  const [barContainerWidth, setBarContainerWidth] = useState(0);

  const fetchSteps = useCallback(async () => {
    const count = await getTodaySteps();
    baseStepsRef.current = count;
    setSteps(count);
  }, []);

  useEffect(() => {
    fetchSteps();

    const unsub = watchTodaySteps((stepsSinceSubscription) => {
      setSteps(baseStepsRef.current + stepsSinceSubscription);
    });

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchSteps();
    });

    return () => {
      unsub();
      sub.remove();
    };
  }, [fetchSteps]);

  useEffect(() => {
    if (refreshKey > 0) fetchSteps();
  }, [refreshKey, fetchSteps]);

  const display = steps >= 1000
    ? `${(steps / 1000).toFixed(1).replace(/\.0$/, '')}k`
    : steps.toLocaleString();

  const pct = Math.min(steps / GOAL, 1);
  const progressWidth = `${Math.round(pct * 100)}%`;

  const fillAnim = useSharedValue(1);

  useEffect(() => {
    if (refreshKey > 0) {
      fillAnim.value = 0;
      fillAnim.value = withDelay(200, withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }));
    }
  }, [refreshKey]);

  const fillAnimStyle = useAnimatedStyle(() => ({
    width: barContainerWidth > 0 ? pct * fillAnim.value * barContainerWidth : 0,
  }));

  const valueAnim = useSharedValue(1);

  useEffect(() => {
    if (refreshKey > 0) {
      valueAnim.value = 0;
      valueAnim.value = withDelay(100, withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }));
    }
  }, [refreshKey]);

  const valueAnimStyle = useAnimatedStyle(() => ({
    opacity: valueAnim.value,
    transform: [{ scale: interpolate(valueAnim.value, [0, 1], [0.85, 1]) }],
  }));

  const handleBarLayout = useCallback((e: LayoutChangeEvent) => {
    setBarContainerWidth(e.nativeEvent.layout.width);
  }, []);

  return (
    <View style={styles.container}>
      <PressableScale activeScale={0.975} onPress={() => router.push('/steps')}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Footprints size={18} color="#3b82f6" strokeWidth={2.5} />
            </View>
            <View style={styles.info}>
              <View style={styles.topRow}>
                <Text style={styles.label}>{i18n.t('home.stats.steps')}</Text>
                <ChevronRight size={14} color="rgba(255,255,255,0.25)" strokeWidth={2} />
              </View>
              <Animated.View style={[styles.valueRow, valueAnimStyle]}>
                <Text style={styles.valueWhite}>{display}</Text>
                <Text style={styles.unit}> /10k</Text>
              </Animated.View>
              <View style={styles.progressBg} onLayout={handleBarLayout}>
                {barContainerWidth > 0 ? (
                  <Animated.View style={[styles.progressFill, fillAnimStyle]} />
                ) : (
                  <View style={[styles.progressFill, { width: progressWidth as any }]} />
                )}
              </View>
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
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
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
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueWhite: {
    color: Colors.text,
    fontSize: 26,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  unit: {
    color: 'rgba(120, 120, 130, 1)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
});
