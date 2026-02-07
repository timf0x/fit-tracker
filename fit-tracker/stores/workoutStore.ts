import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout, WorkoutSession, WorkoutStats, HistoryFilter } from '@/types';
import { presetWorkouts } from '@/data/workouts';

interface WorkoutStoreState {
  customWorkouts: Workout[];
  history: WorkoutSession[];
  stats: WorkoutStats;
  historyFilter: HistoryFilter;

  // Custom Workouts
  addCustomWorkout: (workout: Omit<Workout, 'id' | 'isPreset' | 'createdAt' | 'updatedAt'>) => string;
  updateCustomWorkout: (id: string, updates: Partial<Workout>) => void;
  deleteCustomWorkout: (id: string) => void;
  duplicateWorkout: (id: string) => string;

  // History
  startSession: (workoutId: string, workoutName?: string) => string;
  endSession: (sessionId: string, data: Partial<WorkoutSession>) => void;
  deleteSession: (sessionId: string) => void;
  setHistoryFilter: (filter: HistoryFilter) => void;

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

      startSession: (workoutId, workoutName) => {
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
        };

        set((state) => ({
          history: [session, ...state.history],
        }));
        return id;
      },

      endSession: (sessionId, data) => {
        set((state) => ({
          history: state.history.map((session) =>
            session.id === sessionId
              ? { ...session, ...data, endTime: new Date().toISOString() }
              : session
          ),
        }));
        get().updateStats();
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          history: state.history.filter((s) => s.id !== sessionId),
        }));
        get().updateStats();
      },

      setHistoryFilter: (filter) => set({ historyFilter: filter }),

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

        // Calculate streaks from unique workout dates
        let currentStreak = 0;
        let longestStreak = 0;

        if (completed.length > 0) {
          const uniqueDays = Array.from(
            new Set(
              completed.map((s) => {
                const d = new Date(s.startTime);
                return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              })
            )
          )
            .map((key) => {
              const [y, m, d] = key.split('-').map(Number);
              const date = new Date(y, m, d);
              date.setHours(0, 0, 0, 0);
              return date.getTime();
            })
            .sort((a, b) => b - a); // descending

          const ONE_DAY = 86400000;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayMs = today.getTime();

          // Current streak: consecutive days from today or yesterday
          if (uniqueDays[0] === todayMs || uniqueDays[0] === todayMs - ONE_DAY) {
            currentStreak = 1;
            for (let i = 1; i < uniqueDays.length; i++) {
              if (uniqueDays[i] === uniqueDays[i - 1] - ONE_DAY) {
                currentStreak++;
              } else {
                break;
              }
            }
          }

          // Longest streak: longest consecutive run in entire history
          let run = 1;
          for (let i = 1; i < uniqueDays.length; i++) {
            if (uniqueDays[i] === uniqueDays[i - 1] - ONE_DAY) {
              run++;
            } else {
              if (run > longestStreak) longestStreak = run;
              run = 1;
            }
          }
          if (run > longestStreak) longestStreak = run;
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
      }),
    }
  )
);
