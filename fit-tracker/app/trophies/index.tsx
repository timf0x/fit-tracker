import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle, Line } from 'react-native-svg';
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
} from 'lucide-react-native';
import { Fonts } from '@/constants/theme';
import { ALL_BADGES, BADGE_CATEGORIES, TIER_CONFIG, USER_LEVELS } from '@/data/badges';
import { MOCK_UNLOCKED_BADGE_IDS } from '@/lib/mock-data';
import type { BadgeProgress, BadgeTier } from '@/types';

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
  swords: Shield, seedling: Sparkles, sprout: Sparkles,
};

function getIcon(name: string): IconComponent {
  return ICON_MAP[name] || Trophy;
}

// ── Build badge progress from mock data ──
function buildMockProgress(): BadgeProgress[] {
  return ALL_BADGES.map((badge) => {
    const isUnlocked = MOCK_UNLOCKED_BADGE_IDS.includes(badge.id);
    return {
      badge,
      isUnlocked,
      unlockedAt: isUnlocked ? '2026-01-30T10:00:00Z' : undefined,
      currentValue: isUnlocked ? badge.conditionValue : Math.random() * badge.conditionValue * 0.6,
      targetValue: badge.conditionValue,
      progressPercent: isUnlocked ? 100 : Math.random() * 60,
    };
  });
}

// ── Calculate summary ──
function buildMockSummary(progress: BadgeProgress[]) {
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

// ── SVG Decorative Ring ──
function BadgeRing({
  size,
  isUnlocked,
  tierColor,
  children,
}: {
  size: number;
  isUnlocked: boolean;
  tierColor: string;
  children: React.ReactNode;
}) {
  const center = size / 2;
  const ringRadius = size / 2 - 3;
  const tickCount = 36;
  const tickInner = ringRadius - 3;
  const tickOuter = ringRadius + 1;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <SvgCircle
          cx={center}
          cy={center}
          r={ringRadius - 6}
          fill={isUnlocked ? `${tierColor}18` : 'rgba(255,255,255,0.03)'}
        />
        <SvgCircle
          cx={center}
          cy={center}
          r={ringRadius}
          stroke={isUnlocked ? `${tierColor}80` : 'rgba(255,255,255,0.08)'}
          strokeWidth={1.5}
          fill="transparent"
        />
        {Array.from({ length: tickCount }).map((_, i) => {
          const angle = (i / tickCount) * 2 * Math.PI - Math.PI / 2;
          const isMajor = i % 9 === 0;
          const inner = isMajor ? tickInner - 2 : tickInner;
          return (
            <Line
              key={i}
              x1={center + inner * Math.cos(angle)}
              y1={center + inner * Math.sin(angle)}
              x2={center + tickOuter * Math.cos(angle)}
              y2={center + tickOuter * Math.sin(angle)}
              stroke={isUnlocked ? `${tierColor}50` : 'rgba(255,255,255,0.06)'}
              strokeWidth={isMajor ? 1.5 : 0.8}
            />
          );
        })}
      </Svg>
      {children}
    </View>
  );
}

// ── Badge Card (4-col grid item) ──
const BADGE_SIZE = (SCREEN_WIDTH - 48 - 36) / 4;

function BadgeCard({ progress, onPress }: { progress: BadgeProgress; onPress: () => void }) {
  const { badge, isUnlocked, progressPercent } = progress;
  const tierColor = TIER_CONFIG[badge.tier].color;
  const IconComp = getIcon(badge.icon);
  const ringSize = Math.min(BADGE_SIZE - 8, 68);

  return (
    <Pressable style={[styles.badgeCard, { width: BADGE_SIZE }]} onPress={onPress}>
      {isUnlocked && (
        <View
          style={[styles.badgeGlow, { shadowColor: tierColor }]}
          pointerEvents="none"
        />
      )}
      <BadgeRing size={ringSize} isUnlocked={isUnlocked} tierColor={tierColor}>
        <IconComp
          size={ringSize * 0.35}
          color={isUnlocked ? tierColor : 'rgba(100,100,110,1)'}
          strokeWidth={isUnlocked ? 2.2 : 1.5}
        />
      </BadgeRing>
      <Text
        style={[styles.badgeName, !isUnlocked && { color: 'rgba(100,100,110,1)' }]}
        numberOfLines={2}
      >
        {badge.nameFr}
      </Text>
      <View style={styles.progressBarBg}>
        {isUnlocked ? (
          <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
        ) : (
          <>
            <View style={[styles.tierDotSmall, { backgroundColor: TIER_CONFIG[badge.tier].color + '60' }]} />
            {progressPercent > 5 && (
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: tierColor },
                ]}
              />
            )}
          </>
        )}
      </View>
    </Pressable>
  );
}

// ── Category Section Header ──
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
      <Text style={styles.catTitle}>{category.labelFr}</Text>
      <Text style={styles.catCount}>
        {unlockedCount}/{totalCount}
      </Text>
    </View>
  );
}

// ── Detail Bottom Sheet Modal ──
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
  const tierLabel = TIER_CONFIG[badge.tier].labelFr;
  const IconComp = getIcon(badge.icon);
  const catMeta = BADGE_CATEGORIES.find((c) => c.id === badge.category);

  const unlockDate = isUnlocked && progress.unlockedAt
    ? new Date(progress.unlockedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalSheet}>
          <Pressable style={styles.modalClose} onPress={onClose}>
            <X size={22} color="rgba(160,150,140,1)" />
          </Pressable>
          <View style={styles.modalBadgeContainer}>
            {isUnlocked && (
              <View style={[styles.modalBadgeGlow, { shadowColor: tierColor, backgroundColor: `${tierColor}10` }]} />
            )}
            <BadgeRing size={140} isUnlocked={isUnlocked} tierColor={tierColor}>
              <IconComp
                size={48}
                color={isUnlocked ? tierColor : 'rgba(100,100,110,1)'}
                strokeWidth={isUnlocked ? 2 : 1.5}
              />
            </BadgeRing>
          </View>
          <View style={styles.modalMeta}>
            <View style={[styles.modalPill, { backgroundColor: `${tierColor}20`, borderColor: `${tierColor}40` }]}>
              <Text style={[styles.modalPillText, { color: tierColor }]}>{tierLabel.toUpperCase()}</Text>
            </View>
            <View style={[styles.modalPill, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }]}>
              {catMeta && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {React.createElement(getIcon(catMeta.icon), { size: 12, color: 'rgba(200,200,200,1)', strokeWidth: 2 })}
                  <Text style={[styles.modalPillText, { color: 'rgba(200,200,200,1)' }]}>{catMeta.labelFr}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.modalBadgeName}>{badge.nameFr}</Text>
          <Text style={styles.modalDescription}>{badge.descriptionFr}</Text>
          {isUnlocked && unlockDate ? (
            <View style={styles.modalUnlockedPill}>
              <CheckCircle size={16} color="#4ADE80" strokeWidth={2.5} />
              <Text style={styles.modalUnlockedText}>Débloqué le {unlockDate}</Text>
            </View>
          ) : (
            <View style={styles.modalProgressSection}>
              <View style={styles.modalProgressBarBg}>
                <View
                  style={[styles.modalProgressBarFill, { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: tierColor }]}
                />
              </View>
              <Text style={styles.modalProgressPct}>{Math.round(progressPercent)}%</Text>
            </View>
          )}
          <View style={styles.modalPointsRow}>
            <Sparkles size={16} color="#f97316" strokeWidth={2.5} />
            <Text style={styles.modalPointsText}>{badge.points} points</Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Main Screen ──
export default function TrophiesScreen() {
  const router = useRouter();
  const [detailBadge, setDetailBadge] = useState<BadgeProgress | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const allProgress = useMemo(() => buildMockProgress(), []);
  const summary = useMemo(() => buildMockSummary(allProgress), [allProgress]);

  const categorySections = useMemo(() => {
    return BADGE_CATEGORIES.map((cat) => {
      const badges = allProgress.filter((p) => p.badge.category === cat.id);
      const unlockedCount = badges.filter((p) => p.isUnlocked).length;
      return { category: cat, badges, unlockedCount, totalCount: badges.length };
    });
  }, [allProgress]);

  const LevelIcon = getIcon(summary.level.icon);
  const progressToNext = summary.nextLevel
    ? ((summary.totalPoints - summary.level.minPoints) /
        (summary.nextLevel.minPoints - summary.level.minPoints)) * 100
    : 100;

  return (
    <View style={styles.container}>
      {/* Ambient orbs */}
      <View style={styles.orbOrange} pointerEvents="none" />
      <View style={styles.orbGold} pointerEvents="none" />
      <View style={styles.orbBrown} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header with back button */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color="#fff" strokeWidth={2} />
            </Pressable>
            <Trophy size={22} color="#f97316" strokeWidth={2.5} />
            <Text style={styles.headerTitle}>Trophées</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Level Card */}
          <View style={styles.levelCard}>
            <View style={styles.levelTop}>
              <View style={styles.levelIconBox}>
                <LevelIcon size={28} color="#f97316" strokeWidth={2.2} />
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelLabel}>NIVEAU</Text>
                <Text style={styles.levelName}>{summary.level.nameFr}</Text>
              </View>
              <View style={styles.levelPtsBlock}>
                <Text style={styles.levelPtsBig}>{summary.totalPoints}</Text>
                <Text style={styles.levelPtsLabel}>pts</Text>
              </View>
            </View>
            <View style={styles.levelProgressRow}>
              <View style={styles.levelProgressBarBg}>
                <LinearGradient
                  colors={['#f97316', '#eab308']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.levelProgressBarFill, { width: `${progressToNext}%` }]}
                />
              </View>
            </View>
            <View style={styles.levelProgressLabels}>
              <Text style={styles.levelPctText}>{Math.round(progressToNext)}%</Text>
              {summary.nextLevel && (
                <Text style={styles.levelNextText}>
                  {summary.nextLevel.minPoints - summary.totalPoints} pts → {summary.nextLevel.nameFr}
                </Text>
              )}
            </View>
            <View style={styles.levelDivider} />
            <View style={styles.levelStatsRow}>
              <View style={styles.levelStatItem}>
                <Text style={styles.levelStatNumber}>{summary.totalBadges}</Text>
                <Text style={styles.levelStatLabel}>DÉBLOQUÉS</Text>
              </View>
              <View style={styles.levelStatSep} />
              {(['bronze', 'silver', 'gold', 'platinum'] as BadgeTier[]).map((tier) => (
                <View key={tier} style={styles.levelStatItem}>
                  <View style={[styles.tierDotLarge, { backgroundColor: TIER_CONFIG[tier].color }]} />
                  <Text style={[styles.levelStatNumber, { color: TIER_CONFIG[tier].color }]}>
                    {summary.badgesByTier[tier]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Category Sections */}
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
                  .map((p) => (
                    <BadgeCard
                      key={p.badge.id}
                      progress={p}
                      onPress={() => {
                        setDetailBadge(p);
                        setShowDetail(true);
                      }}
                    />
                  ))}
              </View>
            </View>
          ))}

          <View style={{ height: 40 }} />
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

// ── Styles ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
    position: 'relative',
    overflow: 'hidden',
  },
  orbOrange: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(249, 115, 22, 0.10)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 100,
  },
  orbGold: {
    position: 'absolute',
    top: 400,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(234, 179, 8, 0.06)',
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 100,
  },
  orbBrown: {
    position: 'absolute',
    top: 80,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(139, 69, 19, 0.06)',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 80,
  },
  scrollContent: { paddingBottom: 40 },
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
  levelCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    gap: 14,
  },
  levelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  levelIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelInfo: { flex: 1 },
  levelLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  levelName: {
    color: '#f97316',
    fontSize: 22,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    marginTop: 2,
  },
  levelPtsBlock: { alignItems: 'flex-end' },
  levelPtsBig: {
    color: '#fff',
    fontSize: 32,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    lineHeight: 36,
  },
  levelPtsLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: -2,
  },
  levelProgressRow: { marginTop: 2 },
  levelProgressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelProgressBarFill: { height: '100%', borderRadius: 3 },
  levelProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  levelPctText: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  levelNextText: {
    color: 'rgba(120,120,130,1)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  levelDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  levelStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  levelStatItem: { alignItems: 'center', gap: 4 },
  levelStatSep: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  levelStatNumber: {
    color: '#fff',
    fontSize: 22,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  levelStatLabel: {
    color: 'rgba(120,120,130,1)',
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  tierDotLarge: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
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
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    alignItems: 'center',
    gap: 6,
  },
  badgeGlow: {
    position: 'absolute',
    top: 4,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  badgeName: {
    color: '#fff',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
    height: 28,
  },
  progressBarBg: {
    width: '80%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    height: '100%',
    borderRadius: 1.5,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tierDotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    gap: 16,
  },
  modalClose: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalPillText: {
    fontSize: 12,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  modalUnlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.10)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.20)',
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
    color: 'rgba(160,150,140,1)',
    fontSize: 13,
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
