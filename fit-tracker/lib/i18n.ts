import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import fr from './translations/fr';
import en from './translations/en';

const i18n = new I18n({ fr, en });

// Set default locale from device
const deviceLocale = getLocales()[0]?.languageCode ?? 'fr';
i18n.locale = deviceLocale === 'fr' ? 'fr' : 'fr'; // Default to French per app design
i18n.enableFallback = true;
i18n.defaultLocale = 'fr';

export default i18n;
