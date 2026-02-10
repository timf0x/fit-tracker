import i18n from '@/lib/i18n';
import type { Exercise } from '@/types';
import { exerciseTranslationsFr } from '@/data/exerciseTranslationsFr';

/**
 * Returns the locale-aware description for an exercise.
 * Falls back to English if French is unavailable.
 */
export function getExerciseDescription(exercise: Exercise): string {
  if (i18n.locale === 'fr') {
    if (exercise.descriptionFr) return exercise.descriptionFr;
    const lookup = exerciseTranslationsFr[exercise.id];
    if (lookup?.descriptionFr) return lookup.descriptionFr;
  }
  return exercise.description;
}

/**
 * Returns the locale-aware instructions for an exercise.
 * Falls back to English instructions, or splits description as last resort.
 */
export function getExerciseInstructions(exercise: Exercise): string[] {
  if (i18n.locale === 'fr') {
    if (exercise.instructionsFr && exercise.instructionsFr.length > 0) return exercise.instructionsFr;
    const lookup = exerciseTranslationsFr[exercise.id];
    if (lookup?.instructionsFr && lookup.instructionsFr.length > 0) return lookup.instructionsFr;
  }
  if (exercise.instructions && exercise.instructions.length > 0) {
    return exercise.instructions;
  }
  // Fallback: split description into sentences
  const desc = getExerciseDescription(exercise);
  return desc
    .split('.')
    .map((step) => step.trim())
    .filter((step) => step.length > 0)
    .map((step) => `${step}.`);
}

/**
 * Returns the locale-aware exercise name.
 */
export function getExerciseName(exercise: Exercise): string {
  if (i18n.locale === 'fr') {
    return exercise.nameFr || exercise.name;
  }
  return exercise.name;
}

/**
 * Returns the locale-aware target muscle label.
 */
export function getTargetLabel(target: string): string {
  const key = `targets.${target.replace(/\s+/g, '_')}`;
  const translated = i18n.t(key, { defaultValue: '' });
  // If no translation key found, fall back to raw target
  return translated && translated !== key ? translated : target;
}

/**
 * Returns the locale-aware secondary muscle labels.
 */
export function getSecondaryMusclesLabel(muscles: string[]): string {
  return muscles
    .map((m) => {
      const key = `targets.${m.replace(/\s+/g, '_')}`;
      const translated = i18n.t(key, { defaultValue: '' });
      return translated && translated !== key ? translated : m;
    })
    .join(', ');
}
