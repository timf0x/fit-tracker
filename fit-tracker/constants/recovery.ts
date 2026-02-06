/**
 * Recovery Constants
 * Scientifically-based thresholds for muscle recovery tracking
 */

import { RecoveryLevel, RecoveryBodyPart } from '@/types';

/**
 * Per-muscle-group recovery thresholds (in hours)
 * Small muscles: 24-48h, Medium: 48-72h, Large: 72-96h
 */
export const MUSCLE_RECOVERY_HOURS: Record<RecoveryBodyPart, {
  fatigued: number;
  freshMin: number;
  freshMax: number;
  undertrained: number;
}> = {
  forearms:     { fatigued: 24, freshMin: 24, freshMax: 72, undertrained: 120 },
  abs:          { fatigued: 24, freshMin: 24, freshMax: 72, undertrained: 120 },
  obliques:     { fatigued: 24, freshMin: 24, freshMax: 72, undertrained: 120 },
  calves:       { fatigued: 24, freshMin: 24, freshMax: 72, undertrained: 120 },
  biceps:       { fatigued: 36, freshMin: 36, freshMax: 84, undertrained: 144 },
  triceps:      { fatigued: 36, freshMin: 36, freshMax: 84, undertrained: 144 },
  shoulders:    { fatigued: 48, freshMin: 48, freshMax: 96, undertrained: 168 },
  chest:        { fatigued: 48, freshMin: 48, freshMax: 96, undertrained: 168 },
  'upper back': { fatigued: 48, freshMin: 48, freshMax: 96, undertrained: 168 },
  lats:         { fatigued: 72, freshMin: 72, freshMax: 120, undertrained: 192 },
  'lower back': { fatigued: 72, freshMin: 72, freshMax: 120, undertrained: 192 },
  quads:        { fatigued: 72, freshMin: 72, freshMax: 120, undertrained: 192 },
  hamstrings:   { fatigued: 72, freshMin: 72, freshMax: 120, undertrained: 192 },
  glutes:       { fatigued: 72, freshMin: 72, freshMax: 120, undertrained: 192 },
  cardio:       { fatigued: 24, freshMin: 24, freshMax: 48, undertrained: 72 },
};

export const RECOVERY_COLORS: Record<RecoveryLevel, string> = {
  fatigued: '#EF4444',
  fresh: '#4ADE80',
  undertrained: '#6B7280',
};

export const RECOVERY_COLORS_TRANSPARENT: Record<RecoveryLevel, string> = {
  fatigued: 'rgba(239, 68, 68, 0.7)',
  fresh: 'rgba(74, 222, 128, 0.7)',
  undertrained: 'rgba(107, 114, 128, 0.5)',
};

export const RECOVERY_LABELS: Record<RecoveryLevel, { en: string; fr: string }> = {
  fatigued: { en: 'Fatigued', fr: 'Fatigué' },
  fresh: { en: 'Fresh', fr: 'Frais' },
  undertrained: { en: 'Undertrained', fr: 'Sous-entraîné' },
};

export const BODY_PART_LABELS: Record<RecoveryBodyPart, { en: string; fr: string }> = {
  'upper back': { en: 'Upper Back', fr: 'Haut du dos' },
  lats:         { en: 'Lats', fr: 'Dorsaux' },
  'lower back': { en: 'Lower Back', fr: 'Bas du dos' },
  shoulders:    { en: 'Shoulders', fr: 'Épaules' },
  chest:        { en: 'Chest', fr: 'Pectoraux' },
  biceps:       { en: 'Biceps', fr: 'Biceps' },
  triceps:      { en: 'Triceps', fr: 'Triceps' },
  forearms:     { en: 'Forearms', fr: 'Avant-bras' },
  quads:        { en: 'Quads', fr: 'Quadriceps' },
  hamstrings:   { en: 'Hamstrings', fr: 'Ischio-jambiers' },
  glutes:       { en: 'Glutes', fr: 'Fessiers' },
  calves:       { en: 'Calves', fr: 'Mollets' },
  abs:          { en: 'Abs', fr: 'Abdos' },
  obliques:     { en: 'Obliques', fr: 'Obliques' },
  cardio:       { en: 'Cardio', fr: 'Cardio' },
};

export const TRACKABLE_BODY_PARTS: RecoveryBodyPart[] = [
  'chest', 'shoulders', 'upper back', 'lats', 'lower back',
  'biceps', 'triceps', 'forearms',
  'quads', 'hamstrings', 'glutes', 'calves',
  'abs', 'obliques',
];

export const SCORE_WEIGHTS: Record<RecoveryLevel, number> = {
  fresh: 100,
  undertrained: 50,
  fatigued: 25,
};
