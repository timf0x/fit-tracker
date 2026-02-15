import React from 'react';
import Svg, { Path, Circle, Rect, Line, Ellipse } from 'react-native-svg';
import type { BadgeIconProps } from './types';
import { MetallicDefs } from './primitives';

// ── eq_dumbbell — Dumbbell Master: classic metallic dumbbell ──
export const EqDumbbellIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={16} rx={14} ry={2} fill={p.darkest} opacity={0.3} />
    {/* Left plate */}
    <Rect x={-17} y={-8} width={6} height={16} rx={2} fill="url(#m)" />
    <Rect x={-16} y={-6} width={1.5} height={12} rx={0.5} fill={p.lightest} opacity={0.3} />
    {/* Right plate */}
    <Rect x={11} y={-8} width={6} height={16} rx={2} fill="url(#ml)" />
    <Rect x={15} y={-6} width={1.5} height={12} rx={0.5} fill={p.lightest} opacity={0.2} />
    {/* Handle bar */}
    <Rect x={-11} y={-2.5} width={22} height={5} rx={2.5} fill="url(#m)" />
    {/* Grip texture */}
    <Line x1={-5} y1={-2} x2={-5} y2={2} stroke={p.dark} strokeWidth={0.8} opacity={0.4} />
    <Line x1={-2} y1={-2} x2={-2} y2={2} stroke={p.dark} strokeWidth={0.8} opacity={0.4} />
    <Line x1={1} y1={-2} x2={1} y2={2} stroke={p.dark} strokeWidth={0.8} opacity={0.4} />
    <Line x1={4} y1={-2} x2={4} y2={2} stroke={p.dark} strokeWidth={0.8} opacity={0.4} />
    {/* Specular on handle */}
    <Ellipse cx={-3} cy={-1.5} rx={5} ry={1} fill={p.lightest} opacity={0.5} />
    {/* Specular on left plate */}
    <Ellipse cx={-15} cy={-5} rx={2} ry={3} fill={p.lightest} opacity={0.35} />
  </Svg>
);

// ── eq_barbell — Barbell King: metallic barbell with plates ──
export const EqBarbellIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={16} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Bar */}
    <Rect x={-20} y={-1.5} width={40} height={3} rx={1.5} fill="url(#ml)" />
    <Line x1={-18} y1={-1} x2={18} y2={-1} stroke={p.lightest} strokeWidth={0.6} opacity={0.3} />
    {/* Left outer plate */}
    <Rect x={-19} y={-10} width={4} height={20} rx={1.5} fill="url(#m)" />
    {/* Left inner plate */}
    <Rect x={-14} y={-7} width={3} height={14} rx={1} fill="url(#m)" />
    {/* Right outer plate */}
    <Rect x={15} y={-10} width={4} height={20} rx={1.5} fill={p.mid} opacity={0.8} />
    {/* Right inner plate */}
    <Rect x={11} y={-7} width={3} height={14} rx={1} fill={p.mid} opacity={0.7} />
    {/* Collars */}
    <Rect x={-10} y={-3} width={2} height={6} rx={1} fill={p.light} opacity={0.5} />
    <Rect x={8} y={-3} width={2} height={6} rx={1} fill={p.light} opacity={0.4} />
    {/* Specular on left plate */}
    <Ellipse cx={-18} cy={-6} rx={1.5} ry={4} fill={p.lightest} opacity={0.4} />
    {/* Crown accent for "King" */}
    <Path d="M-5,-15 L-3,-11 L0,-14 L3,-11 L5,-15" fill="none" stroke={p.lightest} strokeWidth={1.5} opacity={0.3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── eq_cable — Cable Expert: metallic pulley with cable ──
export const EqCableIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={8} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Top mount bar */}
    <Rect x={-8} y={-18} width={16} height={3} rx={1.5} fill="url(#ml)" />
    {/* Pulley wheel */}
    <Circle cx={0} cy={-12} r={5} fill="url(#m)" />
    <Circle cx={0} cy={-12} r={3} fill={p.dark} opacity={0.5} />
    <Circle cx={0} cy={-12} r={1.5} fill="url(#ml)" />
    <Ellipse cx={-1.5} cy={-13.5} rx={1.5} ry={1} fill={p.lightest} opacity={0.5} />
    {/* Cable line */}
    <Path d="M-3,-8 L-3,6 L0,10 L3,6 L3,-8" fill="none" stroke="url(#ml)" strokeWidth={2} strokeLinecap="round" />
    {/* Handle grip */}
    <Rect x={-6} y={10} width={12} height={4} rx={2} fill="url(#m)" />
    <Ellipse cx={-2} cy={11} rx={3} ry={1} fill={p.lightest} opacity={0.35} />
    {/* Cable highlight */}
    <Line x1={-2.5} y1={-7} x2={-2.5} y2={5} stroke={p.lightest} strokeWidth={0.5} opacity={0.3} />
  </Svg>
);

// ── eq_machine — Machine Dominator: metallic gear mechanism ──
export const EqMachineIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Large gear */}
    <Circle cx={-2} cy={-2} r={12} fill="url(#m)" />
    <Circle cx={-2} cy={-2} r={8.5} fill={p.dark} opacity={0.4} />
    <Circle cx={-2} cy={-2} r={4} fill="url(#ml)" />
    {/* Gear teeth */}
    <Path d="M-2,-16 L-4,-14 L0,-14 Z" fill="url(#ml)" />
    <Path d="M-2,12 L-4,10 L0,10 Z" fill={p.mid} opacity={0.6} />
    <Path d="M-14,-2 L-12,-4 L-12,0 Z" fill="url(#ml)" />
    <Path d="M10,-2 L8,-4 L8,0 Z" fill={p.mid} opacity={0.6} />
    <Path d="M-12,-10 L-10,-10 L-12,-8 Z" fill="url(#ml)" />
    <Path d="M8,6 L6,6 L8,4 Z" fill={p.mid} opacity={0.6} />
    <Path d="M8,-10 L6,-10 L8,-8 Z" fill={p.mid} opacity={0.5} />
    <Path d="M-12,6 L-10,6 L-12,4 Z" fill="url(#ml)" />
    {/* Small gear */}
    <Circle cx={10} cy={10} r={6} fill="url(#m)" />
    <Circle cx={10} cy={10} r={4} fill={p.dark} opacity={0.4} />
    <Circle cx={10} cy={10} r={2} fill="url(#ml)" />
    {/* Specular on large gear */}
    <Ellipse cx={-6} cy={-7} rx={4} ry={3} fill={p.lightest} opacity={0.35} />
    {/* Specular on small gear */}
    <Ellipse cx={8.5} cy={8} rx={2} ry={1.5} fill={p.lightest} opacity={0.3} />
  </Svg>
);

// ── eq_bodyweight — Bodyweight Warrior: metallic human figure ──
export const EqBodyweightIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={20} rx={8} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Head */}
    <Circle cx={0} cy={-13} r={5} fill="url(#m)" />
    <Ellipse cx={-1.5} cy={-14.5} rx={2} ry={1.5} fill={p.lightest} opacity={0.5} />
    {/* Torso */}
    <Path d="M-6,-7 L6,-7 L5,5 L-5,5 Z" fill="url(#ml)" />
    {/* Arms spread wide — warrior pose */}
    <Path d="M-6,-6 L-14,-2 L-16,2" fill="none" stroke="url(#ml)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6,-6 L14,-2 L16,2" fill="none" stroke={p.mid} strokeWidth={3} opacity={0.7} strokeLinecap="round" strokeLinejoin="round" />
    {/* Legs — wide stance */}
    <Path d="M-4,5 L-7,16" fill="none" stroke="url(#ml)" strokeWidth={3.5} strokeLinecap="round" />
    <Path d="M4,5 L7,16" fill="none" stroke={p.mid} strokeWidth={3.5} opacity={0.7} strokeLinecap="round" />
    {/* Torso specular */}
    <Path d="M-4,-6 L-3,3" stroke={p.lightest} strokeWidth={0.8} opacity={0.3} />
  </Svg>
);

// ── eq_kettlebell — Kettlebell Master: metallic kettlebell ──
export const EqKettlebellIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={9} ry={2} fill={p.darkest} opacity={0.3} />
    {/* Handle */}
    <Path d="M-6,-14 C-6,-20 6,-20 6,-14" fill="none" stroke="url(#ml)" strokeWidth={4} strokeLinecap="round" />
    <Path d="M-5.5,-14 C-5.5,-19 5.5,-19 5.5,-14" fill="none" stroke={p.lightest} strokeWidth={0.8} opacity={0.35} />
    {/* Body — spherical */}
    <Circle cx={0} cy={4} r={14} fill="url(#m)" />
    {/* Flat base */}
    <Ellipse cx={0} cy={16} rx={8} ry={2.5} fill={p.dark} opacity={0.5} />
    {/* Specular highlight */}
    <Ellipse cx={-5} cy={-4} rx={5} ry={4} fill={p.lightest} opacity={0.4} />
    {/* Secondary specular */}
    <Ellipse cx={3} cy={8} rx={3} ry={2} fill={p.lightest} opacity={0.15} />
    {/* Weight number emboss */}
    <Circle cx={0} cy={3} r={4} fill={p.dark} opacity={0.25} />
    <Circle cx={0} cy={3} r={3.5} fill="none" stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
  </Svg>
);

// ── eq_arsenal — Full Arsenal: metallic crate with equipment ──
export const EqArsenalIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={12} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Crate body */}
    <Path d="M-14,0 L-12,16 L12,16 L14,0 Z" fill="url(#ml)" />
    <Rect x={-14} y={-2} width={28} height={4} rx={1} fill="url(#m)" />
    {/* Crate wood lines */}
    <Line x1={-12} y1={5} x2={12} y2={5} stroke={p.dark} strokeWidth={0.5} opacity={0.3} />
    <Line x1={-12} y1={10} x2={12} y2={10} stroke={p.dark} strokeWidth={0.5} opacity={0.3} />
    {/* Dumbbell sticking out */}
    <Rect x={-10} y={-12} width={3} height={10} rx={1} fill="url(#m)" />
    <Rect x={-9} y={-14} width={1} height={2} rx={0.5} fill={p.light} />
    <Rect x={-9} y={-2} width={1} height={1} rx={0.5} fill={p.light} />
    {/* Barbell sticking out */}
    <Rect x={-2} y={-10} width={2} height={8} rx={1} fill="url(#ml)" />
    <Rect x={-4} y={-12} width={6} height={3} rx={1} fill="url(#m)" />
    {/* Kettlebell handle */}
    <Path d="M6,-10 C6,-14 12,-14 12,-10" fill="none" stroke="url(#ml)" strokeWidth={2} strokeLinecap="round" />
    <Circle cx={9} cy={-6} r={3.5} fill="url(#m)" />
    <Ellipse cx={7.5} cy={-7.5} rx={1.2} ry={1} fill={p.lightest} opacity={0.4} />
    {/* Crate specular */}
    <Ellipse cx={-8} cy={8} rx={4} ry={3} fill={p.lightest} opacity={0.15} />
    {/* Rim highlight */}
    <Line x1={-13} y1={-1} x2={5} y2={-1} stroke={p.lightest} strokeWidth={0.6} opacity={0.4} />
  </Svg>
);

// ── eq_minimalist — Minimalist: zen stone stack ──
export const EqMinimalistIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={10} ry={2} fill={p.darkest} opacity={0.3} />
    {/* Bottom stone — large */}
    <Ellipse cx={0} cy={12} rx={12} ry={5} fill="url(#m)" />
    <Ellipse cx={-3} cy={10} rx={5} ry={2} fill={p.lightest} opacity={0.25} />
    {/* Middle stone — medium */}
    <Ellipse cx={0} cy={3} rx={8} ry={4.5} fill="url(#ml)" />
    <Ellipse cx={-2} cy={1.5} rx={3.5} ry={1.5} fill={p.lightest} opacity={0.3} />
    {/* Top stone — small */}
    <Ellipse cx={0} cy={-5} rx={5} ry={3.5} fill="url(#m)" />
    <Ellipse cx={-1.5} cy={-6.5} rx={2} ry={1.2} fill={p.lightest} opacity={0.45} />
    {/* Tiny balance pebble on top */}
    <Circle cx={0} cy={-11} r={2.5} fill="url(#m)" />
    <Ellipse cx={-0.7} cy={-11.8} rx={1} ry={0.7} fill={p.lightest} opacity={0.55} />
  </Svg>
);
