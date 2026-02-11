/**
 * SVG path data for badge shapes.
 * All paths are normalized to a 0-100 viewport and scaled at render time.
 */

// ── Base Shapes (normalized to 100x100 viewport, centered at 50,50) ──

/** Hexagon — Volume badges (strength, structure) */
export const HEXAGON_PATH =
  'M50 5 L93 27.5 L93 72.5 L50 95 L7 72.5 L7 27.5 Z';

/** Circle — Consistency badges (cycles, continuity) */
export const CIRCLE_PATH =
  'M50 5 A45 45 0 1 1 49.99 5 Z';

/** Shield — Strength badges (power, defense) */
export const SHIELD_PATH =
  'M50 5 L90 20 L90 55 Q90 80 50 95 Q10 80 10 55 L10 20 Z';

/** Diamond — Mastery badges (precision, rare) */
export const DIAMOND_PATH =
  'M50 2 L95 50 L50 98 L5 50 Z';

/** Octagon — Explorer badges (adventure, compass-like) */
export const OCTAGON_PATH =
  'M31.7 5 L68.3 5 L95 31.7 L95 68.3 L68.3 95 L31.7 95 L5 68.3 L5 31.7 Z';

/** Pentagon — Science badges (knowledge, elements) */
export const PENTAGON_PATH =
  'M50 5 L95 37 L77 92 L23 92 L5 37 Z';

/** Star (8-point) — Special badges (rare, celestial) */
export const STAR_PATH =
  'M50 2 L58 34 L90 18 L68 44 L98 50 L68 56 L90 82 L58 66 L50 98 L42 66 L10 82 L32 56 L2 50 L32 44 L10 18 L42 34 Z';

// ── Shape Map ──

export type BadgeShape = 'hexagon' | 'circle' | 'shield' | 'diamond' | 'octagon' | 'pentagon' | 'star';

export const SHAPE_PATHS: Record<BadgeShape, string> = {
  hexagon: HEXAGON_PATH,
  circle: CIRCLE_PATH,
  shield: SHIELD_PATH,
  diamond: DIAMOND_PATH,
  octagon: OCTAGON_PATH,
  pentagon: PENTAGON_PATH,
  star: STAR_PATH,
};

// ── Category → Shape mapping ──

export const CATEGORY_SHAPES: Record<string, BadgeShape> = {
  volume: 'hexagon',
  consistency: 'circle',
  strength: 'shield',
  mastery: 'diamond',
  explorer: 'octagon',
  science: 'pentagon',
  special: 'star',
};

// ── Tier Gradient Colors ──

export interface TierGradient {
  primary: string;
  secondary: string;
  glow: string;
}

export const TIER_GRADIENTS: Record<string, TierGradient> = {
  bronze: { primary: '#CD7F32', secondary: '#8B5E2A', glow: '#CD7F32' },
  silver: { primary: '#C0C0C0', secondary: '#808080', glow: '#C0C0C0' },
  gold: { primary: '#FFD700', secondary: '#B8860B', glow: '#FFD700' },
  platinum: { primary: '#E5E4E2', secondary: '#B8B8C0', glow: '#E5E4E2' },
};
