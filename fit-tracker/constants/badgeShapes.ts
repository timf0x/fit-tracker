/**
 * SVG path data for badge shapes, laurel wreaths, and decorative elements.
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

// ── Decorative Elements ──

/** Laurel wreath left branch (normalized 0-100, placed around center icon) */
export const LAUREL_LEFT_PATH =
  'M30 70 Q25 60 28 50 Q30 42 26 35 M28 50 Q22 48 20 44 M28 55 Q21 54 18 50 M28 60 Q22 60 19 56 M28 44 Q23 40 22 36 M28 38 Q25 32 25 28';

/** Laurel wreath right branch (mirrored) */
export const LAUREL_RIGHT_PATH =
  'M70 70 Q75 60 72 50 Q70 42 74 35 M72 50 Q78 48 80 44 M72 55 Q79 54 82 50 M72 60 Q78 60 81 56 M72 44 Q77 40 78 36 M72 38 Q75 32 75 28';

/** Radiating lines for platinum tier (8 lines from center outward) */
export function getRadiatingLines(cx: number, cy: number, innerR: number, outerR: number): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    lines.push({
      x1: cx + Math.cos(angle) * innerR,
      y1: cy + Math.sin(angle) * innerR,
      x2: cx + Math.cos(angle) * outerR,
      y2: cy + Math.sin(angle) * outerR,
    });
  }
  return lines;
}

/** Corner dots for silver tier (4 dots at corners of shape) */
export function getCornerDots(cx: number, cy: number, radius: number): Array<{ x: number; y: number }> {
  return [
    { x: cx, y: cy - radius },
    { x: cx + radius, y: cy },
    { x: cx, y: cy + radius },
    { x: cx - radius, y: cy },
  ];
}

/** Particle dots for platinum tier (12 dots scattered around) */
export function getParticleDots(cx: number, cy: number, radius: number): Array<{ x: number; y: number; size: number }> {
  const dots: Array<{ x: number; y: number; size: number }> = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + Math.PI / 6;
    const r = radius * (0.85 + (i % 3) * 0.1);
    dots.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      size: i % 3 === 0 ? 2 : 1.2,
    });
  }
  return dots;
}
