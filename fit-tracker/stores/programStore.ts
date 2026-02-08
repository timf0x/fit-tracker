import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  TrainingProgram,
  ActiveProgramState,
} from '@/types/program';
import { generateProgram } from '@/lib/programGenerator';

interface ProgramStoreState {
  userProfile: UserProfile | null;
  program: TrainingProgram | null;
  activeState: ActiveProgramState | null;

  // Profile
  setUserProfile: (profile: UserProfile) => void;
  clearProfile: () => void;

  // Program
  generateAndSetProgram: () => TrainingProgram | null;
  startProgram: () => void;
  clearProgram: () => void;

  // Progress tracking
  markDayCompleted: (week: number, dayIndex: number) => void;
  advanceDay: () => void;
  isDayCompleted: (week: number, dayIndex: number) => boolean;
  getCompletedDaysInWeek: (week: number) => number;

  // Getters
  getTodayWorkout: () => { week: number; dayIndex: number } | null;
}

export const useProgramStore = create<ProgramStoreState>()(
  persist(
    (set, get) => ({
      userProfile: null,
      program: null,
      activeState: null,

      setUserProfile: (profile) => {
        set({ userProfile: profile });
      },

      clearProfile: () => {
        set({ userProfile: null, program: null, activeState: null });
      },

      generateAndSetProgram: () => {
        const { userProfile } = get();
        if (!userProfile) return null;

        const program = generateProgram(userProfile);
        set({ program, activeState: null });
        return program;
      },

      startProgram: () => {
        const { program } = get();
        if (!program) return;

        const activeState: ActiveProgramState = {
          programId: program.id,
          currentWeek: 1,
          currentDayIndex: 0,
          completedDays: [],
          startDate: new Date().toISOString(),
        };

        set({
          program: { ...program, startedAt: new Date().toISOString() },
          activeState,
        });
      },

      clearProgram: () => {
        set({ program: null, activeState: null });
      },

      markDayCompleted: (week, dayIndex) => {
        const { activeState } = get();
        if (!activeState) return;

        const key = `${week}-${dayIndex}`;
        if (activeState.completedDays.includes(key)) return;

        set({
          activeState: {
            ...activeState,
            completedDays: [...activeState.completedDays, key],
          },
        });

        // Auto-advance after marking complete
        get().advanceDay();
      },

      advanceDay: () => {
        const { activeState, program } = get();
        if (!activeState || !program) return;

        const currentWeek = program.weeks.find(
          (w) => w.weekNumber === activeState.currentWeek
        );
        if (!currentWeek) return;

        const nextDay = activeState.currentDayIndex + 1;
        if (nextDay < currentWeek.days.length) {
          set({
            activeState: {
              ...activeState,
              currentDayIndex: nextDay,
            },
          });
        } else if (activeState.currentWeek < program.totalWeeks) {
          set({
            activeState: {
              ...activeState,
              currentWeek: activeState.currentWeek + 1,
              currentDayIndex: 0,
            },
          });
        }
        // If at last day of last week, stay there (program complete)
      },

      isDayCompleted: (week, dayIndex) => {
        const { activeState } = get();
        if (!activeState) return false;
        return activeState.completedDays.includes(`${week}-${dayIndex}`);
      },

      getCompletedDaysInWeek: (week) => {
        const { activeState } = get();
        if (!activeState) return 0;
        return activeState.completedDays.filter((k) => k.startsWith(`${week}-`)).length;
      },

      getTodayWorkout: () => {
        const { activeState } = get();
        if (!activeState) return null;
        return {
          week: activeState.currentWeek,
          dayIndex: activeState.currentDayIndex,
        };
      },
    }),
    {
      name: 'onset-program-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userProfile: state.userProfile,
        program: state.program,
        activeState: state.activeState,
      }),
    }
  )
);
