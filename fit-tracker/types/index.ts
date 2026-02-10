// Exercise Types
export type BodyPart =
  | 'back'
  | 'shoulders'
  | 'chest'
  | 'upper arms'
  | 'lower arms'
  | 'upper legs'
  | 'lower legs'
  | 'waist'
  | 'cardio';

export type Equipment =
  | 'dumbbell'
  | 'barbell'
  | 'cable'
  | 'machine'
  | 'body weight'
  | 'kettlebell'
  | 'resistance band'
  | 'ez bar'
  | 'smith machine'
  | 'trap bar'
  | 'other';

export type Category = 'push' | 'pull' | 'legs' | 'core' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  nameFr: string;
  bodyPart: BodyPart;
  equipment: Equipment;
  isUnilateral: boolean;
  target: string;
  description: string;
  descriptionFr?: string;
  category?: Category;
  gifUrl?: string;
  instructions?: string[];
  instructionsFr?: string[];
  secondaryMuscles?: string[];
}

// Workout Types
export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';
export type WorkoutFocus = 'full_body' | 'upper' | 'lower' | 'push' | 'pull' | 'legs' | 'core' | 'cardio';

export interface WorkoutExercise {
  exerciseId: string;
  exercise?: Exercise;
  sets: number;
  reps: number;
  weight?: number;
  restTime: number;
  setTime?: number; // seconds per set execution (default 35)
  notes?: string;
}

export const DEFAULT_SET_TIME = 35;

export interface Workout {
  id: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  equipment?: string[];
  level: WorkoutLevel;
  focus?: WorkoutFocus;
  durationMinutes: number;
  exerciseCount?: number;
  icon?: string;
  exercises: WorkoutExercise[];
  isPreset?: boolean;
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutFilter {
  level?: WorkoutLevel;
  focus?: WorkoutFocus;
  equipment?: string;
  duration?: 'short' | 'medium' | 'long';
}

// Session Types
export interface CompletedSet {
  reps: number;
  weight?: number;
  completed: boolean;
  side?: 'right' | 'left';
  rir?: number; // Reps In Reserve (0=failure, 1-3=effective, 4+=too easy)
}

/**
 * A set is "effective" for hypertrophy volume if completed at adequate intensity.
 * Per RP science, sets at RIR ≤ 3 drive meaningful stimulus.
 * Sets at RIR 4+ are "junk volume" — not hard enough to count toward weekly volume.
 * Sets without RIR logged count fully (backward compat for users who don't log RIR).
 */
export function isEffectiveSet(set: CompletedSet): boolean {
  return set.completed && (set.rir === undefined || set.rir <= 3);
}

export interface CompletedExercise {
  exerciseId: string;
  sets: CompletedSet[];
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  workoutName: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  completedExercises: CompletedExercise[];
  // Program tracking (optional)
  programId?: string;
  programWeek?: number;
  programDayIndex?: number;
  // Pre-session readiness check (optional)
  readiness?: import('@/types/program').ReadinessCheck;
  // Post-session feedback (optional)
  feedback?: import('@/types/program').SessionFeedback;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
  totalVolume: number;
  currentStreak: number;
  longestStreak: number;
}

export interface HistoryFilter {
  dateRange: 'week' | 'month' | '3months' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
}

// Recovery Types
export type RecoveryBodyPart =
  | 'chest'
  | 'shoulders'
  | 'upper back'
  | 'lats'
  | 'lower back'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'obliques'
  | 'cardio';

export type RecoveryLevel = 'fatigued' | 'fresh' | 'undertrained';

export interface MuscleRecoveryData {
  bodyPart: RecoveryBodyPart;
  status: RecoveryLevel;
  hoursSinceTraining: number | null;
  totalSets: number;
}

export interface RecoveryOverview {
  overallScore: number;
  muscles: MuscleRecoveryData[];
  freshCount: number;
  fatiguedCount: number;
  undertrainedCount: number;
}

// Badge / Trophy Types
export type BadgeCategory =
  | 'volume'
  | 'consistency'
  | 'strength'
  | 'muscles'
  | 'equipment'
  | 'variety'
  | 'social'
  | 'ai_coach'
  | 'special';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Badge {
  id: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  category: BadgeCategory;
  tier: BadgeTier;
  icon: string; // Lucide icon name
  points: number;
  isSecret: boolean;
  conditionType: string;
  conditionValue: number;
  conditionExtra?: Record<string, unknown> | null;
}

export interface BadgeProgress {
  badge: Badge;
  isUnlocked: boolean;
  unlockedAt?: string;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
}

export interface UserLevel {
  id: string;
  name: string;
  nameFr: string;
  minPoints: number;
  icon: string;
}

export interface UserBadgeSummary {
  totalBadges: number;
  totalPoints: number;
  level: UserLevel;
  nextLevel?: UserLevel;
  pointsToNextLevel: number;
  badgesByTier: Record<BadgeTier, number>;
  badgesByCategory: Record<BadgeCategory, number>;
}
