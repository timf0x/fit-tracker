import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle as SvgCircle,
  Line as SvgLine,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import {
  Trophy, Flame, Target, Dumbbell, Users,
  Sparkles, Compass, Zap, Shield, Crown,
  Medal, Footprints, Repeat, Calendar, CheckCircle,
  Rocket, TrendingUp, Heart, LayoutGrid, GitBranch,
  ArrowRight, MoveVertical, MoveDown, Circle,
  AlignCenter, Building, Home, Dna, Scale,
  Minus, Link, Settings, User, CircleDot,
  Package, MinusCircle, Search, Map, BookOpen,
  Layers, Shuffle, Star, Megaphone, ThumbsUp,
  Share, HeartHandshake, GraduationCap, Brain,
  ClipboardCheck, MessageCircle, Flag, Sunrise,
  Sun, Moon, Timer, PartyPopper, Weight,
  Mountain, Globe, Landmark, CalendarCheck,
  FlaskConical, Activity, Gauge, Award,
  Crosshair, BarChart3, Swords, Bot,
} from 'lucide-react-native';
import type { Badge, BadgeTier } from '@/types';
import {
  SHAPE_PATHS,
  CATEGORY_SHAPES,
  TIER_GRADIENTS,
  LAUREL_LEFT_PATH,
  LAUREL_RIGHT_PATH,
  getRadiatingLines,
  getCornerDots,
  getParticleDots,
} from '@/constants/badgeShapes';
import type { BadgeShape } from '@/constants/badgeShapes';

// ── Icon resolver ──
type IconComponent = React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;

const ICON_MAP: Record<string, IconComponent> = {
  trophy: Trophy, flame: Flame, target: Target, dumbbell: Dumbbell, users: Users,
  bot: Bot, sparkles: Sparkles, compass: Compass, zap: Zap, shield: Shield,
  crown: Crown, medal: Medal, footprints: Footprints, repeat: Repeat,
  calendar: Calendar, 'check-circle': CheckCircle, 'calendar-check': CalendarCheck,
  rocket: Rocket, 'trending-up': TrendingUp, 'biceps-flexed': Dumbbell,
  heart: Heart, 'layout-grid': LayoutGrid, 'git-branch': GitBranch,
  'arrow-right': ArrowRight, 'move-vertical': MoveVertical, 'move-down': MoveDown,
  circle: Circle, 'align-center': AlignCenter, building: Building, home: Home,
  dna: Dna, scale: Scale, minus: Minus, link: Link, settings: Settings,
  user: User, 'circle-dot': CircleDot, package: Package, 'minus-circle': MinusCircle,
  search: Search, map: Map, 'book-open': BookOpen, layers: Layers, shuffle: Shuffle,
  star: Star, megaphone: Megaphone, 'thumbs-up': ThumbsUp, share: Share,
  'heart-handshake': HeartHandshake, 'graduation-cap': GraduationCap, brain: Brain,
  'clipboard-check': ClipboardCheck, 'message-circle': MessageCircle, flag: Flag,
  sunrise: Sunrise, sun: Sun, moon: Moon, timer: Timer, 'party-popper': PartyPopper,
  weight: Weight, mountain: Mountain, globe: Globe, landmark: Landmark,
  swords: Swords, 'flask-conical': FlaskConical, activity: Activity, gauge: Gauge,
  award: Award, crosshair: Crosshair, 'bar-chart-3': BarChart3,
};

function getIcon(name: string): IconComponent {
  return ICON_MAP[name] || Trophy;
}

// ── Props ──

export interface BadgeIconProps {
  badge: Badge;
  size: number; // 64 for grid, 120 for detail, 160 for celebration
  isUnlocked: boolean;
  isNew?: boolean; // triggers pulse animation
  showProgress?: number; // 0-1, draws partial fill on locked badge
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
  const IconComp = getIcon(badge.icon);

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
    const glowRadius = interpolate(pulseValue.value, [0, 1], [8, 20]);
    const glowOpacity = interpolate(pulseValue.value, [0, 1], [0.25, 0.5]);
    return {
      shadowRadius: glowRadius,
      shadowOpacity: glowOpacity,
    };
  });

  const scale = size / 100;
  const center = size / 2;
  const iconSize = size * 0.38;

  // Locked state
  const lockedColor = 'rgba(60,60,70,1)';
  const lockedBg = 'rgba(255,255,255,0.03)';
  const lockedStroke = 'rgba(255,255,255,0.08)';

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: size },
        isUnlocked && {
          shadowColor: tierGrad.glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        isNew && pulseStyle,
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgLinearGradient id="tierGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={tierGrad.primary} />
            <Stop offset="1" stopColor={tierGrad.secondary} />
          </SvgLinearGradient>
          <SvgLinearGradient id="fillGrad" x1="0.5" y1="1" x2="0.5" y2="0">
            <Stop offset="0" stopColor={tierGrad.primary} stopOpacity="0.15" />
            <Stop offset="1" stopColor={tierGrad.primary} stopOpacity="0.05" />
          </SvgLinearGradient>
        </Defs>

        {/* Layer 1: Base shape fill */}
        <Path
          d={shapePath}
          fill={isUnlocked ? 'url(#fillGrad)' : lockedBg}
          scaleX={scale}
          scaleY={scale}
          opacity={isUnlocked ? 1 : 0.3}
        />

        {/* Layer 2: Tier frame border */}
        <Path
          d={shapePath}
          fill="transparent"
          stroke={isUnlocked ? 'url(#tierGrad)' : lockedStroke}
          strokeWidth={isUnlocked ? 2 / scale : 1.2 / scale}
          scaleX={scale}
          scaleY={scale}
          opacity={isUnlocked ? 1 : 0.3}
        />

        {/* Layer 4: Decorative accents based on tier */}
        {isUnlocked && renderAccents(badge.tier, size, center, scale, tierGrad)}

        {/* Progress fill for locked badges */}
        {!isUnlocked && showProgress != null && showProgress > 0 && (
          <Path
            d={shapePath}
            fill={`${tierGrad.primary}12`}
            scaleX={scale}
            scaleY={scale}
            opacity={0.5}
            // Clip from bottom by translating the progress
            translateY={size * (1 - showProgress) * 0.7}
          />
        )}
      </Svg>

      {/* Layer 3: Inner icon */}
      <View style={[styles.iconContainer, { width: size, height: size }]}>
        <IconComp
          size={iconSize}
          color={isUnlocked ? tierGrad.primary : lockedColor}
          strokeWidth={isUnlocked ? 2 : 1.5}
        />
      </View>
    </Animated.View>
  );
}

// ── Tier-specific decorative accents ──

function renderAccents(
  tier: BadgeTier,
  size: number,
  center: number,
  scale: number,
  tierGrad: { primary: string; secondary: string },
) {
  const elements: React.ReactNode[] = [];

  if (tier === 'bronze') {
    // Simple inner ring
    elements.push(
      <SvgCircle
        key="bronze-ring"
        cx={center}
        cy={center}
        r={size * 0.32}
        stroke={`${tierGrad.primary}30`}
        strokeWidth={1}
        fill="transparent"
      />,
    );
  }

  if (tier === 'silver') {
    // Double ring + 4 corner dots
    elements.push(
      <SvgCircle
        key="silver-ring1"
        cx={center}
        cy={center}
        r={size * 0.34}
        stroke={`${tierGrad.primary}25`}
        strokeWidth={0.8}
        fill="transparent"
      />,
      <SvgCircle
        key="silver-ring2"
        cx={center}
        cy={center}
        r={size * 0.30}
        stroke={`${tierGrad.primary}18`}
        strokeWidth={0.5}
        fill="transparent"
      />,
    );
    const dots = getCornerDots(center, center, size * 0.38);
    dots.forEach((dot, i) => {
      elements.push(
        <SvgCircle
          key={`silver-dot-${i}`}
          cx={dot.x}
          cy={dot.y}
          r={1.5}
          fill={`${tierGrad.primary}40`}
        />,
      );
    });
  }

  if (tier === 'gold') {
    // Laurel wreath
    elements.push(
      <Path
        key="laurel-left"
        d={LAUREL_LEFT_PATH}
        stroke={`${tierGrad.primary}45`}
        strokeWidth={1.2 / scale}
        fill="transparent"
        scaleX={scale}
        scaleY={scale}
        strokeLinecap="round"
      />,
      <Path
        key="laurel-right"
        d={LAUREL_RIGHT_PATH}
        stroke={`${tierGrad.primary}45`}
        strokeWidth={1.2 / scale}
        fill="transparent"
        scaleX={scale}
        scaleY={scale}
        strokeLinecap="round"
      />,
    );
  }

  if (tier === 'platinum') {
    // Laurel wreath + radiating lines + particle dots
    elements.push(
      <Path
        key="plat-laurel-left"
        d={LAUREL_LEFT_PATH}
        stroke={`${tierGrad.primary}35`}
        strokeWidth={1 / scale}
        fill="transparent"
        scaleX={scale}
        scaleY={scale}
        strokeLinecap="round"
      />,
      <Path
        key="plat-laurel-right"
        d={LAUREL_RIGHT_PATH}
        stroke={`${tierGrad.primary}35`}
        strokeWidth={1 / scale}
        fill="transparent"
        scaleX={scale}
        scaleY={scale}
        strokeLinecap="round"
      />,
    );

    const lines = getRadiatingLines(center, center, size * 0.42, size * 0.47);
    lines.forEach((line, i) => {
      elements.push(
        <SvgLine
          key={`plat-line-${i}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={`${tierGrad.primary}25`}
          strokeWidth={0.8}
        />,
      );
    });

    const particles = getParticleDots(center, center, size * 0.45);
    particles.forEach((p, i) => {
      elements.push(
        <SvgCircle
          key={`plat-particle-${i}`}
          cx={p.x}
          cy={p.y}
          r={p.size}
          fill={`${tierGrad.primary}30`}
        />,
      );
    });
  }

  return elements;
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
});
