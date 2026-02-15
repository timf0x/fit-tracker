import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Spacing } from '@/constants/theme';

type CardSize = 'full' | 'half';

const SPRING_CONFIG = { damping: 25, stiffness: 300, mass: 0.8 };
const SCALE_ACTIVE = 1.025;
const ROW_GAP = 16;
const COL_GAP = 14;
const H_PAD = Spacing.lg; // 24

/* ------------------------------------------------------------------ */
/*  Layout Engine                                                       */
/* ------------------------------------------------------------------ */

interface CardPos {
  x: number;
  y: number;
  w: number;
}

/**
 * Pack cards into rows based on their sizes.
 * A row holds either 1 full card or up to 2 half cards.
 * Returns absolute (x, y, w) for every card and the total container height.
 */
function computeLayout(
  order: string[],
  sizes: Record<string, CardSize>,
  heights: Record<string, number>,
  containerWidth: number,
): { positions: Record<string, CardPos>; totalHeight: number } {
  const fullW = containerWidth;
  const halfW = (containerWidth - 2 * H_PAD - COL_GAP) / 2;

  const positions: Record<string, CardPos> = {};
  let y = 0;
  let i = 0;

  while (i < order.length) {
    const key = order[i];

    if (sizes[key] === 'half') {
      // Pair consecutive half cards in one row
      if (i + 1 < order.length && sizes[order[i + 1]] === 'half') {
        const key2 = order[i + 1];
        const rowH = Math.max(heights[key] || 0, heights[key2] || 0);
        positions[key] = { x: H_PAD, y, w: halfW };
        positions[key2] = { x: H_PAD + halfW + COL_GAP, y, w: halfW };
        y += rowH + ROW_GAP;
        i += 2;
      } else {
        // Solo half card — still half-width, left-aligned
        const rowH = heights[key] || 0;
        positions[key] = { x: H_PAD, y, w: halfW };
        y += rowH + ROW_GAP;
        i++;
      }
    } else {
      // Full-width card (handles its own paddingHorizontal)
      const rowH = heights[key] || 0;
      positions[key] = { x: 0, y, w: fullW };
      y += rowH + ROW_GAP;
      i++;
    }
  }

  return { positions, totalHeight: Math.max(0, y - ROW_GAP) };
}

/* ------------------------------------------------------------------ */
/*  Find best insertion for dragged card                                */
/* ------------------------------------------------------------------ */

function computePendingOrder(
  dragKey: string,
  dragCenterX: number,
  dragCenterY: number,
  currentOrder: string[],
  sizes: Record<string, CardSize>,
  heights: Record<string, number>,
  containerWidth: number,
): string[] {
  const remaining = currentOrder.filter((k) => k !== dragKey);

  let bestIdx = remaining.length;
  let bestDist = Infinity;

  for (let idx = 0; idx <= remaining.length; idx++) {
    const tentative = [...remaining.slice(0, idx), dragKey, ...remaining.slice(idx)];
    const layout = computeLayout(tentative, sizes, heights, containerWidth);
    const pos = layout.positions[dragKey];
    if (!pos) continue;

    const h = heights[dragKey] || 0;
    const cx = pos.x + pos.w / 2;
    const cy = pos.y + h / 2;

    // Manhattan distance from drag center to this slot's center
    const dist = Math.abs(dragCenterX - cx) + Math.abs(dragCenterY - cy);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = idx;
    }
  }

  return [...remaining.slice(0, bestIdx), dragKey, ...remaining.slice(bestIdx)];
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DraggableCardListProps {
  order: string[];
  sizes: Record<string, CardSize>;
  cards: Record<string, React.ReactNode>;
  onReorder: (newOrder: string[]) => void;
  onDragStateChange?: (isDragging: boolean) => void;
}

interface DragState {
  key: string;
  startX: number;
  startY: number;
  orderSnapshot: string[];
  pendingOrder: string[];
  active: boolean;
}

interface CardSVs {
  posX: SharedValue<number>;
  posY: SharedValue<number>;
}

/* ------------------------------------------------------------------ */
/*  Parent — layout engine + drag orchestration                         */
/* ------------------------------------------------------------------ */

export function DraggableCardList({
  order,
  sizes,
  cards,
  onReorder,
  onDragStateChange,
}: DraggableCardListProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [layoutReady, setLayoutReady] = useState(false);
  const [totalHeight, setTotalHeight] = useState(0);

  // Refs for stable callbacks (no stale closures)
  const containerWidthRef = useRef(0);
  const heights = useRef<Record<string, number>>({});
  const svMap = useRef<Record<string, CardSVs>>({});
  const orderRef = useRef(order);
  const sizesRef = useRef(sizes);
  const drag = useRef<DragState | null>(null);
  const layoutReadyRef = useRef(false);
  const skipNextOrderEffect = useRef(false);

  // Keep refs in sync with props (single effect to avoid race conditions)
  useEffect(() => {
    orderRef.current = order;
    sizesRef.current = sizes;
    layoutReadyRef.current = layoutReady;
  }, [order, sizes, layoutReady]);

  /* ---- Container measurement ---- */

  const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    containerWidthRef.current = w;
    setContainerWidth(w);
  }, []);

  /* ---- Card SV registration ---- */

  const registerSVs = useCallback(
    (key: string, posX: SharedValue<number>, posY: SharedValue<number>) => {
      svMap.current[key] = { posX, posY };
      return () => { delete svMap.current[key]; };
    },
    [],
  );

  /* ---- Animate all cards to a given order's layout ---- */

  const animateToLayout = useCallback((targetOrder: string[], animated: boolean) => {
    const cw = containerWidthRef.current;
    if (!cw) return;
    const layout = computeLayout(targetOrder, sizesRef.current, heights.current, cw);
    for (const [key, pos] of Object.entries(layout.positions)) {
      const sv = svMap.current[key];
      if (!sv) continue;
      if (animated) {
        sv.posX.value = withSpring(pos.x, SPRING_CONFIG);
        sv.posY.value = withSpring(pos.y, SPRING_CONFIG);
      } else {
        sv.posX.value = pos.x;
        sv.posY.value = pos.y;
      }
    }
    setTotalHeight(layout.totalHeight);
  }, []);

  /* ---- Card height measurement ---- */

  const handleCardLayout = useCallback((key: string, height: number) => {
    const prev = heights.current[key];
    heights.current[key] = height;

    const cw = containerWidthRef.current;
    if (!cw) return;
    const ord = orderRef.current;

    if (!layoutReadyRef.current) {
      // First-time layout: wait for ALL card heights
      const allMeasured = ord.every((k) => heights.current[k] != null);
      if (allMeasured) {
        const layout = computeLayout(ord, sizesRef.current, heights.current, cw);
        // Set positions instantly (before opacity flips to 1)
        for (const [k, pos] of Object.entries(layout.positions)) {
          const sv = svMap.current[k];
          if (sv) {
            sv.posX.value = pos.x;
            sv.posY.value = pos.y;
          }
        }
        setTotalHeight(layout.totalHeight);
        setLayoutReady(true);
        layoutReadyRef.current = true;
      }
    } else if (prev !== height && !drag.current?.active) {
      // Height changed on an existing card (e.g. content update) — recompute
      const layout = computeLayout(ord, sizesRef.current, heights.current, cw);
      setTotalHeight(layout.totalHeight);
      for (const [k, pos] of Object.entries(layout.positions)) {
        const sv = svMap.current[k];
        if (sv) {
          sv.posX.value = withSpring(pos.x, SPRING_CONFIG);
          sv.posY.value = withSpring(pos.y, SPRING_CONFIG);
        }
      }
    }
  }, []);

  /* ---- React to external order changes (not from drag) ---- */

  useEffect(() => {
    if (skipNextOrderEffect.current) {
      skipNextOrderEffect.current = false;
      return;
    }
    if (layoutReadyRef.current && containerWidthRef.current) {
      animateToLayout(order, true);
    }
  }, [order, animateToLayout]);

  /* ---- Drag callbacks (JS thread via runOnJS) ---- */

  const handleDragStart = useCallback((key: string) => {
    const cw = containerWidthRef.current;
    if (!cw) return;
    const layout = computeLayout(
      orderRef.current, sizesRef.current, heights.current, cw,
    );
    const pos = layout.positions[key];

    drag.current = {
      key,
      startX: pos?.x || 0,
      startY: pos?.y || 0,
      orderSnapshot: [...orderRef.current],
      pendingOrder: [...orderRef.current],
      active: true,
    };
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onDragStateChange?.(true);
  }, [onDragStateChange]);

  const handleDragMove = useCallback((key: string, tx: number, ty: number) => {
    const info = drag.current;
    if (!info?.active) return;
    const cw = containerWidthRef.current;
    if (!cw) return;

    const dragH = heights.current[key] || 0;
    const dragW = sizesRef.current[key] === 'half'
      ? (cw - 2 * H_PAD - COL_GAP) / 2
      : cw;

    const centerX = info.startX + tx + dragW / 2;
    const centerY = info.startY + ty + dragH / 2;

    const pending = computePendingOrder(
      key, centerX, centerY,
      info.orderSnapshot, sizesRef.current, heights.current, cw,
    );

    // Skip if nothing changed
    if (pending.every((k, i) => k === info.pendingOrder[i])) return;
    info.pendingOrder = pending;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate non-dragged cards to pending layout
    const layout = computeLayout(pending, sizesRef.current, heights.current, cw);
    for (const [k, pos] of Object.entries(layout.positions)) {
      if (k === key) continue;
      const sv = svMap.current[k];
      if (!sv) continue;
      sv.posX.value = withSpring(pos.x, SPRING_CONFIG);
      sv.posY.value = withSpring(pos.y, SPRING_CONFIG);
    }
  }, []);

  const handleDragEnd = useCallback((key: string) => {
    const info = drag.current;
    if (!info?.active) return;
    info.active = false;
    drag.current = null;
    onDragStateChange?.(false);

    // Snap dragged card to final position INSTANTLY (no animations)
    const cw = containerWidthRef.current;
    if (cw) {
      const layout = computeLayout(
        info.pendingOrder, sizesRef.current, heights.current, cw,
      );
      // Set ALL card positions instantly
      for (const [k, pos] of Object.entries(layout.positions)) {
        const sv = svMap.current[k];
        if (sv) {
          sv.posX.value = pos.x;
          sv.posY.value = pos.y;
        }
      }
      setTotalHeight(layout.totalHeight);
    }

    // Commit new order if it changed
    const changed = info.pendingOrder.some(
      (k, i) => k !== info.orderSnapshot[i],
    );
    if (changed) {
      orderRef.current = info.pendingOrder;
      skipNextOrderEffect.current = true;
      onReorder(info.pendingOrder);
    }
  }, [onReorder, onDragStateChange]);

  const handleDragCancel = useCallback(() => {
    const info = drag.current;
    if (!info?.active) return;
    info.active = false;
    drag.current = null;
    onDragStateChange?.(false);
    // Spring everything back to original positions
    animateToLayout(orderRef.current, true);
  }, [onDragStateChange, animateToLayout]);

  /* ---- Computed widths ---- */

  const halfW = containerWidth > 0
    ? (containerWidth - 2 * H_PAD - COL_GAP) / 2
    : 0;

  // Stable render order: always render children in the same sorted order.
  // Visual positions are driven by shared values, not React child order.
  // This prevents React from reordering native Animated.View nodes on
  // drag commit, which would crash Reanimated's animation state.
  const renderKeys = useMemo(
    () => [...new Set(order)].sort(),
    [order],
  );

  return (
    <View
      style={[styles.container, totalHeight > 0 && { height: totalHeight }]}
      onLayout={handleContainerLayout}
    >
      {containerWidth > 0 &&
        renderKeys.map((key) => (
          <DraggableCard
            key={key}
            cardKey={key}
            width={sizes[key] === 'half' ? halfW : containerWidth}
            registerSVs={registerSVs}
            onCardLayout={handleCardLayout}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            layoutReady={layoutReady}
          >
            {cards[key]}
          </DraggableCard>
        ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Child — owns gesture + animated style (absolute positioned)         */
/* ------------------------------------------------------------------ */

interface DraggableCardProps {
  cardKey: string;
  width: number;
  registerSVs: (
    key: string,
    posX: SharedValue<number>,
    posY: SharedValue<number>,
  ) => () => void;
  onCardLayout: (key: string, height: number) => void;
  onDragStart: (key: string) => void;
  onDragMove: (key: string, tx: number, ty: number) => void;
  onDragEnd: (key: string) => void;
  onDragCancel: () => void;
  layoutReady: boolean;
  children: React.ReactNode;
}

function DraggableCard({
  cardKey,
  width,
  registerSVs,
  onCardLayout,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
  layoutReady,
  children,
}: DraggableCardProps) {
  const posX = useSharedValue(0);
  const posY = useSharedValue(0);
  const dragTX = useSharedValue(0);
  const dragTY = useSharedValue(0);
  const isActive = useSharedValue(0);
  const zIdx = useSharedValue(0);

  useEffect(() => {
    return registerSVs(cardKey, posX, posY);
  }, [cardKey, registerSVs, posX, posY]);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      onCardLayout(cardKey, e.nativeEvent.layout.height);
    },
    [cardKey, onCardLayout],
  );

  const gesture = Gesture.Pan()
    .activateAfterLongPress(350)
    .onStart(() => {
      'worklet';
      isActive.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      zIdx.value = 100;
      runOnJS(onDragStart)(cardKey);
    })
    .onUpdate((e) => {
      'worklet';
      dragTX.value = e.translationX;
      dragTY.value = e.translationY;
      runOnJS(onDragMove)(cardKey, e.translationX, e.translationY);
    })
    .onEnd(() => {
      'worklet';
      // INSTANT reset — no animations. Avoids Reanimated commit hook crash
      // caused by in-flight animations during React shadow tree commit.
      dragTX.value = 0;
      dragTY.value = 0;
      isActive.value = 0;
      zIdx.value = 0;
      runOnJS(onDragEnd)(cardKey);
    })
    .onFinalize((_e, success) => {
      'worklet';
      // Only run for cancelled gestures (success=false means onEnd didn't fire)
      if (success) return;
      dragTX.value = 0;
      dragTY.value = 0;
      isActive.value = 0;
      zIdx.value = 0;
      runOnJS(onDragCancel)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: posX.value + dragTX.value },
      { translateY: posY.value + dragTY.value },
      { scale: 1 + isActive.value * (SCALE_ACTIVE - 1) },
    ],
    zIndex: zIdx.value,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: isActive.value * 0.35,
    shadowRadius: isActive.value * 24,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            width,
            opacity: layoutReady ? 1 : 0,
          },
          animatedStyle,
        ]}
        onLayout={handleLayout}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
