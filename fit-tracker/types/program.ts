// ─── User Profile ───

export type TrainingGoal = 'hypertrophy' | 'strength' | 'recomposition';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type EquipmentSetup = 'full_gym' | 'home_dumbbell' | 'bodyweight';

export interface UserProfile {
  goal: TrainingGoal;
  experience: ExperienceLevel;
  daysPerWeek: 3 | 4 | 5 | 6;
  sex: 'male' | 'female';
  weight: number; // kg — required for weight estimation
  height?: number; // cm
  age?: number;
  equipment: EquipmentSetup;
  priorityMuscles: string[]; // 0-2 muscle keys from MUSCLE_LABELS_FR
  createdAt: string;
  updatedAt: string;
}

// ─── Program Structure ───

export type SplitType = 'full_body' | 'upper_lower' | 'ppl';

export interface ProgramExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  restTime: number;
  suggestedWeight?: number; // kg — estimated from bodyweight, 0 for bodyweight exercises
  notes?: string;
}

export interface ProgramDay {
  dayIndex: number;
  label: string;
  labelFr: string;
  focus: string;
  muscleTargets: string[];
  exercises: ProgramExercise[];
  isRestDay: boolean;
}

export interface ProgramWeek {
  weekNumber: number;
  isDeload: boolean;
  days: ProgramDay[];
  volumeTargets: Record<string, number>; // muscle → target sets
}

export interface TrainingProgram {
  id: string;
  name: string;
  nameFr: string;
  splitType: SplitType;
  totalWeeks: number;
  weeks: ProgramWeek[];
  userProfile: UserProfile;
  createdAt: string;
  startedAt?: string;
}

export interface ActiveProgramState {
  programId: string;
  currentWeek: number;
  currentDayIndex: number;
  completedDays: string[]; // "week-day" keys
  startDate: string;
}
