import { Tabs } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import { Flame, Trophy, Dumbbell, Settings } from 'lucide-react-native';
import { Fonts } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  interpolateColor,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const TIMING_CONFIG = {
  duration: 400,
  easing: Easing.bezier(0.4, 0, 0.2, 1),
};

const TAB_CONFIG = [
  { name: 'index', label: 'Home', icon: Flame },
  { name: 'trophies', label: 'Trophées', icon: Trophy },
  { name: 'workouts', label: 'Workouts', icon: Dumbbell },
  { name: 'prefs', label: 'Prefs', icon: Settings },
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

  const pillStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        ['rgba(0,0,0,0)', 'rgba(255,255,255,1)'],
      ),
      paddingHorizontal: interpolate(progress.value, [0, 1], [16, 20]),
      shadowOpacity: interpolate(progress.value, [0, 1], [0, 0.5]),
    };
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.tab, pillStyle]}>
        <IconComponent
          size={20}
          color={isFocused ? '#1a1a1a' : 'rgba(163,163,170,1)'}
          strokeWidth={isFocused ? 2.5 : 1.8}
        />

        {isFocused && (
          <Animated.Text
            entering={FadeIn.duration(250).delay(80)}
            exiting={FadeOut.duration(100)}
            style={styles.tabLabel}
          >
            {config.label}
          </Animated.Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

function DockBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
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
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <DockBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="trophies" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="prefs" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dock: {
    backgroundColor: 'rgba(20, 20, 20, 0.6)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  innerPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 40,
    padding: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    gap: 8,
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
  },
});
