import {
  UserProfile,
  TrainingProgram,
  ProgramWeek,
  ProgramDay,
  ProgramExercise,
  SplitType,
} from '@/types/program';
import { exercises } from '@/data/exercises';
import { RP_VOLUME_LANDMARKS } from '@/constants/volumeLandmarks';
import {
  EQUIPMENT_BY_SETUP,
  getSplitForDays,
  EXERCISE_POOLS,
  SPLIT_TEMPLATES,
  GOAL_CONFIG,
  MESO_LENGTH,
  SplitDayTemplate,
} from '@/constants/programTemplates';
import { Equipment } from '@/types';
import { getEstimatedWeight, roundToIncrement } from '@/lib/weightEstimation';
import { getExerciseCategory, getTargetRir } from '@/lib/exerciseClassification';

// ─── Helpers ───

const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

function generateId() {
  return `prog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Compound vs Isolation ───

/**
 * Multi-joint compound movements — these stay constant across weeks
 * for progressive overload tracking. Isolations rotate mid-meso.
 */
export const COMPOUND_IDS = new Set([
  // Chest
  'ex_023', 'ex_024', 'ex_025', 'ex_026', 'ex_027', 'ex_031', 'ex_032',
  // Back
  'ex_005', 'ex_006', 'ex_007', 'ex_008', 'ex_009', 'ex_010', 'ex_011',
  'ex_087', 'ex_088', 'ex_085',
  // Shoulders
  'ex_015', 'ex_016', 'ex_017', 'ex_091',
  // Arms (close-grip bench is compound)
  'ex_042',
  // Legs
  'ex_051', 'ex_052', 'ex_053', 'ex_054', 'ex_056', 'ex_058', 'ex_059',
  'ex_060', 'ex_061', 'ex_062', 'ex_102', 'ex_103', 'ex_104', 'ex_107',
  'ex_108', 'ex_109', 'ex_110', 'ex_111', 'ex_112',
]);

export function isCompound(exerciseId: string): boolean {
  return COMPOUND_IDS.has(exerciseId);
}

/**
 * Ordering priority for muscles within a day.
 * Big compound muscles first → small isolation muscles last.
 */
const MUSCLE_SORT_ORDER: Record<string, number> = {
  quads: 0, hamstrings: 1, glutes: 2, chest: 3, lats: 4,
  'upper back': 5, 'lower back': 6, shoulders: 7,
  triceps: 8, biceps: 9, forearms: 10, calves: 11,
  abs: 12, obliques: 13,
};

// ─── Volume Logic ───

function filterByEquipment(pool: string[], allowedEquipment: Equipment[]): string[] {
  return pool.filter((id) => {
    const ex = exerciseMap.get(id);
    return ex && allowedEquipment.includes(ex.equipment);
  });
}

function getVolumeRange(
  muscle: string,
  profile: UserProfile
): { start: number; end: number; deload: number } {
  const landmarks = RP_VOLUME_LANDMARKS[muscle];
  if (!landmarks) return { start: 0, end: 0, deload: 0 };

  const isPriority = profile.priorityMuscles.includes(muscle);
  const bonus = isPriority ? 2 : 0;

  let start: number;
  let end: number;

  switch (profile.experience) {
    case 'beginner':
      start = landmarks.mev;
      end = landmarks.mavLow;
      break;
    case 'intermediate':
      start = Math.round((landmarks.mev + landmarks.mavLow) / 2);
      end = Math.round((landmarks.mavLow + landmarks.mavHigh) / 2);
      break;
    case 'advanced':
      start = landmarks.mavLow;
      end = landmarks.mavHigh;
      break;
  }

  start = Math.min(start + bonus, landmarks.mrv);
  end = Math.min(end + bonus, landmarks.mrv);
  const deload = landmarks.mv;

  return { start, end, deload };
}

function getWeekVolume(
  start: number,
  end: number,
  deload: number,
  weekIndex: number,
  totalWeeks: number,
  isDeload: boolean
): number {
  if (isDeload) return deload;
  const trainingWeeks = totalWeeks - 1;
  if (trainingWeeks <= 1) return start;
  const t = weekIndex / (trainingWeeks - 1);
  return Math.round(start + t * (end - start));
}

function getDayTemplates(splitType: SplitType, daysPerWeek: number): SplitDayTemplate[] {
  const templates = SPLIT_TEMPLATES[splitType];
  if (splitType === 'upper_lower') {
    return daysPerWeek === 5 ? templates[1] : templates[0];
  }
  return templates[0];
}

function muscleFrequency(templates: SplitDayTemplate[], muscle: string): number {
  return templates.filter((t) => t.muscles.includes(muscle)).length;
}

// ─── Exercise Picking ───

/**
 * Pick exercises for a muscle on a given day.
 *
 * @param muscle - target muscle key
 * @param setsForMuscle - total sets to allocate
 * @param dayVariant - 0=A, 1=B, 2=C (offsets exercise selection in pool)
 * @param weekPhase - 0=first half, 1=second half (rotates isolation choices)
 * @param allowedEquipment - user's available equipment
 * @param usedExercises - exercises already used this day (avoid duplicates)
 */
function pickExercises(
  muscle: string,
  setsForMuscle: number,
  dayVariant: number,
  weekPhase: number,
  allowedEquipment: Equipment[],
  usedExercises: Set<string>
): ProgramExercise[] {
  if (setsForMuscle <= 0) return [];

  const pool = EXERCISE_POOLS[muscle] || [];
  const available = filterByEquipment(pool, allowedEquipment);
  if (available.length === 0) return [];

  const baseOffset = dayVariant * 2;

  // Determine exercise count: 1 if ≤4 sets, 2 if >4
  const exerciseCount = setsForMuscle > 4 ? 2 : 1;
  const result: ProgramExercise[] = [];

  for (let i = 0; i < exerciseCount; i++) {
    // First exercise = compound (use base offset, stable across weeks)
    // Second exercise = isolation (add weekPhase offset to rotate mid-meso)
    const extraOffset = i > 0 ? weekPhase : 0;
    const offset = baseOffset + i + extraOffset;

    let picked: string | null = null;
    for (let j = 0; j < available.length; j++) {
      const idx = (offset + j) % available.length;
      const exId = available[idx];
      if (!usedExercises.has(exId)) {
        picked = exId;
        usedExercises.add(exId);
        break;
      }
    }
    // Fallback: reuse from pool
    if (!picked) {
      picked = available[offset % available.length];
    }

    const setsForThis = exerciseCount === 1
      ? setsForMuscle
      : i === 0
        ? Math.ceil(setsForMuscle / 2)
        : Math.floor(setsForMuscle / 2);

    result.push({
      exerciseId: picked,
      sets: Math.max(setsForThis, 1),
      reps: 0,        // set by caller (= maxReps for backward compat)
      minReps: 0,     // set by caller based on exercise category
      maxReps: 0,     // set by caller based on exercise category
      targetRir: 0,   // set by caller based on week position
      restTime: 0,    // set by caller based on exercise category
    });
  }

  return result;
}

// ─── Main Generator ───

export function generateProgram(profile: UserProfile): TrainingProgram {
  const splitType = getSplitForDays(profile.daysPerWeek);
  const totalWeeks = MESO_LENGTH[profile.experience];
  const dayTemplates = getDayTemplates(splitType, profile.daysPerWeek);
  const allowedEquipment = EQUIPMENT_BY_SETUP[profile.equipment];
  const goalConfig = GOAL_CONFIG[profile.goal];

  // Compute volume ranges for all muscles
  const allMuscles = new Set<string>();
  for (const day of dayTemplates) {
    for (const m of day.muscles) allMuscles.add(m);
  }

  const volumeRanges: Record<string, { start: number; end: number; deload: number }> = {};
  for (const muscle of allMuscles) {
    volumeRanges[muscle] = getVolumeRange(muscle, profile);
  }

  // Midpoint of the meso (for isolation rotation)
  const trainingWeeks = totalWeeks - 1; // exclude deload
  const midpoint = Math.ceil(trainingWeeks / 2);

  // Build weeks
  const weeks: ProgramWeek[] = [];
  for (let weekIdx = 0; weekIdx < totalWeeks; weekIdx++) {
    const isDeload = weekIdx === totalWeeks - 1;
    // Phase 0 = first half, Phase 1 = second half (isolation exercises rotate)
    const weekPhase = weekIdx < midpoint ? 0 : isDeload ? 0 : 1;

    // Compute target volume per muscle for this week
    const volumeTargets: Record<string, number> = {};
    for (const muscle of allMuscles) {
      const range = volumeRanges[muscle];
      volumeTargets[muscle] = getWeekVolume(
        range.start, range.end, range.deload,
        weekIdx, totalWeeks, isDeload
      );
    }

    // Distribute volume across days
    const days: ProgramDay[] = dayTemplates.map((template, dayIdx) => {
      const usedExercises = new Set<string>();
      const dayExercises: ProgramExercise[] = [];

      // Determine variant: A=0, B=1, C=2 based on label suffix
      const variant = template.label.endsWith('B') ? 1
        : template.label.endsWith('C') ? 2 : 0;

      for (const muscle of template.muscles) {
        const totalForMuscle = volumeTargets[muscle] || 0;
        const freq = muscleFrequency(dayTemplates, muscle);
        const setsThisDay = Math.max(Math.round(totalForMuscle / freq), 0);
        if (setsThisDay <= 0) continue;

        const exs = pickExercises(
          muscle, setsThisDay, variant, weekPhase,
          allowedEquipment, usedExercises
        );

        // Assign reps + rest + RIR + suggested weight based on 6-tier category
        const targetRir = getTargetRir(weekIdx, totalWeeks, isDeload);
        for (const ex of exs) {
          const category = getExerciseCategory(ex.exerciseId);
          const catConfig = goalConfig[category];
          ex.minReps = catConfig.minReps;
          ex.maxReps = catConfig.maxReps;
          ex.reps = catConfig.maxReps; // backward compat
          ex.restTime = catConfig.restTime;
          ex.targetRir = targetRir;

          const exData = exerciseMap.get(ex.exerciseId);
          if (exData) {
            const baseWeight = getEstimatedWeight(
              ex.exerciseId,
              exData.equipment,
              exData.target,
              profile.weight,
              profile.sex,
              profile.experience
            );

            // Week-over-week weight progression: ~2.5% per training week
            // Compounds get full progression, isolations get ~1%
            // Deload resets to base weight
            if (baseWeight > 0 && !isDeload && weekIdx > 0) {
              const isCompoundEx = isCompound(ex.exerciseId);
              const weeklyMultiplier = isCompoundEx ? 0.025 : 0.01;
              const rawWeight = baseWeight * (1 + weeklyMultiplier * weekIdx);
              ex.suggestedWeight = roundToIncrement(rawWeight, exData.equipment);
            } else {
              ex.suggestedWeight = baseWeight;
            }
          }
        }

        dayExercises.push(...exs);
      }

      // ─── Sort: compounds first (big → small muscles), then isolations ───
      dayExercises.sort((a, b) => {
        const aCompound = isCompound(a.exerciseId);
        const bCompound = isCompound(b.exerciseId);
        // Compounds before isolations
        if (aCompound !== bCompound) return aCompound ? -1 : 1;
        // Within same category, order by muscle size
        const aEx = exerciseMap.get(a.exerciseId);
        const bEx = exerciseMap.get(b.exerciseId);
        const aMuscle = aEx?.target || '';
        const bMuscle = bEx?.target || '';
        // Map target back to canonical muscle for sorting
        const aOrder = getMuscleOrder(aMuscle);
        const bOrder = getMuscleOrder(bMuscle);
        return aOrder - bOrder;
      });

      return {
        dayIndex: dayIdx,
        label: template.label,
        labelFr: template.labelFr,
        focus: template.focus,
        muscleTargets: template.muscles,
        exercises: dayExercises,
        isRestDay: false,
      };
    });

    weeks.push({
      weekNumber: weekIdx + 1,
      isDeload,
      days,
      volumeTargets,
    });
  }

  // Program name
  const splitNamesFr: Record<SplitType, string> = {
    full_body: 'Full Body',
    upper_lower: 'Haut/Bas',
    ppl: 'Push/Pull/Legs',
  };

  return {
    id: generateId(),
    name: `${splitNamesFr[splitType]} – ${totalWeeks} weeks`,
    nameFr: `${splitNamesFr[splitType]} – ${totalWeeks} semaines`,
    splitType,
    totalWeeks,
    weeks,
    userProfile: profile,
    createdAt: new Date().toISOString(),
  };
}

/** Map exercise target string → sort priority (lower = earlier in workout) */
function getMuscleOrder(target: string): number {
  // Direct match
  if (target in MUSCLE_SORT_ORDER) return MUSCLE_SORT_ORDER[target];
  // Common target aliases
  const aliases: Record<string, string> = {
    pecs: 'chest', 'upper chest': 'chest', 'lower chest': 'chest',
    'middle back': 'upper back', 'rear delts': 'shoulders',
    delts: 'shoulders', 'front delts': 'shoulders', 'lateral delts': 'shoulders',
    traps: 'shoulders', biceps: 'biceps', brachialis: 'biceps',
    triceps: 'triceps', 'forearm flexors': 'forearms',
    'forearm extensors': 'forearms', brachioradialis: 'forearms', grip: 'forearms',
    gastrocnemius: 'calves', soleus: 'calves',
    'lower abs': 'abs', 'core stability': 'abs',
  };
  const canonical = aliases[target];
  if (canonical && canonical in MUSCLE_SORT_ORDER) return MUSCLE_SORT_ORDER[canonical];
  return 99;
}

// ─── Overload Suggestions (Double Progression) ───

export function getOverloadSuggestions(
  history: Array<{ exerciseId: string; sets: Array<{ reps: number; weight?: number; completed: boolean }> }>,
  programDay: ProgramDay
): Record<string, string> {
  const suggestions: Record<string, string> = {};

  for (const pex of programDay.exercises) {
    const sessions = history
      .filter((h) => h.exerciseId === pex.exerciseId)
      .slice(0, 2);

    if (sessions.length === 0) continue;

    const ex = exerciseMap.get(pex.exerciseId);
    if (!ex) continue;

    const maxReps = pex.maxReps || pex.reps;
    const minReps = pex.minReps || maxReps;
    const lastSession = sessions[0];
    const completedSets = lastSession.sets.filter((s) => s.completed);
    if (completedSets.length === 0) continue;

    const lastWeight = completedSets[0]?.weight || 0;

    // Check if >50% sets below minReps → suggest weight reduction
    const belowMinCount = completedSets.filter((s) => s.reps < minReps).length;
    if (belowMinCount > completedSets.length * 0.5 && lastWeight > 0) {
      const increment = (ex.equipment === 'barbell' || ex.equipment === 'ez bar' || ex.equipment === 'smith machine' || ex.equipment === 'trap bar')
        ? 2.5 : (ex.equipment === 'dumbbell' || ex.equipment === 'kettlebell') ? 2 : 2.5;
      suggestions[pex.exerciseId] = `Réduis à ${lastWeight - increment}kg`;
      continue;
    }

    // Check if all sets hit maxReps for 2 sessions → suggest weight bump
    if (sessions.length >= 2) {
      const allAtMax = sessions.every((s) =>
        s.sets.filter((set) => set.completed).every((set) => set.reps >= maxReps)
      );
      if (allAtMax && lastWeight > 0) {
        const increment = (ex.equipment === 'barbell' || ex.equipment === 'ez bar' || ex.equipment === 'smith machine' || ex.equipment === 'trap bar')
          ? 2.5 : (ex.equipment === 'dumbbell' || ex.equipment === 'kettlebell') ? 2 : 2.5;
        suggestions[pex.exerciseId] = `${lastWeight + increment}kg (reviens à ${minReps} reps)`;
        continue;
      }
    }

    // All sets in range but not at max → nudge +1 rep
    const allInRange = completedSets.every((s) => s.reps >= minReps && s.reps < maxReps);
    if (allInRange) {
      suggestions[pex.exerciseId] = `+1 rep (objectif : ${maxReps})`;
    }
  }

  return suggestions;
}

// ─── Duration Estimate ───

export function estimateDuration(day: ProgramDay): number {
  let totalSeconds = 0;
  for (const ex of day.exercises) {
    const setTime = isCompound(ex.exerciseId) ? 50 : 35; // compounds take longer
    totalSeconds += ex.sets * (setTime + ex.restTime);
  }
  return Math.round(totalSeconds / 60);
}
