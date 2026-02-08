/**
 * BodyMapScrubOverlay
 * Transparent PanResponder overlay on the body map.
 * Slide finger across muscles → haptic tick on zone change, floating tooltip, select on lift.
 */

import { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { findHitZone } from '@/constants/bodyHitZones';
import { BODY_PART_LABELS, RECOVERY_COLORS } from '@/constants/recovery';
import { MuscleRecoveryData, RecoveryBodyPart } from '@/types';
import { Fonts } from '@/constants/theme';

interface ScrubOverlayProps {
  bodyWidth: number;
  bodyHeight: number;
  bodyOffsetX: number;
  bodyOffsetY: number;
  containerPageX: number;
  containerPageY: number;
  view: 'front' | 'back';
  muscles: MuscleRecoveryData[];
  onMuscleSelect: (muscle: MuscleRecoveryData) => void;
}

export function BodyMapScrubOverlay({
  bodyWidth,
  bodyHeight,
  bodyOffsetX,
  bodyOffsetY,
  containerPageX,
  containerPageY,
  view,
  muscles,
  onMuscleSelect,
}: ScrubOverlayProps) {
  const [currentZone, setCurrentZone] = useState<RecoveryBodyPart | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  // Refs to avoid stale closures in PanResponder
  const currentZoneRef = useRef<RecoveryBodyPart | null>(null);
  const propsRef = useRef({
    bodyWidth, bodyHeight, bodyOffsetX, bodyOffsetY,
    containerPageX, containerPageY, view, muscles, onMuscleSelect,
  });
  propsRef.current = {
    bodyWidth, bodyHeight, bodyOffsetX, bodyOffsetY,
    containerPageX, containerPageY, view, muscles, onMuscleSelect,
  };

  const bannerOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) =>
          Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,

        onPanResponderGrant: (evt) => {
          processTouch(evt);

          setBannerVisible(true);
          Animated.timing(bannerOpacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }).start();
        },

        onPanResponderMove: (evt) => {
          processTouch(evt);
        },

        onPanResponderRelease: () => {
          const zone = currentZoneRef.current;
          if (zone) {
            const { muscles: m, onMuscleSelect: cb } = propsRef.current;
            const muscleData = m.find((md) => md.bodyPart === zone);
            if (muscleData) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              cb(muscleData);
            }
          }
          reset();
        },

        onPanResponderTerminate: () => {
          reset();
        },
      }),
    [], // stable — uses refs for current values
  );

  function processTouch(evt: any) {
    const p = propsRef.current;
    // Use locationX/Y (relative to this view) instead of pageX/Y
    // This is scroll-proof — no dependency on stale containerPageX/Y
    const locationX = evt.nativeEvent.locationX;
    const locationY = evt.nativeEvent.locationY;
    const localX = locationX - p.bodyOffsetX;
    const localY = locationY - p.bodyOffsetY;
    const nx = p.bodyWidth > 0 ? localX / p.bodyWidth : 0;
    const ny = p.bodyHeight > 0 ? localY / p.bodyHeight : 0;

    const zone = findHitZone(nx, ny, p.view);

    if (zone !== currentZoneRef.current) {
      currentZoneRef.current = zone;
      setCurrentZone(zone);
      if (zone) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }

  function reset() {
    currentZoneRef.current = null;
    setCurrentZone(null);
    Animated.timing(bannerOpacity, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setBannerVisible(false);
    });
  }

  const tooltipLabel = currentZone
    ? BODY_PART_LABELS[currentZone]?.fr || currentZone
    : '';

  const muscleData = currentZone
    ? muscles.find((m) => m.bodyPart === currentZone)
    : null;
  const statusColor = muscleData ? RECOVERY_COLORS[muscleData.status] : '#FFFFFF';

  return (
    <View
      style={StyleSheet.absoluteFill}
      {...panResponder.panHandlers}
      pointerEvents="box-only"
    >
      {/* Fixed banner at top of body map */}
      {bannerVisible && currentZone && (
        <Animated.View
          style={[styles.banner, { opacity: bannerOpacity }]}
          pointerEvents="none"
        >
          <View style={[styles.bannerDot, { backgroundColor: statusColor }]} />
          <Text style={styles.bannerText}>{tooltipLabel}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(12, 12, 12, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bannerText: {
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
