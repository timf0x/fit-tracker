import React from 'react';
import {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import type { MetallicPalette } from './types';

/**
 * Shared metallic gradient definitions.
 * Drop inside any <Svg> to get access to:
 *   fill="url(#m)"    — radial metallic (spherical objects, top-left light)
 *   fill="url(#ml)"   — linear metallic (flat/cylindrical surfaces, diagonal light)
 *   fill="url(#ms)"   — subtle shadow gradient (for base/ground shadow)
 *
 * Each icon's <Svg> is isolated, so these IDs never collide across components.
 */
export const MetallicDefs: React.FC<{ p: MetallicPalette }> = ({ p }) => (
  <Defs>
    {/* Radial metallic — simulates sphere-like 3D surface */}
    <RadialGradient id="m" cx="0.35" cy="0.30" rx="0.65" ry="0.65">
      <Stop offset="0" stopColor={p.lightest} stopOpacity={0.95} />
      <Stop offset="0.25" stopColor={p.light} stopOpacity={0.9} />
      <Stop offset="0.55" stopColor={p.mid} />
      <Stop offset="0.85" stopColor={p.dark} />
      <Stop offset="1" stopColor={p.darkest} />
    </RadialGradient>

    {/* Linear metallic — diagonal light for flat/cylindrical objects */}
    <LinearGradient id="ml" x1="0" y1="0" x2="1" y2="1">
      <Stop offset="0" stopColor={p.light} />
      <Stop offset="0.4" stopColor={p.mid} />
      <Stop offset="0.8" stopColor={p.dark} />
      <Stop offset="1" stopColor={p.darkest} />
    </LinearGradient>

    {/* Shadow gradient — for ground/drop shadow under objects */}
    <RadialGradient id="ms" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
      <Stop offset="0" stopColor={p.darkest} stopOpacity={0.5} />
      <Stop offset="1" stopColor={p.darkest} stopOpacity={0} />
    </RadialGradient>
  </Defs>
);
