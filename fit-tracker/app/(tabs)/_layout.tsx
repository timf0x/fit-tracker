import { Tabs } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Flame, Dumbbell, TrendingUp, Settings } from 'lucide-react-native';
import { Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const TIMING_CONFIG = {
  duration: 400,
  easing: Easing.bezier(0.4, 0, 0.2, 1),
};

const TAB_CONFIG = [
  { name: 'index', labelKey: 'tabs.home', icon: Flame },
  { name: 'workouts', labelKey: 'tabs.workouts', icon: Dumbbell },
  { name: 'stats', labelKey: 'tabs.stats', icon: TrendingUp },
  { name: 'prefs', labelKey: 'tabs.settings', icon: Settings },
];

function DockTab({
  config,
  isFocused,
  onPress,
}: {
  config: (typeof TAB_CONFIG)[number];
  isFocused: boolean;
  onPress: () => void;
}) {
  const IconComponent = config.icon;
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, TIMING_CONFIG);
  }, [isFocused]);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(0,0,0,0)', 'rgba(255,255,255,1)'],
    ),
    paddingHorizontal: interpolate(progress.value, [0, 1], [14, 18]),
    shadowOpacity: interpolate(progress.value, [0, 1], [0, 0.5]),
  }));

  // Label smoothly expands/collapses like the CSS max-width transition
  const labelStyle = useAnimatedStyle(() => ({
    maxWidth: interpolate(progress.value, [0, 1], [0, 100]),
    opacity: progress.value,
    marginLeft: interpolate(progress.value, [0, 1], [0, 8]),
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.tab, pillStyle]}>
        <IconComponent
          size={20}
          color={isFocused ? '#1a1a1a' : 'rgba(163,163,170,1)'}
          strokeWidth={isFocused ? 2.5 : 1.8}
        />
        <Animated.Text style={[styles.tabLabel, labelStyle]} numberOfLines={1}>
          {i18n.t(config.labelKey)}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function DockBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView intensity={80} tint="systemChromeMaterialDark" style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
      <View style={styles.innerPill}>
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG[index];
          if (!config) return null;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate(route.name);
            }
          };

          return (
            <DockTab
              key={route.key}
              config={config}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </BlurView>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <DockBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="prefs" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  innerPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 40,
    padding: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    // Shadow base (opacity animated)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  tabLabel: {
    color: '#1a1a1a',
    fontSize: 13,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    overflow: 'hidden',
  },
});
