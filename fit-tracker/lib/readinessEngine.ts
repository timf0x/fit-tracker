import i18n from '@/lib/i18n';
import type { ReadinessCheck } from '@/types/program';

// ─── Types ───

export type ReadinessLevel = 'peak' | 'good' | 'moderate' | 'low';

export interface SessionAdjustments {
  volumeMultiplier: number;   // 1.0 = no change, 0.85 = -15%
  weightMultiplier: number;   // 1.0 = no change, 0.95 = -5%
  restMultiplier: number;     // 1.0 = no change, 1.2 = +20%
  rirDelta: number;           // 0 = no change, +1 = easier target
  level: ReadinessLevel;
}

// ─── Score Computation ───

/**
 * Computes a readiness score from 0-100 based on 4 metrics (each 1-3).
 * Higher = better readiness. 4 metrics × 3 max = 12.
 */
export function computeReadinessScore(input: ReadinessCheck): number {
  const raw = input.sleep + input.energy + input.stress + input.soreness;
  return Math.round((raw / 12) * 100);
}

/**
 * Maps a 0-100 score to a readiness level.
 */
export function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 86) return 'peak';
  if (score >= 66) return 'good';
  if (score >= 42) return 'moderate';
  return 'low';
}

/**
 * Returns the theme color for a readiness level.
 */
export function getReadinessColor(level: ReadinessLevel): string {
  switch (level) {
    case 'peak': return '#3B82F6';    // blue
    case 'good': return '#4ADE80';    // green
    case 'moderate': return '#FBBF24'; // amber
    case 'low': return '#EF4444';      // red
  }
}

// ─── Session Adjustments ───

/**
 * Computes concrete session adjustments based on readiness score.
 * Returns multipliers for volume/weight/rest and RIR delta.
 */
export function computeSessionAdjustments(score: number): SessionAdjustments {
  const level = getReadinessLevel(score);

  switch (level) {
    case 'peak':
    case 'good':
      return { volumeMultiplier: 1.0, weightMultiplier: 1.0, restMultiplier: 1.0, rirDelta: 0, level };
    case 'moderate':
      return { volumeMultiplier: 0.85, weightMultiplier: 0.95, restMultiplier: 1.2, rirDelta: 1, level };
    case 'low':
      return { volumeMultiplier: 0.70, weightMultiplier: 0.90, restMultiplier: 1.3, rirDelta: 2, level };
  }
}

/**
 * Applies readiness adjustments to an exercises JSON array (the serialized format).
 * Returns the modified array. Only modifies when level is moderate or low.
 */
export function applyAdjustmentsToExercises<T extends {
  sets: number;
  weight: number;
  restTime: number;
  targetRir?: number;
}>(exercises: T[], adjustments: SessionAdjustments): T[] {
  if (adjustments.level === 'peak' || adjustments.level === 'good') {
    return exercises;
  }

  return exercises.map((ex) => {
    const adjustedSets = Math.max(1, Math.round(ex.sets * adjustments.volumeMultiplier));
    const adjustedWeight = ex.weight > 0
      ? Math.round(ex.weight * adjustments.weightMultiplier * 2) / 2 // round to 0.5kg
      : 0;
    const adjustedRest = Math.round(ex.restTime * adjustments.restMultiplier);
    const adjustedRir = Math.min(4, (ex.targetRir ?? 2) + adjustments.rirDelta);

    return {
      ...ex,
      sets: adjustedSets,
      weight: adjustedWeight,
      restTime: adjustedRest,
      targetRir: adjustedRir,
    };
  });
}

// ─── Nudge Text ───

/**
 * Returns the i18n key for the contextual readiness nudge.
 */
export function getReadinessNudge(level: ReadinessLevel): string {
  return i18n.t(`readiness.nudge${level.charAt(0).toUpperCase() + level.slice(1)}`);
}

/**
 * Returns the i18n label for the readiness level.
 */
export function getReadinessLevelLabel(level: ReadinessLevel): string {
  return i18n.t(`readiness.level${level.charAt(0).toUpperCase() + level.slice(1)}`);
}

/**
 * Formats the adjustment preview string for display.
 * Only shown when level is moderate or low.
 */
export function getAdjustmentPreview(adjustments: SessionAdjustments): string | null {
  if (adjustments.level === 'peak' || adjustments.level === 'good') return null;

  const volumePct = Math.round((1 - adjustments.volumeMultiplier) * 100);
  const restPct = Math.round((adjustments.restMultiplier - 1) * 100);

  return i18n.t('readiness.adjustmentPreview', {
    volume: `-${volumePct}%`,
    rest: `+${restPct}%`,
    rir: `+${adjustments.rirDelta}`,
  });
}
