import { PropsWithChildren } from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  /** Scale factor on press (default 0.975) */
  activeScale?: number;
  /** Style applied to the inner animated view (card styles go here) */
  style?: StyleProp<ViewStyle>;
}

/**
 * Drop-in Pressable replacement with smooth Reanimated scale feedback.
 * Card/button styles go on `style` prop (applied to inner Animated.View).
 */
export function PressableScale({
  children,
  activeScale = 0.975,
  style,
  onPressIn,
  onPressOut,
  ...props
}: PropsWithChildren<PressableScaleProps>) {
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, activeScale]) }],
  }));

  return (
    <Pressable
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: 80 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(0, { damping: 15, stiffness: 400 });
        onPressOut?.(e);
      }}
      {...props}
    >
      <Animated.View style={[style, animStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
