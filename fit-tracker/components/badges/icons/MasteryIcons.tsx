import React from 'react';
import Svg, { Path, Circle, Rect, Line, Ellipse } from 'react-native-svg';
import type { BadgeIconProps } from './types';
import { MetallicDefs } from './primitives';

// ── mus_chest — Metallic pectoral plate ──
export const MusChestIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={12} ry={2} fill={p.darkest} opacity={0.25} />
    <Path d="M-17,-4 C-17,-13 -9,-17 0,-13 C9,-17 17,-13 17,-4 C17,5 9,13 0,17 C-9,13 -17,5 -17,-4 Z" fill="url(#m)" />
    <Path d="M0,-13 L0,17" stroke={p.dark} strokeWidth={1.2} opacity={0.25} />
    <Path d="M-9,-9 C-7,-11 -3,-11 0,-9" fill="none" stroke={p.lightest} strokeWidth={1} opacity={0.3} />
    <Path d="M9,-9 C7,-11 3,-11 0,-9" fill="none" stroke={p.dark} strokeWidth={0.8} opacity={0.2} />
    <Ellipse cx={-7} cy={-8} rx={4} ry={3} fill={p.lightest} opacity={0.35} />
  </Svg>
);

// ── mus_back — Metallic V-taper back plate ──
export const MusBackIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    <Path d="M0,-17 L-11,-9 L-15,4 L-11,14 L-5,16 L0,12 L5,16 L11,14 L15,4 L11,-9 Z" fill="url(#m)" />
    <Path d="M0,-17 L0,12" stroke={p.dark} strokeWidth={1.5} opacity={0.2} />
    <Path d="M-7,-7 L-11,4" stroke={p.dark} strokeWidth={0.8} opacity={0.15} />
    <Path d="M7,-7 L11,4" stroke={p.dark} strokeWidth={0.8} opacity={0.15} />
    <Ellipse cx={-5} cy={-10} rx={4} ry={3} fill={p.lightest} opacity={0.35} />
  </Svg>
);

// ── mus_shoulders — Metallic deltoid caps ──
export const MusShouldersIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={12} ry={2} fill={p.darkest} opacity={0.25} />
    <Ellipse cx={-10} cy={-4} rx={9} ry={11} fill="url(#m)" rotation={12} origin="-10, -4" />
    <Ellipse cx={10} cy={-4} rx={9} ry={11} fill="url(#ml)" rotation={-12} origin="10, -4" />
    <Path d="M-5,5 L5,5 L3,17 L-3,17 Z" fill="url(#ml)" />
    <Ellipse cx={-12} cy={-8} rx={3} ry={2} fill={p.lightest} opacity={0.45} />
    <Ellipse cx={8} cy={-8} rx={2.5} ry={1.8} fill={p.lightest} opacity={0.3} />
  </Svg>
);

// ── mus_biceps — Metallic flexed arm ──
export const MusBicepsIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={1} cy={18} rx={8} ry={2} fill={p.darkest} opacity={0.25} />
    <Path d="M-5,16 L-5,4 C-5,-5 -9,-9 -9,-15 C-9,-19 -5,-19 -3,-15 L1,-5 C3,-1 7,-3 9,-7 C11,-11 13,-9 11,-5 L7,5 L5,16 Z" fill="url(#m)" />
    <Path d="M-3,-10 C-1,-6 3,-3 5,-1" fill="none" stroke={p.dark} strokeWidth={1.2} opacity={0.2} />
    <Ellipse cx={1} cy={-8} rx={4.5} ry={3} fill={p.lightest} opacity={0.2} />
    <Ellipse cx={-4} cy={-14} rx={2.5} ry={1.5} fill={p.lightest} opacity={0.45} />
  </Svg>
);

// ── mus_triceps — Metallic arm rear view ──
export const MusTricepsIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={-1} cy={18} rx={8} ry={2} fill={p.darkest} opacity={0.25} />
    <Path d="M5,16 L5,4 C5,-5 9,-9 9,-15 C9,-19 5,-19 3,-15 L-1,-5 C-3,-1 -7,-3 -9,-7 C-11,-11 -13,-9 -11,-5 L-7,5 L-5,16 Z" fill="url(#m)" />
    <Path d="M3,-10 C1,-6 -3,-3 -5,-1" fill="none" stroke={p.dark} strokeWidth={1.2} opacity={0.2} />
    <Ellipse cx={4} cy={-14} rx={2.5} ry={1.5} fill={p.lightest} opacity={0.45} />
  </Svg>
);

// ── mus_quads — Metallic thigh pair ──
export const MusQuadsIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={12} ry={2} fill={p.darkest} opacity={0.25} />
    <Path d="M-9,-16 L-13,16 L-2,16 L0,-4 L2,16 L13,16 L9,-16 Z" fill="url(#m)" />
    <Path d="M0,-4 L0,16" stroke={p.dark} strokeWidth={1} opacity={0.2} />
    <Path d="M-9,-16 L9,-16" stroke={p.lightest} strokeWidth={1.2} opacity={0.3} />
    <Ellipse cx={-5} cy={-10} rx={3} ry={2} fill={p.lightest} opacity={0.35} />
  </Svg>
);

// ── mus_hams — Metallic posterior thigh ──
export const MusHamsIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    <Path d="M-9,-16 L-13,8 C-13,14 -9,16 -5,16 L0,12 L5,16 C9,16 13,14 13,8 L9,-16 Z" fill="url(#m)" />
    <Path d="M0,-16 L0,12" stroke={p.dark} strokeWidth={1.2} opacity={0.2} />
    <Path d="M-7,-2 C-9,5 -9,11 -7,14" fill="none" stroke={p.dark} strokeWidth={0.8} opacity={0.15} />
    <Ellipse cx={-4} cy={-10} rx={3.5} ry={2} fill={p.lightest} opacity={0.35} />
  </Svg>
);

// ── mus_glutes — Metallic double sphere ──
export const MusGlutesIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={14} rx={14} ry={2} fill={p.darkest} opacity={0.25} />
    <Ellipse cx={-7} cy={0} rx={11} ry={13} fill="url(#m)" />
    <Ellipse cx={7} cy={0} rx={11} ry={13} fill="url(#ml)" />
    <Path d="M0,-13 L0,13" stroke={p.dark} strokeWidth={1.5} opacity={0.2} />
    <Ellipse cx={-10} cy={-5} rx={3} ry={2} fill={p.lightest} opacity={0.4} />
    <Ellipse cx={4} cy={-5} rx={2.5} ry={1.8} fill={p.lightest} opacity={0.25} />
  </Svg>
);

// ── mus_calves — Metallic calf muscle ──
export const MusCalvesIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={6} ry={2} fill={p.darkest} opacity={0.25} />
    <Path d="M-7,-16 L-9,-4 C-11,5 -9,13 -5,17 L5,17 C9,13 11,5 9,-4 L7,-16 Z" fill="url(#m)" />
    <Path d="M0,-16 L0,17" stroke={p.dark} strokeWidth={0.8} opacity={0.15} />
    <Path d="M-7,0 C-5,5 -3,9 -3,15" fill="none" stroke={p.dark} strokeWidth={0.8} opacity={0.2} />
    <Ellipse cx={-3} cy={-8} rx={3} ry={2} fill={p.lightest} opacity={0.4} />
  </Svg>
);

// ── mus_abs — Metallic six-pack plate ──
export const MusAbsIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Abs plate */}
    <Rect x={-11} y={-16} width={22} height={32} rx={5} fill="url(#ml)" />
    {/* Center line */}
    <Line x1={0} y1={-14} x2={0} y2={14} stroke={p.dark} strokeWidth={1.2} opacity={0.3} />
    {/* 6 metallic segments */}
    <Rect x={-9} y={-13} width={8} height={7} rx={2} fill="url(#m)" />
    <Rect x={1} y={-13} width={8} height={7} rx={2} fill="url(#m)" />
    <Rect x={-9} y={-4} width={8} height={7} rx={2} fill="url(#m)" />
    <Rect x={1} y={-4} width={8} height={7} rx={2} fill="url(#m)" />
    <Rect x={-9} y={5} width={8} height={7} rx={2} fill="url(#m)" />
    <Rect x={1} y={5} width={8} height={7} rx={2} fill="url(#m)" />
    {/* Specular on top segments */}
    <Ellipse cx={-6} cy={-11} rx={2.5} ry={1.5} fill={p.lightest} opacity={0.4} />
    <Ellipse cx={4} cy={-11} rx={2.5} ry={1.5} fill={p.lightest} opacity={0.35} />
  </Svg>
);

// ── mus_upper — Metallic upper body silhouette ──
export const MusUpperIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={14} ry={2} fill={p.darkest} opacity={0.25} />
    <Circle cx={0} cy={-14} r={6} fill="url(#m)" />
    <Ellipse cx={-2} cy={-16} rx={2} ry={1.5} fill={p.lightest} opacity={0.5} />
    <Path d="M-5,-9 L-13,-1 L-17,9 L-13,9 L-9,1 L-7,11 L-3,11 L-3,-7 Z" fill="url(#ml)" />
    <Path d="M5,-9 L13,-1 L17,9 L13,9 L9,1 L7,11 L3,11 L3,-7 Z" fill="url(#m)" />
    <Ellipse cx={-10} cy={2} rx={2} ry={1.5} fill={p.lightest} opacity={0.25} />
  </Svg>
);

// ── mus_lower — Metallic legs silhouette ──
export const MusLowerIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={12} ry={2} fill={p.darkest} opacity={0.25} />
    <Rect x={-7} y={-15} width={14} height={5} rx={2.5} fill="url(#m)" />
    <Path d="M-7,-10 L-9,5 L-13,17 L-9,17 L-5,7 L0,1 L5,7 L9,17 L13,17 L9,5 L7,-10 Z" fill="url(#ml)" />
    <Path d="M0,-10 L0,1" stroke={p.dark} strokeWidth={0.8} opacity={0.2} />
    <Ellipse cx={-5} cy={-4} rx={2} ry={1.5} fill={p.lightest} opacity={0.3} />
  </Svg>
);

// ── mus_full — Metallic full body figure ──
export const MusFullIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={8} ry={2} fill={p.darkest} opacity={0.25} />
    <Circle cx={0} cy={-14} r={5.5} fill="url(#m)" />
    <Ellipse cx={-1.5} cy={-15.5} rx={2} ry={1.3} fill={p.lightest} opacity={0.5} />
    <Rect x={-4} y={-9} width={8} height={14} rx={3} fill="url(#ml)" />
    <Path d="M-4,-7 L-13,1 L-11,3 L-4,-3" fill="url(#m)" />
    <Path d="M4,-7 L13,1 L11,3 L4,-3" fill={p.mid} opacity={0.6} />
    <Path d="M-3,5 L-7,17 L-3,17 L0,9" fill="url(#ml)" />
    <Path d="M3,5 L7,17 L3,17 L0,9" fill={p.mid} opacity={0.6} />
  </Svg>
);

// ── mus_balance — Metallic balance scale ──
export const MusBalanceIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Center pillar */}
    <Rect x={-2} y={-16} width={4} height={24} rx={2} fill="url(#ml)" />
    <Line x1={-1} y1={-16} x2={-1} y2={8} stroke={p.lightest} strokeWidth={0.6} opacity={0.25} />
    {/* Beam */}
    <Rect x={-17} y={-2} width={34} height={3} rx={1.5} fill="url(#m)" />
    <Line x1={-16} y1={-1.5} x2={16} y2={-1.5} stroke={p.lightest} strokeWidth={0.5} opacity={0.3} />
    {/* Top ornament */}
    <Circle cx={0} cy={-16} r={3} fill="url(#m)" />
    <Ellipse cx={-1} cy={-17} rx={1.2} ry={0.8} fill={p.lightest} opacity={0.6} />
    {/* Left pan */}
    <Path d="M-17,1 L-13,11 L-9,11 L-13,1" fill="url(#ml)" />
    <Line x1={-13} y1={11} x2={-9} y2={11} stroke={p.lightest} strokeWidth={1} opacity={0.4} />
    {/* Right pan */}
    <Path d="M17,1 L13,11 L9,11 L13,1" fill={p.mid} opacity={0.5} />
    <Line x1={9} y1={11} x2={13} y2={11} stroke={p.lightest} strokeWidth={1} opacity={0.3} />
    {/* Base */}
    <Rect x={-5} y={8} width={10} height={8} rx={2} fill="url(#m)" />
    <Ellipse cx={-2} cy={10} rx={2} ry={1} fill={p.lightest} opacity={0.25} />
  </Svg>
);
