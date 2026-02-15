import React from 'react';
import Svg, { Path, Circle, Rect, Line, Ellipse, Defs, RadialGradient, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import type { BadgeIconProps } from './types';
import { MetallicDefs } from './primitives';

// ── vol_ton_1 — First Ton: heavy metallic coin with embossed "1T" ──
export const VolTon1Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={1} cy={16} rx={12} ry={3} fill={p.darkest} opacity={0.35} />
    {/* Coin edge (thickness) */}
    <Ellipse cx={0} cy={2} rx={14} ry={14} fill={p.dark} />
    {/* Coin face */}
    <Circle cx={0} cy={-1} r={14} fill="url(#m)" />
    {/* Inner ring emboss */}
    <Circle cx={0} cy={-1} r={10} fill="none" stroke={p.dark} strokeWidth={1.2} opacity={0.4} />
    <Circle cx={0} cy={-1} r={10} fill="none" stroke={p.lightest} strokeWidth={0.6} opacity={0.3} />
    {/* Embossed text */}
    <SvgText x={0} y={4} textAnchor="middle" fontSize={11} fontWeight="800" fill={p.dark} opacity={0.5} fontFamily="Plus Jakarta Sans">1T</SvgText>
    <SvgText x={-0.5} y={3.5} textAnchor="middle" fontSize={11} fontWeight="800" fill={p.lightest} opacity={0.4} fontFamily="Plus Jakarta Sans">1T</SvgText>
    {/* Specular */}
    <Ellipse cx={-5} cy={-8} rx={5} ry={3} fill={p.lightest} opacity={0.45} />
  </Svg>
);

// ── vol_ton_2 — Mover: stacked metallic crates ──
export const VolTon2Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={17} rx={14} ry={2.5} fill={p.darkest} opacity={0.3} />
    {/* Back crate */}
    <Rect x={-14} y={-4} width={12} height={12} rx={2} fill={p.dark} />
    <Rect x={-14} y={-5} width={12} height={12} rx={2} fill="url(#ml)" />
    <Ellipse cx={-10} cy={-3} rx={3} ry={1.5} fill={p.lightest} opacity={0.3} />
    {/* Middle crate */}
    <Rect x={-4} y={-10} width={12} height={12} rx={2} fill={p.dark} />
    <Rect x={-4} y={-11} width={12} height={12} rx={2} fill="url(#m)" />
    <Ellipse cx={0} cy={-9} rx={3} ry={1.5} fill={p.lightest} opacity={0.4} />
    {/* Front crate */}
    <Rect x={2} y={0} width={12} height={12} rx={2} fill={p.dark} />
    <Rect x={2} y={-1} width={12} height={12} rx={2} fill="url(#ml)" />
    <Ellipse cx={6} cy={1} rx={3} ry={1.5} fill={p.lightest} opacity={0.35} />
  </Svg>
);

// ── vol_ton_3 — Titan: metallic mountain peak ──
export const VolTon3Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={2} cy={16} rx={18} ry={2.5} fill={p.darkest} opacity={0.3} />
    {/* Mountain shadow side */}
    <Path d="M-18,15 L-2,-17 L2,-9 L8,-19 L22,15 Z" fill={p.dark} />
    {/* Mountain lit side */}
    <Path d="M-18,15 L-2,-17 L2,-9 L8,-19 L22,15 Z" fill="url(#ml)" />
    {/* Snow cap — specular on peak */}
    <Path d="M6,-19 L8,-14 L10,-11 L4,-11 L2,-9 L0,-11 Z" fill={p.lightest} opacity={0.7} />
    <Path d="M-2,-17 L0,-12 L-4,-10 Z" fill={p.lightest} opacity={0.5} />
    {/* Ridge line */}
    <Path d="M-2,-17 L2,-9 L8,-19" fill="none" stroke={p.lightest} strokeWidth={0.8} opacity={0.3} />
    {/* Ground line */}
    <Line x1={-18} y1={15} x2={22} y2={15} stroke={p.mid} strokeWidth={0.8} opacity={0.2} />
  </Svg>
);

// ── vol_ton_4 — Atlas: metallic globe sphere ──
export const VolTon4Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={1} cy={17} rx={10} ry={2.5} fill={p.darkest} opacity={0.35} />
    {/* Globe sphere */}
    <Circle cx={0} cy={0} r={15} fill="url(#m)" />
    {/* Grid lines (longitude) */}
    <Ellipse cx={0} cy={0} rx={15} ry={6} fill="none" stroke={p.dark} strokeWidth={0.8} opacity={0.3} />
    <Ellipse cx={0} cy={0} rx={6} ry={15} fill="none" stroke={p.dark} strokeWidth={0.8} opacity={0.3} rotation={25} origin="0, 0" />
    <Ellipse cx={0} cy={0} rx={6} ry={15} fill="none" stroke={p.dark} strokeWidth={0.8} opacity={0.3} rotation={-25} origin="0, 0" />
    {/* Equator highlight */}
    <Ellipse cx={0} cy={0} rx={15} ry={6} fill="none" stroke={p.lightest} strokeWidth={0.4} opacity={0.2} />
    {/* Specular */}
    <Ellipse cx={-5} cy={-6} rx={5} ry={3.5} fill={p.lightest} opacity={0.5} />
    <Ellipse cx={-3} cy={-8} rx={2} ry={1.2} fill={p.lightest} opacity={0.7} />
  </Svg>
);

// ── vol_ton_5 — Hercules: metallic lightning bolt ──
export const VolTon5Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={2} cy={22} rx={6} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Bolt shadow */}
    <Path d="M-2,-20 L-11,3 L-2,1 L-6,22 L16,-3 L6,-1 L10,-20 Z" fill={p.darkest} opacity={0.3} x={1.5} y={1.5} />
    {/* Bolt main body */}
    <Path d="M-2,-20 L-11,3 L-2,1 L-6,22 L16,-3 L6,-1 L10,-20 Z" fill="url(#ml)" />
    {/* Bolt lit face */}
    <Path d="M-2,-20 L10,-20 L6,-1 L16,-3 Z" fill={p.light} opacity={0.5} />
    {/* Specular on top */}
    <Ellipse cx={3} cy={-16} rx={4} ry={2} fill={p.lightest} opacity={0.55} />
    {/* Edge highlight */}
    <Path d="M-2,-20 L-11,3" stroke={p.lightest} strokeWidth={0.8} opacity={0.3} />
  </Svg>
);

// ── vol_ton_6 — Colossus: metallic classical column ──
export const VolTon6Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={20} rx={16} ry={2.5} fill={p.darkest} opacity={0.3} />
    {/* Column shaft */}
    <Rect x={-5} y={-14} width={10} height={30} rx={1} fill="url(#ml)" />
    {/* Flutes (column grooves) */}
    <Line x1={-2} y1={-14} x2={-2} y2={16} stroke={p.dark} strokeWidth={0.5} opacity={0.3} />
    <Line x1={2} y1={-14} x2={2} y2={16} stroke={p.dark} strokeWidth={0.5} opacity={0.3} />
    {/* Left highlight flute */}
    <Line x1={-3.5} y1={-14} x2={-3.5} y2={16} stroke={p.lightest} strokeWidth={0.5} opacity={0.15} />
    {/* Capital (top) */}
    <Rect x={-9} y={-18} width={18} height={5} rx={1.5} fill="url(#m)" />
    <Ellipse cx={-3} cy={-17} rx={3} ry={1.2} fill={p.lightest} opacity={0.4} />
    {/* Base */}
    <Rect x={-9} y={15} width={18} height={4} rx={1.5} fill="url(#m)" />
    {/* Side pillars */}
    <Rect x={-16} y={-14} width={4} height={30} rx={1} fill={p.mid} opacity={0.4} />
    <Rect x={12} y={-14} width={4} height={30} rx={1} fill={p.dark} opacity={0.4} />
  </Svg>
);

// ── vol_ton_7 — Legend: metallic crown ──
export const VolTon7Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={16} rx={14} ry={2.5} fill={p.darkest} opacity={0.3} />
    {/* Crown body */}
    <Path d="M-16,7 L-18,-9 L-8,-3 L0,-15 L8,-3 L18,-9 L16,7 Z" fill="url(#ml)" />
    {/* Crown band */}
    <Path d="M-16,7 L16,7 L14,13 L-14,13 Z" fill="url(#m)" />
    {/* Crown tip jewels */}
    <Circle cx={-18} cy={-9} r={3} fill="url(#m)" />
    <Ellipse cx={-19} cy={-10} rx={1.2} ry={0.8} fill={p.lightest} opacity={0.7} />
    <Circle cx={0} cy={-15} r={3.5} fill="url(#m)" />
    <Ellipse cx={-1} cy={-16} rx={1.5} ry={1} fill={p.lightest} opacity={0.8} />
    <Circle cx={18} cy={-9} r={3} fill="url(#m)" />
    <Ellipse cx={17} cy={-10} rx={1.2} ry={0.8} fill={p.lightest} opacity={0.6} />
    {/* Band gems */}
    <Circle cx={-7} cy={10} r={2} fill={p.lightest} opacity={0.4} />
    <Circle cx={0} cy={10} r={2} fill={p.lightest} opacity={0.45} />
    <Circle cx={7} cy={10} r={2} fill={p.lightest} opacity={0.4} />
    {/* Crown body specular */}
    <Path d="M-12,0 C-10,-4 -4,-6 0,-5" fill="none" stroke={p.lightest} strokeWidth={1} opacity={0.3} />
  </Svg>
);

// ── vol_ton_8 — Immortal: metallic starburst/supernova ──
export const VolTon8Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    {/* Glow aura */}
    <Circle cx={0} cy={-3} r={18} fill={p.glow} opacity={0.15} />
    {/* Rays */}
    <Path d="M-4,-10 L-12,-19 L-8,-10 Z" fill="url(#ml)" opacity={0.7} />
    <Path d="M4,-10 L12,-19 L8,-10 Z" fill="url(#ml)" opacity={0.7} />
    <Path d="M-7,0 L-17,-4 L-9,2 Z" fill={p.mid} opacity={0.55} />
    <Path d="M7,0 L17,-4 L9,2 Z" fill={p.mid} opacity={0.55} />
    <Path d="M-4,4 L-9,15 L-2,8 Z" fill={p.mid} opacity={0.45} />
    <Path d="M4,4 L9,15 L2,8 Z" fill={p.mid} opacity={0.45} />
    {/* Core sphere */}
    <Circle cx={0} cy={-3} r={7} fill="url(#m)" />
    {/* Inner core */}
    <Circle cx={0} cy={-3} r={3.5} fill={p.lightest} opacity={0.5} />
    {/* Specular */}
    <Ellipse cx={-2} cy={-6} rx={2.5} ry={1.5} fill={p.lightest} opacity={0.75} />
  </Svg>
);

// ── vol_ses_1 — First Step: metallic footprint ──
export const VolSes1Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={1} cy={19} rx={8} ry={2} fill={p.darkest} opacity={0.3} />
    {/* Foot pad */}
    <Ellipse cx={-1} cy={5} rx={9} ry={13} fill="url(#m)" rotation={-8} origin="-1, 5" />
    {/* Arch cutout (darker) */}
    <Ellipse cx={-1} cy={5} rx={5.5} ry={8.5} fill={p.dark} opacity={0.35} rotation={-8} origin="-1, 5" />
    {/* Toes */}
    <Circle cx={-10} cy={-10} r={3.5} fill="url(#m)" />
    <Ellipse cx={-11} cy={-11} rx={1.3} ry={0.9} fill={p.lightest} opacity={0.6} />
    <Circle cx={-13} cy={-3} r={3} fill="url(#m)" />
    <Circle cx={-14} cy={4} r={2.5} fill="url(#m)" />
    <Circle cx={-12} cy={10} r={2.2} fill="url(#m)" />
    {/* Specular on pad */}
    <Ellipse cx={-4} cy={-1} rx={3} ry={2} fill={p.lightest} opacity={0.4} />
  </Svg>
);

// ── vol_ses_2 — Regular: metallic progress ring with "10" ──
export const VolSes2Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    {/* Ring body */}
    <Circle cx={0} cy={0} r={14} fill="none" stroke={p.dark} strokeWidth={4} opacity={0.5} />
    {/* Progress arc — thick metallic */}
    <Path d="M0,-14 A14,14 0 0,1 14,0" fill="none" stroke="url(#ml)" strokeWidth={5} strokeLinecap="round" />
    {/* Arrow tip */}
    <Path d="M12,2 L16,-3 L13,5 Z" fill="url(#m)" />
    {/* Center sphere */}
    <Circle cx={0} cy={0} r={5} fill="url(#m)" />
    <Ellipse cx={-1.5} cy={-1.5} rx={2} ry={1.3} fill={p.lightest} opacity={0.5} />
    {/* Text */}
    <SvgText x={0} y={3} textAnchor="middle" fontSize={5.5} fontWeight="800" fill={p.darkest} opacity={0.6} fontFamily="Plus Jakarta Sans">10</SvgText>
  </Svg>
);

// ── vol_ses_3 — Dedicated: metallic calendar grid ──
export const VolSes3Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={1} cy={19} rx={12} ry={2} fill={p.darkest} opacity={0.3} />
    {/* Calendar body */}
    <Rect x={-14} y={-12} width={28} height={28} rx={4} fill="url(#ml)" />
    {/* Header bar */}
    <Rect x={-14} y={-12} width={28} height={9} rx={4} fill={p.mid} opacity={0.5} />
    <Line x1={-14} y1={-3} x2={14} y2={-3} stroke={p.dark} strokeWidth={0.8} opacity={0.4} />
    {/* Pins */}
    <Rect x={-7} y={-16} width={3} height={6} rx={1.5} fill="url(#m)" />
    <Rect x={4} y={-16} width={3} height={6} rx={1.5} fill="url(#m)" />
    {/* Date dots (metallic) */}
    <Circle cx={-5} cy={4} r={2.5} fill="url(#m)" />
    <Circle cx={5} cy={4} r={2.5} fill="url(#m)" />
    <Circle cx={-5} cy={11} r={2.5} fill={p.mid} opacity={0.4} />
    <Circle cx={5} cy={11} r={2.5} fill={p.mid} opacity={0.4} />
    {/* Specular */}
    <Ellipse cx={-8} cy={-10} rx={4} ry={2} fill={p.lightest} opacity={0.25} />
  </Svg>
);

// ── vol_ses_4 — Veteran: metallic medal on ribbon ──
export const VolSes4Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={8} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Ribbon */}
    <Path d="M-7,4 L-5,-16 L5,-16 L7,4" fill={p.mid} opacity={0.5} />
    <Path d="M-5,-16 L0,-12 L5,-16" fill={p.light} opacity={0.3} />
    {/* Medal body */}
    <Circle cx={0} cy={5} r={11} fill={p.dark} />
    <Circle cx={0} cy={4} r={11} fill="url(#m)" />
    {/* Inner ring */}
    <Circle cx={0} cy={4} r={7.5} fill="none" stroke={p.dark} strokeWidth={1} opacity={0.4} />
    {/* Star emboss */}
    <Path d="M0,-3 L1.5,1 L5.5,1 L2.5,3.5 L3.5,7.5 L0,5 L-3.5,7.5 L-2.5,3.5 L-5.5,1 L-1.5,1 Z" fill={p.lightest} opacity={0.45} />
    {/* Specular */}
    <Ellipse cx={-3.5} cy={-2} rx={4} ry={2.5} fill={p.lightest} opacity={0.5} />
  </Svg>
);

// ── vol_ses_5 — Centurion: metallic Roman helmet ──
export const VolSes5Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={12} ry={2} fill={p.darkest} opacity={0.3} />
    {/* Helmet dome */}
    <Path d="M-12,-10 L12,-10 L14,-4 L10,0 L-10,0 L-14,-4 Z" fill="url(#m)" />
    {/* Face guard */}
    <Rect x={-8} y={0} width={16} height={4} rx={0} fill="url(#ml)" />
    {/* Cheek guards */}
    <Path d="M-6,4 L-10,16 L10,16 L6,4 Z" fill="url(#ml)" />
    <Path d="M-6,4 L-10,16 L-4,16 L0,4 Z" fill={p.dark} opacity={0.3} />
    {/* Plume (crest) */}
    <Path d="M-4,-10 L0,-20 L4,-10 Z" fill={p.mid} opacity={0.7} />
    <Path d="M0,-20 L2,-10 L0,-12 Z" fill={p.lightest} opacity={0.35} />
    {/* Eye slit */}
    <Circle cx={0} cy={-5} r={2.5} fill={p.darkest} opacity={0.5} />
    {/* Specular */}
    <Ellipse cx={-6} cy={-8} rx={4} ry={2} fill={p.lightest} opacity={0.4} />
  </Svg>
);

// ── vol_ses_6 — Spartan: metallic crossed swords ──
export const VolSes6Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={20} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Sword 1 (left to right) */}
    <Path d="M-16,-16 L4,14 L6,12 L-14,-18 Z" fill="url(#ml)" />
    <Path d="M-16,-16 L-14,-18 L-10,-14 L-12,-12 Z" fill={p.lightest} opacity={0.4} />
    {/* Sword 2 (right to left) */}
    <Path d="M16,-16 L-4,14 L-6,12 L14,-18 Z" fill="url(#ml)" />
    <Path d="M16,-16 L14,-18 L10,-14 L12,-12 Z" fill={p.lightest} opacity={0.4} />
    {/* Cross guard 1 */}
    <Rect x={-10} y={-4} width={8} height={3} rx={1} fill="url(#m)" rotation={-40} origin="-6, -2.5" />
    {/* Cross guard 2 */}
    <Rect x={2} y={-4} width={8} height={3} rx={1} fill="url(#m)" rotation={40} origin="6, -2.5" />
    {/* Center gem */}
    <Circle cx={0} cy={-2} r={3.5} fill="url(#m)" />
    <Ellipse cx={-1} cy={-3} rx={1.5} ry={1} fill={p.lightest} opacity={0.65} />
  </Svg>
);
