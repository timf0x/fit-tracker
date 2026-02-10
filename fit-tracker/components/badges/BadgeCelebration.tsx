import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import { BadgeIcon } from './BadgeIcon';
import { ALL_BADGES, TIER_CONFIG } from '@/data/badges';
import { Fonts } from '@/constants/theme';
import i18n, { getLocale } from '@/lib/i18n';
import type { Badge, BadgeTier } from '@/types';

interface BadgeCelebrationProps {
  badgeIds: string[];
  visible: boolean;
  onDismiss: () => void;
}

function loc(obj: { name: string; nameFr: string }, field: 'name'): string {
  const isFr = getLocale() === 'fr';
  return isFr ? obj.nameFr : obj.name;
}

function getTierLabel(tier: BadgeTier): string {
  const config = TIER_CONFIG[tier];
  return getLocale() === 'fr' ? config.labelFr : config.label;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function BadgeCelebration({ badgeIds, visible, onDismiss }: BadgeCelebrationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const badges: Badge[] = badgeIds
    .map((id) => ALL_BADGES.find((b) => b.id === id))
    .filter(Boolean) as Badge[];

  // Animation shared values
  const overlayOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0.5);
  const badgeOpacity = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const nameOpacity = useSharedValue(0);
  const tierOpacity = useSharedValue(0);
  const pointsOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  const runAnimation = useCallback(() => {
    // Reset
    badgeScale.value = 0.5;
    badgeOpacity.value = 0;
    glowIntensity.value = 0;
    nameOpacity.value = 0;
    tierOpacity.value = 0;
    pointsOpacity.value = 0;
    buttonOpacity.value = 0;

    // Sequence
    overlayOpacity.value = withTiming(1, { duration: 200 });

    // Badge appears (200ms delay)
    badgeOpacity.value = withDelay(200, withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) }));
    badgeScale.value = withDelay(200, withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) }));

    // Glow burst (600ms)
    glowIntensity.value = withDelay(600, withSequence(
      withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
      withTiming(0.6, { duration: 200 }),
    ));

    // Name + tier (900ms)
    nameOpacity.value = withDelay(900, withTiming(1, { duration: 300 }));
    tierOpacity.value = withDelay(1000, withTiming(1, { duration: 300 }));

    // Points (1200ms)
    pointsOpacity.value = withDelay(1200, withTiming(1, { duration: 300 }));

    // Button (1600ms)
    buttonOpacity.value = withDelay(1600, withTiming(1, { duration: 300 }));

    // Haptic at badge reveal
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 600);
  }, [overlayOpacity, badgeScale, badgeOpacity, glowIntensity, nameOpacity, tierOpacity, pointsOpacity, buttonOpacity]);

  useEffect(() => {
    if (visible && badges.length > 0) {
      setCurrentIndex(0);
      runAnimation();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < badges.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      runAnimation();
    } else {
      // Dismiss
      overlayOpacity.value = withTiming(0, { duration: 200 });
      setTimeout(() => {
        onDismiss();
      }, 220);
    }
  }, [currentIndex, badges.length, onDismiss, runAnimation, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const badgeAnimStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => {
    const badge = badges[currentIndex];
    if (!badge) return {};
    const tierColor = TIER_CONFIG[badge.tier].color;
    return {
      shadowColor: tierColor,
      shadowRadius: interpolate(glowIntensity.value, [0, 1], [0, 40]),
      shadowOpacity: interpolate(glowIntensity.value, [0, 1], [0, 0.6]),
      backgroundColor: `${tierColor}${Math.round(glowIntensity.value * 15).toString(16).padStart(2, '0')}`,
    };
  });

  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: interpolate(nameOpacity.value, [0, 1], [10, 0]) }],
  }));

  const tierStyle = useAnimatedStyle(() => ({
    opacity: tierOpacity.value,
  }));

  const pointsStyle = useAnimatedStyle(() => ({
    opacity: pointsOpacity.value,
    transform: [{ translateY: interpolate(pointsOpacity.value, [0, 1], [8, 0]) }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: interpolate(buttonOpacity.value, [0, 1], [10, 0]) }],
  }));

  if (!visible || badges.length === 0) return null;

  const badge = badges[currentIndex];
  if (!badge) return null;

  const tierColor = TIER_CONFIG[badge.tier].color;
  const isLast = currentIndex === badges.length - 1;
  const buttonLabel = isLast
    ? i18n.t('trophies.celebration.continue')
    : i18n.t('trophies.celebration.next');

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleNext}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <View style={styles.content}>
          {/* Glow backdrop */}
          <Animated.View style={[styles.glowCircle, glowStyle]} />

          {/* Badge */}
          <Animated.View style={badgeAnimStyle}>
            <BadgeIcon badge={badge} size={140} isUnlocked isNew />
          </Animated.View>

          {/* Tier label */}
          <Animated.View style={[styles.tierRow, tierStyle]}>
            <Text style={[styles.tierLabel, { color: tierColor }]}>
              {getTierLabel(badge.tier).toUpperCase()}
            </Text>
          </Animated.View>

          {/* Badge name */}
          <Animated.View style={nameStyle}>
            <Text style={styles.badgeName}>{loc(badge, 'name')}</Text>
          </Animated.View>

          {/* Points */}
          <Animated.View style={[styles.pointsRow, pointsStyle]}>
            <Sparkles size={18} color="#FFD700" strokeWidth={2.5} />
            <Text style={styles.pointsText}>+{badge.points} {i18n.t('trophies.points')}</Text>
          </Animated.View>

          {/* Badge counter */}
          {badges.length > 1 && (
            <Text style={styles.counter}>
              {currentIndex + 1} / {badges.length}
            </Text>
          )}

          {/* Continue button */}
          <Animated.View style={[styles.buttonContainer, buttonStyle]}>
            <Pressable
              style={[styles.button, { backgroundColor: `${tierColor}25`, borderColor: `${tierColor}40` }]}
              onPress={handleNext}
            >
              <Text style={[styles.buttonText, { color: tierColor }]}>{buttonLabel}</Text>
              <ChevronRight size={18} color={tierColor} strokeWidth={2.5} />
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  glowCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -30,
    shadowOffset: { width: 0, height: 0 },
  },
  tierRow: {
    marginTop: 8,
  },
  tierLabel: {
    fontSize: 13,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 2,
  },
  badgeName: {
    color: '#fff',
    fontSize: 26,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    textAlign: 'center',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  pointsText: {
    color: '#FFD700',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  counter: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 24,
    width: SCREEN_WIDTH * 0.6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 17,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
});
