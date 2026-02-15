import React from 'react';
import Svg, { Path, Circle, Rect, Line, Ellipse, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import type { BadgeIconProps } from './types';
import { MetallicDefs } from './primitives';

// ── con_str_1 — Spark: tiny metallic flame droplet ──
export const ConStr1Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    {/* Drop shadow */}
    <Ellipse cx={1} cy={14} rx={6} ry={2} fill={p.darkest} opacity={0.35} />
    {/* Flame body */}
    <Path d="M0,12 C-5,5 -7,-3 -5,-9 C-3,-13 3,-13 5,-9 C7,-3 5,5 0,12 Z" fill="url(#m)" />
    {/* Inner core glow */}
    <Path d="M0,6 C-2,2 -3,-2 -1,-5 C1,-7 3,-5 3,-2 C3,1 1,4 0,6 Z" fill={p.lightest} opacity={0.45} />
    {/* Specular highlight */}
    <Ellipse cx={-2} cy={-6} rx={2} ry={1.5} fill={p.lightest} opacity={0.7} />
  </Svg>
);

// ── con_str_2 — Flame: medium metallic flame ──
export const ConStr2Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={1} cy={17} rx={7} ry={2} fill={p.darkest} opacity={0.3} />
    <Path d="M0,16 C-7,7 -11,-3 -9,-11 C-7,-17 -3,-19 0,-15 C3,-19 7,-17 9,-11 C11,-3 7,7 0,16 Z" fill="url(#m)" />
    <Path d="M0,10 C-4,3 -5,-3 -3,-8 C-1,-12 2,-9 2,-5 C4,-9 5,-4 3,2 Z" fill={p.light} opacity={0.4} />
    <Path d="M0,3 C-1,-1 0,-5 1,-3 C2,-1 1,1 0,3 Z" fill={p.lightest} opacity={0.55} />
    <Ellipse cx={-3} cy={-10} rx={2.5} ry={1.8} fill={p.lightest} opacity={0.6} />
  </Svg>
);

// ── con_str_3 — Blaze: multi-tongue metallic fire ──
export const ConStr3Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={1} cy={19} rx={9} ry={2.5} fill={p.darkest} opacity={0.3} />
    <Path d="M0,18 C-9,7 -15,-5 -13,-13 C-11,-19 -5,-19 -3,-13 C-1,-19 4,-21 6,-15 C10,-19 14,-15 12,-9 C10,0 4,11 0,18 Z" fill="url(#m)" />
    <Path d="M-2,12 C-7,3 -9,-4 -7,-11 C-5,-15 0,-13 0,-9 C2,-13 5,-11 5,-7 C7,-11 9,-7 7,-3 C5,4 0,9 -2,12 Z" fill={p.light} opacity={0.35} />
    <Ellipse cx={-4} cy={-12} rx={3} ry={2} fill={p.lightest} opacity={0.55} />
    <Ellipse cx={4} cy={-14} rx={2} ry={1.5} fill={p.lightest} opacity={0.4} />
  </Svg>
);

// ── con_str_4 — Inferno: large complex metallic inferno ──
export const ConStr4Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={1} cy={20} rx={11} ry={2.5} fill={p.darkest} opacity={0.3} />
    <Path d="M0,20 C-11,7 -19,-7 -17,-15 C-15,-21 -9,-19 -7,-13 C-5,-19 0,-23 2,-17 C4,-23 9,-21 11,-15 C15,-21 19,-17 17,-11 C15,-3 7,11 0,20 Z" fill="url(#m)" />
    <Path d="M-4,14 C-9,5 -13,-4 -11,-11 C-9,-15 -5,-13 -3,-9 C-1,-15 4,-13 4,-9 C6,-15 11,-11 9,-7 C7,0 1,9 -4,14 Z" fill={p.light} opacity={0.3} />
    <Path d="M0,8 C-2,3 -4,-2 -2,-7 C0,-9 2,-7 2,-5 C4,-9 4,-5 2,0 Z" fill={p.lightest} opacity={0.35} />
    <Ellipse cx={-6} cy={-14} rx={3} ry={2} fill={p.lightest} opacity={0.5} />
  </Svg>
);

// ── con_str_5 — Phoenix: metallic phoenix bird shape ──
export const ConStr5Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={20} rx={12} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Body */}
    <Path d="M-9,-9 C-7,-15 -3,-17 2,-15 L9,-13 L13,-5 L9,5 L3,11 L-4,9 L-11,3 L-13,-3 Z" fill="url(#m)" />
    {/* Right wing */}
    <Path d="M11,-1 L15,-5 L19,-3 L17,4 Z" fill="url(#ml)" />
    {/* Left wing */}
    <Path d="M-11,3 L-15,-1 L-19,1 L-17,7 Z" fill={p.mid} opacity={0.7} />
    {/* Tail */}
    <Path d="M-2,11 L-4,18 L0,15 L4,18 L2,11 Z" fill={p.mid} opacity={0.6} />
    {/* Eye highlight */}
    <Circle cx={0} cy={-3} r={2.5} fill={p.lightest} opacity={0.5} />
    <Circle cx={-0.5} cy={-3.5} r={1} fill={p.lightest} opacity={0.8} />
  </Svg>
);

// ── con_str_6 — Eternal: metallic infinity symbol ──
export const ConStr6Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={14} rx={14} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Infinity loop — thick metallic tube */}
    <Path d="M-15,0 C-15,-9 -9,-15 0,-15 C9,-15 15,-9 15,0 C15,9 9,15 0,15" fill="none" stroke="url(#ml)" strokeWidth={5} strokeLinecap="round" />
    <Path d="M0,15 C-9,15 -15,9 -15,0" fill="none" stroke={p.mid} strokeWidth={5} opacity={0.6} strokeLinecap="round" strokeDasharray="4 3" />
    {/* Top specular along tube */}
    <Path d="M-12,-3 C-10,-12 -2,-14 4,-12" fill="none" stroke={p.lightest} strokeWidth={1.5} opacity={0.6} strokeLinecap="round" />
    {/* Center ornament */}
    <Circle cx={0} cy={-18} r={2} fill="url(#m)" />
    <Ellipse cx={-0.5} cy={-18.5} rx={0.8} ry={0.6} fill={p.lightest} opacity={0.7} />
    {/* Infinity text */}
    <SvgText x={0} y={4} textAnchor="middle" fontSize={10} fontWeight="800" fill={p.lightest} opacity={0.65} fontFamily="Plus Jakarta Sans">{'\u221E'}</SvgText>
  </Svg>
);

// ── con_str_7 — Perfect Week: metallic calendar with embossed check ──
export const ConStr7Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={1} cy={17} rx={12} ry={2} fill={p.darkest} opacity={0.3} />
    {/* Calendar body */}
    <Rect x={-14} y={-10} width={28} height={24} rx={4} fill="url(#ml)" />
    {/* Calendar face — lighter inset */}
    <Rect x={-12} y={-2} width={24} height={14} rx={2} fill={p.mid} opacity={0.3} />
    {/* Top bar */}
    <Rect x={-14} y={-10} width={28} height={8} rx={4} fill={p.mid} opacity={0.5} />
    {/* Calendar pins */}
    <Rect x={-7} y={-14} width={3} height={6} rx={1.5} fill="url(#m)" />
    <Rect x={4} y={-14} width={3} height={6} rx={1.5} fill="url(#m)" />
    {/* Embossed checkmark */}
    <Path d="M-6,6 L-2,11 L8,2" stroke={p.lightest} strokeWidth={3} opacity={0.85} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Path d="M-5.5,6.5 L-1.5,11.5 L8.5,2.5" stroke={p.darkest} strokeWidth={1} opacity={0.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Specular */}
    <Ellipse cx={-8} cy={-8} rx={4} ry={2} fill={p.lightest} opacity={0.3} />
  </Svg>
);

// ── con_str_8 — Perfect Month: metallic calendar with gem stars ──
export const ConStr8Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={1} cy={17} rx={12} ry={2} fill={p.darkest} opacity={0.3} />
    {/* Calendar body */}
    <Rect x={-14} y={-10} width={28} height={24} rx={4} fill="url(#ml)" />
    <Rect x={-12} y={-2} width={24} height={14} rx={2} fill={p.mid} opacity={0.3} />
    <Rect x={-14} y={-10} width={28} height={8} rx={4} fill={p.mid} opacity={0.5} />
    {/* Calendar pins */}
    <Rect x={-7} y={-14} width={3} height={6} rx={1.5} fill="url(#m)" />
    <Rect x={4} y={-14} width={3} height={6} rx={1.5} fill="url(#m)" />
    {/* Gem stars — two metallic sphere gems */}
    <Circle cx={-5} cy={6} r={4} fill="url(#m)" />
    <Ellipse cx={-6} cy={4.5} rx={1.5} ry={1} fill={p.lightest} opacity={0.7} />
    <Circle cx={5} cy={6} r={4} fill="url(#m)" />
    <Ellipse cx={4} cy={4.5} rx={1.5} ry={1} fill={p.lightest} opacity={0.7} />
    {/* Star accent */}
    <Path d="M11,-7 L12.5,-4 L11,-1 L9.5,-4 Z" fill={p.lightest} opacity={0.6} />
    {/* Specular on body */}
    <Ellipse cx={-8} cy={-8} rx={4} ry={2} fill={p.lightest} opacity={0.25} />
  </Svg>
);
