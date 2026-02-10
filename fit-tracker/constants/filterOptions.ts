import i18n from '@/lib/i18n';
import type { BodyPart, Equipment } from '@/types';

export function getFocusOptions(): { value: BodyPart | 'all'; label: string }[] {
  return [
    { value: 'all', label: i18n.t('workoutCreate.focus.all') },
    { value: 'chest', label: i18n.t('workoutCreate.focus.chest') },
    { value: 'back', label: i18n.t('workoutCreate.focus.back') },
    { value: 'shoulders', label: i18n.t('workoutCreate.focus.shoulders') },
    { value: 'upper legs', label: i18n.t('workoutCreate.focus.legs') },
    { value: 'upper arms', label: i18n.t('workoutCreate.focus.arms') },
    { value: 'waist', label: i18n.t('workoutCreate.focus.waist') },
    { value: 'cardio', label: i18n.t('workoutCreate.focus.cardio') },
  ];
}

export function getEquipmentOptions(): { value: Equipment | 'all'; label: string }[] {
  return [
    { value: 'all', label: i18n.t('common.all') },
    { value: 'dumbbell', label: i18n.t('equipment.dumbbells') },
    { value: 'barbell', label: i18n.t('equipment.barbell') },
    { value: 'cable', label: i18n.t('equipment.cable') },
    { value: 'machine', label: i18n.t('equipment.machine') },
    { value: 'body weight', label: i18n.t('equipment.bodyweight') },
    { value: 'kettlebell', label: i18n.t('equipment.kettlebell') },
    { value: 'resistance band', label: i18n.t('equipment.bands') },
    { value: 'ez bar', label: i18n.t('equipment.ezBar') },
    { value: 'smith machine', label: i18n.t('equipment.smithMachine') },
    { value: 'trap bar', label: i18n.t('equipment.trapBar') },
  ];
}
