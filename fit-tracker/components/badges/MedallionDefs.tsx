import React from 'react';
import {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import type { MetallicPalette } from './icons/types';

/**
 * Shared gradient definitions for the dish-anatomy badge frame.
 * All IDs prefixed `med_` to avoid collision with icon gradients (`m`, `ml`, `ms`).
 *
 * Drop inside the BadgeIcon <Svg> to get access to:
 *   fill="url(#med_body)"    — 5-stop radial metallic surface (the dish)
 *   stroke="url(#med_smooth)" — linear gradient for polished ring (strongest specular)
 *   fill="url(#med_recess)"  — darker radial for the center well
 *   fill="url(#med_spec)"    — tight specular hotspot for the smooth ring
 */
export const MedallionDefs: React.FC<{ p: MetallicPalette }> = ({ p }) => (
  <Defs>
    {/* BODY — main disc surface, 5-stop radial metallic */}
    <RadialGradient id="med_body" cx="0.38" cy="0.32" rx="0.68" ry="0.68">
      <Stop offset="0" stopColor={p.lightest} stopOpacity={0.82} />
      <Stop offset="0.22" stopColor={p.light} stopOpacity={0.75} />
      <Stop offset="0.50" stopColor={p.mid} stopOpacity={0.68} />
      <Stop offset="0.78" stopColor={p.dark} stopOpacity={0.75} />
      <Stop offset="1" stopColor={p.darkest} stopOpacity={0.82} />
    </RadialGradient>

    {/* SMOOTH — linear gradient for polished ring (clean sweep, max reflectivity) */}
    <LinearGradient id="med_smooth" x1="0.15" y1="0.10" x2="0.85" y2="0.90">
      <Stop offset="0" stopColor={p.lightest} stopOpacity={0.88} />
      <Stop offset="0.30" stopColor={p.light} stopOpacity={0.72} />
      <Stop offset="0.60" stopColor={p.mid} stopOpacity={0.65} />
      <Stop offset="1" stopColor={p.dark} stopOpacity={0.78} />
    </LinearGradient>

    {/* RECESS — darkened radial for center well (glyph sits here) */}
    <RadialGradient id="med_recess" cx="0.48" cy="0.45" rx="0.32" ry="0.32">
      <Stop offset="0" stopColor={p.darkest} stopOpacity={0.28} />
      <Stop offset="0.6" stopColor={p.dark} stopOpacity={0.10} />
      <Stop offset="1" stopColor={p.mid} stopOpacity={0} />
    </RadialGradient>

    {/* SPECULAR — tight radial hotspot for the smooth ring area */}
    <RadialGradient id="med_spec" cx="0.32" cy="0.25" rx="0.22" ry="0.12">
      <Stop offset="0" stopColor={p.lightest} stopOpacity={0.55} />
      <Stop offset="0.4" stopColor={p.lightest} stopOpacity={0.15} />
      <Stop offset="1" stopColor={p.lightest} stopOpacity={0} />
    </RadialGradient>
  </Defs>
);
