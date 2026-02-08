/**
 * Body Map Hit Zones
 * Normalized bounding boxes (0-1) for muscle group touch detection.
 * Coordinates are relative to the rendered body SVG area.
 *
 * PRIORITY: Zones are checked in array order — first match wins.
 * For overlapping regions, the more specific/upper zone must come first.
 * e.g. chest must be before abs, glutes before hamstrings.
 */

import { RecoveryBodyPart } from '@/types';

export interface HitZone {
  bodyPart: RecoveryBodyPart;
  x: number;      // left edge (0-1)
  y: number;      // top edge (0-1)
  width: number;
  height: number;
}

function pointInZone(nx: number, ny: number, zone: HitZone): boolean {
  return (
    nx >= zone.x &&
    nx <= zone.x + zone.width &&
    ny >= zone.y &&
    ny <= zone.y + zone.height
  );
}

export function findHitZone(
  nx: number,
  ny: number,
  view: 'front' | 'back',
): RecoveryBodyPart | null {
  const zones = view === 'front' ? FRONT_HIT_ZONES : BACK_HIT_ZONES;
  for (const zone of zones) {
    if (pointInZone(nx, ny, zone)) {
      return zone.bodyPart;
    }
  }
  return null;
}

// ═══════ Front View ═══════
// Coordinates derived from react-native-body-highlighter SVG paths.
// ViewBox "0 0 724 1448" → normalized: nx = svgX/724, ny = svgY/1448.
// Body figure starts at ~Y:167 (head top) and ends at ~Y:1340 (feet).
// Priority order: arms → shoulders → chest → obliques → abs → legs
export const FRONT_HIT_ZONES: HitZone[] = [
  // 1. Forearms (outer arms, low — SVG X:53-207 left, 530-661 right, Y:500-700)
  { bodyPart: 'forearms',   x: 0.02, y: 0.34, width: 0.26, height: 0.15 }, // left
  { bodyPart: 'forearms',   x: 0.72, y: 0.34, width: 0.26, height: 0.15 }, // right

  // 2. Biceps (upper arms — SVG X:182-224 left, 506-546 right, Y:405-492)
  { bodyPart: 'biceps',     x: 0.18, y: 0.27, width: 0.16, height: 0.10 }, // left
  { bodyPart: 'biceps',     x: 0.66, y: 0.27, width: 0.16, height: 0.10 }, // right

  // 3. Shoulders / deltoids (SVG X:195-274 left, 450-550 right, Y:300-400)
  { bodyPart: 'shoulders',  x: 0.22, y: 0.19, width: 0.16, height: 0.10 }, // left
  { bodyPart: 'shoulders',  x: 0.62, y: 0.19, width: 0.16, height: 0.10 }, // right

  // 4. Chest — MUST be before abs (SVG X:260-470, Y:335-435)
  { bodyPart: 'chest',      x: 0.34, y: 0.22, width: 0.32, height: 0.10 },

  // 5. Obliques (flanking sides — SVG X:258-320 left, 420-470 right, Y:435-660)
  { bodyPart: 'obliques',   x: 0.30, y: 0.30, width: 0.12, height: 0.16 }, // left
  { bodyPart: 'obliques',   x: 0.58, y: 0.30, width: 0.12, height: 0.16 }, // right

  // 6. Abs (center torso — SVG X:310-420, Y:429-713)
  { bodyPart: 'abs',        x: 0.40, y: 0.29, width: 0.20, height: 0.17 },

  // 7. Calves (lower legs — SVG X:252-480, Y:973-1250)
  { bodyPart: 'calves',     x: 0.33, y: 0.67, width: 0.14, height: 0.19 }, // left
  { bodyPart: 'calves',     x: 0.54, y: 0.67, width: 0.14, height: 0.19 }, // right

  // 8. Quads (upper legs — SVG X:244-500, Y:647-946)
  { bodyPart: 'quads',      x: 0.28, y: 0.45, width: 0.44, height: 0.22 },
];

// ═══════ Back View ═══════
// Same SVG coordinate system — body outline is symmetrical front/back.
// Priority order: arms → shoulders → upper back → lower back → lats → glutes → legs
export const BACK_HIT_ZONES: HitZone[] = [
  // 1. Forearms
  { bodyPart: 'forearms',   x: 0.02, y: 0.34, width: 0.26, height: 0.15 }, // left
  { bodyPart: 'forearms',   x: 0.72, y: 0.34, width: 0.26, height: 0.15 }, // right

  // 2. Triceps (back of upper arms — same position as front biceps)
  { bodyPart: 'triceps',    x: 0.18, y: 0.27, width: 0.16, height: 0.10 }, // left
  { bodyPart: 'triceps',    x: 0.66, y: 0.27, width: 0.16, height: 0.10 }, // right

  // 3. Shoulders / rear delts
  { bodyPart: 'shoulders',  x: 0.22, y: 0.19, width: 0.16, height: 0.10 }, // left
  { bodyPart: 'shoulders',  x: 0.62, y: 0.19, width: 0.16, height: 0.10 }, // right

  // 4. Upper back / traps — MUST be before lats
  { bodyPart: 'upper back', x: 0.34, y: 0.21, width: 0.32, height: 0.08 },

  // 5. Lower back — before lats (center of back, below lats)
  { bodyPart: 'lower back', x: 0.36, y: 0.35, width: 0.28, height: 0.10 },

  // 6. Lats (mid back, wider — catch zone between upper back and lower back)
  { bodyPart: 'lats',       x: 0.28, y: 0.27, width: 0.44, height: 0.10 },

  // 7. Glutes — MUST be before hamstrings
  { bodyPart: 'glutes',     x: 0.30, y: 0.44, width: 0.40, height: 0.12 },

  // 8. Calves (lower legs)
  { bodyPart: 'calves',     x: 0.33, y: 0.67, width: 0.14, height: 0.19 }, // left
  { bodyPart: 'calves',     x: 0.54, y: 0.67, width: 0.14, height: 0.19 }, // right

  // 9. Hamstrings (back of thighs — below glutes, large catch-all)
  { bodyPart: 'hamstrings', x: 0.28, y: 0.55, width: 0.44, height: 0.14 },
];
