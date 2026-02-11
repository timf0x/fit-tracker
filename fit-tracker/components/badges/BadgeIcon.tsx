import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  G,
  Circle as SvgCircle,
  Ellipse as SvgEllipse,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import type { Badge } from '@/types';
import {
  SHAPE_PATHS,
  CATEGORY_SHAPES,
  TIER_GRADIENTS,
} from '@/constants/badgeShapes';
import type { BadgeShape } from '@/constants/badgeShapes';
import { TIER_PALETTES, getBadgeIcon } from './icons';
import { TIER_GLOW_CONFIG, RELIEF_PALETTES } from './icons/palette';
import type { MetallicPalette } from './icons/types';
import { MedallionDefs } from './MedallionDefs';

// ── Detail level — progressive enhancement by badge size ──
//
// 0 (28-39px):  Body shape + edge stroke + glyph silhouette
// 1 (40-47px):  + solid rim band + glyph shadow + center recess
// 2 (48-55px):  + gadroon dashes + 1 dot ring + smooth ring + specular + frame
// 3 (56-79px):  + 2 dot rings + inner frame ring + glyph highlight
// 4 (80-119px): + 3 dot rings + beaded frame
// 5 (120-160px): all details + platinum double specular

function getDetailLevel(size: number): number {
  if (size < 40) return 0;
  if (size < 48) return 1;
  if (size < 56) return 2;
  if (size < 80) return 3;
  if (size < 120) return 4;
  return 5;
}

function getIconScale(detail: number): number {
  switch (detail) {
    case 0: return 0.55;
    case 1: return 0.50;
    case 2: return 0.46;
    case 3: return 0.43;
    case 4: return 0.40;
    default: return 0.38;
  }
}

// ── Flat palette helpers (for shadow / highlight silhouettes) ──

function makeFlatPalette(color: string): MetallicPalette {
  return {
    darkest: color, dark: color, mid: color,
    light: color, lightest: color,
    glow: 'rgba(0,0,0,0)',
  };
}

// ── Ornament dot renderer (dense micro-pattern in the band zone) ──

function renderOrnamentDots(
  center: number,
  size: number,
  detail: number,
  relief: MetallicPalette,
): React.ReactNode[] {
  const dots: React.ReactNode[] = [];
  const dotR = Math.max(0.7, size * 0.009);

  // Ring A (detail >= 2): at 0.82R from center
  const rA = size * 0.41;
  const countA = Math.max(12, Math.round(size * 0.32));
  for (let i = 0; i < countA; i++) {
    const angle = (i / countA) * Math.PI * 2;
    dots.push(
      <SvgCircle key={`da${i}`}
        cx={center + Math.cos(angle) * rA}
        cy={center + Math.sin(angle) * rA}
        r={dotR}
        fill={relief.mid}
        opacity={0.14 + ((i * 7) % 5) * 0.025}
      />,
    );
  }

  // Ring B (detail >= 3): at 0.76R, staggered
  if (detail >= 3) {
    const rB = size * 0.38;
    const countB = Math.max(10, countA - 4);
    for (let i = 0; i < countB; i++) {
      const angle = (i / countB) * Math.PI * 2 + Math.PI / countB;
      dots.push(
        <SvgCircle key={`db${i}`}
          cx={center + Math.cos(angle) * rB}
          cy={center + Math.sin(angle) * rB}
          r={dotR * 0.8}
          fill={relief.light}
          opacity={0.11 + ((i * 11) % 4) * 0.025}
        />,
      );
    }
  }

  // Ring C (detail >= 4): at 0.72R
  if (detail >= 4) {
    const rC = size * 0.36;
    const countC = Math.max(8, countA - 8);
    for (let i = 0; i < countC; i++) {
      const angle = (i / countC) * Math.PI * 2 + Math.PI / (countC * 2);
      dots.push(
        <SvgCircle key={`dc${i}`}
          cx={center + Math.cos(angle) * rC}
          cy={center + Math.sin(angle) * rC}
          r={dotR * 0.65}
          fill={relief.mid}
          opacity={0.09 + ((i * 13) % 3) * 0.025}
        />,
      );
    }
  }

  return dots;
}

// ── Props ──

export interface BadgeIconProps {
  badge: Badge;
  size: number;
  isUnlocked: boolean;
  isNew?: boolean;
  showProgress?: number;
}

// ── Component ──

export function BadgeIcon({
  badge,
  size,
  isUnlocked,
  isNew = false,
  showProgress,
}: BadgeIconProps) {
  const shape: BadgeShape = CATEGORY_SHAPES[badge.category] || 'circle';
  const shapePath = SHAPE_PATHS[shape];
  const tierGrad = TIER_GRADIENTS[badge.tier] || TIER_GRADIENTS.bronze;
  const tier = isUnlocked ? (badge.tier || 'bronze') : 'locked';
  const primary = TIER_PALETTES[tier] || TIER_PALETTES.bronze;
  const relief = RELIEF_PALETTES[tier] || RELIEF_PALETTES.bronze;
  const glowCfg = TIER_GLOW_CONFIG[tier] || TIER_GLOW_CONFIG.bronze;

  const CustomIcon = getBadgeIcon(badge.id);
  const detail = getDetailLevel(size);
  const iconScale = getIconScale(detail);

  // Pulse animation for newly unlocked
  const pulseValue = useSharedValue(0);

  useEffect(() => {
    if (isNew) {
      pulseValue.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      pulseValue.value = 0;
    }
  }, [isNew, pulseValue]);

  const pulseStyle = useAnimatedStyle(() => {
    if (!isNew) return {};
    return {
      shadowRadius: interpolate(pulseValue.value, [0, 1], [8, 24]),
      shadowOpacity: interpolate(pulseValue.value, [0, 1], [0.3, 0.6]),
    };
  });

  const scale = size / 100;
  const center = size / 2;
  const iconSize = size * iconScale;

  // Inset shape transform for gadrooned rim (at 96% of full size)
  const rimFactor = 0.96;
  const rimS = scale * rimFactor;
  const rimOff = center * (1 - rimFactor);

  // Shadow/highlight offsets for the carved glyph
  const shadowOff = detail >= 2 ? Math.max(0.8, size * 0.012) : (detail >= 1 ? 0.8 : 0);
  const hlOff = detail >= 3 ? Math.max(0.5, size * 0.007) : 0;

  // Memoized flat palettes for glyph shadow/highlight
  const shadowPal = useMemo(() => makeFlatPalette(relief.darkest), [relief.darkest]);
  const hlPal = useMemo(() => makeFlatPalette(relief.lightest), [relief.lightest]);

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: size },
        // Tier glow (native iOS shadow)
        isUnlocked && glowCfg.shadowOpacity > 0 && {
          shadowColor: primary.glow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: glowCfg.shadowOpacity,
          shadowRadius: size * glowCfg.shadowRadiusFrac,
        },
        isNew && pulseStyle,
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <MedallionDefs p={primary} />

        {/* ═══════════════════════════════════════════════
            1. SHAPE_BODY — the metallic disc surface
            ═══════════════════════════════════════════════ */}
        <Path
          d={shapePath}
          fill={isUnlocked ? 'url(#med_body)' : primary.mid}
          scaleX={scale}
          scaleY={scale}
          opacity={isUnlocked ? 1 : 0.12}
        />

        {/* Thin edge stroke at smallest sizes (detail 0 only) */}
        {detail === 0 && (
          <Path
            d={shapePath}
            fill="none"
            stroke={isUnlocked ? primary.light : primary.dark}
            strokeWidth={Math.max(0.8, 1.2 / scale)}
            scaleX={scale}
            scaleY={scale}
            opacity={isUnlocked ? 0.25 : 0.10}
          />
        )}

        {/* ═══════════════════════════════════════════════
            2. RIM_GADROON — fluted outer edge
            ═══════════════════════════════════════════════ */}
        {detail >= 1 && (
          <G transform={`translate(${rimOff}, ${rimOff})`}>
            {/* Rim body — solid dark stroke (the rim band) */}
            <Path
              d={shapePath}
              fill="none"
              stroke={primary.dark}
              strokeWidth={7}
              scaleX={rimS}
              scaleY={rimS}
              opacity={isUnlocked ? 0.45 : 0.08}
            />
            {/* Gadroon lobes — dashed lighter stroke on top */}
            {detail >= 2 && isUnlocked && (
              <Path
                d={shapePath}
                fill="none"
                stroke={primary.light}
                strokeWidth={5.5}
                strokeDasharray="5 2.5"
                strokeLinecap="butt"
                scaleX={rimS}
                scaleY={rimS}
                opacity={0.30}
              />
            )}
          </G>
        )}

        {/* ═══════════════════════════════════════════════
            3. BAND_ORNAMENT — micro-pattern dots
            ═══════════════════════════════════════════════ */}
        {detail >= 2 && isUnlocked && (
          <G>
            {renderOrnamentDots(center, size, detail, relief)}
          </G>
        )}

        {/* ═══════════════════════════════════════════════
            4. SMOOTH_RING — polished separator (the "breath")
            ═══════════════════════════════════════════════ */}
        {detail >= 2 && isUnlocked && (
          <G>
            {/* Polished torus — clean gradient stroke */}
            <SvgCircle
              cx={center}
              cy={center}
              r={size * 0.345}
              fill="none"
              stroke="url(#med_smooth)"
              strokeWidth={Math.max(1.5, size * 0.035)}
              opacity={0.80}
            />
            {/* Specular hotspot — brightest light catch */}
            <SvgEllipse
              cx={center * 0.72}
              cy={center * 0.58}
              rx={size * 0.09}
              ry={size * 0.032}
              fill="url(#med_spec)"
              opacity={glowCfg.specularOpacity}
            />
          </G>
        )}

        {/* Platinum double specular (detail 5 only) */}
        {detail >= 5 && tier === 'platinum' && (
          <SvgEllipse
            cx={center * 0.65}
            cy={center * 0.50}
            rx={size * 0.035}
            ry={size * 0.018}
            fill={primary.lightest}
            opacity={0.25}
          />
        )}

        {/* ═══════════════════════════════════════════════
            5. CENTER_FRAME — thin concentric borders
            ═══════════════════════════════════════════════ */}
        {detail >= 2 && isUnlocked && (
          <G>
            {/* Outer frame ring */}
            <SvgCircle
              cx={center}
              cy={center}
              r={size * 0.30}
              fill="none"
              stroke={relief.mid}
              strokeWidth={Math.max(0.5, size * 0.006)}
              opacity={0.28}
            />
            {/* Inner frame ring (detail >= 3, beaded at >= 4) */}
            {detail >= 3 && (
              <SvgCircle
                cx={center}
                cy={center}
                r={size * 0.28}
                fill="none"
                stroke={relief.light}
                strokeWidth={Math.max(0.4, size * 0.004)}
                strokeDasharray={
                  detail >= 4
                    ? `${size * 0.008} ${size * 0.008}`
                    : undefined
                }
                opacity={0.18}
              />
            )}
          </G>
        )}

        {/* ═══════════════════════════════════════════════
            6. CENTER_FIELD — recessed well for the glyph
            ═══════════════════════════════════════════════ */}
        {detail >= 1 && isUnlocked && (
          <SvgCircle
            cx={center}
            cy={center}
            r={size * 0.26}
            fill="url(#med_recess)"
            opacity={0.28}
          />
        )}

        {/* ── Progress fill for locked badges ── */}
        {!isUnlocked && showProgress != null && showProgress > 0 && (
          <Path
            d={shapePath}
            fill={`${tierGrad.primary}18`}
            scaleX={scale}
            scaleY={scale}
            opacity={0.5}
            translateY={size * (1 - showProgress) * 0.7}
          />
        )}
      </Svg>

      {/* ═══════════════════════════════════════════════
          CENTER GLYPH — engraved relief (View overlay)

          Three layers create a carved-into-metal effect:
          1. Shadow: flat darkest color, offset down-right
          2. Highlight: flat lightest color, offset up-left
          3. Main: compressed relief palette (subtle gradients)
          ═══════════════════════════════════════════════ */}
      <View style={[styles.iconContainer, { width: size, height: size }]}>
        {CustomIcon ? (
          <>
            {/* Shadow cast — carved groove depth */}
            {shadowOff > 0 && (
              <View style={[styles.glyphLayer, {
                transform: [
                  { translateX: shadowOff },
                  { translateY: shadowOff },
                ],
                opacity: 0.30,
              }]}>
                <CustomIcon size={iconSize} palette={shadowPal} />
              </View>
            )}
            {/* Highlight edge — light catching the carved rim */}
            {hlOff > 0 && isUnlocked && (
              <View style={[styles.glyphLayer, {
                transform: [
                  { translateX: -hlOff },
                  { translateY: -hlOff },
                ],
                opacity: 0.15,
              }]}>
                <CustomIcon size={iconSize} palette={hlPal} />
              </View>
            )}
            {/* Main glyph — compressed palette reads as low-relief carving */}
            <View style={[styles.glyphLayer, {
              opacity: isUnlocked ? 1 : 0.18,
            }]}>
              <CustomIcon
                size={iconSize}
                palette={isUnlocked ? relief : RELIEF_PALETTES.locked}
              />
            </View>
          </>
        ) : (
          /* Fallback: circular indentation if no custom icon */
          <View style={[styles.glyphLayer, { opacity: isUnlocked ? 0.3 : 0.1 }]}>
            <View style={{
              width: iconSize * 0.4,
              height: iconSize * 0.4,
              borderRadius: iconSize * 0.2,
              backgroundColor: relief.mid,
            }} />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
