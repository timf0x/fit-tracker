import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import {
  setSoundEnabled as setAudioSoundEnabled,
  setVoiceEnabled as setAudioVoiceEnabled,
  setSoundVolume as setAudioVolume,
  setLanguage as setAudioLanguage,
} from '@/services/audio';
import { setLocale } from '@/lib/i18n';

// ─── System defaults from device ───

const deviceLocale = getLocales()[0];
const systemLanguage: 'fr' | 'en' = deviceLocale?.languageCode === 'fr' ? 'fr' : 'en';
// US, UK, Liberia, Myanmar use imperial — everyone else metric
const IMPERIAL_REGIONS = ['US', 'LR', 'MM', 'GB'];
const systemWeightUnit: 'kg' | 'lbs' =
  deviceLocale?.measurementSystem === 'us' ||
  (deviceLocale?.regionCode && IMPERIAL_REGIONS.includes(deviceLocale.regionCode))
    ? 'lbs'
    : 'kg';

interface SettingsState {
  // Audio
  soundEnabled: boolean;
  voiceEnabled: boolean;
  soundVolume: number;

  // Units & Language
  weightUnit: 'kg' | 'lbs';
  language: 'fr' | 'en';

  // Behavior
  keepScreenAwake: boolean;

  // Setters
  setSoundEnabled: (v: boolean) => void;
  setVoiceEnabled: (v: boolean) => void;
  setSoundVolume: (v: number) => void;
  setWeightUnit: (v: 'kg' | 'lbs') => void;
  setLanguage: (v: 'fr' | 'en') => void;
  setKeepScreenAwake: (v: boolean) => void;

  // Hydrate audio service from persisted state
  applyAudioSettings: () => void;
}

// ─── Unit conversion helpers (usable outside components) ───

const KG_TO_LBS = 2.20462;

/** Convert kg to display value based on current unit setting */
export function formatWeight(kg: number): string {
  const unit = useSettingsStore.getState().weightUnit;
  if (unit === 'lbs') {
    return `${Math.round(kg * KG_TO_LBS)}`;
  }
  // Show decimal only if not whole
  return kg % 1 === 0 ? `${kg}` : `${kg.toFixed(1)}`;
}

/** Get the current unit label */
export function getWeightUnitLabel(): string {
  return useSettingsStore.getState().weightUnit;
}

/** Convert display value back to kg for storage */
export function toKg(value: number, fromUnit?: 'kg' | 'lbs'): number {
  const unit = fromUnit ?? useSettingsStore.getState().weightUnit;
  if (unit === 'lbs') return Math.round((value / KG_TO_LBS) * 10) / 10;
  return value;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      soundEnabled: true,
      voiceEnabled: true,
      soundVolume: 0.8,
      weightUnit: systemWeightUnit,
      language: systemLanguage,
      keepScreenAwake: true,

      setSoundEnabled: (v) => {
        set({ soundEnabled: v });
        setAudioSoundEnabled(v);
      },
      setVoiceEnabled: (v) => {
        set({ voiceEnabled: v });
        setAudioVoiceEnabled(v);
      },
      setSoundVolume: (v) => {
        set({ soundVolume: v });
        setAudioVolume(v);
      },
      setWeightUnit: (v) => set({ weightUnit: v }),
      setLanguage: (v) => {
        set({ language: v });
        setLocale(v);
        setAudioLanguage(v);
      },
      setKeepScreenAwake: (v) => set({ keepScreenAwake: v }),

      applyAudioSettings: () => {
        const { soundEnabled, voiceEnabled, soundVolume, language } = get();
        setAudioSoundEnabled(soundEnabled);
        setAudioVoiceEnabled(voiceEnabled);
        setAudioVolume(soundVolume);
        setAudioLanguage(language);
        setLocale(language);
      },
    }),
    {
      name: 'onset-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        voiceEnabled: state.voiceEnabled,
        soundVolume: state.soundVolume,
        weightUnit: state.weightUnit,
        language: state.language,
        keepScreenAwake: state.keepScreenAwake,
      }),
    },
  ),
);
