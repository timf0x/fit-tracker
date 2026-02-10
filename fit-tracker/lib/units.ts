import { useSettingsStore } from '@/stores/settingsStore';
import i18n from '@/lib/i18n';

const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;

/** Convert kg to the user's preferred unit */
export function toUserUnit(kg: number): number {
  const unit = useSettingsStore.getState().weightUnit;
  if (unit === 'lbs') return Math.round(kg * KG_TO_LBS * 10) / 10;
  return kg;
}

/** Convert from user's unit back to kg (for storage) */
export function toKg(value: number): number {
  const unit = useSettingsStore.getState().weightUnit;
  if (unit === 'lbs') return Math.round(value * LBS_TO_KG * 10) / 10;
  return value;
}

/** Format a weight value with the correct unit label */
export function formatWeight(kg: number, decimals: number = 1): string {
  const unit = useSettingsStore.getState().weightUnit;
  if (unit === 'lbs') {
    const lbs = Math.round(kg * KG_TO_LBS * 10) / 10;
    return `${lbs.toFixed(decimals)} ${i18n.t('settings.unitsLbs')}`;
  }
  return `${kg.toFixed(decimals)} ${i18n.t('settings.unitsKg')}`;
}

/** Get the current unit label */
export function weightUnitLabel(): string {
  const unit = useSettingsStore.getState().weightUnit;
  return unit === 'lbs' ? i18n.t('settings.unitsLbs') : i18n.t('settings.unitsKg');
}

/** React hook version — re-renders when unit changes */
export function useWeightUnit() {
  const unit = useSettingsStore((s) => s.weightUnit);
  return {
    unit,
    label: unit === 'lbs' ? i18n.t('settings.unitsLbs') : i18n.t('settings.unitsKg'),
    toDisplay: (kg: number) => unit === 'lbs' ? Math.round(kg * KG_TO_LBS * 10) / 10 : kg,
    toKg: (value: number) => unit === 'lbs' ? Math.round(value * LBS_TO_KG * 10) / 10 : value,
    format: (kg: number, decimals: number = 1) => {
      const val = unit === 'lbs' ? kg * KG_TO_LBS : kg;
      const lbl = unit === 'lbs' ? i18n.t('settings.unitsLbs') : i18n.t('settings.unitsKg');
      return `${val.toFixed(decimals)} ${lbl}`;
    },
  };
}
