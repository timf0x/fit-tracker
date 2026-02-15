import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ChevronRight, Trophy } from 'lucide-react-native';
import { BadgeIcon } from '@/components/badges/BadgeIcon';
import { CircularProgress } from '@/components/CircularProgress';
import { PressableScale } from '@/components/ui/PressableScale';
import { getDisplayableBadges, TIER_CONFIG, USER_LEVELS } from '@/data/badges';
import { evaluateAllBadges } from '@/lib/badgeEvaluation';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useBadgeStore } from '@/stores/badgeStore';
import { Fonts, Spacing } from '@/constants/theme';
import i18n, { getLocale } from '@/lib/i18n';
import { useHomeRefreshKey } from '@/lib/refreshContext';
import type { BadgeProgress, BadgeTier } from '@/types';

function loc(obj: { name: string; nameFr: string }): string {
  return getLocale() === 'fr' ? obj.nameFr : obj.name;
}

function locDesc(obj: { description: string; descriptionFr: string }): string {
  return getLocale() === 'fr' ? obj.descriptionFr : obj.description;
}

/** Get a smart nudge for the next badge */
function getNudge(badge: BadgeProgress): string {
  const pct = Math.round(badge.progressPercent);

  if (pct >= 90) return i18n.t('home.achievement.almostThere');
  if (pct >= 75) return i18n.t('home.achievement.finalStretch');
  if (pct >= 50) return i18n.t('home.achievement.keepGoing', { pct });
  return i18n.t('home.achievement.complete', { pct });
}

/** Get level tier color */
function getLevelTier(points: number): BadgeTier {
  if (points >= 3000) return 'platinum';
  if (points >= 800) return 'gold';
  if (points >= 150) return 'silver';
  return 'bronze';
}

export function AchievementCard() {
  const router = useRouter();
  const history = useWorkoutStore((s) => s.history);
  const unlockedBadges = useBadgeStore((s) => s.unlockedBadges);

  // Urgency pulse for close-to-unlock
  const pulse = useSharedValue(0);

  const refreshKey = useHomeRefreshKey();

  const badgeBounce = useSharedValue(1);

  useEffect(() => {
    if (refreshKey > 0) {
      badgeBounce.value = 0.6;
      badgeBounce.value = withDelay(400, withTiming(1, { duration: 500, easing: Easing.out(Easing.back(2)) }));
    }
  }, [refreshKey]);

  const badgeBounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeBounce.value }],
  }));

  const { recentBadges, nextBadge, totalPoints, totalUnlocked, totalBadges, levelName } = useMemo(() => {
    const displayable = getDisplayableBadges();
    const allProgress = evaluateAllBadges(history, unlockedBadges);
    const displayableIds = new Set(displayable.map((b) => b.id));
    const progress = allProgress.filter((p) => displayableIds.has(p.badge.id));

    // Total stats
    const unlocked = progress.filter((p) => p.isUnlocked);
    const points = unlocked.reduce((sum, p) => sum + p.badge.points, 0);
    const levels = [...USER_LEVELS].reverse();
    const level = levels.find((l) => points >= l.minPoints) || USER_LEVELS[0];

    // Recent unlocks (last 3, sorted by date)
    const recentUnlocks = progress
      .filter((p) => p.isUnlocked && p.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 3);

    // Closest to unlock (highest progress %, excluding 0% and 100%)
    const locked = progress
      .filter((p) => !p.isUnlocked && p.progressPercent > 0)
      .sort((a, b) => b.progressPercent - a.progressPercent);

    return {
      recentBadges: recentUnlocks,
      nextBadge: locked[0] || null,
      totalPoints: points,
      totalUnlocked: unlocked.length,
      totalBadges: progress.length,
      levelName: loc(level),
    };
  }, [history, unlockedBadges]);

  // Start urgency pulse if next badge is close
  const isUrgent = nextBadge && nextBadge.progressPercent >= 75;
  useEffect(() => {
    if (isUrgent) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(0, { duration: 300 });
    }
  }, [isUrgent]);

  const ringGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(pulse.value, [0, 1], [0, 0.7]),
  }));

  const tierColor = nextBadge ? TIER_CONFIG[nextBadge.badge.tier].color : '#FFD700';
  const levelTierColor = TIER_CONFIG[getLevelTier(totalPoints)].color;

  // ── Empty state: no history at all ──
  if (totalUnlocked === 0 && !nextBadge) {
    return (
      <View style={styles.container}>
        <PressableScale activeScale={0.975} onPress={() => router.push('/trophies')}>
          <View style={styles.card}>
            <View style={styles.emptyRow}>
              <Trophy size={20} color="rgba(255,255,255,0.25)" strokeWidth={2} />
              <Text style={styles.emptyText}>{i18n.t('trophies.title')}</Text>
              <ChevronRight size={14} color="rgba(255,255,255,0.2)" strokeWidth={2} />
            </View>
            <Text style={styles.emptySubtext}>
              {i18n.t('trophies.noUnlocks')}
            </Text>
          </View>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <PressableScale activeScale={0.975} onPress={() => router.push('/trophies')}>
      <View style={styles.card}>
        {/* ── Top row: Level + stats + arrow ── */}
        <View style={styles.topRow}>
          <View style={styles.levelRow}>
            <View style={[styles.levelDot, { backgroundColor: levelTierColor }]} />
            <Text style={styles.levelLabel}>{levelName}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statValue}>
              {totalUnlocked}
              <Text style={styles.statDim}>/{totalBadges}</Text>
            </Text>
            <ChevronRight size={14} color="rgba(255,255,255,0.25)" strokeWidth={2} />
          </View>
        </View>

        {/* ── Main content: Next badge spotlight or recent ── */}
        {nextBadge ? (
          <View style={styles.spotlightRow}>
            {/* Badge with circular progress ring */}
            <Animated.View
              style={[
                styles.ringContainer,
                { shadowColor: tierColor },
                isUrgent ? ringGlowStyle : undefined,
              ]}
            >
              <CircularProgress
                size={76}
                strokeWidth={3}
                progress={nextBadge.progressPercent / 100}
                color={tierColor}
                animationKey={refreshKey}
              />
              <Animated.View style={[styles.badgeOverlay, badgeBounceStyle]}>
                <BadgeIcon
                  badge={nextBadge.badge}
                  size={52}
                  isUnlocked={false}
                  showProgress={nextBadge.progressPercent / 100}
                />
              </Animated.View>
            </Animated.View>

            {/* Info */}
            <View style={styles.spotlightInfo}>
              <Text style={styles.badgeName} numberOfLines={1}>
                {loc(nextBadge.badge)}
              </Text>
              <Text style={styles.badgeDesc} numberOfLines={1}>
                {locDesc(nextBadge.badge)}
              </Text>
              <View style={styles.nudgeRow}>
                <View style={[styles.nudgeDot, { backgroundColor: tierColor }]} />
                <Text style={[styles.nudgeText, { color: tierColor }]}>
                  {getNudge(nextBadge)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* No next badge — show level summary */
          <View style={styles.completedRow}>
            <Trophy size={24} color={levelTierColor} strokeWidth={2} />
            <Text style={styles.completedText}>
              {totalPoints} {i18n.t('trophies.pts')}
            </Text>
          </View>
        )}

        {/* ── Bottom: Recent unlocks row ── */}
        {recentBadges.length > 0 && (
          <View style={styles.recentRow}>
            <Text style={styles.recentLabel}>
              {i18n.t('trophies.recentAchievements')}
            </Text>
            <View style={styles.recentBadges}>
              {recentBadges.map((bp) => (
                <View key={bp.badge.id} style={styles.recentBadgeItem}>
                  <BadgeIcon
                    badge={bp.badge}
                    size={28}
                    isUnlocked
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    gap: 14,
  },

  // ── Top row ──
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  levelLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  statDim: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    fontFamily: Fonts?.sans,
    fontWeight: '400',
  },

  // ── Spotlight (next badge) ──
  spotlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ringContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0C0C0C',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 18,
  },
  badgeOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotlightInfo: {
    flex: 1,
    gap: 3,
  },
  badgeName: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  badgeDesc: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: Fonts?.sans,
    fontWeight: '400',
  },
  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  nudgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  nudgeText: {
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // ── Completed row (no next badge) ──
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  completedText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // ── Recent unlocks ──
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 10,
  },
  recentLabel: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 9,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  recentBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  recentBadgeItem: {
    width: 28,
    height: 28,
  },

  // ── Empty state ──
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    flex: 1,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    fontFamily: Fonts?.sans,
    fontWeight: '400',
  },
});
