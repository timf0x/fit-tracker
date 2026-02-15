export interface CountryCode {
  code: string;      // ISO 3166-1 alpha-2
  dialCode: string;  // E.164 prefix
  name: string;      // English
  nameFr: string;    // French
  flag: string;      // Emoji flag (OK in picker modal — identifies countries, not UI icons)
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: 'FR', dialCode: '+33', name: 'France', nameFr: 'France', flag: '🇫🇷' },
  { code: 'BE', dialCode: '+32', name: 'Belgium', nameFr: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', dialCode: '+41', name: 'Switzerland', nameFr: 'Suisse', flag: '🇨🇭' },
  { code: 'CA', dialCode: '+1', name: 'Canada', nameFr: 'Canada', flag: '🇨🇦' },
  { code: 'US', dialCode: '+1', name: 'United States', nameFr: 'États-Unis', flag: '🇺🇸' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', nameFr: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'DE', dialCode: '+49', name: 'Germany', nameFr: 'Allemagne', flag: '🇩🇪' },
  { code: 'ES', dialCode: '+34', name: 'Spain', nameFr: 'Espagne', flag: '🇪🇸' },
  { code: 'IT', dialCode: '+39', name: 'Italy', nameFr: 'Italie', flag: '🇮🇹' },
  { code: 'PT', dialCode: '+351', name: 'Portugal', nameFr: 'Portugal', flag: '🇵🇹' },
  { code: 'NL', dialCode: '+31', name: 'Netherlands', nameFr: 'Pays-Bas', flag: '🇳🇱' },
  { code: 'LU', dialCode: '+352', name: 'Luxembourg', nameFr: 'Luxembourg', flag: '🇱🇺' },
  { code: 'AT', dialCode: '+43', name: 'Austria', nameFr: 'Autriche', flag: '🇦🇹' },
  { code: 'IE', dialCode: '+353', name: 'Ireland', nameFr: 'Irlande', flag: '🇮🇪' },
  { code: 'SE', dialCode: '+46', name: 'Sweden', nameFr: 'Suède', flag: '🇸🇪' },
  { code: 'NO', dialCode: '+47', name: 'Norway', nameFr: 'Norvège', flag: '🇳🇴' },
  { code: 'DK', dialCode: '+45', name: 'Denmark', nameFr: 'Danemark', flag: '🇩🇰' },
  { code: 'FI', dialCode: '+358', name: 'Finland', nameFr: 'Finlande', flag: '🇫🇮' },
  { code: 'PL', dialCode: '+48', name: 'Poland', nameFr: 'Pologne', flag: '🇵🇱' },
  { code: 'CZ', dialCode: '+420', name: 'Czech Republic', nameFr: 'Tchéquie', flag: '🇨🇿' },
  { code: 'RO', dialCode: '+40', name: 'Romania', nameFr: 'Roumanie', flag: '🇷🇴' },
  { code: 'HU', dialCode: '+36', name: 'Hungary', nameFr: 'Hongrie', flag: '🇭🇺' },
  { code: 'GR', dialCode: '+30', name: 'Greece', nameFr: 'Grèce', flag: '🇬🇷' },
  { code: 'HR', dialCode: '+385', name: 'Croatia', nameFr: 'Croatie', flag: '🇭🇷' },
  { code: 'BG', dialCode: '+359', name: 'Bulgaria', nameFr: 'Bulgarie', flag: '🇧🇬' },
  { code: 'RS', dialCode: '+381', name: 'Serbia', nameFr: 'Serbie', flag: '🇷🇸' },
  { code: 'SK', dialCode: '+421', name: 'Slovakia', nameFr: 'Slovaquie', flag: '🇸🇰' },
  { code: 'SI', dialCode: '+386', name: 'Slovenia', nameFr: 'Slovénie', flag: '🇸🇮' },
  { code: 'UA', dialCode: '+380', name: 'Ukraine', nameFr: 'Ukraine', flag: '🇺🇦' },
  { code: 'RU', dialCode: '+7', name: 'Russia', nameFr: 'Russie', flag: '🇷🇺' },
  { code: 'TR', dialCode: '+90', name: 'Turkey', nameFr: 'Turquie', flag: '🇹🇷' },
  { code: 'MA', dialCode: '+212', name: 'Morocco', nameFr: 'Maroc', flag: '🇲🇦' },
  { code: 'DZ', dialCode: '+213', name: 'Algeria', nameFr: 'Algérie', flag: '🇩🇿' },
  { code: 'TN', dialCode: '+216', name: 'Tunisia', nameFr: 'Tunisie', flag: '🇹🇳' },
  { code: 'SN', dialCode: '+221', name: 'Senegal', nameFr: 'Sénégal', flag: '🇸🇳' },
  { code: 'CI', dialCode: '+225', name: 'Ivory Coast', nameFr: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'CM', dialCode: '+237', name: 'Cameroon', nameFr: 'Cameroun', flag: '🇨🇲' },
  { code: 'ZA', dialCode: '+27', name: 'South Africa', nameFr: 'Afrique du Sud', flag: '🇿🇦' },
  { code: 'EG', dialCode: '+20', name: 'Egypt', nameFr: 'Égypte', flag: '🇪🇬' },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia', nameFr: 'Arabie saoudite', flag: '🇸🇦' },
  { code: 'AE', dialCode: '+971', name: 'United Arab Emirates', nameFr: 'Émirats arabes unis', flag: '🇦🇪' },
  { code: 'JP', dialCode: '+81', name: 'Japan', nameFr: 'Japon', flag: '🇯🇵' },
  { code: 'KR', dialCode: '+82', name: 'South Korea', nameFr: 'Corée du Sud', flag: '🇰🇷' },
  { code: 'CN', dialCode: '+86', name: 'China', nameFr: 'Chine', flag: '🇨🇳' },
  { code: 'IN', dialCode: '+91', name: 'India', nameFr: 'Inde', flag: '🇮🇳' },
  { code: 'AU', dialCode: '+61', name: 'Australia', nameFr: 'Australie', flag: '🇦🇺' },
  { code: 'NZ', dialCode: '+64', name: 'New Zealand', nameFr: 'Nouvelle-Zélande', flag: '🇳🇿' },
  { code: 'BR', dialCode: '+55', name: 'Brazil', nameFr: 'Brésil', flag: '🇧🇷' },
  { code: 'MX', dialCode: '+52', name: 'Mexico', nameFr: 'Mexique', flag: '🇲🇽' },
  { code: 'AR', dialCode: '+54', name: 'Argentina', nameFr: 'Argentine', flag: '🇦🇷' },
  { code: 'CL', dialCode: '+56', name: 'Chile', nameFr: 'Chili', flag: '🇨🇱' },
  { code: 'CO', dialCode: '+57', name: 'Colombia', nameFr: 'Colombie', flag: '🇨🇴' },
];

/** Find a country by ISO code */
export function getCountryByCode(code: string): CountryCode | undefined {
  return COUNTRY_CODES.find((c) => c.code === code);
}
