import { exercises } from '@/data/exercises';
import { ALL_BADGES } from '@/data/badges';
import type { Badge, BadgeProgress, WorkoutSession } from '@/types';
import { TARGET_TO_MUSCLE } from './muscleMapping';

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

// Condition types requiring Supabase (social/AI) — can't evaluate locally
const DEFERRED_CONDITIONS = new Set([
  'friends_count',
  'reactions_given',
  'posts_count',
  'reactions_received',
  'ai_recommendations',
  'checkins_count',
  'ai_goals_achieved',
]);

// Boolean-ish condition types where currentValue is 0 or 1
const BOOLEAN_CONDITIONS = new Set([
  'account_created_before',
  'workout_hour_before',
  'workout_hour_after',
  'workout_date',
]);

// Composite muscle groups (conditionExtra.muscle → TARGET_TO_MUSCLE keys)
const MUSCLE_COMPOSITES: Record<string, string[]> = {
  back: ['upper back', 'lats', 'lower back'],
};

function resolveMuscleValue(
  muscle: string,
  data: Record<string, number>,
): number {
  if (MUSCLE_COMPOSITES[muscle]) {
    return MUSCLE_COMPOSITES[muscle].reduce(
      (sum, m) => sum + (data[m] || 0),
      0,
    );
  }
  return data[muscle] || 0;
}

// ─── Precomputed Stats ───

interface PrecomputedStats {
  totalVolumeKg: number;
  sessionsCount: number;
  dayStreak: number;
  weekGoalCount: number;
  weekGoalStreak: number;
  totalPRs: number;
  maxPRIncreasePct: number;
  muscleVolumeKg: Record<string, number>;
  muscleSets: Record<string, number>;
  equipmentSets: Record<string, number>;
  uniqueExerciseCount: number;
  uniqueEquipmentCount: number;
  bodyweightSessionCount: number;
  maxEquipmentInWeek: number;
  allMusclesTrainedCount: number;
  balancedDays: number;
  variedWeeksStreak: number;
  earliestSessionMs: number;
  workoutHours: number[];
  maxDailyDurationHours: number;
  maxSessionDurationHours: number;
  weekendStreakWeeks: number;
  workoutDates: Set<number>;
}

function getDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMondayKey(d: Date): string {
  const monday = new Date(d);
  const dayOfWeek = monday.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  monday.setDate(monday.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return getDateKey(monday);
}

// ─── Main computation ───

function computeStats(history: WorkoutSession[]): PrecomputedStats {
  const completed = history.filter((s) => s.endTime);

  let totalVolumeKg = 0;
  const muscleVolumeKg: Record<string, number> = {};
  const muscleSets: Record<string, number> = {};
  const equipmentSets: Record<string, number> = {};
  const uniqueExerciseIds = new Set<string>();
  const uniqueEquipmentTypes = new Set<string>();
  let bodyweightSessionCount = 0;

  const sessionDates = new Map<string, WorkoutSession[]>();
  const equipmentByWeek = new Map<string, Set<string>>();
  const weekExerciseIds = new Map<string, Set<string>>();

  // Track first/best weights per exercise for PR increase %
  const exerciseFirstWeight: Record<string, number> = {};
  const exerciseBestWeight: Record<string, number> = {};

  // PR counting (chronological scan)
  const prRunningBest: Record<
    string,
    { bestWeight: number; bestVolume: number }
  > = {};
  let totalPRs = 0;

  let earliestMs = Infinity;
  const workoutHours: number[] = [];
  let maxSessionDurationHours = 0;
  const dailyDuration: Record<string, number> = {};
  const workoutDates = new Set<number>();
  const weekendDateKeys = new Set<string>();
  const sessionsPerWeek = new Map<string, number>();

  // Sort oldest-first for accurate PR counting
  const sorted = [...completed].sort(
    (a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  for (const session of sorted) {
    const startDate = new Date(session.startTime);
    const startMs = startDate.getTime();
    if (startMs < earliestMs) earliestMs = startMs;

    const dateKey = getDateKey(startDate);
    if (!sessionDates.has(dateKey)) sessionDates.set(dateKey, []);
    sessionDates.get(dateKey)!.push(session);

    // Workout date (month*100+day for workout_date badge)
    workoutDates.add(
      (startDate.getMonth() + 1) * 100 + startDate.getDate(),
    );

    workoutHours.push(startDate.getHours());

    // Session duration
    const durationSec = session.durationSeconds || 0;
    const durationHours = durationSec / 3600;
    if (durationHours > maxSessionDurationHours)
      maxSessionDurationHours = durationHours;

    // Daily duration accumulator
    dailyDuration[dateKey] = (dailyDuration[dateKey] || 0) + durationSec;

    // Weekend check
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDateKeys.add(dateKey);
    }

    // Week key
    const weekKey = getMondayKey(startDate);
    if (!equipmentByWeek.has(weekKey))
      equipmentByWeek.set(weekKey, new Set());
    if (!weekExerciseIds.has(weekKey))
      weekExerciseIds.set(weekKey, new Set());
    sessionsPerWeek.set(weekKey, (sessionsPerWeek.get(weekKey) || 0) + 1);

    // Per-exercise aggregates for this session
    let isBodyweightOnly = true;
    const sessionBestPerEx: Record<string, number> = {};
    const sessionVolPerEx: Record<string, number> = {};

    for (const compEx of session.completedExercises) {
      const exercise = exerciseMap.get(compEx.exerciseId);
      if (!exercise) continue;

      uniqueExerciseIds.add(compEx.exerciseId);
      uniqueEquipmentTypes.add(exercise.equipment);
      equipmentByWeek.get(weekKey)!.add(exercise.equipment);
      weekExerciseIds.get(weekKey)!.add(compEx.exerciseId);

      if (exercise.equipment !== 'body weight') isBodyweightOnly = false;

      const muscle = TARGET_TO_MUSCLE[exercise.target];
      let exVol = 0;
      let exBest = 0;

      for (const set of compEx.sets) {
        if (!set.completed) continue;
        const w = set.weight || 0;
        const vol = w * set.reps;
        totalVolumeKg += vol;
        exVol += vol;
        if (w > exBest) exBest = w;

        if (muscle) {
          muscleVolumeKg[muscle] = (muscleVolumeKg[muscle] || 0) + vol;
          muscleSets[muscle] = (muscleSets[muscle] || 0) + 1;
        }
        equipmentSets[exercise.equipment] =
          (equipmentSets[exercise.equipment] || 0) + 1;
      }

      sessionBestPerEx[compEx.exerciseId] = exBest;
      sessionVolPerEx[compEx.exerciseId] = exVol;

      // First/best weight tracking
      if (exBest > 0) {
        if (!(compEx.exerciseId in exerciseFirstWeight)) {
          exerciseFirstWeight[compEx.exerciseId] = exBest;
        }
        if (
          !exerciseBestWeight[compEx.exerciseId] ||
          exBest > exerciseBestWeight[compEx.exerciseId]
        ) {
          exerciseBestWeight[compEx.exerciseId] = exBest;
        }
      }
    }

    if (isBodyweightOnly && session.completedExercises.length > 0) {
      bodyweightSessionCount++;
    }

    // Count PRs — compare against running bests
    for (const compEx of session.completedExercises) {
      const exId = compEx.exerciseId;
      if (!prRunningBest[exId]) {
        prRunningBest[exId] = { bestWeight: 0, bestVolume: 0 };
      }
      const sw = sessionBestPerEx[exId] || 0;
      const sv = sessionVolPerEx[exId] || 0;

      if (sw > 0 && sw > prRunningBest[exId].bestWeight) {
        totalPRs++;
        prRunningBest[exId].bestWeight = sw;
      }
      if (sv > 0 && sv > prRunningBest[exId].bestVolume) {
        totalPRs++;
        prRunningBest[exId].bestVolume = sv;
      }
    }
  }

  // Max PR increase %
  let maxPRIncreasePct = 0;
  for (const exId of Object.keys(exerciseFirstWeight)) {
    const first = exerciseFirstWeight[exId];
    const best = exerciseBestWeight[exId];
    if (first > 0 && best > first) {
      const pct = ((best - first) / first) * 100;
      if (pct > maxPRIncreasePct) maxPRIncreasePct = pct;
    }
  }

  // ── Day streak ──
  const workoutDayKeys = new Set(sessionDates.keys());
  let dayStreak = 0;
  if (workoutDayKeys.size > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = getDateKey(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getDateKey(yesterday);

    let checkDate: Date | null = null;
    if (workoutDayKeys.has(todayKey)) {
      checkDate = new Date(today);
    } else if (workoutDayKeys.has(yesterdayKey)) {
      checkDate = new Date(yesterday);
    }

    if (checkDate) {
      dayStreak = 1;
      const d = new Date(checkDate);
      while (true) {
        d.setDate(d.getDate() - 1);
        if (workoutDayKeys.has(getDateKey(d))) {
          dayStreak++;
        } else {
          break;
        }
      }
    }
  }

  // ── Week goal (≥3 sessions/week) ──
  let weekGoalCount = 0;
  const qualifiedWeekKeys: string[] = [];
  for (const [weekKey, count] of sessionsPerWeek) {
    if (count >= 3) {
      weekGoalCount++;
      qualifiedWeekKeys.push(weekKey);
    }
  }

  // Week goal streak
  qualifiedWeekKeys.sort().reverse();
  let weekGoalStreak = 0;
  if (qualifiedWeekKeys.length > 0) {
    const now = new Date();
    const currentWeekKey = getMondayKey(now);
    const lastWeekDate = new Date(now);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeekKey = getMondayKey(lastWeekDate);

    const qualSet = new Set(qualifiedWeekKeys);
    let startKey: string | null = null;
    if (qualSet.has(currentWeekKey)) {
      startKey = currentWeekKey;
    } else if (qualSet.has(lastWeekKey)) {
      startKey = lastWeekKey;
    }

    if (startKey) {
      weekGoalStreak = 1;
      const d = new Date(startKey + 'T00:00:00');
      while (true) {
        d.setDate(d.getDate() - 7);
        if (qualSet.has(getDateKey(d))) {
          weekGoalStreak++;
        } else {
          break;
        }
      }
    }
  }

  // ── Max equipment types in a single week ──
  let maxEquipmentInWeek = 0;
  for (const eqSet of equipmentByWeek.values()) {
    if (eqSet.size > maxEquipmentInWeek) maxEquipmentInWeek = eqSet.size;
  }

  // ── Unique muscles trained in last 30 days ──
  const recentMuscles = new Set<string>();
  const cutoff30 = Date.now() - 30 * 86400000;
  for (const session of completed) {
    if (new Date(session.startTime).getTime() < cutoff30) continue;
    for (const compEx of session.completedExercises) {
      const exercise = exerciseMap.get(compEx.exerciseId);
      if (!exercise) continue;
      const muscle = TARGET_TO_MUSCLE[exercise.target];
      if (muscle) recentMuscles.add(muscle);
    }
  }

  // ── Balanced push/pull/legs (last 90 days) ──
  const pushMuscles = ['chest', 'shoulders', 'triceps'];
  const pullMuscles = ['upper back', 'lats', 'biceps'];
  const legMuscles = ['quads', 'hamstrings', 'glutes', 'calves'];
  let pushSets = 0;
  let pullSets = 0;
  let legSets = 0;
  const cutoff90 = Date.now() - 90 * 86400000;
  let oldestInWindow = Date.now();
  let newestInWindow = 0;

  for (const session of completed) {
    const ms = new Date(session.startTime).getTime();
    if (ms < cutoff90) continue;
    if (ms < oldestInWindow) oldestInWindow = ms;
    if (ms > newestInWindow) newestInWindow = ms;
    for (const compEx of session.completedExercises) {
      const exercise = exerciseMap.get(compEx.exerciseId);
      if (!exercise) continue;
      const muscle = TARGET_TO_MUSCLE[exercise.target];
      if (!muscle) continue;
      const sets = compEx.sets.filter((s) => s.completed).length;
      if (pushMuscles.includes(muscle)) pushSets += sets;
      else if (pullMuscles.includes(muscle)) pullSets += sets;
      else if (legMuscles.includes(muscle)) legSets += sets;
    }
  }

  let balancedDays = 0;
  const totalPPL = pushSets + pullSets + legSets;
  if (totalPPL > 20) {
    const pushPct = pushSets / totalPPL;
    const pullPct = pullSets / totalPPL;
    const legPct = legSets / totalPPL;
    if (
      pushPct >= 0.22 &&
      pushPct <= 0.45 &&
      pullPct >= 0.22 &&
      pullPct <= 0.45 &&
      legPct >= 0.22 &&
      legPct <= 0.45
    ) {
      balancedDays = Math.ceil(
        (newestInWindow - oldestInWindow) / 86400000,
      );
    }
  }

  // ── Max daily duration ──
  let maxDailyDurationHours = 0;
  for (const seconds of Object.values(dailyDuration)) {
    const hours = seconds / 3600;
    if (hours > maxDailyDurationHours) maxDailyDurationHours = hours;
  }

  // ── Weekend streak ──
  const weekendsWithWorkout = new Set<string>();
  for (const dateStr of weekendDateKeys) {
    const d = new Date(dateStr + 'T00:00:00');
    weekendsWithWorkout.add(getMondayKey(d));
  }

  const weekendWeeks = Array.from(weekendsWithWorkout).sort().reverse();
  let weekendStreakWeeks = 0;
  if (weekendWeeks.length > 0) {
    const now = new Date();
    const currentWeekKey = getMondayKey(now);
    const lastWeekDate = new Date(now);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeekKey = getMondayKey(lastWeekDate);

    let startKey: string | null = null;
    if (weekendsWithWorkout.has(currentWeekKey)) {
      startKey = currentWeekKey;
    } else if (weekendsWithWorkout.has(lastWeekKey)) {
      startKey = lastWeekKey;
    }

    if (startKey) {
      weekendStreakWeeks = 1;
      const d = new Date(startKey + 'T00:00:00');
      while (true) {
        d.setDate(d.getDate() - 7);
        if (weekendsWithWorkout.has(getDateKey(d))) {
          weekendStreakWeeks++;
        } else {
          break;
        }
      }
    }
  }

  // ── Varied weeks streak ──
  // Consecutive weeks where exercise selection differs by >30%
  const weekKeys = Array.from(weekExerciseIds.keys()).sort().reverse();
  let variedWeeksStreak = 0;
  for (let i = 0; i < weekKeys.length - 1; i++) {
    const thisWeek = weekExerciseIds.get(weekKeys[i])!;
    const prevWeek = weekExerciseIds.get(weekKeys[i + 1])!;
    const overlap = new Set(
      [...thisWeek].filter((id) => prevWeek.has(id)),
    );
    const maxSize = Math.max(thisWeek.size, prevWeek.size);
    const overlapPct = maxSize > 0 ? overlap.size / maxSize : 1;
    if (overlapPct < 0.7) {
      variedWeeksStreak++;
    } else {
      break;
    }
  }

  return {
    totalVolumeKg,
    sessionsCount: completed.length,
    dayStreak,
    weekGoalCount,
    weekGoalStreak,
    totalPRs,
    maxPRIncreasePct,
    muscleVolumeKg,
    muscleSets,
    equipmentSets,
    uniqueExerciseCount: uniqueExerciseIds.size,
    uniqueEquipmentCount: uniqueEquipmentTypes.size,
    bodyweightSessionCount,
    maxEquipmentInWeek,
    allMusclesTrainedCount: recentMuscles.size,
    balancedDays,
    variedWeeksStreak,
    earliestSessionMs: earliestMs === Infinity ? Date.now() : earliestMs,
    workoutHours,
    maxDailyDurationHours,
    maxSessionDurationHours,
    weekendStreakWeeks,
    workoutDates,
  };
}

// ─── Evaluate a single badge condition ───

function evaluateCondition(
  badge: Badge,
  stats: PrecomputedStats,
  unlockedIds: Set<string>,
): number {
  const extra = badge.conditionExtra as Record<string, unknown> | undefined;

  switch (badge.conditionType) {
    case 'volume_tons':
      return stats.totalVolumeKg / 1000;

    case 'sessions_count':
      return stats.sessionsCount;

    case 'streak_days':
      return stats.dayStreak;

    case 'week_goal_hit':
      return stats.weekGoalCount;

    case 'week_streak':
      return stats.weekGoalStreak;

    case 'prs_count':
      return stats.totalPRs;

    case 'pr_increase_pct':
      return stats.maxPRIncreasePct;

    case 'muscle_volume': {
      const muscle = extra?.muscle as string | undefined;
      return muscle ? resolveMuscleValue(muscle, stats.muscleVolumeKg) : 0;
    }

    case 'muscle_sets': {
      const muscle = extra?.muscle as string | undefined;
      return muscle ? resolveMuscleValue(muscle, stats.muscleSets) : 0;
    }

    case 'badges_unlocked': {
      const required = extra?.badges as string[] | undefined;
      if (!required) return 0;
      return required.filter((id) => unlockedIds.has(id)).length;
    }

    case 'all_muscles_trained':
      return stats.allMusclesTrainedCount;

    case 'balanced_training':
      return stats.balancedDays;

    case 'equipment_sets': {
      const equipment = extra?.equipment as string | undefined;
      return equipment ? stats.equipmentSets[equipment] || 0 : 0;
    }

    case 'unique_equipment':
      return stats.uniqueEquipmentCount;

    case 'bodyweight_sessions':
      return stats.bodyweightSessionCount;

    case 'unique_exercises':
      return stats.uniqueExerciseCount;

    case 'equipment_week':
      return stats.maxEquipmentInWeek;

    case 'varied_weeks':
      return stats.variedWeeksStreak;

    case 'account_created_before':
      return stats.earliestSessionMs <= badge.conditionValue ? 1 : 0;

    case 'workout_hour_before':
      return stats.workoutHours.some((h) => h < badge.conditionValue)
        ? 1
        : 0;

    case 'workout_hour_after':
      return stats.workoutHours.some((h) => h >= badge.conditionValue)
        ? 1
        : 0;

    case 'daily_duration_hours':
      return stats.maxDailyDurationHours;

    case 'session_duration_hours':
      return stats.maxSessionDurationHours;

    case 'weekend_streak':
      return stats.weekendStreakWeeks;

    case 'workout_date':
      return stats.workoutDates.has(badge.conditionValue) ? 1 : 0;

    // Social and AI — deferred until Supabase
    default:
      return 0;
  }
}

// ─── Public API ───

/**
 * Evaluate all badges against workout history.
 * Returns BadgeProgress[] for the trophies screen.
 */
export function evaluateAllBadges(
  history: WorkoutSession[],
  unlockedBadges: Record<string, { unlockedAt: string }>,
): BadgeProgress[] {
  const stats = computeStats(history);
  const unlockedIds = new Set(Object.keys(unlockedBadges));

  return ALL_BADGES.map((badge) => {
    const isDeferred = DEFERRED_CONDITIONS.has(badge.conditionType);
    const isAlreadyUnlocked = unlockedIds.has(badge.id);

    if (isAlreadyUnlocked) {
      return {
        badge,
        isUnlocked: true,
        unlockedAt: unlockedBadges[badge.id].unlockedAt,
        currentValue: badge.conditionValue,
        targetValue: badge.conditionValue,
        progressPercent: 100,
      };
    }

    if (isDeferred) {
      return {
        badge,
        isUnlocked: false,
        currentValue: 0,
        targetValue: badge.conditionValue,
        progressPercent: 0,
      };
    }

    const currentValue = evaluateCondition(badge, stats, unlockedIds);
    const isBoolean = BOOLEAN_CONDITIONS.has(badge.conditionType);
    const targetValue = isBoolean ? 1 : badge.conditionValue;
    const isUnlocked = currentValue >= targetValue;
    const progressPercent =
      targetValue > 0
        ? Math.min(100, (currentValue / targetValue) * 100)
        : 0;

    return {
      badge,
      isUnlocked,
      currentValue,
      targetValue,
      progressPercent,
    };
  });
}

/**
 * Returns badge IDs that qualify for unlock but aren't yet in unlockedBadges.
 * Used after each session to detect new badge unlocks.
 */
export function getNewlyUnlockedBadges(
  history: WorkoutSession[],
  unlockedIds: Set<string>,
): string[] {
  const stats = computeStats(history);
  const newlyUnlocked: string[] = [];

  // Multiple passes: first pass evaluates non-meta badges,
  // then check meta-badges (badges_unlocked) with updated set
  const workingUnlocked = new Set(unlockedIds);

  // Pass 1: non-meta badges
  for (const badge of ALL_BADGES) {
    if (workingUnlocked.has(badge.id)) continue;
    if (DEFERRED_CONDITIONS.has(badge.conditionType)) continue;
    if (badge.conditionType === 'badges_unlocked') continue;

    const currentValue = evaluateCondition(badge, stats, workingUnlocked);
    const targetValue = BOOLEAN_CONDITIONS.has(badge.conditionType)
      ? 1
      : badge.conditionValue;

    if (currentValue >= targetValue) {
      newlyUnlocked.push(badge.id);
      workingUnlocked.add(badge.id);
    }
  }

  // Pass 2: meta-badges (badges_unlocked type)
  for (const badge of ALL_BADGES) {
    if (workingUnlocked.has(badge.id)) continue;
    if (badge.conditionType !== 'badges_unlocked') continue;

    const currentValue = evaluateCondition(badge, stats, workingUnlocked);
    if (currentValue >= badge.conditionValue) {
      newlyUnlocked.push(badge.id);
      workingUnlocked.add(badge.id);
    }
  }

  return newlyUnlocked;
}
