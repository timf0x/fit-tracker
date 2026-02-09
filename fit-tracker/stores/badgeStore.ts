import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutSession } from '@/types';
import { getNewlyUnlockedBadges } from '@/lib/badgeEvaluation';

interface UnlockedBadge {
  unlockedAt: string;
}

interface BadgeStoreState {
  unlockedBadges: Record<string, UnlockedBadge>;

  /**
   * Check all badges against current workout history.
   * Unlocks any newly qualifying badges.
   * Returns array of newly unlocked badge IDs (empty if none).
   */
  checkBadges: (history: WorkoutSession[]) => string[];
}

export const useBadgeStore = create<BadgeStoreState>()(
  persist(
    (set, get) => ({
      unlockedBadges: {},

      checkBadges: (history) => {
        const currentUnlocked = get().unlockedBadges;
        const unlockedIds = new Set(Object.keys(currentUnlocked));
        const newlyUnlocked = getNewlyUnlockedBadges(history, unlockedIds);

        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          const updates: Record<string, UnlockedBadge> = {};
          for (const id of newlyUnlocked) {
            updates[id] = { unlockedAt: now };
          }
          set((state) => ({
            unlockedBadges: { ...state.unlockedBadges, ...updates },
          }));
        }

        return newlyUnlocked;
      },
    }),
    {
      name: 'onset-badge-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        unlockedBadges: state.unlockedBadges,
      }),
    },
  ),
);
