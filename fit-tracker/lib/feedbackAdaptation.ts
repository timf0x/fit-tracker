import type { SessionFeedback } from '@/types/program';

// ─── Feedback-Driven Volume Adaptation ───

export interface VolumeAdjustment {
  muscle: string;
  deltaSets: number;  // +1/+2 or -1/-2
  reason: string;     // French nudge
}

/**
 * Compute volume adjustments from a week's session feedback.
 *
 * Rules (RP-inspired):
 * - pump=1 + soreness=1 + performance=3 → under-stimulated → +1 set/muscle
 * - pump=1 + soreness=1 + performance≥2 → slight under-stimulus → +1 set/muscle
 * - soreness=3 + performance=1 → over-reached → -2 sets/muscle
 * - soreness=3 + performance=2 → moderate fatigue → -1 set/muscle
 * - jointPain=true → flag (future: swap suggestion)
 * - Cap at +/-2 per muscle after dedup
 */
export function computeFeedbackAdjustments(
  weekFeedbacks: SessionFeedback[],
  dayMuscleMap: Record<number, string[]>
): VolumeAdjustment[] {
  if (weekFeedbacks.length === 0) return [];

  // Aggregate scores across the week
  const totalPump = weekFeedbacks.reduce((s, f) => s + f.pump, 0);
  const totalSoreness = weekFeedbacks.reduce((s, f) => s + f.soreness, 0);
  const totalPerformance = weekFeedbacks.reduce((s, f) => s + f.performance, 0);
  const n = weekFeedbacks.length;

  const avgPump = totalPump / n;
  const avgSoreness = totalSoreness / n;
  const avgPerformance = totalPerformance / n;

  // Collect all muscles trained this week
  const allMuscles = new Set<string>();
  for (const muscles of Object.values(dayMuscleMap)) {
    for (const m of muscles) allMuscles.add(m);
  }

  const adjustments: VolumeAdjustment[] = [];

  for (const muscle of allMuscles) {
    let delta = 0;
    let reason = '';

    // Over-reached: high soreness + declining performance
    if (avgSoreness >= 2.5 && avgPerformance <= 1.5) {
      delta = -2;
      reason = 'Fatigue élevée — réduis le volume pour récupérer';
    } else if (avgSoreness >= 2.5 && avgPerformance <= 2) {
      delta = -1;
      reason = 'Courbatures persistantes — légère baisse de volume';
    }
    // Under-stimulated: low pump + low soreness + good/rising performance
    else if (avgPump <= 1.5 && avgSoreness <= 1.5 && avgPerformance >= 2.5) {
      delta = +1;
      reason = 'Bonne récup, peu de congestion — ajoute du volume';
    }
    // Sweet spot: moderate everything → no change
    // (delta stays 0)

    // Cap at +/-2
    delta = Math.max(-2, Math.min(2, delta));

    if (delta !== 0) {
      adjustments.push({ muscle, deltaSets: delta, reason });
    }
  }

  return adjustments;
}
