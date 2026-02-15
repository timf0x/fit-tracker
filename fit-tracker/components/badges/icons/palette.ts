import type { MetallicPalette } from './types';

/**
 * 5-stop metallic palettes per tier.
 * Each palette simulates a real metallic material under a top-left light source.
 * darkest → lightest maps to shadow → specular highlight.
 */
export const TIER_PALETTES: Record<string, MetallicPalette> = {
  bronze: {
    darkest: '#2A1508',
    dark: '#6B3A1F',
    mid: '#CD7F32',
    light: '#E8C898',
    lightest: '#FFF5E0',
    glow: 'rgba(205,127,50,0.35)',
  },
  silver: {
    darkest: '#2A2A2A',
    dark: '#707070',
    mid: '#C0C0C0',
    light: '#E0E0E0',
    lightest: '#FFFFFF',
    glow: 'rgba(192,192,192,0.35)',
  },
  gold: {
    darkest: '#3A2800',
    dark: '#8B6914',
    mid: '#FFD700',
    light: '#FFE878',
    lightest: '#FFFFF0',
    glow: 'rgba(255,215,0,0.35)',
  },
  platinum: {
    darkest: '#303040',
    dark: '#707088',
    mid: '#D0D0E8',
    light: '#E8E8FF',
    lightest: '#FFFFFF',
    glow: 'rgba(200,200,255,0.4)',
  },
  locked: {
    darkest: '#08080A',
    dark: '#18181C',
    mid: '#3C3C46',
    light: '#4A4A55',
    lightest: '#5A5A65',
    glow: 'rgba(60,60,70,0)',
  },
};

/**
 * Compressed-range palettes for the engraved center glyph.
 * Each icon renders with its own MetallicDefs gradients, but the narrow range
 * makes it read as low-relief carving rather than a separate 3D object.
 *
 * Bronze/Silver: monochromatic relief (same metal family, compressed range).
 * Gold: silver-toned relief on gold base (true bimetallic like the Venus Rosewater Dish).
 * Platinum: near-white luminous relief.
 */
export const RELIEF_PALETTES: Record<string, MetallicPalette> = {
  bronze: {
    darkest: '#3D1E0C',
    dark: '#5A3018',
    mid: '#7A4828',
    light: '#906038',
    lightest: '#A87848',
    glow: 'rgba(120,72,40,0)',
  },
  silver: {
    darkest: '#808085',
    dark: '#959598',
    mid: '#ABABAE',
    light: '#C0C0C4',
    lightest: '#D5D5DA',
    glow: 'rgba(180,180,185,0)',
  },
  gold: {
    darkest: '#606068',
    dark: '#808088',
    mid: '#A0A0A8',
    light: '#B8B8C0',
    lightest: '#D0D0D8',
    glow: 'rgba(160,160,168,0)',
  },
  platinum: {
    darkest: '#B0B0C0',
    dark: '#C0C0D0',
    mid: '#D4D4E4',
    light: '#E4E4F0',
    lightest: '#F4F4FF',
    glow: 'rgba(220,220,255,0)',
  },
  locked: {
    darkest: '#2A2A30',
    dark: '#353540',
    mid: '#454550',
    light: '#505058',
    lightest: '#5A5A64',
    glow: 'rgba(0,0,0,0)',
  },
};

/**
 * Per-tier glow/shadow + specular configuration.
 * Controls native View shadow and the specular highlight on the smooth ring.
 */
export interface TierGlowConfig {
  /** Native shadowOpacity (0-1) */
  shadowOpacity: number;
  /** shadowRadius as fraction of badge size */
  shadowRadiusFrac: number;
  /** Specular ellipse opacity on the smooth ring (0-1) */
  specularOpacity: number;
}

export const TIER_GLOW_CONFIG: Record<string, TierGlowConfig> = {
  bronze: {
    shadowOpacity: 0.25,
    shadowRadiusFrac: 0.10,
    specularOpacity: 0.20,
  },
  silver: {
    shadowOpacity: 0.30,
    shadowRadiusFrac: 0.14,
    specularOpacity: 0.30,
  },
  gold: {
    shadowOpacity: 0.45,
    shadowRadiusFrac: 0.20,
    specularOpacity: 0.40,
  },
  platinum: {
    shadowOpacity: 0.55,
    shadowRadiusFrac: 0.28,
    specularOpacity: 0.50,
  },
  locked: {
    shadowOpacity: 0,
    shadowRadiusFrac: 0,
    specularOpacity: 0,
  },
};
