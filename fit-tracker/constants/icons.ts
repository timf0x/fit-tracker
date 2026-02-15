/**
 * Onset Fitness Icon System
 * Uses Lucide React Native for all icons
 */

import { BodyPart } from '@/types';

// ============================================
// WORKOUT CATEGORY ICONS (Lucide names)
// ============================================

export const CATEGORY_ICONS: Record<string, { icon: string; color: string; bgColor: string }> = {
  push: {
    icon: 'flame',
    color: '#ff7043',
    bgColor: 'rgba(255, 112, 67, 0.12)',
  },
  pull: {
    icon: 'anchor',
    color: '#42a5f5',
    bgColor: 'rgba(66, 165, 245, 0.12)',
  },
  legs: {
    icon: 'mountain',
    color: '#66bb6a',
    bgColor: 'rgba(102, 187, 106, 0.12)',
  },
  core: {
    icon: 'target',
    color: '#ab47bc',
    bgColor: 'rgba(171, 71, 188, 0.12)',
  },
  cardio: {
    icon: 'zap',
    color: '#ffee58',
    bgColor: 'rgba(255, 238, 88, 0.12)',
  },
  full_body: {
    icon: 'user',
    color: '#ff7043',
    bgColor: 'rgba(255, 112, 67, 0.12)',
  },
  upper: {
    icon: 'dumbbell',
    color: '#ff7043',
    bgColor: 'rgba(255, 112, 67, 0.12)',
  },
  lower: {
    icon: 'footprints',
    color: '#66bb6a',
    bgColor: 'rgba(102, 187, 106, 0.12)',
  },
};

// ============================================
// BODY PART COLORS
// ============================================

export const BODY_PART_COLORS: Record<BodyPart | string, { color: string; bgColor: string }> = {
  back: { color: '#42a5f5', bgColor: 'rgba(66, 165, 245, 0.12)' },
  shoulders: { color: '#ab47bc', bgColor: 'rgba(171, 71, 188, 0.12)' },
  chest: { color: '#ff7043', bgColor: 'rgba(255, 112, 67, 0.12)' },
  'upper arms': { color: '#ec407a', bgColor: 'rgba(236, 64, 122, 0.12)' },
  'lower arms': { color: '#ec407a', bgColor: 'rgba(236, 64, 122, 0.12)' },
  'upper legs': { color: '#66bb6a', bgColor: 'rgba(102, 187, 106, 0.12)' },
  'lower legs': { color: '#66bb6a', bgColor: 'rgba(102, 187, 106, 0.12)' },
  waist: { color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.12)' },
  cardio: { color: '#ef5350', bgColor: 'rgba(239, 83, 80, 0.12)' },
};

// ============================================
// EXERCISE ICONS (Lucide icon names)
// Mapped by exercise name (lowercase)
// ============================================

export const EXERCISE_ICONS: Record<string, string> = {
  // BACK & LATS
  'one-arm dumbbell row': 'arrow-left',
  'dumbbell pullover': 'arrow-down-circle',
  'incline dumbbell row': 'arrow-left',
  'incline reverse fly': 'expand',
  'lat pulldown': 'arrow-down',
  'seated cable row': 'arrow-left',
  'barbell row': 'dumbbell',
  't-bar row': 'dumbbell',
  'deadlift': 'dumbbell',
  'pull-up': 'arrow-up',
  'chin-up': 'arrow-up',
  'straight arm pulldown': 'arrow-down',

  // SHOULDERS
  'lateral raise': 'move-horizontal',
  'front raise': 'arrow-up',
  'arnold press': 'refresh-cw',
  'overhead press': 'arrow-up',
  'dumbbell shoulder press': 'arrow-up',
  'face pull': 'eye',
  'upright row': 'arrow-up',
  'dumbbell shrugs': 'chevron-up',
  'barbell shrugs': 'chevron-up',
  'reverse pec deck': 'expand',

  // CHEST
  'barbell bench press': 'dumbbell',
  'incline bench press': 'trending-up',
  'decline bench press': 'trending-down',
  'dumbbell bench press': 'dumbbell',
  'incline dumbbell press': 'trending-up',
  'dumbbell fly': 'expand',
  'cable crossover': 'infinity',
  'push-up': 'hand',
  'dips': 'arrow-down',
  'machine chest press': 'grid-2x2',

  // ARMS
  'barbell curl': 'dumbbell',
  'dumbbell curl': 'dumbbell',
  'hammer curl': 'hammer',
  'preacher curl': 'dumbbell',
  'concentration curl': 'dumbbell',
  'incline dumbbell curl': 'dumbbell',
  'tricep pushdown': 'arrow-down',
  'skull crusher': 'skull',
  'overhead tricep extension': 'arrow-up',
  'close-grip bench press': 'diamond',
  'diamond push-up': 'diamond',
  'tricep dips': 'arrow-down',
  'tricep kickback': 'arrow-right',
  'zottman curl': 'refresh-cw',
  'wrist curl': 'hand',
  'reverse wrist curl': 'hand',
  'reverse curl': 'dumbbell',
  'farmer walk': 'grip-horizontal',

  // LEGS
  'barbell squat': 'layers',
  'front squat': 'layers',
  'leg press': 'chevron-down',
  'hack squat': 'layers',
  'leg extension': 'arrow-right',
  'romanian deadlift': 'dumbbell',
  'leg curl': 'arrow-left',
  'stiff leg deadlift': 'dumbbell',
  'bulgarian split squat': 'footprints',
  'walking lunges': 'footprints',
  'hip thrust': 'circle',
  'goblet squat': 'layers',

  // CALVES
  'standing calf raise': 'chevron-up',
  'seated calf raise': 'chevron-up',
  'donkey calf raise': 'chevron-up',
  'single leg calf raise': 'chevron-up',

  // ABS & CORE
  'plank': 'minus',
  'crunch': 'chevrons-up',
  'hanging leg raise': 'arrow-up',
  'cable crunch': 'chevrons-up',
  'russian twist': 'refresh-cw',
  'ab wheel rollout': 'target',
  'dead bug': 'bug',
  'mountain climber': 'triangle',
  'side plank': 'minus',
  'bicycle crunch': 'bike',

  // CARDIO
  'jumping jacks': 'user',
  'burpees': 'activity',
  'high knees': 'footprints',
  'box jump': 'box',
  'battle ropes': 'waves',
  'rowing machine': 'ship',
  'jump rope': 'link',
  'sprint': 'zap',

  // NEW EXERCISES
  'inverted row': 'arrow-up',
  'band pull-apart': 'expand',
  'single arm cable row': 'arrow-left',
  'pendlay row': 'dumbbell',
  'cable lateral raise': 'move-horizontal',
  'pike push-up': 'arrow-up',
  'machine shoulder press': 'arrow-up',
  'band pull-apart overhead': 'expand',
  'pec deck fly': 'expand',
  'incline dumbbell fly': 'expand',
  'band chest press': 'arrow-right',
  'ez bar curl': 'dumbbell',
  'cable curl': 'dumbbell',
  'spider curl': 'dumbbell',
  'cable overhead tricep extension': 'arrow-up',
  'band curl': 'dumbbell',
  'ez bar skull crusher': 'skull',
  'sumo deadlift': 'dumbbell',
  'dumbbell lunge': 'footprints',
  'step-up': 'chevron-up',
  'glute bridge': 'circle',
  'cable pull-through': 'arrow-right',
  'good morning': 'dumbbell',
  'nordic hamstring curl': 'arrow-down',
  'smith machine squat': 'layers',
  'trap bar deadlift': 'dumbbell',
  'kettlebell swing': 'refresh-cw',
  'pistol squat': 'footprints',
  'wall sit': 'minus',
  'band squat': 'layers',
  'dumbbell calf raise': 'chevron-up',
  'pallof press': 'arrow-right',
  'cable woodchopper': 'refresh-cw',
  'v-up': 'chevrons-up',
  'flutter kicks': 'activity',
  'lying leg raise': 'arrow-up',
  'superman': 'minus',
  'hollow body hold': 'minus',
  'bear crawl': 'user',
  'treadmill run': 'activity',
  'stationary bike': 'bike',
  'kettlebell snatch': 'zap',

  // RESISTANCE BAND EXERCISES
  'band seated row': 'arrow-left',
  'band lat pulldown': 'arrow-down',
  'band straight arm pulldown': 'arrow-down',
  'band face pull': 'eye',
  'band lateral raise': 'move-horizontal',
  'band shoulder press': 'arrow-up',
  'band front raise': 'arrow-up',
  'band chest fly': 'expand',
  'band tricep pushdown': 'arrow-down',
  'band overhead tricep extension': 'arrow-up',
  'band hammer curl': 'hammer',
  'band glute kickback': 'arrow-right',
  'band romanian deadlift': 'dumbbell',
  'band leg curl': 'arrow-left',
  'band hip thrust': 'circle',
  'band split squat': 'footprints',
  'band good morning': 'dumbbell',
  'band calf raise': 'chevron-up',
  'band pallof press': 'arrow-right',
  'band woodchopper': 'refresh-cw',
};

export const DEFAULT_EXERCISE_ICON = 'dumbbell';

export function getExerciseIcon(exerciseName: string): string {
  const normalized = exerciseName.toLowerCase().trim();
  return EXERCISE_ICONS[normalized] || DEFAULT_EXERCISE_ICON;
}

export function getBodyPartColors(bodyPart: BodyPart | string): { color: string; bgColor: string } {
  return BODY_PART_COLORS[bodyPart] || { color: '#ff7043', bgColor: 'rgba(255, 112, 67, 0.12)' };
}

export function getCategoryIcon(category: string): { icon: string; color: string; bgColor: string } {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.push;
}
