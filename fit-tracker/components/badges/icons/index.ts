import type { BadgeIconProps } from './types';

// Volume (14)
import {
  VolTon1Icon, VolTon2Icon, VolTon3Icon, VolTon4Icon,
  VolTon5Icon, VolTon6Icon, VolTon7Icon, VolTon8Icon,
  VolSes1Icon, VolSes2Icon, VolSes3Icon, VolSes4Icon,
  VolSes5Icon, VolSes6Icon,
} from './VolumeIcons';

// Consistency (8)
import {
  ConStr1Icon, ConStr2Icon, ConStr3Icon, ConStr4Icon,
  ConStr5Icon, ConStr6Icon, ConStr7Icon, ConStr8Icon,
} from './ConsistencyIcons';

// Strength (6)
import {
  StrPr1Icon, StrPr2Icon, StrPr3Icon,
  StrPr4Icon, StrPr5Icon, StrPr6Icon,
} from './StrengthIcons';

// Mastery (14)
import {
  MusChestIcon, MusBackIcon, MusShouldersIcon, MusBicepsIcon,
  MusTricepsIcon, MusQuadsIcon, MusHamsIcon, MusGlutesIcon,
  MusCalvesIcon, MusAbsIcon, MusUpperIcon, MusLowerIcon,
  MusFullIcon, MusBalanceIcon,
} from './MasteryIcons';

// Equipment (8)
import {
  EqDumbbellIcon, EqBarbellIcon, EqCableIcon, EqMachineIcon,
  EqBodyweightIcon, EqKettlebellIcon, EqArsenalIcon, EqMinimalistIcon,
} from './EquipmentIcons';

// Explorer (6)
import {
  VarCurIcon, VarExpIcon, VarAdvIcon,
  VarEncIcon, VarJackIcon, VarChamIcon,
} from './ExplorerIcons';

// Special (8)
import {
  SpEarlyIcon, SpEarlyBirdIcon, SpNightOwlIcon, SpIronmanIcon,
  SpMarathonIcon, SpWeekendIcon, SpNewyearIcon, SpKingIcon,
} from './SpecialIcons';

// Social (7)
import {
  SocFriend1Icon, SocFriend2Icon, SocFriend3Icon,
  SocReact1Icon, SocReact2Icon, SocShareIcon, SocInspireIcon,
} from './SocialIcons';

// Science (12)
import {
  SciRir1Icon, SciRir2Icon, SciZone1Icon, SciZone2Icon,
  SciDeloadIcon, SciFreqIcon, SciOverloadIcon, SciReadinessIcon,
  SciFeedbackIcon, SciIntensityIcon, SciBalancedIcon, SciProgramIcon,
} from './ScienceIcons';

export type { BadgeIconProps } from './types';
export type { MetallicPalette } from './types';
export { TIER_PALETTES } from './palette';

/**
 * Complete badge-ID → custom metallic icon mapping.
 * 83 unique 3D metallic icons covering every badge in the system.
 */
export const BADGE_ICON_MAP: Record<string, React.FC<BadgeIconProps>> = {
  // Volume — Tonnes (8)
  vol_ton_1: VolTon1Icon,
  vol_ton_2: VolTon2Icon,
  vol_ton_3: VolTon3Icon,
  vol_ton_4: VolTon4Icon,
  vol_ton_5: VolTon5Icon,
  vol_ton_6: VolTon6Icon,
  vol_ton_7: VolTon7Icon,
  vol_ton_8: VolTon8Icon,

  // Volume — Sessions (6)
  vol_ses_1: VolSes1Icon,
  vol_ses_2: VolSes2Icon,
  vol_ses_3: VolSes3Icon,
  vol_ses_4: VolSes4Icon,
  vol_ses_5: VolSes5Icon,
  vol_ses_6: VolSes6Icon,

  // Consistency — Streaks (8)
  con_str_1: ConStr1Icon,
  con_str_2: ConStr2Icon,
  con_str_3: ConStr3Icon,
  con_str_4: ConStr4Icon,
  con_str_5: ConStr5Icon,
  con_str_6: ConStr6Icon,
  con_str_7: ConStr7Icon,
  con_str_8: ConStr8Icon,

  // Strength — PRs (6)
  str_pr_1: StrPr1Icon,
  str_pr_2: StrPr2Icon,
  str_pr_3: StrPr3Icon,
  str_pr_4: StrPr4Icon,
  str_pr_5: StrPr5Icon,
  str_pr_6: StrPr6Icon,

  // Mastery — Muscles (14)
  mus_chest: MusChestIcon,
  mus_back: MusBackIcon,
  mus_shoulders: MusShouldersIcon,
  mus_biceps: MusBicepsIcon,
  mus_triceps: MusTricepsIcon,
  mus_quads: MusQuadsIcon,
  mus_hams: MusHamsIcon,
  mus_glutes: MusGlutesIcon,
  mus_calves: MusCalvesIcon,
  mus_abs: MusAbsIcon,
  mus_upper: MusUpperIcon,
  mus_lower: MusLowerIcon,
  mus_full: MusFullIcon,
  mus_balance: MusBalanceIcon,

  // Equipment (8)
  eq_dumbbell: EqDumbbellIcon,
  eq_barbell: EqBarbellIcon,
  eq_cable: EqCableIcon,
  eq_machine: EqMachineIcon,
  eq_bodyweight: EqBodyweightIcon,
  eq_kettlebell: EqKettlebellIcon,
  eq_arsenal: EqArsenalIcon,
  eq_minimalist: EqMinimalistIcon,

  // Explorer — Variety (6)
  var_cur: VarCurIcon,
  var_exp: VarExpIcon,
  var_adv: VarAdvIcon,
  var_enc: VarEncIcon,
  var_jack: VarJackIcon,
  var_cham: VarChamIcon,

  // Special (8)
  sp_early: SpEarlyIcon,
  sp_early_bird: SpEarlyBirdIcon,
  sp_night_owl: SpNightOwlIcon,
  sp_ironman: SpIronmanIcon,
  sp_marathon: SpMarathonIcon,
  sp_weekend: SpWeekendIcon,
  sp_newyear: SpNewyearIcon,
  sp_king: SpKingIcon,

  // Social (7)
  soc_friend1: SocFriend1Icon,
  soc_friend2: SocFriend2Icon,
  soc_friend3: SocFriend3Icon,
  soc_react1: SocReact1Icon,
  soc_react2: SocReact2Icon,
  soc_share: SocShareIcon,
  soc_inspire: SocInspireIcon,

  // Science (12)
  sci_rir_1: SciRir1Icon,
  sci_rir_2: SciRir2Icon,
  sci_zone_1: SciZone1Icon,
  sci_zone_2: SciZone2Icon,
  sci_deload: SciDeloadIcon,
  sci_freq: SciFreqIcon,
  sci_overload: SciOverloadIcon,
  sci_readiness: SciReadinessIcon,
  sci_feedback: SciFeedbackIcon,
  sci_intensity: SciIntensityIcon,
  sci_balanced: SciBalancedIcon,
  sci_program: SciProgramIcon,
};

/**
 * Get custom metallic icon for a badge ID.
 * Returns null if no custom icon exists (shouldn't happen — all 83 are covered).
 */
export function getBadgeIcon(badgeId: string): React.FC<BadgeIconProps> | null {
  return BADGE_ICON_MAP[badgeId] ?? null;
}
