import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout, WorkoutSession, WorkoutStats, HistoryFilter, CompletedExercise } from '@/types';
import { presetWorkouts } from '@/data/workouts';
import { useProgramStore } from '@/stores/programStore';
import { useBadgeStore } from '@/stores/badgeStore';
import type { ReadinessCheck, SessionFeedback } from '@/types/program';

interface WorkoutStoreState {
  customWorkouts: Workout[];
  history: WorkoutSession[];
  stats: WorkoutStats;
  historyFilter: HistoryFilter;
  muscleOrder: string[];
  homeCardOrder: string[];

  // Custom Workouts
  addCustomWorkout: (workout: Omit<Workout, 'id' | 'isPreset' | 'createdAt' | 'updatedAt'>) => string;
  updateCustomWorkout: (id: string, updates: Partial<Workout>) => void;
  deleteCustomWorkout: (id: string) => void;
  duplicateWorkout: (id: string) => string;

  // History
  startSession: (workoutId: string, workoutName?: string, programMeta?: { programId: string; programWeek: number; programDayIndex: number }) => string;
  endSession: (sessionId: string, data: Partial<WorkoutSession>) => void;
  deleteSession: (sessionId: string) => void;
  logPastWorkout: (data: { dateISO: string; workoutName: string; durationMinutes: number; exercises: CompletedExercise[] }) => string;
  saveSessionReadiness: (sessionId: string, readiness: ReadinessCheck) => void;
  setHistoryFilter: (filter: HistoryFilter) => void;

  updateSession: (sessionId: string, updates: Partial<WorkoutSession>) => void;

  // Data management
  clearHistory: () => void;

  // Preferences
  setMuscleOrder: (order: string[]) => void;
  setHomeCardOrder: (order: string[]) => void;

  // Getters
  getWorkoutById: (id: string) => Workout | undefined;
  getAllWorkouts: () => Workout[];
  getFilteredHistory: () => WorkoutSession[];
  updateStats: () => void;
}

const generateId = () => `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const initialStats: WorkoutStats = {
  totalWorkouts: 0,
  totalMinutes: 0,
  totalCalories: 0,
  totalVolume: 0,
  currentStreak: 0,
  longestStreak: 0,
};

export const useWorkoutStore = create<WorkoutStoreState>()(
  persist(
    (set, get) => ({
      customWorkouts: [],
      history: [],
      stats: initialStats,
      historyFilter: { dateRange: 'week' },
      muscleOrder: [],
      homeCardOrder: [],

      addCustomWorkout: (workoutData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const workout: Workout = {
          ...workoutData,
          id,
          isPreset: false,
          isCustom: true,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          customWorkouts: [...state.customWorkouts, workout],
        }));
        return id;
      },

      updateCustomWorkout: (id, updates) => {
        set((state) => ({
          customWorkouts: state.customWorkouts.map((w) =>
            w.id === id
              ? { ...w, ...updates, updatedAt: new Date().toISOString() }
              : w
          ),
        }));
      },

      deleteCustomWorkout: (id) => {
        set((state) => ({
          customWorkouts: state.customWorkouts.filter((w) => w.id !== id),
        }));
      },

      duplicateWorkout: (id) => {
        const { addCustomWorkout } = get();
        const workout = get().getWorkoutById(id);
        if (!workout) return '';

        return addCustomWorkout({
          name: `${workout.name} (Copy)`,
          nameFr: `${workout.nameFr} (Copie)`,
          description: workout.description,
          descriptionFr: workout.descriptionFr,
          equipment: workout.equipment,
          level: workout.level,
          focus: workout.focus,
          durationMinutes: workout.durationMinutes,
          exerciseCount: workout.exerciseCount,
          icon: workout.icon,
          exercises: [...workout.exercises],
        });
      },

      startSession: (workoutId, workoutName, programMeta) => {
        const workout = get().getWorkoutById(workoutId);
        const name = workoutName || workout?.name || 'Workout';
        const id = generateSessionId();

        const session: WorkoutSession = {
          id,
          workoutId,
          workoutName: name,
          startTime: new Date().toISOString(),
          durationSeconds: 0,
          completedExercises: [],
          ...(programMeta && {
            programId: programMeta.programId,
            programWeek: programMeta.programWeek,
            programDayIndex: programMeta.programDayIndex,
          }),
        };

        set((state) => ({
          history: [session, ...state.history],
        }));
        return id;
      },

      endSession: (sessionId, data) => {
        const session = get().history.find((s) => s.id === sessionId);
        set((state) => ({
          history: state.history.map((s) =>
            s.id === sessionId
              ? { ...s, ...data, endTime: new Date().toISOString() }
              : s
          ),
        }));
        get().updateStats();

        // Mark program day completed if this was a program session
        if (session?.programId && session.programWeek != null && session.programDayIndex != null) {
          useProgramStore.getState().markDayCompleted(session.programWeek, session.programDayIndex);
          // Save session feedback to program store for volume adaptation
          if (data.feedback) {
            useProgramStore.getState().saveSessionFeedback(
              session.programWeek,
              session.programDayIndex,
              data.feedback as SessionFeedback,
            );
          }
        }

        // Check badge unlocks with updated history
        useBadgeStore.getState().checkBadges(get().history);
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          history: state.history.filter((s) => s.id !== sessionId),
        }));
        get().updateStats();
      },

      logPastWorkout: (data) => {
        const id = generateSessionId();
        // Place session at noon on the target date to avoid timezone edge cases
        const startTime = new Date(`${data.dateISO}T12:00:00`);
        const endTime = new Date(startTime.getTime() + data.durationMinutes * 60 * 1000);

        const session: WorkoutSession = {
          id,
          workoutId: 'manual',
          workoutName: data.workoutName,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationSeconds: data.durationMinutes * 60,
          completedExercises: data.exercises,
          source: 'manual',
        };

        set((state) => ({
          history: [session, ...state.history],
        }));
        get().updateStats();
        useBadgeStore.getState().checkBadges(get().history);
        return id;
      },

      updateSession: (sessionId, updates) => {
        set((state) => ({
          history: state.history.map((s) =>
            s.id === sessionId
              ? { ...s, ...updates }
              : s
          ),
        }));
        get().updateStats();
        useBadgeStore.getState().checkBadges(get().history);
      },

      saveSessionReadiness: (sessionId, readiness) => {
        set((state) => ({
          history: state.history.map((s) =>
            s.id === sessionId ? { ...s, readiness } : s
          ),
        }));
      },

      setHistoryFilter: (filter) => set({ historyFilter: filter }),

      clearHistory: () => {
        set({ history: [], stats: initialStats });
      },

      setMuscleOrder: (order) => set({ muscleOrder: order }),
      setHomeCardOrder: (order) => set({ homeCardOrder: order }),

      getWorkoutById: (id) => {
        const { customWorkouts } = get();
        return [...presetWorkouts, ...customWorkouts].find((w) => w.id === id);
      },

      getAllWorkouts: () => {
        const { customWorkouts } = get();
        return [...presetWorkouts, ...customWorkouts];
      },

      getFilteredHistory: () => {
        const { history, historyFilter } = get();
        const now = new Date();
        let startDate: Date;

        switch (historyFilter.dateRange) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '3months':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'custom':
            startDate = historyFilter.startDate ? new Date(historyFilter.startDate) : new Date(0);
            break;
          case 'all':
          default:
            return history;
        }

        const endDate = historyFilter.endDate ? new Date(historyFilter.endDate) : now;
        return history.filter((session) => {
          const sessionDate = new Date(session.startTime);
          return sessionDate >= startDate && sessionDate <= endDate;
        });
      },

      updateStats: () => {
        const { history } = get();
        const completed = history.filter((s) => s.endTime);
        const totalWorkouts = completed.length;
        const totalMinutes = Math.round(
          completed.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60
        );
        const totalCalories = Math.round(totalMinutes * 5);
        const totalVolume = completed.reduce((acc, session) => {
          return acc + session.completedExercises.reduce((exAcc, ex) => {
            return exAcc + ex.sets.reduce((setAcc, s) => setAcc + (s.weight || 0) * s.reps, 0);
          }, 0);
        }, 0);

        // Calculate weekly streaks (consecutive weeks with ≥2 sessions)
        // In musculation, rest days are essential — what matters is weekly consistency
        let currentStreak = 0;
        let longestStreak = 0;

        if (completed.length > 0) {
          // Get Monday 00:00 for a given date
          const getMonday = (d: Date): number => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = day === 0 ? 6 : day - 1;
            date.setDate(date.getDate() - diff);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
          };

          // Count sessions per week (keyed by Monday timestamp)
          const sessionsPerWeek = new Map<number, number>();
          for (const s of completed) {
            const mondayMs = getMonday(new Date(s.startTime));
            sessionsPerWeek.set(mondayMs, (sessionsPerWeek.get(mondayMs) || 0) + 1);
          }

          // Get weeks with ≥2 sessions, sorted descending
          const ONE_WEEK = 7 * 86400000;
          const qualifiedWeeks = Array.from(sessionsPerWeek.entries())
            .filter(([, count]) => count >= 2)
            .map(([monday]) => monday)
            .sort((a, b) => b - a);

          if (qualifiedWeeks.length > 0) {
            const currentMonday = getMonday(new Date());

            // Current streak: consecutive weeks from this week or last week
            if (qualifiedWeeks[0] === currentMonday || qualifiedWeeks[0] === currentMonday - ONE_WEEK) {
              currentStreak = 1;
              for (let i = 1; i < qualifiedWeeks.length; i++) {
                if (qualifiedWeeks[i] === qualifiedWeeks[i - 1] - ONE_WEEK) {
                  currentStreak++;
                } else {
                  break;
                }
              }
            }

            // Longest streak
            let run = 1;
            for (let i = 1; i < qualifiedWeeks.length; i++) {
              if (qualifiedWeeks[i] === qualifiedWeeks[i - 1] - ONE_WEEK) {
                run++;
              } else {
                if (run > longestStreak) longestStreak = run;
                run = 1;
              }
            }
            if (run > longestStreak) longestStreak = run;
          }
        }

        set({
          stats: {
            totalWorkouts,
            totalMinutes,
            totalCalories,
            totalVolume: Math.round(totalVolume),
            currentStreak,
            longestStreak,
          },
        });
      },
    }),
    {
      name: 'onset-workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        customWorkouts: state.customWorkouts,
        history: state.history,
        stats: state.stats,
        muscleOrder: state.muscleOrder,
        homeCardOrder: state.homeCardOrder,
      }),
    }
  )
);
