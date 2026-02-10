import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Trophy,
  ArrowLeft,
  X,
  Flame,
  Target,
  Dumbbell,
  Users,
  Bot,
  Sparkles,
  Compass,
  Zap,
  Shield,
  Crown,
  Medal,
  Footprints,
  Repeat,
  Calendar,
  CheckCircle,
  Rocket,
  TrendingUp,
  Heart,
  LayoutGrid,
  GitBranch,
  ArrowRight,
  MoveVertical,
  MoveDown,
  Circle,
  AlignCenter,
  Building,
  Home,
  Dna,
  Scale,
  Minus,
  Link,
  Settings,
  User,
  CircleDot,
  Package,
  MinusCircle,
  Search,
  Map,
  BookOpen,
  Layers,
  Shuffle,
  Star,
  Megaphone,
  ThumbsUp,
  Share,
  HeartHandshake,
  GraduationCap,
  Brain,
  ClipboardCheck,
  MessageCircle,
  Flag,
  Sunrise,
  Sun,
  Moon,
  Timer,
  PartyPopper,
  Weight,
  Mountain,
  Globe,
  Landmark,
  CalendarCheck,
  FlaskConical,
  Activity,
  Gauge,
  Award,
  Crosshair,
  BarChart3,
  Swords,
  Lock,
} from 'lucide-react-native';
import { Fonts } from '@/constants/theme';
import { CircularProgress } from '@/components/CircularProgress';
import { BadgeIcon } from '@/components/badges/BadgeIcon';
import { getDisplayableBadges, BADGE_CATEGORIES, TIER_CONFIG, USER_LEVELS } from '@/data/badges';
import { evaluateAllBadges } from '@/lib/badgeEvaluation';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useBadgeStore } from '@/stores/badgeStore';
import i18n, { getLocale } from '@/lib/i18n';
import type { Badge, BadgeProgress, BadgeTier } from '@/types';

// ── Locale-aware field access ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loc(obj: any, field: string): string {
  const isFr = getLocale() === 'fr';
  const frKey = `${field}Fr`;
  return String(isFr ? (obj[frKey] ?? obj[field]) : (obj[field] ?? obj[frKey]));
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// ── Calculate summary from real progress ──
function buildSummary(progress: BadgeProgress[]) {
  const unlocked = progress.filter((p) => p.isUnlocked);
  const totalPoints = unlocked.reduce((sum, p) => sum + p.badge.points, 0);

  const levels = [...USER_LEVELS].reverse();
  const currentLevel = levels.find((l) => totalPoints >= l.minPoints) || USER_LEVELS[0];
  const currentIdx = USER_LEVELS.findIndex((l) => l.id === currentLevel.id);
  const nextLevel = currentIdx < USER_LEVELS.length - 1 ? USER_LEVELS[currentIdx + 1] : undefined;

  const badgesByTier: Record<BadgeTier, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  for (const p of unlocked) badgesByTier[p.badge.tier]++;

  return { totalBadges: unlocked.length, totalPoints, level: currentLevel, nextLevel, badgesByTier };
}

// ── Tier color for the current level ──
function getLevelTier(points: number): BadgeTier {
  if (points >= 3000) return 'platinum';
  if (points >= 800) return 'gold';
  if (points >= 150) return 'silver';
  return 'bronze';
}

// ── Category order (Science first) ──
const CATEGORY_ORDER: string[] = [
  'science', 'volume', 'consistency', 'strength', 'mastery', 'explorer', 'special',
];

// ── Badge grid sizing ──
const GRID_PADDING = 20;
const GRID_GAP = 10;
const GRID_COLUMNS = 4;
const BADGE_CELL_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

// ── Showcase item sizing ──
const SHOWCASE_ICON_SIZE = 72;

// ============================================
// SECTION: Badge Detail Modal (redesigned)
// ============================================

function BadgeDetailModal({
  visible,
  progress,
  onClose,
}: {
  visible: boolean;
  progress: BadgeProgress | null;
  onClose: () => void;
}) {
  if (!progress) return null;
  const { badge, isUnlocked, progressPercent } = progress;
  const tierColor = TIER_CONFIG[badge.tier].color;
  const tierLabel = loc(TIER_CONFIG[badge.tier], 'label');
  const catMeta = BADGE_CATEGORIES.find((c) => c.id === badge.category);
  const CatIcon = catMeta ? getIcon(catMeta.icon) : null;

  const unlockDate = isUnlocked && progress.unlockedAt
    ? new Date(progress.unlockedAt).toLocaleDateString(getLocale() === 'fr' ? 'fr-FR' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          {/* Close button */}
          <Pressable style={styles.modalClose} onPress={onClose}>
            <X size={22} color="rgba(160,150,140,1)" />
          </Pressable>

          {/* Large badge icon */}
          <View style={styles.modalBadgeContainer}>
            {isUnlocked && (
              <View
                style={[
                  styles.modalBadgeGlow,
                  { shadowColor: tierColor, backgroundColor: `${tierColor}10` },
                ]}
              />
            )}
            <BadgeIcon badge={badge} size={140} isUnlocked={isUnlocked} showProgress={progressPercent / 100} />
          </View>

          {/* Tier + Category labels (NO pills/borders, plain text) */}
          <View style={styles.modalMeta}>
            <Text style={[styles.modalTierLabel, { color: tierColor }]}>
              {tierLabel.toUpperCase()}
            </Text>
            {catMeta && (
              <View style={styles.modalCatRow}>
                <View style={styles.modalMetaDot} />
                {CatIcon && <CatIcon size={13} color="rgba(160,150,140,1)" strokeWidth={2} />}
                <Text style={styles.modalCatLabel}>{loc(catMeta, 'label')}</Text>
              </View>
            )}
          </View>

          {/* Name + Description */}
          <Text style={styles.modalBadgeName}>{loc(badge, 'name')}</Text>
          <Text style={styles.modalDescription}>{loc(badge, 'description')}</Text>

          {/* Unlocked state */}
          {isUnlocked && unlockDate ? (
            <View style={styles.modalUnlockedRow}>
              <CheckCircle size={16} color="#4ADE80" strokeWidth={2.5} />
              <Text style={styles.modalUnlockedText}>
                {i18n.t('trophies.unlockedOn', { date: unlockDate })}
              </Text>
            </View>
          ) : (
            <View style={styles.modalProgressSection}>
              <View style={styles.modalProgressBarBg}>
                <LinearGradient
                  colors={[tierColor, `${tierColor}80`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.modalProgressBarFill,
                    { width: `${Math.min(progressPercent, 100)}%` },
                  ]}
                />
              </View>
              <Text style={[styles.modalProgressPct, { color: tierColor }]}>
                {Math.round(progressPercent)}%
              </Text>
            </View>
          )}

          {/* Points */}
          <View style={styles.modalPointsRow}>
            <Sparkles size={16} color="#f97316" strokeWidth={2.5} />
            <Text style={styles.modalPointsText}>
              {badge.points} {i18n.t('trophies.points')}
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================
// SECTION: Category Header
// ============================================

function CategoryHeader({
  category,
  unlockedCount,
  totalCount,
}: {
  category: (typeof BADGE_CATEGORIES)[number];
  unlockedCount: number;
  totalCount: number;
}) {
  const CatIcon = getIcon(category.icon);
  return (
    <View style={styles.catHeader}>
      <View style={[styles.catIconCircle, { backgroundColor: `${category.color}15` }]}>
        <CatIcon size={16} color={category.color} strokeWidth={2.2} />
      </View>
      <Text style={styles.catTitle}>{loc(category, 'label')}</Text>
      <Text style={styles.catCount}>
        {unlockedCount}/{totalCount}
      </Text>
    </View>
  );
}

// ============================================
// MAIN SCREEN
// ============================================

export default function TrophiesScreen() {
  const router = useRouter();
  const [detailBadge, setDetailBadge] = useState<BadgeProgress | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const history = useWorkoutStore((s) => s.history);
  const unlockedBadges = useBadgeStore((s) => s.unlockedBadges);
  const checkBadges = useBadgeStore((s) => s.checkBadges);

  // Catch-up: persist any badges the user earned before the badge system existed
  useEffect(() => {
    if (history.length > 0) checkBadges(history);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter to displayable badges only
  const displayableBadgeIds = useMemo(() => {
    const badges = getDisplayableBadges();
    return new Set(badges.map((b) => b.id));
  }, []);

  const allProgress = useMemo(
    () => evaluateAllBadges(history, unlockedBadges).filter((p) => displayableBadgeIds.has(p.badge.id)),
    [history, unlockedBadges, displayableBadgeIds],
  );

  const summary = useMemo(() => buildSummary(allProgress), [allProgress]);

  // Recent unlocks (last 5, most recent first)
  const recentUnlocks = useMemo(() => {
    return allProgress
      .filter((p) => p.isUnlocked && p.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 5);
  }, [allProgress]);

  // Next goals (3 closest to unlock, excluding 0%)
  const nextGoals = useMemo(() => {
    return allProgress
      .filter((p) => !p.isUnlocked && p.progressPercent > 0)
      .sort((a, b) => b.progressPercent - a.progressPercent)
      .slice(0, 3);
  }, [allProgress]);

  // Category sections, ordered by CATEGORY_ORDER
  const categorySections = useMemo(() => {
    return CATEGORY_ORDER.map((catId) => {
      const cat = BADGE_CATEGORIES.find((c) => c.id === catId);
      if (!cat) return null;
      const badges = allProgress.filter((p) => p.badge.category === cat.id);
      const unlockedCount = badges.filter((p) => p.isUnlocked).length;
      return { category: cat, badges, unlockedCount, totalCount: badges.length };
    }).filter(Boolean) as {
      category: (typeof BADGE_CATEGORIES)[number];
      badges: BadgeProgress[];
      unlockedCount: number;
      totalCount: number;
    }[];
  }, [allProgress]);

  const currentTier = getLevelTier(summary.totalPoints);
  const progressToNext = summary.nextLevel
    ? ((summary.totalPoints - summary.level.minPoints) /
        (summary.nextLevel.minPoints - summary.level.minPoints)) * 100
    : 100;
  const pointsToNext = summary.nextLevel
    ? summary.nextLevel.minPoints - summary.totalPoints
    : 0;

  const openDetail = useCallback((p: BadgeProgress) => {
    setDetailBadge(p);
    setShowDetail(true);
  }, []);

  // Build the virtual level badge for BadgeIcon rendering
  const levelBadge: Badge = useMemo(() => ({
    id: 'level',
    name: summary.level.name,
    nameFr: summary.level.nameFr,
    category: 'special',
    tier: currentTier,
    icon: summary.level.icon,
    points: 0,
    isSecret: false,
    description: '',
    descriptionFr: '',
    conditionType: 'sessions_count',
    conditionValue: 0,
  }), [summary.level, currentTier]);

  // ══════════════════════════════════════════
  // ANIMATIONS — Making the Forge breathe
  // ══════════════════════════════════════════
  const sinEase = Easing.inOut(Easing.sin);

  // ── Ambient orb breathing (3 independent cycles) ──
  const orbGoldBreath = useSharedValue(0);
  const orbSilverBreath = useSharedValue(0);
  const orbBronzeBreath = useSharedValue(0);

  // ── Hero entrance (mount once) ──
  const heroEnter = useSharedValue(0);

  // ── Hero aura glow breathing ──
  const auraPulse = useSharedValue(0);

  // ── Showcase entrance (slide from right) ──
  const showcaseEnter = useSharedValue(0);

  // ── Forge nodes entrance (rise up) ──
  const forgeEnter = useSharedValue(0);

  // ── Closest badge urgency pulse ──
  const closestPulse = useSharedValue(0);

  useEffect(() => {
    // Breathing orbs — desynchronized organic rhythms
    orbGoldBreath.value = withRepeat(
      withTiming(1, { duration: 12000, easing: sinEase }), -1, true,
    );
    orbSilverBreath.value = withDelay(4000, withRepeat(
      withTiming(1, { duration: 16000, easing: sinEase }), -1, true,
    ));
    orbBronzeBreath.value = withDelay(2000, withRepeat(
      withTiming(1, { duration: 10000, easing: sinEase }), -1, true,
    ));

    // Hero entrance — scale + fade in
    heroEnter.value = withDelay(100, withTiming(1, {
      duration: 700, easing: Easing.out(Easing.cubic),
    }));

    // Hero aura — continuous breathing glow
    auraPulse.value = withDelay(800, withRepeat(
      withTiming(1, { duration: 4000, easing: sinEase }), -1, true,
    ));

    // Showcase — slide in from right
    showcaseEnter.value = withDelay(400, withTiming(1, {
      duration: 600, easing: Easing.out(Easing.cubic),
    }));

    // Forge nodes — float up
    forgeEnter.value = withDelay(600, withTiming(1, {
      duration: 650, easing: Easing.out(Easing.cubic),
    }));

    // Closest badge — urgency pulse
    closestPulse.value = withDelay(1200, withRepeat(
      withTiming(1, { duration: 2500, easing: sinEase }), -1, true,
    ));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Animated styles ──
  const orbGoldStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(orbGoldBreath.value, [0, 1], [0.9, 1.15]) },
      { translateX: interpolate(orbGoldBreath.value, [0, 1], [-8, 8]) },
    ],
  }));
  const orbSilverStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(orbSilverBreath.value, [0, 1], [0.95, 1.1]) },
      { translateY: interpolate(orbSilverBreath.value, [0, 1], [-6, 6]) },
    ],
  }));
  const orbBronzeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(orbBronzeBreath.value, [0, 1], [0.92, 1.12]) },
      { translateX: interpolate(orbBronzeBreath.value, [0, 1], [5, -5]) },
    ],
  }));

  const heroAnimStyle = useAnimatedStyle(() => ({
    opacity: heroEnter.value,
    transform: [{ scale: interpolate(heroEnter.value, [0, 1], [0.85, 1]) }],
  }));

  const auraAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(auraPulse.value, [0, 1], [0.88, 1.12]) }],
    opacity: interpolate(auraPulse.value, [0, 1], [0.6, 1.0]),
  }));

  const showcaseAnimStyle = useAnimatedStyle(() => ({
    opacity: showcaseEnter.value,
    transform: [{ translateX: interpolate(showcaseEnter.value, [0, 1], [40, 0]) }],
  }));

  const forgeAnimStyle = useAnimatedStyle(() => ({
    opacity: forgeEnter.value,
    transform: [{ translateY: interpolate(forgeEnter.value, [0, 1], [24, 0]) }],
  }));

  const closestPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(closestPulse.value, [0, 1], [0.96, 1.06]) }],
    opacity: interpolate(closestPulse.value, [0, 1], [0.5, 1.0]),
  }));

  return (
    <View style={styles.container}>
      {/* Ambient orbs — breathing like the home screen */}
      <Animated.View style={[styles.orbGold, orbGoldStyle]} pointerEvents="none" />
      <Animated.View style={[styles.orbSilver, orbSilverStyle]} pointerEvents="none" />
      <Animated.View style={[styles.orbBronze, orbBronzeStyle]} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color="#fff" strokeWidth={2} />
            </Pressable>
            <Trophy size={22} color="#f97316" strokeWidth={2.5} />
            <Text style={styles.headerTitle}>{i18n.t('trophies.title')}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* ── Forge Identity — Immersive Level Display ── */}
          <Animated.View style={[styles.heroSection, heroAnimStyle]}>
            {/* Golden aura glow — breathing */}
            <Animated.View style={[styles.heroGlow, auraAnimStyle]} pointerEvents="none" />

            {/* Circular progress ring + badge centered inside */}
            <View style={styles.heroRingContainer}>
              <CircularProgress
                size={156}
                strokeWidth={5}
                progress={progressToNext / 100}
                color="#FFD700"
              />
              <View style={styles.heroBadgeOverlay}>
                <BadgeIcon badge={levelBadge} size={104} isUnlocked />
              </View>
            </View>

            {/* Level name */}
            <Text style={styles.heroLevelName}>{loc(summary.level, 'name')}</Text>

            {/* Points + next level */}
            <View style={styles.heroPointsRow}>
              <Sparkles size={13} color="rgba(255,215,0,0.6)" strokeWidth={2.2} />
              <Text style={styles.heroPointsText}>
                {summary.totalPoints} {i18n.t('trophies.points')}
              </Text>
            </View>
            {summary.nextLevel && (
              <Text style={styles.heroNextHint}>
                {pointsToNext} {i18n.t('trophies.ptsTo')} {loc(summary.nextLevel, 'name')}
              </Text>
            )}

            {/* Tier orbs — only tiers with unlocks */}
            <View style={styles.heroTierRow}>
              {(['bronze', 'silver', 'gold', 'platinum'] as BadgeTier[]).map((tier) =>
                summary.badgesByTier[tier] > 0 ? (
                  <View key={tier} style={styles.heroTierItem}>
                    <View
                      style={[
                        styles.heroTierDot,
                        {
                          backgroundColor: TIER_CONFIG[tier].color,
                          shadowColor: TIER_CONFIG[tier].color,
                          shadowOpacity: 0.4,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 0 },
                        },
                      ]}
                    />
                    <Text style={[styles.heroTierCount, { color: TIER_CONFIG[tier].color }]}>
                      {summary.badgesByTier[tier]}
                    </Text>
                  </View>
                ) : null,
              )}
            </View>
          </Animated.View>

          {/* ── Showcase Row: Recent Achievements ── */}
          <Animated.View style={[styles.sectionContainer, showcaseAnimStyle]}>
            <Text style={styles.sectionTitle}>
              {i18n.t('trophies.recentAchievements')}
            </Text>
            {recentUnlocks.length > 0 ? (
              <FlatList
                data={recentUnlocks}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.badge.id}
                contentContainerStyle={styles.showcaseList}
                renderItem={({ item }) => {
                  const tierColor = TIER_CONFIG[item.badge.tier].color;
                  return (
                    <Pressable
                      style={styles.showcaseItem}
                      onPress={() => openDetail(item)}
                    >
                      <View style={[styles.showcaseGlow, { shadowColor: tierColor }]}>
                        <BadgeIcon
                          badge={item.badge}
                          size={SHOWCASE_ICON_SIZE}
                          isUnlocked
                        />
                      </View>
                      <Text style={styles.showcaseName} numberOfLines={2}>
                        {loc(item.badge, 'name')}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            ) : (
              <View style={styles.noUnlocksContainer}>
                <Lock size={20} color="rgba(100,100,110,1)" strokeWidth={2} />
                <Text style={styles.noUnlocksText}>
                  {i18n.t('trophies.noUnlocks')}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* ── Forge Progress — Radial Nodes ── */}
          {nextGoals.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                {i18n.t('trophies.nextGoals')}
              </Text>
              <Animated.View style={[styles.forgeProgressRow, forgeAnimStyle]}>
                {nextGoals.map((item, idx) => {
                  const isClosest = idx === 0;
                  const nodeSize = isClosest ? 72 : 56;
                  const ringSize = nodeSize + 24;
                  const tierColor = TIER_CONFIG[item.badge.tier].color;
                  return (
                    <Pressable
                      key={item.badge.id}
                      style={styles.forgeNode}
                      onPress={() => openDetail(item)}
                    >
                      {/* Tier glow behind closest badge — pulsing urgency */}
                      {isClosest && (
                        <Animated.View
                          style={[
                            styles.forgeNodeGlow,
                            { shadowColor: tierColor, backgroundColor: `${tierColor}08` },
                            closestPulseStyle,
                          ]}
                          pointerEvents="none"
                        />
                      )}
                      <View style={[styles.forgeRingContainer, { width: ringSize, height: ringSize }]}>
                        <CircularProgress
                          size={ringSize}
                          strokeWidth={3}
                          progress={item.progressPercent / 100}
                          color={tierColor}
                        />
                        <View style={styles.forgeBadgeOverlay}>
                          <BadgeIcon
                            badge={item.badge}
                            size={nodeSize}
                            isUnlocked={false}
                            showProgress={item.progressPercent / 100}
                          />
                        </View>
                      </View>
                      <Text style={styles.forgeNodeName} numberOfLines={2}>
                        {loc(item.badge, 'name')}
                      </Text>
                      <Text style={[styles.forgeNodePct, { color: tierColor }]}>
                        {Math.round(item.progressPercent)}%
                      </Text>
                    </Pressable>
                  );
                })}
              </Animated.View>
            </View>
          )}

          {/* ── Category Collections ── */}
          {categorySections.map((section) => (
            <View key={section.category.id} style={styles.catSection}>
              <CategoryHeader
                category={section.category}
                unlockedCount={section.unlockedCount}
                totalCount={section.totalCount}
              />
              <View style={styles.badgeGrid}>
                {section.badges
                  .filter((p) => !p.badge.isSecret || p.isUnlocked)
                  .map((p) => {
                    const tierColor = TIER_CONFIG[p.badge.tier].color;
                    return (
                      <Pressable
                        key={p.badge.id}
                        style={[styles.badgeCell, { width: BADGE_CELL_SIZE }]}
                        onPress={() => openDetail(p)}
                      >
                        {p.isUnlocked && (
                          <View
                            style={[styles.badgeCellGlow, { shadowColor: tierColor }]}
                            pointerEvents="none"
                          />
                        )}
                        <BadgeIcon
                          badge={p.badge}
                          size={BADGE_CELL_SIZE - 12}
                          isUnlocked={p.isUnlocked}
                          showProgress={!p.isUnlocked ? p.progressPercent / 100 : undefined}
                        />
                        <Text
                          style={[
                            styles.badgeCellName,
                            !p.isUnlocked && { color: 'rgba(100,100,110,1)' },
                          ]}
                          numberOfLines={2}
                        >
                          {loc(p.badge, 'name')}
                        </Text>
                      </Pressable>
                    );
                  })}
              </View>
            </View>
          ))}

          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>

      <BadgeDetailModal
        visible={showDetail}
        progress={detailBadge}
        onClose={() => setShowDetail(false)}
      />
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // ── Container ──
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
    position: 'relative',
    overflow: 'hidden',
  },

  // ── Ambient orbs ──
  orbGold: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 215, 0, 0.07)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 100,
  },
  orbSilver: {
    position: 'absolute',
    top: 380,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(192, 192, 192, 0.05)',
    shadowColor: '#C0C0C0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 90,
  },
  orbBronze: {
    position: 'absolute',
    top: 700,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(205, 127, 50, 0.06)',
    shadowColor: '#CD7F32',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 80,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // ── Forge Identity (Immersive Level) ──
  heroSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  heroGlow: {
    position: 'absolute',
    top: -10,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,215,0,0.04)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 70,
  },
  heroRingContainer: {
    width: 156,
    height: 156,
  },
  heroBadgeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLevelName: {
    color: '#fff',
    fontSize: 26,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    marginTop: 4,
  },
  heroPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroPointsText: {
    color: 'rgba(160,150,140,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  heroNextHint: {
    color: 'rgba(100,100,110,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  heroTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 4,
  },
  heroTierItem: {
    alignItems: 'center',
    gap: 4,
    flexDirection: 'row',
  },
  heroTierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroTierCount: {
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // ── Section titles ──
  sectionContainer: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: 'rgba(160,150,140,1)',
    fontSize: 12,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  // ── Showcase (Recent Achievements) ──
  showcaseList: {
    gap: 16,
    paddingRight: 8,
  },
  showcaseItem: {
    alignItems: 'center',
    width: SHOWCASE_ICON_SIZE + 20,
    gap: 8,
  },
  showcaseGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  showcaseName: {
    color: '#fff',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
    height: 28,
  },
  noUnlocksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  noUnlocksText: {
    color: 'rgba(100,100,110,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // ── Forge Progress (Radial Nodes) ──
  forgeProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
  },
  forgeNode: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
    maxWidth: 110,
  },
  forgeNodeGlow: {
    position: 'absolute',
    top: -6,
    width: 108,
    height: 108,
    borderRadius: 54,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
  },
  forgeRingContainer: {
    position: 'relative',
  },
  forgeBadgeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgeNodeName: {
    color: '#fff',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 15,
    height: 30,
  },
  forgeNodePct: {
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // ── Category sections ──
  catSection: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  catIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  catCount: {
    color: 'rgba(120,120,130,1)',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // ── Badge grid ──
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  badgeCell: {
    alignItems: 'center',
    gap: 6,
  },
  badgeCellGlow: {
    position: 'absolute',
    top: 4,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
  },
  badgeCellName: {
    color: '#fff',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
    height: 28,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 0,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 14,
  },
  modalClose: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBadgeGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
  },
  modalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  modalTierLabel: {
    fontSize: 12,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modalMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(120,120,130,1)',
  },
  modalCatLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  modalBadgeName: {
    color: '#fff',
    fontSize: 24,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalDescription: {
    color: 'rgba(160,150,140,1)',
    fontSize: 15,
    fontFamily: Fonts?.sans,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalUnlockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  modalUnlockedText: {
    color: '#4ADE80',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  modalProgressSection: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalProgressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  modalProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  modalProgressPct: {
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  modalPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  modalPointsText: {
    color: '#f97316',
    fontSize: 16,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
});
