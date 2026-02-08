import { ExperienceLevel } from '@/types/program';
import { Equipment } from '@/types';

/**
 * Weight Estimation Engine
 *
 * Estimates starting weights based on:
 * - User bodyweight (kg)
 * - Sex (male/female)
 * - Experience level (beginner/intermediate/advanced)
 * - Exercise equipment type
 * - Whether the exercise is compound or isolation
 * - Target muscle group
 *
 * Based on population averages from strength standards databases
 * (Symmetric Strength, ExRx, RP guidelines).
 *
 * All ratios are expressed as fraction of bodyweight (BW).
 * Female upper body = ~55% of male, lower body = ~75% of male.
 */

// ─── BW Ratios by Exercise ID (specific overrides for key lifts) ───

interface BWRatio {
  beginner: number;
  intermediate: number;
  advanced: number;
}

/**
 * Per-exercise BW ratios for MALE lifters.
 * These are the "working weight" for the prescribed rep range,
 * NOT 1RM. E.g., bench press beginner 0.45 = 45% of BW for sets of 8-12.
 */
const EXERCISE_BW_RATIOS: Record<string, BWRatio> = {
  // ─── Chest (Compound) ───
  'ex_023': { beginner: 0.45, intermediate: 0.70, advanced: 0.95 }, // Bench Press
  'ex_024': { beginner: 0.35, intermediate: 0.55, advanced: 0.75 }, // Incline Bench
  'ex_025': { beginner: 0.40, intermediate: 0.65, advanced: 0.85 }, // Decline Bench
  'ex_026': { beginner: 0.15, intermediate: 0.25, advanced: 0.35 }, // DB Bench (per hand)
  'ex_027': { beginner: 0.12, intermediate: 0.20, advanced: 0.30 }, // Incline DB Press (per hand)
  'ex_031': { beginner: 0.00, intermediate: 0.00, advanced: 0.00 }, // Dips (BW)
  'ex_032': { beginner: 0.40, intermediate: 0.65, advanced: 0.90 }, // Machine Press

  // ─── Back (Compound) ───
  'ex_005': { beginner: 0.40, intermediate: 0.65, advanced: 0.85 }, // Lat Pulldown
  'ex_006': { beginner: 0.40, intermediate: 0.60, advanced: 0.80 }, // Seated Cable Row
  'ex_007': { beginner: 0.40, intermediate: 0.65, advanced: 0.85 }, // Barbell Row
  'ex_008': { beginner: 0.35, intermediate: 0.55, advanced: 0.75 }, // T-Bar Row
  'ex_009': { beginner: 0.75, intermediate: 1.20, advanced: 1.65 }, // Deadlift
  'ex_010': { beginner: 0.00, intermediate: 0.00, advanced: 0.00 }, // Pull-Up (BW)
  'ex_011': { beginner: 0.00, intermediate: 0.00, advanced: 0.00 }, // Chin-Up (BW)
  'ex_085': { beginner: 0.00, intermediate: 0.00, advanced: 0.00 }, // Inverted Row (BW)
  'ex_087': { beginner: 0.12, intermediate: 0.20, advanced: 0.28 }, // Single Arm Cable Row
  'ex_088': { beginner: 0.40, intermediate: 0.60, advanced: 0.80 }, // Pendlay Row
  'ex_001': { beginner: 0.12, intermediate: 0.20, advanced: 0.30 }, // One-Arm DB Row (per hand)

  // ─── Shoulders (Compound) ───
  'ex_015': { beginner: 0.10, intermediate: 0.17, advanced: 0.25 }, // Arnold Press (per hand)
  'ex_016': { beginner: 0.30, intermediate: 0.48, advanced: 0.65 }, // Overhead Press
  'ex_017': { beginner: 0.10, intermediate: 0.18, advanced: 0.27 }, // DB Shoulder Press (per hand)
  'ex_091': { beginner: 0.30, intermediate: 0.50, advanced: 0.70 }, // Machine Shoulder Press

  // ─── Legs (Compound) ───
  'ex_051': { beginner: 0.60, intermediate: 1.00, advanced: 1.40 }, // Barbell Squat
  'ex_052': { beginner: 0.50, intermediate: 0.85, advanced: 1.20 }, // Front Squat
  'ex_053': { beginner: 1.00, intermediate: 1.60, advanced: 2.20 }, // Leg Press
  'ex_054': { beginner: 0.55, intermediate: 0.90, advanced: 1.30 }, // Hack Squat
  'ex_056': { beginner: 0.45, intermediate: 0.75, advanced: 1.05 }, // Romanian DL
  'ex_058': { beginner: 0.40, intermediate: 0.70, advanced: 1.00 }, // Stiff Leg DL
  'ex_059': { beginner: 0.10, intermediate: 0.18, advanced: 0.27 }, // Bulgarian Split Squat (per hand)
  'ex_060': { beginner: 0.08, intermediate: 0.15, advanced: 0.22 }, // Walking Lunges (per hand)
  'ex_061': { beginner: 0.50, intermediate: 0.85, advanced: 1.20 }, // Hip Thrust
  'ex_062': { beginner: 0.12, intermediate: 0.22, advanced: 0.32 }, // Goblet Squat (single DB)
  'ex_102': { beginner: 0.60, intermediate: 1.00, advanced: 1.40 }, // Sumo Deadlift
  'ex_103': { beginner: 0.10, intermediate: 0.18, advanced: 0.27 }, // DB Lunge (per hand)
  'ex_104': { beginner: 0.10, intermediate: 0.17, advanced: 0.25 }, // Step-Up (per hand)
  'ex_107': { beginner: 0.30, intermediate: 0.50, advanced: 0.70 }, // Good Morning
  'ex_108': { beginner: 0.00, intermediate: 0.00, advanced: 0.00 }, // Nordic Curl (BW)
  'ex_109': { beginner: 0.55, intermediate: 0.90, advanced: 1.30 }, // Smith Machine Squat
  'ex_110': { beginner: 0.65, intermediate: 1.05, advanced: 1.50 }, // Trap Bar DL
  'ex_111': { beginner: 0.15, intermediate: 0.25, advanced: 0.35 }, // KB Swing
  'ex_112': { beginner: 0.00, intermediate: 0.00, advanced: 0.00 }, // Pistol Squat (BW)

  // ─── Arms (Compound) ───
  'ex_042': { beginner: 0.40, intermediate: 0.60, advanced: 0.80 }, // Close-Grip Bench
};

/**
 * Fallback BW ratios by muscle + equipment category (male).
 * Used when no specific exercise ratio is defined.
 * Key format: "muscle:equipment" or "muscle:*" for default.
 */
const FALLBACK_RATIOS: Record<string, BWRatio> = {
  // Isolation — Chest
  'chest:dumbbell':        { beginner: 0.08, intermediate: 0.13, advanced: 0.18 },
  'chest:cable':           { beginner: 0.12, intermediate: 0.20, advanced: 0.28 },
  'chest:machine':         { beginner: 0.20, intermediate: 0.35, advanced: 0.50 },

  // Isolation — Back
  'lats:cable':            { beginner: 0.15, intermediate: 0.25, advanced: 0.35 },
  'lats:dumbbell':         { beginner: 0.10, intermediate: 0.17, advanced: 0.25 },
  'upper back:dumbbell':   { beginner: 0.10, intermediate: 0.17, advanced: 0.25 },
  'upper back:cable':      { beginner: 0.12, intermediate: 0.20, advanced: 0.28 },

  // Isolation — Shoulders
  'shoulders:dumbbell':    { beginner: 0.05, intermediate: 0.08, advanced: 0.12 },
  'shoulders:cable':       { beginner: 0.06, intermediate: 0.10, advanced: 0.15 },
  'shoulders:machine':     { beginner: 0.15, intermediate: 0.25, advanced: 0.35 },

  // Isolation — Biceps
  'biceps:barbell':        { beginner: 0.15, intermediate: 0.25, advanced: 0.35 },
  'biceps:dumbbell':       { beginner: 0.06, intermediate: 0.10, advanced: 0.15 },
  'biceps:cable':          { beginner: 0.10, intermediate: 0.18, advanced: 0.25 },
  'biceps:ez bar':         { beginner: 0.13, intermediate: 0.22, advanced: 0.30 },

  // Isolation — Triceps
  'triceps:cable':         { beginner: 0.12, intermediate: 0.20, advanced: 0.28 },
  'triceps:barbell':       { beginner: 0.18, intermediate: 0.30, advanced: 0.42 },
  'triceps:dumbbell':      { beginner: 0.06, intermediate: 0.10, advanced: 0.15 },
  'triceps:ez bar':        { beginner: 0.15, intermediate: 0.25, advanced: 0.35 },

  // Isolation — Forearms
  'forearms:dumbbell':     { beginner: 0.05, intermediate: 0.08, advanced: 0.12 },
  'forearms:barbell':      { beginner: 0.10, intermediate: 0.17, advanced: 0.25 },

  // Isolation — Legs
  'quads:machine':         { beginner: 0.25, intermediate: 0.40, advanced: 0.55 },
  'hamstrings:machine':    { beginner: 0.20, intermediate: 0.35, advanced: 0.50 },
  'calves:machine':        { beginner: 0.40, intermediate: 0.65, advanced: 0.90 },
  'calves:dumbbell':       { beginner: 0.12, intermediate: 0.20, advanced: 0.30 },
  'glutes:cable':          { beginner: 0.15, intermediate: 0.25, advanced: 0.35 },

  // Default fallbacks by equipment
  '*:barbell':             { beginner: 0.25, intermediate: 0.40, advanced: 0.55 },
  '*:dumbbell':            { beginner: 0.08, intermediate: 0.13, advanced: 0.20 },
  '*:cable':               { beginner: 0.12, intermediate: 0.20, advanced: 0.28 },
  '*:machine':             { beginner: 0.25, intermediate: 0.40, advanced: 0.55 },
  '*:kettlebell':          { beginner: 0.10, intermediate: 0.17, advanced: 0.25 },
  '*:ez bar':              { beginner: 0.15, intermediate: 0.25, advanced: 0.35 },
  '*:smith machine':       { beginner: 0.35, intermediate: 0.55, advanced: 0.75 },
  '*:trap bar':            { beginner: 0.55, intermediate: 0.90, advanced: 1.25 },
};

// ─── Sex Modifiers ───

const SEX_MODIFIER = {
  male: 1.0,
  female_upper: 0.55, // Upper body exercises
  female_lower: 0.75, // Lower body exercises
} as const;

const LOWER_BODY_MUSCLES = new Set([
  'quads', 'hamstrings', 'glutes', 'calves',
  'lower back', // often trained with lower body movements
]);

// ─── Rounding ───

export function roundToIncrement(weight: number, equipment: Equipment): number {
  if (weight <= 0) return 0;

  let increment: number;
  switch (equipment) {
    case 'barbell':
    case 'ez bar':
    case 'smith machine':
    case 'trap bar':
      increment = 2.5;
      break;
    case 'dumbbell':
    case 'kettlebell':
      increment = 2;
      break;
    case 'cable':
    case 'machine':
      increment = 5;
      break;
    default:
      increment = 2.5;
  }

  return Math.max(increment, Math.round(weight / increment) * increment);
}

// ─── Main Function ───

/**
 * Estimate a starting weight for an exercise based on user profile.
 * Returns 0 for bodyweight/resistance band exercises.
 */
export function getEstimatedWeight(
  exerciseId: string,
  equipment: Equipment,
  targetMuscle: string,
  bodyweight: number,
  sex: 'male' | 'female',
  experience: ExperienceLevel,
  hasHistory?: boolean
): number {
  // Bodyweight exercises → no external weight
  if (equipment === 'body weight' || equipment === 'resistance band') {
    return 0;
  }

  // 1. Look up specific exercise ratio
  let ratio: BWRatio | undefined = EXERCISE_BW_RATIOS[exerciseId];

  // 2. Fallback to muscle:equipment
  if (!ratio) {
    // Normalize muscle name for lookup
    const muscleKey = normalizeMuscle(targetMuscle);
    ratio = FALLBACK_RATIOS[`${muscleKey}:${equipment}`]
      || FALLBACK_RATIOS[`*:${equipment}`];
  }

  if (!ratio) return 0;

  // 3. Get base weight from experience-appropriate ratio
  const bwRatio = ratio[experience];
  let weight = bodyweight * bwRatio;

  // 4. Apply sex modifier
  if (sex === 'female') {
    const muscleKey = normalizeMuscle(targetMuscle);
    const isLower = LOWER_BODY_MUSCLES.has(muscleKey);
    weight *= isLower ? SEX_MODIFIER.female_lower : SEX_MODIFIER.female_upper;
  }

  // 5. Conservative first-meso: reduce by 15% if no training history
  if (hasHistory === false) {
    weight *= 0.85;
  }

  // 6. Round to practical increment
  return roundToIncrement(weight, equipment);
}

/**
 * Get the last logged weight for an exercise from workout history.
 * Returns median completed weight from the most recent session, or null.
 */
export function getLastLoggedWeight(
  exerciseId: string,
  history: Array<{ completedExercises: Array<{ exerciseId: string; sets: Array<{ weight?: number; completed: boolean }> }> }>
): number | null {
  for (const session of history) {
    if (!session.completedExercises) continue;
    const found = session.completedExercises.find((e) => e.exerciseId === exerciseId);
    if (!found) continue;

    const weights = found.sets
      .filter((s) => s.completed && s.weight && s.weight > 0)
      .map((s) => s.weight as number);

    if (weights.length === 0) continue;

    // Return median
    weights.sort((a, b) => a - b);
    const mid = Math.floor(weights.length / 2);
    return weights.length % 2 === 0
      ? (weights[mid - 1] + weights[mid]) / 2
      : weights[mid];
  }

  return null;
}

/**
 * Normalize target muscle strings to canonical keys used in lookup tables.
 */
function normalizeMuscle(target: string): string {
  const aliases: Record<string, string> = {
    pecs: 'chest', 'upper chest': 'chest', 'lower chest': 'chest',
    'middle back': 'upper back', 'rear delts': 'shoulders',
    delts: 'shoulders', 'front delts': 'shoulders', 'lateral delts': 'shoulders',
    traps: 'shoulders',
    brachialis: 'biceps',
    'forearm flexors': 'forearms', 'forearm extensors': 'forearms',
    brachioradialis: 'forearms', grip: 'forearms',
    gastrocnemius: 'calves', soleus: 'calves',
    'lower abs': 'abs', 'core stability': 'abs',
  };
  return aliases[target] || target;
}

/**
 * Estimate e1RM using the Brzycki formula.
 * e1RM = weight x (36 / (37 - reps))
 * Only valid for reps <= 12.
 */
export function estimateE1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  if (reps > 12) {
    // Brzycki is less accurate above 12 reps, use Epley
    return weight * (1 + reps / 30);
  }
  return weight * (36 / (37 - reps));
}

/**
 * Suggest progressive overload based on the last completed weight.
 * Returns the next weight to attempt.
 */
export function getNextWeight(
  lastWeight: number,
  equipment: Equipment,
): number {
  if (lastWeight <= 0) return 0;

  let increment: number;
  switch (equipment) {
    case 'barbell':
    case 'ez bar':
    case 'smith machine':
    case 'trap bar':
      increment = 2.5;
      break;
    case 'dumbbell':
    case 'kettlebell':
      increment = 2;
      break;
    case 'cable':
    case 'machine':
      increment = 2.5; // cable/machine smaller jumps than plate-loaded
      break;
    default:
      increment = 2.5;
  }

  return lastWeight + increment;
}
