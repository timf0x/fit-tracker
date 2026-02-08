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

  // ─── Breathing shared values ───
  const warmDriftX = useSharedValue(0);
  const warmDriftY = useSharedValue(0);
  const warmPulse = useSharedValue(0);

  const coolDriftX = useSharedValue(0);
  const coolDriftY = useSharedValue(0);
  const coolPulse = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.inOut(Easing.sin);

    // Warm orb: 3 independent slow cycles
    warmDriftX.value = withRepeat(
      withTiming(1, { duration: 18000, easing: ease }),
      -1,
      true,
    );
    warmDriftY.value = withDelay(
      2000,
      withRepeat(
        withTiming(1, { duration: 22000, easing: ease }),
        -1,
        true,
      ),
    );
    warmPulse.value = withRepeat(
      withTiming(1, { duration: 15000, easing: ease }),
      -1,
      true,
    );

    // Cool orb: offset phases (never syncs with warm)
    coolDriftX.value = withDelay(
      5000,
      withRepeat(
        withTiming(1, { duration: 20000, easing: ease }),
        -1,
        true,
      ),
    );
    coolDriftY.value = withDelay(
      8000,
      withRepeat(
        withTiming(1, { duration: 25000, easing: ease }),
        -1,
        true,
      ),
    );
    coolPulse.value = withDelay(
      3000,
      withRepeat(
        withTiming(1, { duration: 17000, easing: ease }),
        -1,
        true,
      ),
    );
  }, []);

  // ─── Animated styles ───
  // opacity on the View controls everything (circle + shadow) in one shot
  const warmStyle = useAnimatedStyle(() => {
    // Data: warm orb more visible when training hard
    const dataBoost = interpolate(dataSV.value, [0, 0.5, 1], [0.7, 0.85, 1.0]);
    const breathe = interpolate(warmPulse.value, [0, 1], [0.55, 1.0]);

    return {
      opacity: breathe * dataBoost,
      transform: [
        { translateX: interpolate(warmDriftX.value, [0, 1], [-15, 15]) },
        { translateY: interpolate(warmDriftY.value, [0, 1], [-12, 12]) },
        { scale: interpolate(warmPulse.value, [0, 1], [0.9, 1.15]) },
      ],
    };
  });

  const coolStyle = useAnimatedStyle(() => {
    // Data: cool orb more visible during rest / low volume
    const dataBoost = interpolate(dataSV.value, [0, 0.5, 1], [1.0, 0.8, 0.6]);
    const breathe = interpolate(coolPulse.value, [0, 1], [0.5, 1.0]);

    return {
      opacity: breathe * dataBoost,
      transform: [
        { translateX: interpolate(coolDriftX.value, [0, 1], [-18, 12]) },
        { translateY: interpolate(coolDriftY.value, [0, 1], [-10, 14]) },
        { scale: interpolate(coolPulse.value, [0, 1], [0.92, 1.12]) },
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
