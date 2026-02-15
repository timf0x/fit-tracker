import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  withRepeat,
  withTiming,
  Easing,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { Activity, BarChart3, TrendingUp, Shield } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import { AmbientBackground } from '@/components/home/AmbientBackground';
import { useAuthStore } from '@/stores/authStore';
import i18n from '@/lib/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as typeof FlatList;

// ─── Slide Data ───

const ICON_MAP = {
  Activity,
  BarChart3,
  TrendingUp,
  Shield,
} as const;

interface SlideData {
  id: string;
  icon: keyof typeof ICON_MAP;
  titleKey: string;
  subtitleKey: string;
}

const SLIDES: SlideData[] = [
  {
    id: '1',
    icon: 'Activity',
    titleKey: 'onboarding.slide1Title',
    subtitleKey: 'onboarding.slide1Subtitle',
  },
  {
    id: '2',
    icon: 'BarChart3',
    titleKey: 'onboarding.slide2Title',
    subtitleKey: 'onboarding.slide2Subtitle',
  },
  {
    id: '3',
    icon: 'TrendingUp',
    titleKey: 'onboarding.slide3Title',
    subtitleKey: 'onboarding.slide3Subtitle',
  },
  {
    id: '4',
    icon: 'Shield',
    titleKey: 'onboarding.slide4Title',
    subtitleKey: 'onboarding.slide4Subtitle',
  },
];

// ─── Icon Glow Component ───

function GlowingIcon({ icon, index, scrollX }: { icon: keyof typeof ICON_MAP; index: number; scrollX: SharedValue<number> }) {
  const IconComponent = ICON_MAP[icon];
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glow.value, [0, 1], [0.2, 0.5]),
    shadowRadius: interpolate(glow.value, [0, 1], [10, 20]),
  }));

  const contentStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    return {
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            scrollX.value,
            inputRange,
            [30, 0, 30],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.iconWrapper, glowStyle, contentStyle]}>
      <IconComponent size={64} color={Colors.primary} strokeWidth={2} />
    </Animated.View>
  );
}

// ─── Slide Text Component ───

function SlideText({ titleKey, subtitleKey, index, scrollX }: {
  titleKey: string;
  subtitleKey: string;
  index: number;
  scrollX: SharedValue<number>;
}) {
  const textStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    return {
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            scrollX.value,
            inputRange,
            [40, 0, 40],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.textContainer, textStyle]}>
      <Text style={styles.headline}>{i18n.t(titleKey)}</Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {i18n.t(subtitleKey)}
      </Text>
    </Animated.View>
  );
}

// ─── Pagination Dot ───

function PaginationDot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.15, 1, 0.15],
      Extrapolation.CLAMP,
    );

    const backgroundColor =
      opacity > 0.5 ? Colors.primary : 'rgba(255, 255, 255, 0.15)';

    return {
      width,
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [1, 1, 1],
        Extrapolation.CLAMP,
      ),
      backgroundColor,
    };
  });

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

// ─── Main Screen ───

export default function OnboardingScreen() {
  const router = useRouter();
  const { markOnboardingSeen } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleContinue = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      markOnboardingSeen();
      router.replace('/(auth)/welcome');
    }
  }, [currentIndex, markOnboardingSeen, router]);

  const handleSkip = useCallback(() => {
    markOnboardingSeen();
    router.replace('/(auth)/welcome');
  }, [markOnboardingSeen, router]);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const renderSlide = useCallback(
    ({ item, index }: { item: SlideData; index: number }) => (
      <View style={styles.slide}>
        <View style={styles.slideTop}>
          <GlowingIcon icon={item.icon} index={index} scrollX={scrollX} />
        </View>
        <SlideText
          titleKey={item.titleKey}
          subtitleKey={item.subtitleKey}
          index={index}
          scrollX={scrollX}
        />
      </View>
    ),
    [scrollX],
  );

  const keyExtractor = useCallback((item: SlideData) => item.id, []);

  return (
    <View style={styles.screen}>
      <AmbientBackground />

      <SafeAreaView style={styles.safe}>
        {/* Skip button — top right, hidden on last slide */}
        {!isLastSlide && (
          <Pressable
            style={styles.skipButton}
            onPress={handleSkip}
            hitSlop={12}
          >
            <Text style={styles.skipText}>{i18n.t('onboarding.skip')}</Text>
          </Pressable>
        )}

        {/* Slides */}
        <AnimatedFlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_: any, index: number) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          style={styles.flatList}
        />

        {/* Bottom section — pagination + CTA */}
        <View style={styles.bottomSection}>
          {/* Pagination dots */}
          <View style={styles.pagination}>
            {SLIDES.map((_, index) => (
              <PaginationDot key={index} index={index} scrollX={scrollX} />
            ))}
          </View>

          {/* CTA Button */}
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.ctaText}>
              {isLastSlide
                ? i18n.t('onboarding.getStarted')
                : i18n.t('onboarding.continue')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safe: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 8,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 32,
  },
  slideTop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 48,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
  },
  textContainer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaButton: {
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButtonPressed: {
    opacity: 0.85,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
});
