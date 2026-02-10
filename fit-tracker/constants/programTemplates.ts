import { EquipmentSetup, SplitType } from '@/types/program';
import { Equipment } from '@/types';

/**
 * Equipment allowed per setup
 */
export const EQUIPMENT_BY_SETUP: Record<EquipmentSetup, Equipment[]> = {
  full_gym: [
    'barbell', 'dumbbell', 'cable', 'machine', 'body weight',
    'kettlebell', 'resistance band', 'ez bar', 'smith machine', 'trap bar',
  ],
  home_dumbbell: [
    'dumbbell', 'body weight', 'resistance band', 'kettlebell',
  ],
  bodyweight: [
    'body weight', 'resistance band',
  ],
};

/**
 * Split selection based on days per week
 */
export function getSplitForDays(days: 3 | 4 | 5 | 6): SplitType {
  switch (days) {
    case 3: return 'full_body';
    case 4: return 'upper_lower';
    case 5: return 'upper_lower';
    case 6: return 'ppl';
  }
}

/**
 * Exercise pools per muscle, ordered by priority.
 * The generator uses these IDs to pick exercises.
 */
export const EXERCISE_POOLS: Record<string, string[]> = {
  // Chest
  chest: [
    'ex_023', // Bench Press
    'ex_026', // DB Bench Press
    'ex_024', // Incline Bench Press
    'ex_027', // Incline DB Press
    'ex_028', // DB Fly
    'ex_029', // Cable Crossover
    'ex_032', // Machine Press
    'ex_093', // Pec Deck
    'ex_094', // Incline DB Fly
    'ex_030', // Push-Up
    'ex_031', // Dips
    'ex_095', // Band Chest Press
  ],
  // Back - Lats
  lats: [
    'ex_005', // Lat Pulldown
    'ex_007', // Barbell Row
    'ex_001', // One-Arm DB Row
    'ex_006', // Seated Cable Row
    'ex_002', // DB Pullover
    'ex_012', // Straight Arm Pulldown
    'ex_087', // Single Arm Cable Row
    'ex_010', // Pull-Up
    'ex_011', // Chin-Up
    'ex_085', // Inverted Row
  ],
  // Back - Upper back
  'upper back': [
    'ex_003', // Incline DB Row
    'ex_008', // T-Bar Row
    'ex_088', // Pendlay Row
    'ex_006', // Seated Cable Row
    'ex_085', // Inverted Row
    'ex_086', // Band Pull-Apart
    'ex_018', // Face Pull (rear delts)
    'ex_019', // Upright Row (traps)
    'ex_020', // DB Shrugs (traps)
    'ex_021', // Barbell Shrugs (traps)
    'ex_022', // Reverse Pec Deck (rear delts)
    'ex_092', // Band Pull-Apart Overhead (rear delts)
  ],
  // Lower back
  'lower back': [
    'ex_009', // Deadlift
    'ex_107', // Good Morning
    'ex_121', // Superman
  ],
  // Shoulders
  shoulders: [
    'ex_016', // Overhead Press
    'ex_017', // DB Shoulder Press
    'ex_013', // Lateral Raise
    'ex_015', // Arnold Press
    'ex_089', // Cable Lateral Raise
    'ex_091', // Machine Shoulder Press
    'ex_090', // Pike Push-Up
  ],
  // Biceps
  biceps: [
    'ex_033', // Barbell Curl
    'ex_034', // DB Curl
    'ex_035', // Hammer Curl
    'ex_096', // EZ Bar Curl
    'ex_097', // Cable Curl
    'ex_036', // Preacher Curl
    'ex_038', // Incline DB Curl
    'ex_098', // Spider Curl
    'ex_037', // Concentration Curl
    'ex_100', // Band Curl
  ],
  // Triceps
  triceps: [
    'ex_039', // Pushdown
    'ex_040', // Skull Crusher
    'ex_041', // Overhead Extension
    'ex_042', // Close-Grip Bench
    'ex_099', // Cable Overhead Extension
    'ex_101', // EZ Skull Crusher
    'ex_045', // Kickback
    'ex_043', // Diamond Push-Up
    'ex_044', // Tricep Dips
  ],
  // Forearms
  forearms: [
    'ex_047', // Wrist Curl
    'ex_049', // Reverse Curl
    'ex_048', // Reverse Wrist Curl
    'ex_046', // Zottman Curl
    'ex_050', // Farmer Walk
  ],
  // Quads
  quads: [
    'ex_051', // Barbell Squat
    'ex_053', // Leg Press
    'ex_052', // Front Squat
    'ex_054', // Hack Squat
    'ex_055', // Leg Extension
    'ex_059', // Bulgarian Split Squat (DB)
    'ex_062', // Goblet Squat
    'ex_060', // Walking Lunges
    'ex_103', // DB Lunge
    'ex_104', // Step-Up
    'ex_109', // Smith Machine Squat
    'ex_110', // Trap Bar DL
    'ex_112', // Pistol Squat (BW)
    'ex_113', // Wall Sit (BW)
    'ex_114', // Band Squat
    'ex_127', // Bodyweight Squat (BW)
    'ex_128', // Reverse Lunge (BW)
    'ex_129', // Bulgarian Split Squat (BW)
    'ex_130', // Jump Squat (BW)
  ],
  // Hamstrings
  hamstrings: [
    'ex_056', // Romanian DL
    'ex_057', // Leg Curl
    'ex_058', // Stiff Leg DL
    'ex_107', // Good Morning
    'ex_108', // Nordic Curl (BW)
    'ex_132', // Sliding Leg Curl (BW)
  ],
  // Glutes
  glutes: [
    'ex_061', // Hip Thrust
    'ex_102', // Sumo Deadlift
    'ex_111', // KB Swing
    'ex_106', // Cable Pull-Through
    'ex_105', // Glute Bridge (BW)
    'ex_131', // Single Leg Glute Bridge (BW)
  ],
  // Calves
  calves: [
    'ex_063', // Standing Calf Raise
    'ex_064', // Seated Calf Raise
    'ex_065', // Donkey Calf Raise
    'ex_115', // DB Calf Raise
    'ex_066', // Single Leg Calf Raise (BW)
    'ex_133', // Calf Raise (BW)
  ],
  // Abs
  abs: [
    'ex_069', // Hanging Leg Raise
    'ex_070', // Cable Crunch
    'ex_067', // Plank
    'ex_068', // Crunch
    'ex_118', // V-Up
    'ex_073', // Dead Bug
    'ex_120', // Lying Leg Raise
    'ex_122', // Hollow Body Hold
    'ex_074', // Mountain Climber
    'ex_119', // Flutter Kicks
  ],
  // Obliques
  obliques: [
    'ex_071', // Russian Twist
    'ex_076', // Bicycle Crunch
    'ex_075', // Side Plank
    'ex_117', // Cable Woodchopper
    'ex_116', // Pallof Press
  ],
};

/**
 * Split day templates — defines which muscles each day targets.
 */
export interface SplitDayTemplate {
  label: string;
  labelKey: string; // i18n key under programLabels.*
  focus: string;
  muscles: string[];
}

export const SPLIT_TEMPLATES: Record<SplitType, SplitDayTemplate[][]> = {
  full_body: [
    [
      { label: 'Full Body A', labelKey: 'fullBodyA', focus: 'full_body', muscles: ['chest', 'lats', 'shoulders', 'quads', 'hamstrings', 'biceps', 'triceps', 'abs'] },
      { label: 'Full Body B', labelKey: 'fullBodyB', focus: 'full_body', muscles: ['chest', 'upper back', 'shoulders', 'quads', 'glutes', 'biceps', 'triceps', 'obliques'] },
      { label: 'Full Body C', labelKey: 'fullBodyC', focus: 'full_body', muscles: ['chest', 'lats', 'shoulders', 'hamstrings', 'quads', 'biceps', 'triceps', 'abs'] },
    ],
  ],
  upper_lower: [
    [
      { label: 'Upper A', labelKey: 'upperA', focus: 'upper', muscles: ['chest', 'lats', 'shoulders', 'biceps', 'triceps'] },
      { label: 'Lower A', labelKey: 'lowerA', focus: 'lower', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'] },
      { label: 'Upper B', labelKey: 'upperB', focus: 'upper', muscles: ['chest', 'upper back', 'shoulders', 'biceps', 'triceps'] },
      { label: 'Lower B', labelKey: 'lowerB', focus: 'lower', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'obliques'] },
    ],
    [
      { label: 'Upper A', labelKey: 'upperA', focus: 'upper', muscles: ['chest', 'lats', 'shoulders', 'biceps', 'triceps'] },
      { label: 'Lower A', labelKey: 'lowerA', focus: 'lower', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'] },
      { label: 'Upper B', labelKey: 'upperB', focus: 'upper', muscles: ['chest', 'upper back', 'shoulders', 'biceps', 'triceps'] },
      { label: 'Lower B', labelKey: 'lowerB', focus: 'lower', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'obliques'] },
      { label: 'Full Body Pump', labelKey: 'fullBodyPump', focus: 'full_body', muscles: ['chest', 'lats', 'shoulders', 'quads', 'abs'] },
    ],
  ],
  ppl: [
    [
      { label: 'Push A', labelKey: 'pushA', focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
      { label: 'Pull A', labelKey: 'pullA', focus: 'pull', muscles: ['lats', 'upper back', 'biceps', 'forearms'] },
      { label: 'Legs A', labelKey: 'legsA', focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'] },
      { label: 'Push B', labelKey: 'pushB', focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
      { label: 'Pull B', labelKey: 'pullB', focus: 'pull', muscles: ['lats', 'upper back', 'biceps', 'forearms'] },
      { label: 'Legs B', labelKey: 'legsB', focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'obliques'] },
    ],
  ],
};

/**
 * 6-tier rep/rest config by goal × exercise category.
 * Based on RP Hypertrophy guidelines:
 * - Heavy barbells: lower reps, longer rest (strength benefit)
 * - Machine isolations: higher reps, shorter rest (metabolic stress)
 * - Abs/calves: highest reps, minimal rest
 */
import type { ExerciseCategory } from '@/lib/exerciseClassification';

export interface CategoryConfig {
  minReps: number;
  maxReps: number;
  restTime: number;
  setTime: number; // seconds per set execution
}

export type GoalCategoryConfig = Record<ExerciseCategory, CategoryConfig>;

export const GOAL_CONFIG: Record<string, GoalCategoryConfig> = {
  hypertrophy: {
    heavy_barbell_compound: { minReps: 6,  maxReps: 10, restTime: 150, setTime: 50 },
    dumbbell_compound:      { minReps: 8,  maxReps: 12, restTime: 120, setTime: 45 },
    machine_compound:       { minReps: 8,  maxReps: 15, restTime: 120, setTime: 40 },
    isolation:              { minReps: 10, maxReps: 15, restTime: 90,  setTime: 35 },
    machine_isolation:      { minReps: 12, maxReps: 20, restTime: 75,  setTime: 35 },
    abs_calves:             { minReps: 12, maxReps: 25, restTime: 60,  setTime: 30 },
  },
  strength: {
    heavy_barbell_compound: { minReps: 3,  maxReps: 6,  restTime: 180, setTime: 50 },
    dumbbell_compound:      { minReps: 5,  maxReps: 8,  restTime: 150, setTime: 45 },
    machine_compound:       { minReps: 6,  maxReps: 10, restTime: 120, setTime: 40 },
    isolation:              { minReps: 8,  maxReps: 12, restTime: 90,  setTime: 35 },
    machine_isolation:      { minReps: 10, maxReps: 15, restTime: 75,  setTime: 35 },
    abs_calves:             { minReps: 12, maxReps: 20, restTime: 60,  setTime: 30 },
  },
  recomposition: {
    heavy_barbell_compound: { minReps: 5,  maxReps: 8,  restTime: 150, setTime: 50 },
    dumbbell_compound:      { minReps: 6,  maxReps: 10, restTime: 120, setTime: 45 },
    machine_compound:       { minReps: 8,  maxReps: 12, restTime: 120, setTime: 40 },
    isolation:              { minReps: 8,  maxReps: 12, restTime: 90,  setTime: 35 },
    machine_isolation:      { minReps: 10, maxReps: 15, restTime: 75,  setTime: 35 },
    abs_calves:             { minReps: 12, maxReps: 20, restTime: 60,  setTime: 30 },
  },
};

/**
 * Priority muscle groups for onboarding.
 * Maps user-friendly region keys → internal RP muscle tracking keys.
 * Used by onboarding selector + programGenerator volume expansion.
 */
export const PRIORITY_GROUPS: { key: string; labelKey: string; muscles: string[] }[] = [
  { key: 'chest', labelKey: 'priorityGroups.chest', muscles: ['chest'] },
  { key: 'back', labelKey: 'priorityGroups.back', muscles: ['upper back', 'lats'] },
  { key: 'shoulders', labelKey: 'priorityGroups.shoulders', muscles: ['shoulders'] },
  { key: 'biceps', labelKey: 'priorityGroups.biceps', muscles: ['biceps'] },
  { key: 'triceps', labelKey: 'priorityGroups.triceps', muscles: ['triceps'] },
  { key: 'quads', labelKey: 'priorityGroups.quads', muscles: ['quads'] },
  { key: 'hamstrings', labelKey: 'priorityGroups.hamstrings', muscles: ['hamstrings'] },
  { key: 'glutes', labelKey: 'priorityGroups.glutes', muscles: ['glutes'] },
  { key: 'calves', labelKey: 'priorityGroups.calves', muscles: ['calves'] },
  { key: 'abs', labelKey: 'priorityGroups.abs', muscles: ['abs', 'obliques'] },
];

/**
 * Mesocycle length by experience
 */
export const MESO_LENGTH = {
  beginner: 4,
  intermediate: 5,
  advanced: 6,
} as const;
