import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getSetsPerMuscle } from '@/lib/muscleMapping';

/**
 * Ambient breathing background for the home screen.
 *
 * Two orbs (warm orange + cool blue) drift, pulse, and fade slowly.
 * View `opacity` drives the breathing (affects both circle + shadow glow).
 * Training volume modulates warmth — you feel your training state at a glance.
 *
 * Cycles: 15-25s · Performance: Reanimated UI thread only
 */
export function AmbientBackground() {
  const { history } = useWorkoutStore();

  // ─── Data-driven intensity (0 = rest week, 1 = peak volume) ───
  const intensity = useMemo(() => {
    const setsPerMuscle = getSetsPerMuscle(history, 7);
    const total = Object.values(setsPerMuscle).reduce((a, b) => a + b, 0);
    return Math.min(total / 160, 1);
  }, [history]);

  // Smooth transition when workouts are logged
  const dataSV = useSharedValue(intensity);
  useEffect(() => {
    dataSV.value = withTiming(intensity, { duration: 3000 });
  }, [intensity]);

  // ─── Breathing shared values (4 total — 2 per orb) ───
  const warmDrift = useSharedValue(0);
  const warmPulse = useSharedValue(0);
  const coolDrift = useSharedValue(0);
  const coolPulse = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.inOut(Easing.sin);

    // Warm orb: drift + pulse (longer cycles = less CPU)
    warmDrift.value = withRepeat(
      withTiming(1, { duration: 22000, easing: ease }),
      -1,
      true,
    );
    warmPulse.value = withRepeat(
      withTiming(1, { duration: 18000, easing: ease }),
      -1,
      true,
    );

    // Cool orb: offset phase
    coolDrift.value = withDelay(
      4000,
      withRepeat(
        withTiming(1, { duration: 25000, easing: ease }),
        -1,
        true,
      ),
    );
    coolPulse.value = withDelay(
      3000,
      withRepeat(
        withTiming(1, { duration: 20000, easing: ease }),
        -1,
        true,
      ),
    );
  }, []);

  // ─── Animated styles ───
  const warmStyle = useAnimatedStyle(() => {
    const dataBoost = interpolate(dataSV.value, [0, 0.5, 1], [0.7, 0.85, 1.0]);
    const breathe = interpolate(warmPulse.value, [0, 1], [0.55, 1.0]);

    return {
      opacity: breathe * dataBoost,
      transform: [
        { translateX: interpolate(warmDrift.value, [0, 1], [-12, 12]) },
        { translateY: interpolate(warmDrift.value, [0, 1], [-8, 10]) },
        { scale: interpolate(warmPulse.value, [0, 1], [0.92, 1.12]) },
      ],
    };
  });

  const coolStyle = useAnimatedStyle(() => {
    const dataBoost = interpolate(dataSV.value, [0, 0.5, 1], [1.0, 0.8, 0.6]);
    const breathe = interpolate(coolPulse.value, [0, 1], [0.5, 1.0]);

    return {
      opacity: breathe * dataBoost,
      transform: [
        { translateX: interpolate(coolDrift.value, [0, 1], [-14, 10]) },
        { translateY: interpolate(coolDrift.value, [0, 1], [-8, 12]) },
        { scale: interpolate(coolPulse.value, [0, 1], [0.94, 1.1]) },
      ],
    };
  });

  return (
    <>
      <Animated.View
        style={[styles.orbWarm, warmStyle]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.orbCool, coolStyle]}
        pointerEvents="none"
      />
    </>
  );
}

const styles = StyleSheet.create({
  orbWarm: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 107, 53, 0.14)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 120,
  },
  orbCool: {
    position: 'absolute',
    top: '48%',
    left: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(59, 130, 246, 0.07)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 140,
  },
});
