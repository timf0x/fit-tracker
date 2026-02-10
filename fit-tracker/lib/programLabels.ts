import i18n from '@/lib/i18n';
import type { ProgramDay, TrainingProgram, SplitType } from '@/types/program';

/**
 * Legacy label → i18n key mapping.
 * Old programs stored English or French labels directly in labelFr.
 * This lets us resolve them to proper i18n keys without regenerating.
 */
const LEGACY_LABEL_TO_KEY: Record<string, string> = {
  // English labels (stored by old generator as labelFr or label)
  'Upper A': 'upperA',
  'Upper B': 'upperB',
  'Lower A': 'lowerA',
  'Lower B': 'lowerB',
  'Full Body A': 'fullBodyA',
  'Full Body B': 'fullBodyB',
  'Full Body C': 'fullBodyC',
  'Full Body Pump': 'fullBodyPump',
  'Push A': 'pushA',
  'Push B': 'pushB',
  'Pull A': 'pullA',
  'Pull B': 'pullB',
  'Legs A': 'legsA',
  'Legs B': 'legsB',
  // Old French labels (stored by original generator)
  'Haut A': 'upperA',
  'Haut B': 'upperB',
  'Bas A': 'lowerA',
  'Bas B': 'lowerB',
  'Corps entier A': 'fullBodyA',
  'Corps entier B': 'fullBodyB',
  'Corps entier C': 'fullBodyC',
  'Pump global': 'fullBodyPump',
  'Poussée A': 'pushA',
  'Poussée B': 'pushB',
  'Tirage A': 'pullA',
  'Tirage B': 'pullB',
  'Jambes A': 'legsA',
  'Jambes B': 'legsB',
};

/**
 * Resolve a day's display label using i18n.
 * New programs store a `labelKey` that maps to `programLabels.*`.
 * Legacy programs only have `labelFr` — try to map it back to a key.
 */
export function resolveDayLabel(day: ProgramDay): string {
  // 1. Use labelKey if available (new programs)
  if (day.labelKey) {
    const key = `programLabels.${day.labelKey}`;
    const resolved = i18n.t(key);
    if (resolved !== key) return resolved;
  }

  // 2. Try to resolve legacy label → i18n key
  const legacyKey = LEGACY_LABEL_TO_KEY[day.labelFr] || LEGACY_LABEL_TO_KEY[day.label];
  if (legacyKey) {
    const key = `programLabels.${legacyKey}`;
    const resolved = i18n.t(key);
    if (resolved !== key) return resolved;
  }

  // 3. Final fallback — raw stored label
  return day.labelFr || day.label;
}

const SPLIT_KEYS: Record<SplitType, string> = {
  full_body: 'splitFullBody',
  upper_lower: 'splitUpperLower',
  ppl: 'splitPPL',
};

/**
 * Resolve a program's display name using i18n.
 * Uses the split type + total weeks to build a localized name.
 */
export function resolveProgramName(program: TrainingProgram): string {
  const splitKey = SPLIT_KEYS[program.splitType];
  if (splitKey) {
    const split = i18n.t(`programLabels.${splitKey}`);
    return i18n.t('programLabels.programName', { split, weeks: program.totalWeeks });
  }
  // Legacy fallback
  return program.nameFr;
}
