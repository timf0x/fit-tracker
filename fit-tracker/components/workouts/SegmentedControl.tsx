import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Fonts } from '@/constants/theme';

const TIMING = { duration: 300, easing: Easing.bezier(0.4, 0, 0.2, 1) };
const PADDING = 4;
const BORDER = 1;

interface SegmentedControlProps {
  tabs: string[];
  activeIndex: number;
  onTabChange: (index: number) => void;
}

export function SegmentedControl({ tabs, activeIndex, onTabChange }: SegmentedControlProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const tabWidth = containerWidth > 0 ? (containerWidth - PADDING * 2 - BORDER * 2) / tabs.length : 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(activeIndex * tabWidth, TIMING) }],
    width: tabWidth,
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {containerWidth > 0 && (
        <Animated.View style={[styles.indicator, indicatorStyle]} />
      )}
      {tabs.map((tab, index) => (
        <Pressable
          key={tab}
          style={styles.tab}
          onPress={() => onTabChange(index)}
        >
          <Text
            style={[
              styles.tabText,
              activeIndex === index && styles.tabTextActive,
            ]}
          >
            {tab}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: PADDING,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    color: 'rgba(120, 120, 130, 1)',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'rgba(220, 220, 230, 1)',
  },
});
