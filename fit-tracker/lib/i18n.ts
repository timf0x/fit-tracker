import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import fr from './translations/fr';
import en from './translations/en';

const i18n = new I18n({ fr, en });

// Detect device language — default to French
const deviceLocale = getLocales()[0]?.languageCode ?? 'fr';
i18n.locale = deviceLocale === 'fr' ? 'fr' : 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'fr';

/** Change locale at runtime */
export function setLocale(locale: 'fr' | 'en') {
  i18n.locale = locale;
}

/** Get current locale */
export function getLocale(): string {
  return i18n.locale;
}

export default i18n;
