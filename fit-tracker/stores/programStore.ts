import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  TrainingProgram,
  ActiveProgramState,
  ProgramExercise,
  SessionFeedback,
  ReadinessCheck,
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
  isProgramComplete: () => boolean;

  // Exercise overrides
  overrideExercise: (week: number, dayIndex: number, exerciseIndex: number, overrides: Partial<ProgramExercise>) => void;
  resetExerciseOverrides: (week: number, dayIndex: number, exerciseIndex: number) => void;

  // Feedback & readiness
  saveSessionFeedback: (week: number, dayIndex: number, feedback: SessionFeedback) => void;
  saveReadiness: (check: ReadinessCheck) => void;

  // Exercise swap
  swapExercise: (week: number, dayIndex: number, exerciseIndex: number, newExerciseId: string) => void;

  // Getters
  getTodayWorkout: () => { week: number; dayIndex: number } | null;
  getStreakCount: () => number;
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

        // Populate original values for reset capability
        for (const week of program.weeks) {
          for (const day of week.days) {
            for (const ex of day.exercises) {
              ex.originalSets = ex.sets;
              ex.originalReps = ex.reps;
              ex.originalRestTime = ex.restTime;
              ex.originalSuggestedWeight = ex.suggestedWeight;
            }
          }
        }

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
            lastCompletedAt: new Date().toISOString(),
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

      isProgramComplete: () => {
        const { activeState, program } = get();
        if (!activeState || !program) return false;
        const totalDays = program.weeks.reduce((sum, w) => sum + w.days.length, 0);
        return activeState.completedDays.length >= totalDays;
      },

      overrideExercise: (week, dayIndex, exerciseIndex, overrides) => {
        const { program } = get();
        if (!program) return;

        const weekIdx = program.weeks.findIndex((w) => w.weekNumber === week);
        if (weekIdx === -1) return;
        const weekData = program.weeks[weekIdx];
        if (!weekData.days[dayIndex]?.exercises[exerciseIndex]) return;

        const updatedWeeks = [...program.weeks];
        const updatedDays = [...updatedWeeks[weekIdx].days];
        const updatedExercises = [...updatedDays[dayIndex].exercises];
        updatedExercises[exerciseIndex] = {
          ...updatedExercises[exerciseIndex],
          ...overrides,
        };
        updatedDays[dayIndex] = { ...updatedDays[dayIndex], exercises: updatedExercises };
        updatedWeeks[weekIdx] = { ...updatedWeeks[weekIdx], days: updatedDays };

        set({ program: { ...program, weeks: updatedWeeks } });
      },

      resetExerciseOverrides: (week, dayIndex, exerciseIndex) => {
        const { program } = get();
        if (!program) return;

        const weekIdx = program.weeks.findIndex((w) => w.weekNumber === week);
        if (weekIdx === -1) return;
        const ex = program.weeks[weekIdx]?.days[dayIndex]?.exercises[exerciseIndex];
        if (!ex || ex.originalSets === undefined) return;

        get().overrideExercise(week, dayIndex, exerciseIndex, {
          sets: ex.originalSets,
          reps: ex.originalReps,
          restTime: ex.originalRestTime,
          suggestedWeight: ex.originalSuggestedWeight,
        });
      },

      saveSessionFeedback: (week, dayIndex, feedback) => {
        const { activeState } = get();
        if (!activeState) return;
        const key = `${week}-${dayIndex}`;
        set({
          activeState: {
            ...activeState,
            sessionFeedback: {
              ...activeState.sessionFeedback,
              [key]: feedback,
            },
          },
        });
      },

      saveReadiness: (check) => {
        const { activeState } = get();
        if (!activeState) return;
        set({
          activeState: {
            ...activeState,
            lastReadiness: check,
          },
        });
      },

      swapExercise: (week, dayIndex, exerciseIndex, newExerciseId) => {
        get().overrideExercise(week, dayIndex, exerciseIndex, {
          exerciseId: newExerciseId,
        });
      },

      getTodayWorkout: () => {
        const { activeState } = get();
        if (!activeState) return null;
        return {
          week: activeState.currentWeek,
          dayIndex: activeState.currentDayIndex,
        };
      },

      getStreakCount: () => {
        const { activeState } = get();
        if (!activeState) return 0;
        return activeState.completedDays.length;
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
