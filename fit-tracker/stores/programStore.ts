import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  TrainingProgram,
  ActiveProgramState,
  ProgramExercise,
  ProgramSchedule,
  SessionFeedback,
  ReadinessCheck,
  WeekDay,
} from '@/types/program';
import { generateProgram } from '@/lib/programGenerator';
import { computeFeedbackAdjustments } from '@/lib/feedbackAdaptation';
import {
  buildSchedule,
  rescheduleForward,
  getPlannedDayForDate,
  getNextScheduledDay,
  getTodayISO,
} from '@/lib/scheduleEngine';

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
  startProgramWithSchedule: (preferredDays: WeekDay[], startDate: string) => void;
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
  applyFeedbackToNextWeek: () => void;

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
              ex.originalMinReps = ex.minReps;
              ex.originalMaxReps = ex.maxReps;
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

      startProgramWithSchedule: (preferredDays, startDate) => {
        const { program } = get();
        if (!program) return;

        const schedule = buildSchedule(program, preferredDays, startDate);

        const activeState: ActiveProgramState = {
          programId: program.id,
          currentWeek: 1,
          currentDayIndex: 0,
          completedDays: [],
          startDate: new Date().toISOString(),
          schedule,
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

        const todayISO = getTodayISO();

        // Update schedule if it exists — reschedule future days
        let updatedSchedule = activeState.schedule;
        if (updatedSchedule) {
          updatedSchedule = rescheduleForward(
            updatedSchedule,
            week,
            dayIndex,
            todayISO,
          );
        }

        set({
          activeState: {
            ...activeState,
            completedDays: [...activeState.completedDays, key],
            lastCompletedAt: new Date().toISOString(),
            schedule: updatedSchedule,
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
          // Crossing week boundary — apply feedback to next week
          get().applyFeedbackToNextWeek();
          set({
            activeState: {
              ...get().activeState!,
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
          minReps: ex.originalMinReps,
          maxReps: ex.originalMaxReps,
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

      applyFeedbackToNextWeek: () => {
        const { activeState, program } = get();
        if (!activeState || !program || !activeState.sessionFeedback) return;

        const currentWeekNum = activeState.currentWeek;
        const currentWeek = program.weeks.find((w) => w.weekNumber === currentWeekNum);
        const nextWeek = program.weeks.find((w) => w.weekNumber === currentWeekNum + 1);
        if (!currentWeek || !nextWeek) return;

        // Collect feedback for this week's days
        const weekFeedbacks: import('@/types/program').SessionFeedback[] = [];
        const dayMuscleMap: Record<number, string[]> = {};
        for (let d = 0; d < currentWeek.days.length; d++) {
          const key = `${currentWeekNum}-${d}`;
          const fb = activeState.sessionFeedback[key];
          if (fb) {
            weekFeedbacks.push(fb);
            dayMuscleMap[d] = currentWeek.days[d].muscleTargets;
          }
        }

        // Only apply if feedback exists for ≥50% of the week's days
        if (weekFeedbacks.length < currentWeek.days.length * 0.5) return;

        const adjustments = computeFeedbackAdjustments(weekFeedbacks, dayMuscleMap);
        if (adjustments.length === 0) return;

        // Build muscle→delta map
        const deltaMap = new Map<string, number>();
        for (const adj of adjustments) {
          deltaMap.set(adj.muscle, adj.deltaSets);
        }

        // Apply set deltas to next week's exercises
        const nextWeekIdx = program.weeks.findIndex((w) => w.weekNumber === currentWeekNum + 1);
        if (nextWeekIdx === -1) return;

        const updatedWeeks = [...program.weeks];
        const updatedDays = [...updatedWeeks[nextWeekIdx].days];

        for (let d = 0; d < updatedDays.length; d++) {
          const day = updatedDays[d];
          const updatedExercises = [...day.exercises];
          for (let e = 0; e < updatedExercises.length; e++) {
            const ex = updatedExercises[e];
            // Check if any of this day's muscle targets have an adjustment
            for (const muscle of day.muscleTargets) {
              const delta = deltaMap.get(muscle);
              if (delta && delta !== 0) {
                // Distribute delta across exercises targeting this muscle
                // Simple: apply to first exercise found for this muscle
                const newSets = Math.max(1, ex.sets + delta);
                if (newSets !== ex.sets) {
                  updatedExercises[e] = { ...ex, sets: newSets };
                  break; // Only apply delta once per muscle per day
                }
              }
            }
          }
          updatedDays[d] = { ...day, exercises: updatedExercises };
        }

        updatedWeeks[nextWeekIdx] = { ...updatedWeeks[nextWeekIdx], days: updatedDays };
        set({ program: { ...program, weeks: updatedWeeks } });
      },

      swapExercise: (week, dayIndex, exerciseIndex, newExerciseId) => {
        get().overrideExercise(week, dayIndex, exerciseIndex, {
          exerciseId: newExerciseId,
        });
      },

      getTodayWorkout: () => {
        const { activeState } = get();
        if (!activeState) return null;

        // If schedule exists, use it for date-aware lookup
        if (activeState.schedule) {
          const todayISO = getTodayISO();
          const planned = getPlannedDayForDate(activeState.schedule, todayISO);
          if (planned && !planned.completedDate) {
            return { week: planned.weekNumber, dayIndex: planned.dayIndex };
          }
          // No session scheduled today
          return null;
        }

        // Legacy fallback: use raw currentWeek/currentDayIndex
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
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userProfile: state.userProfile,
        program: state.program,
        activeState: state.activeState,
      }),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        // v2→v3: no structural changes needed, schedule field is optional
        if (version < 2) {
          // Migrate reps → minReps=maxReps=reps for existing programs
          const program = state.program as TrainingProgram | null;
          if (program?.weeks) {
            for (const week of program.weeks) {
              for (const day of week.days) {
                for (const ex of day.exercises) {
                  if (ex.minReps === undefined || ex.minReps === 0) {
                    ex.minReps = ex.reps || 10;
                  }
                  if (ex.maxReps === undefined || ex.maxReps === 0) {
                    ex.maxReps = ex.reps || 10;
                  }
                  if (ex.targetRir === undefined) {
                    ex.targetRir = 2;
                  }
                  if (ex.originalMinReps === undefined && ex.originalReps !== undefined) {
                    ex.originalMinReps = ex.originalReps;
                  }
                  if (ex.originalMaxReps === undefined && ex.originalReps !== undefined) {
                    ex.originalMaxReps = ex.originalReps;
                  }
                }
              }
            }
          }
        }
        return state as unknown as ProgramStoreState;
      },
    }
  )
);
