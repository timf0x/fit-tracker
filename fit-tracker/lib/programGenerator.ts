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
import { TARGET_TO_MUSCLE } from '@/lib/muscleMapping';
import i18n from '@/lib/i18n';

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

// ─── Age / Sex / Limitation Modifiers ───

import type { JointKey } from '@/types/program';

/**
 * Age-based modifiers (Israetel guidelines for 40+/55+/70+).
 * Rest: longer recovery windows. Overload: slower progression.
 * Machines: prefer guided movements for joint safety.
 */
function getAgeModifiers(age?: number) {
  if (!age || age < 40) return { restMultiplier: 1.0, overloadMultiplier: 1.0, preferMachines: false };
  if (age < 55) return { restMultiplier: 1.15, overloadMultiplier: 0.6, preferMachines: false };
  if (age < 70) return { restMultiplier: 1.3, overloadMultiplier: 0.4, preferMachines: true };
  return { restMultiplier: 1.5, overloadMultiplier: 0.25, preferMachines: true };
}

/**
 * Sex-based rest modifier.
 * Women have greater fatigue resistance (2025 PubMed meta) →
 * ~15% shorter rest periods without compromising force production.
 */
function getSexRestModifier(sex: 'male' | 'female'): number {
  return sex === 'female' ? 0.85 : 1.0;
}

/**
 * Muscles affected by each joint limitation.
 * Used to cap volume and deprioritize free-weight compounds.
 */
const LIMITATION_MUSCLES: Record<JointKey, string[]> = {
  shoulder: ['chest', 'shoulders', 'upper back'],
  knee: ['quads', 'glutes'],
  lower_back: ['lower back', 'hamstrings', 'glutes'],
  hip: ['glutes', 'hamstrings', 'quads'],
  elbow: ['biceps', 'triceps'],
  wrist: ['forearms', 'biceps'],
};

/**
 * Exercises to deprioritize (push to end of pool) per joint limitation.
 * These are heavy free-weight compounds that stress the joint most.
 */
const LIMITATION_DEPRIORITIZE: Record<JointKey, Set<string>> = {
  shoulder: new Set([
    'ex_016', // Overhead Press
    'ex_017', // DB Shoulder Press
    'ex_015', // Arnold Press
    'ex_091', // Machine Shoulder Press
    'ex_023', // Bench Press (wide grip stresses shoulder)
    'ex_024', // Incline Bench
    'ex_031', // Dips
  ]),
  knee: new Set([
    'ex_051', // Barbell Squat
    'ex_052', // Front Squat
    'ex_054', // Hack Squat
    'ex_055', // Leg Extension (shear force)
    'ex_060', // Walking Lunges
    'ex_112', // Pistol Squat
    'ex_130', // Jump Squat
  ]),
  lower_back: new Set([
    'ex_009', // Deadlift
    'ex_058', // Stiff Leg DL
    'ex_107', // Good Morning
    'ex_088', // Pendlay Row
    'ex_051', // Barbell Squat
    'ex_052', // Front Squat
  ]),
  hip: new Set([
    'ex_051', // Barbell Squat
    'ex_102', // Sumo Deadlift
    'ex_061', // Hip Thrust (deep ROM)
    'ex_059', // Bulgarian Split Squat
  ]),
  elbow: new Set([
    'ex_040', // Skull Crusher
    'ex_101', // EZ Skull Crusher
    'ex_036', // Preacher Curl (full extension stress)
    'ex_042', // Close-Grip Bench
  ]),
  wrist: new Set([
    'ex_023', // Bench Press (wrist loading)
    'ex_016', // Overhead Press
    'ex_047', // Wrist Curl
    'ex_048', // Reverse Wrist Curl
    'ex_049', // Reverse Curl
  ]),
};

/**
 * Check if a muscle is affected by any user limitation.
 */
function isMuscleAffected(muscle: string, limitations?: JointKey[]): boolean {
  if (!limitations || limitations.length === 0) return false;
  return limitations.some((joint) => LIMITATION_MUSCLES[joint]?.includes(muscle));
}

/**
 * Reorder exercise pool: push deprioritized exercises to end.
 * Doesn't remove them — just nudges toward safer choices first.
 */
function applyLimitationReorder(pool: string[], limitations?: JointKey[]): string[] {
  if (!limitations || limitations.length === 0) return pool;
  const deprioritized = new Set<string>();
  for (const joint of limitations) {
    const set = LIMITATION_DEPRIORITIZE[joint];
    if (set) set.forEach((id) => deprioritized.add(id));
  }
  const safe = pool.filter((id) => !deprioritized.has(id));
  const risky = pool.filter((id) => deprioritized.has(id));
  return [...safe, ...risky];
}

/**
 * Sort exercise pool: machine/cable first for joint-friendly selection.
 * Used for 55+ lifters where guided movements are safer.
 */
function applyMachinePreference(pool: string[]): string[] {
  const preferred = new Set(['machine', 'cable', 'smith machine']);
  const machines: string[] = [];
  const freeWeights: string[] = [];
  for (const id of pool) {
    const ex = exerciseMap.get(id);
    if (ex && preferred.has(ex.equipment)) {
      machines.push(id);
    } else {
      freeWeights.push(id);
    }
  }
  return [...machines, ...freeWeights];
}

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

  // ─── Training years micro-adjustment ───
  // Refine volume within experience bucket for more precise prescription
  if (profile.trainingYears != null) {
    const years = profile.trainingYears;
    let microAdjust = 0;
    if (profile.experience === 'beginner') {
      // 0-2 years: ramp from 0 to +1 set
      microAdjust = Math.min(1, years / 2);
    } else if (profile.experience === 'intermediate') {
      // 2-5 years typical; more years → +1 set
      microAdjust = Math.min(1, Math.max(0, (years - 2) / 3));
    } else {
      // Advanced 5+: more experience → slight boost toward MRV
      microAdjust = Math.min(2, Math.max(0, (years - 5) / 4));
    }
    start = Math.round(start + microAdjust);
    end = Math.round(end + microAdjust);
    start = Math.max(landmarks.mev, Math.min(start, landmarks.mrv));
    end = Math.max(landmarks.mev, Math.min(end, landmarks.mrv));
  }

  // ─── Limitation cap ───
  // Muscles affected by joint limitations: conservative volume (MEV → MEV+2)
  if (isMuscleAffected(muscle, profile.limitations)) {
    start = landmarks.mev;
    end = Math.min(landmarks.mev + 2, landmarks.mavLow);
  }

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
  usedExercises: Set<string>,
  limitations?: JointKey[],
  preferMachines?: boolean,
): ProgramExercise[] {
  if (setsForMuscle <= 0) return [];

  const pool = EXERCISE_POOLS[muscle] || [];
  let available = filterByEquipment(pool, allowedEquipment);
  if (available.length === 0) return [];

  // Safety reordering: push risky exercises to end for limited joints
  available = applyLimitationReorder(available, limitations);

  // Prefer guided movements for 55+ lifters
  if (preferMachines) {
    available = applyMachinePreference(available);
  }

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

  // ─── Profile-based modifiers ───
  const ageMods = getAgeModifiers(profile.age);
  const sexRestMod = getSexRestModifier(profile.sex);
  const restMultiplier = ageMods.restMultiplier * sexRestMod;

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
          allowedEquipment, usedExercises,
          profile.limitations, ageMods.preferMachines,
        );

        // Assign reps + rest + RIR + suggested weight based on 6-tier category
        const targetRir = getTargetRir(weekIdx, totalWeeks, isDeload);
        for (const ex of exs) {
          const category = getExerciseCategory(ex.exerciseId);
          const catConfig = goalConfig[category];
          ex.minReps = catConfig.minReps;
          ex.maxReps = catConfig.maxReps;
          ex.reps = catConfig.maxReps; // backward compat
          ex.restTime = Math.round(catConfig.restTime * restMultiplier);
          ex.targetRir = targetRir;

          const exData = exerciseMap.get(ex.exerciseId);
          if (exData) {
            const baseWeight = getEstimatedWeight(
              ex.exerciseId,
              exData.equipment,
              exData.target,
              profile.weight,
              profile.sex,
              profile.experience,
              undefined, // hasHistory
              profile.height,
            );

            // Week-over-week weight progression: ~2.5% per training week
            // Compounds get full progression, isolations get ~1%
            // Deload resets to base weight
            if (baseWeight > 0 && !isDeload && weekIdx > 0) {
              const isCompoundEx = isCompound(ex.exerciseId);
              const weeklyMultiplier = (isCompoundEx ? 0.025 : 0.01) * ageMods.overloadMultiplier;
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
        labelKey: template.labelKey,
        labelFr: template.label, // legacy compat — resolveDayLabel() uses labelKey first
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

  // Program name — stored as English fallback, resolveProgramName() localizes at render time
  const splitNames: Record<SplitType, string> = {
    full_body: 'Full Body',
    upper_lower: 'Upper/Lower',
    ppl: 'Push/Pull/Legs',
  };

  return {
    id: generateId(),
    name: `${splitNames[splitType]} – ${totalWeeks} weeks`,
    nameFr: `${splitNames[splitType]} – ${totalWeeks} weeks`, // legacy field, resolveProgramName() used instead
    splitType,
    totalWeeks,
    weeks,
    userProfile: profile,
    createdAt: new Date().toISOString(),
  };
}

/** Map exercise target string → sort priority (lower = earlier in workout) */
function getMuscleOrder(target: string): number {
  if (target in MUSCLE_SORT_ORDER) return MUSCLE_SORT_ORDER[target];
  const canonical = TARGET_TO_MUSCLE[target];
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
      suggestions[pex.exerciseId] = i18n.t('programDay.overloadReduce', { weight: lastWeight - increment });
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
        suggestions[pex.exerciseId] = i18n.t('programDay.overloadBumpReps', { weight: lastWeight + increment, reps: minReps });
        continue;
      }
    }

    // All sets in range but not at max → nudge +1 rep
    const allInRange = completedSets.every((s) => s.reps >= minReps && s.reps < maxReps);
    if (allInRange) {
      suggestions[pex.exerciseId] = i18n.t('programDay.overloadPlusRep', { reps: maxReps });
    }
  }

  return suggestions;
}

// ─── Duration Estimate ───

export function estimateDuration(day: ProgramDay): number {
  let totalSeconds = 0;
  for (const ex of day.exercises) {
    const setTime = ex.setTime || (isCompound(ex.exerciseId) ? 50 : 35);
    totalSeconds += ex.sets * (setTime + ex.restTime);
  }
  return Math.round(totalSeconds / 60);
}
