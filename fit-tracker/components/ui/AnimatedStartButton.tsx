import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Play, Zap } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';

/**
 * "Ignite" start button — premium loading animation before navigation.
 *
 * 1. Tap → button contracts, fill bar sweeps left→right
 * 2. Label crossfades to loadingLabel with ⚡ icon
 * 3. Leading-edge glow follows the fill bar
 * 4. At 100% → scale pop + heavy haptic → callback fires
 */

type IconComponent = React.ComponentType<{ size: number; color: string; fill?: string }>;

interface AnimatedStartButtonProps {
  onPress: () => void;
  label?: string;
  loadingLabel?: string;
  style?: Record<string, unknown>;
  disabled?: boolean;
  iconSize?: number;
  icon?: IconComponent;
  loadingIcon?: IconComponent;
  /** Total fill animation duration in ms (default 650) */
  fillDuration?: number;
}

export function AnimatedStartButton({
  onPress,
  label = i18n.t('common.start'),
  loadingLabel = i18n.t('common.letsGo'),
  style,
  disabled,
  iconSize = 18,
  icon: IconDefault = Play,
  loadingIcon: IconLoading = Zap,
  fillDuration = 650,
}: AnimatedStartButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const btnWidth = useSharedValue(0);

  const triggerNav = useCallback(() => {
    onPress();
    setTimeout(() => {
      setIsAnimating(false);
      progress.value = 0;
      scale.value = 1;
    }, 500);
  }, [onPress]);

  const handlePress = useCallback(() => {
    if (isAnimating || disabled) return;
    setIsAnimating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Press-in
    scale.value = withTiming(0.97, { duration: 80 });

    // Fill sweep
    progress.value = withTiming(1, {
      duration: fillDuration,
      easing: Easing.bezier(0.22, 0.68, 0.35, 1.0),
    });

    // Mid-fill haptic pulse for longer animations (simulates processing steps)
    if (fillDuration > 1000) {
      const pulseInterval = fillDuration / 4;
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), pulseInterval);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), pulseInterval * 2);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), pulseInterval * 3);
    }

    // Completion: scale pop + heavy haptic + navigate
    const popDelay = fillDuration + 30;
    const navDelay = fillDuration + 230;
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      scale.value = withSequence(
        withTiming(1.04, { duration: 130, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 100 }),
      );
    }, popDelay);

    setTimeout(triggerNav, navDelay);
  }, [isAnimating, disabled, fillDuration, triggerNav]);

  const handleLayout = (e: LayoutChangeEvent) => {
    btnWidth.value = e.nativeEvent.layout.width;
  };

  // ── Animated Styles ──

  const containerAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const fillAnim = useAnimatedStyle(() => ({
    width: progress.value * btnWidth.value,
    opacity: progress.value > 0.01 ? 1 : 0,
  }));

  const glowAnim = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.08, 0.85, 1], [0, 0.9, 0.7, 0]),
  }));

  // Pure opacity crossfade — no translateY to avoid text jumping
  const labelAnim = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.15], [1, 0]),
  }));

  const loadingAnim = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.1, 0.3], [0, 1]),
  }));

  // Extract only visual props from external style (no layout props)
  const s = (style || {}) as ViewStyle;
  const outerStyle: ViewStyle = {
    ...(s.backgroundColor != null && { backgroundColor: s.backgroundColor }),
    ...(s.borderRadius != null && { borderRadius: s.borderRadius }),
    ...(s.paddingVertical != null && { paddingVertical: s.paddingVertical }),
    ...(s.paddingHorizontal != null && { paddingHorizontal: s.paddingHorizontal }),
  };

  return (
    <Animated.View style={[containerAnim, { width: '100%' }]}>
      <Pressable
        style={[styles.button, outerStyle]}
        onPress={handlePress}
        onLayout={handleLayout}
        disabled={isAnimating || disabled}
      >
        {/* Fill overlay */}
        <Animated.View style={[styles.fill, fillAnim]}>
          <Animated.View style={[styles.fillGlow, glowAnim]} />
        </Animated.View>

        {/* Content layer — both labels stacked, crossfade via opacity */}
        <View style={styles.contentLayer}>
          {/* Default label */}
          <Animated.View style={[styles.row, labelAnim]}>
            <IconDefault size={iconSize} color="#0C0C0C" fill="#0C0C0C" />
            <Text style={styles.label}>{label}</Text>
          </Animated.View>

          {/* Loading label — positioned on top */}
          <Animated.View style={[styles.row, styles.overlay, loadingAnim]}>
            <IconLoading size={iconSize} color="#0C0C0C" fill="#0C0C0C" />
            <Text style={styles.label}>{loadingLabel}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#0C0C0C',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
  },
  fillGlow: {
    position: 'absolute',
    right: -4,
    top: 0,
    bottom: 0,
    width: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
