import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutSession } from '@/types';
import { getNewlyUnlockedBadges } from '@/lib/badgeEvaluation';
import { ALL_BADGES, USER_LEVELS } from '@/data/badges';

interface UnlockedBadge {
  unlockedAt: string;
}

interface BadgeStoreState {
  unlockedBadges: Record<string, UnlockedBadge>;

  /** Badge IDs unlocked during the most recent checkBadges() call */
  lastUnlockedBadgeIds: string[];

  /** Previous total points (for level-up detection) */
  previousPoints: number;

  /** Whether a level-up occurred on last check */
  leveledUp: boolean;

  /**
   * Check all badges against current workout history.
   * Unlocks any newly qualifying badges.
   * Returns array of newly unlocked badge IDs (empty if none).
   */
  checkBadges: (history: WorkoutSession[]) => string[];

  /** Clear lastUnlockedBadgeIds after celebration is shown */
  clearLastUnlocked: () => void;

  /** Reset all badge data (used on sign out) */
  resetAll: () => void;
}

function computeTotalPoints(unlockedBadges: Record<string, UnlockedBadge>): number {
  const unlockedIds = new Set(Object.keys(unlockedBadges));
  return ALL_BADGES
    .filter((b) => unlockedIds.has(b.id))
    .reduce((sum, b) => sum + b.points, 0);
}

function getLevel(points: number) {
  const levels = [...USER_LEVELS].reverse();
  return levels.find((l) => points >= l.minPoints) || USER_LEVELS[0];
}

export const useBadgeStore = create<BadgeStoreState>()(
  persist(
    (set, get) => ({
      unlockedBadges: {},
      lastUnlockedBadgeIds: [],
      previousPoints: 0,
      leveledUp: false,

      checkBadges: (history) => {
        const currentUnlocked = get().unlockedBadges;
        const pointsBefore = computeTotalPoints(currentUnlocked);
        const levelBefore = getLevel(pointsBefore);

        const unlockedIds = new Set(Object.keys(currentUnlocked));
        const newlyUnlocked = getNewlyUnlockedBadges(history, unlockedIds);

        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          const updates: Record<string, UnlockedBadge> = {};
          for (const id of newlyUnlocked) {
            updates[id] = { unlockedAt: now };
          }
          const updatedBadges = { ...currentUnlocked, ...updates };
          const pointsAfter = computeTotalPoints(updatedBadges);
          const levelAfter = getLevel(pointsAfter);
          const didLevelUp = levelAfter.id !== levelBefore.id;

          set({
            unlockedBadges: updatedBadges,
            lastUnlockedBadgeIds: newlyUnlocked,
            previousPoints: pointsBefore,
            leveledUp: didLevelUp,
          });
        }

        return newlyUnlocked;
      },

      clearLastUnlocked: () => {
        set({ lastUnlockedBadgeIds: [], leveledUp: false });
      },

      resetAll: () => {
        set({
          unlockedBadges: {},
          lastUnlockedBadgeIds: [],
          previousPoints: 0,
          leveledUp: false,
        });
      },
    }),
    {
      name: 'onset-badge-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        unlockedBadges: state.unlockedBadges,
        previousPoints: state.previousPoints,
      }),
    },
  ),
);
