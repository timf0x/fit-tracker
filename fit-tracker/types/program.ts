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
  reps: number; // kept for backward compat (= maxReps)
  minReps: number;
  maxReps: number;
  targetRir: number;
  restTime: number;
  setTime?: number; // seconds per set execution (default 35)
  suggestedWeight?: number; // kg — estimated from bodyweight, 0 for bodyweight exercises
  notes?: string;
  // Original values for reset (populated during generation)
  originalSets?: number;
  originalReps?: number;
  originalMinReps?: number;
  originalMaxReps?: number;
  originalRestTime?: number;
  originalSuggestedWeight?: number;
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
  lastCompletedAt?: string; // ISO date — for same-day pacing guard
  sessionFeedback?: Record<string, SessionFeedback>; // key = "week-day"
  lastReadiness?: ReadinessCheck;
}

// ─── Session Feedback (post-session) ───

export interface SessionFeedback {
  pump: 1 | 2 | 3;           // 1=faible, 2=bon, 3=enorme
  soreness: 1 | 2 | 3;       // 1=aucune, 2=moderees, 3=fortes
  performance: 1 | 2 | 3;    // 1=baisse, 2=stable, 3=hausse
  jointPain: boolean;
}

// ─── Readiness Check (pre-session) ───

export interface ReadinessCheck {
  sleep: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  soreness: 1 | 2 | 3 | 4 | 5;
  timestamp: string;
}
