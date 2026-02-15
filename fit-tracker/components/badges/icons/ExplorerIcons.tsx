import React from 'react';
import Svg, { Path, Circle, Rect, Line, Ellipse, Text as SvgText } from 'react-native-svg';
import type { BadgeIconProps } from './types';
import { MetallicDefs } from './primitives';

// ── var_cur — Curious: metallic magnifying glass with sparkle ──
export const VarCurIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={2} cy={19} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Handle */}
    <Path d="M6,8 L15,17" stroke="url(#ml)" strokeWidth={4} strokeLinecap="round" />
    <Path d="M6.5,8.5 L14,16" stroke={p.lightest} strokeWidth={0.8} opacity={0.3} />
    {/* Lens ring */}
    <Circle cx={-2} cy={0} r={12} fill="none" stroke="url(#ml)" strokeWidth={4} />
    <Circle cx={-2} cy={0} r={12} fill="none" stroke={p.lightest} strokeWidth={0.8} opacity={0.25} />
    {/* Lens glass */}
    <Circle cx={-2} cy={0} r={9.5} fill={p.mid} opacity={0.12} />
    {/* Glass reflection */}
    <Ellipse cx={-6} cy={-4} rx={4} ry={3} fill={p.lightest} opacity={0.3} />
    {/* Sparkle — discovery */}
    <Path d="M5,-10 L6,-7 L9,-6 L6,-5 L5,-2 L4,-5 L1,-6 L4,-7 Z" fill={p.lightest} opacity={0.7} />
  </Svg>
);

// ── var_exp — Explorer: metallic compass ──
export const VarExpIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={12} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Outer ring — thick metallic bezel */}
    <Circle cx={0} cy={0} r={16} fill="url(#m)" />
    <Circle cx={0} cy={0} r={13} fill={p.darkest} opacity={0.7} />
    {/* Inner ring */}
    <Circle cx={0} cy={0} r={12.5} fill="none" stroke={p.mid} strokeWidth={0.5} opacity={0.3} />
    {/* Cardinal marks */}
    <Line x1={0} y1={-12} x2={0} y2={-10} stroke={p.lightest} strokeWidth={1.5} opacity={0.6} />
    <Line x1={0} y1={10} x2={0} y2={12} stroke={p.mid} strokeWidth={1} opacity={0.3} />
    <Line x1={-12} y1={0} x2={-10} y2={0} stroke={p.mid} strokeWidth={1} opacity={0.3} />
    <Line x1={10} y1={0} x2={12} y2={0} stroke={p.mid} strokeWidth={1} opacity={0.3} />
    {/* Compass needle — north (red/light) */}
    <Path d="M0,-9 L2,0 L-2,0 Z" fill={p.lightest} opacity={0.85} />
    {/* Compass needle — south (dark) */}
    <Path d="M0,9 L2,0 L-2,0 Z" fill={p.mid} opacity={0.5} />
    {/* Center pivot */}
    <Circle cx={0} cy={0} r={2} fill="url(#ml)" />
    <Ellipse cx={-0.5} cy={-0.5} rx={0.8} ry={0.6} fill={p.lightest} opacity={0.7} />
    {/* Bezel specular */}
    <Ellipse cx={-7} cy={-11} rx={5} ry={3} fill={p.lightest} opacity={0.25} />
  </Svg>
);

// ── var_adv — Adventurer: metallic mountain peak with flag ──
export const VarAdvIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={14} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Back mountain */}
    <Path d="M-18,16 L-5,-8 L8,16 Z" fill={p.dark} opacity={0.5} />
    {/* Main mountain */}
    <Path d="M-14,16 L2,-14 L18,16 Z" fill="url(#ml)" />
    {/* Snow cap */}
    <Path d="M2,-14 L-3,-4 L-1,-6 L3,-4 L7,-4 Z" fill={p.lightest} opacity={0.5} />
    {/* Mountain face shadow */}
    <Path d="M2,-14 L10,4 L18,16 Z" fill={p.dark} opacity={0.25} />
    {/* Flag pole */}
    <Line x1={2} y1={-14} x2={2} y2={-20} stroke="url(#ml)" strokeWidth={1.5} strokeLinecap="round" />
    {/* Flag */}
    <Path d="M2,-20 L10,-17.5 L2,-15" fill={p.lightest} opacity={0.7} />
    <Path d="M2,-20 L10,-17.5 L2,-15" fill="none" stroke={p.mid} strokeWidth={0.5} opacity={0.3} />
    {/* Rock texture */}
    <Line x1={-4} y1={6} x2={0} y2={4} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
    <Line x1={5} y1={10} x2={9} y2={8} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
  </Svg>
);

// ── var_enc — Living Encyclopedia: metallic open book ──
export const VarEncIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={17} rx={13} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Left page */}
    <Path d="M-16,-12 L0,-8 L0,14 L-16,10 Z" fill="url(#ml)" />
    {/* Right page */}
    <Path d="M16,-12 L0,-8 L0,14 L16,10 Z" fill={p.mid} opacity={0.7} />
    {/* Spine */}
    <Line x1={0} y1={-8} x2={0} y2={14} stroke={p.dark} strokeWidth={2} />
    {/* Left page lines */}
    <Line x1={-13} y1={-5} x2={-3} y2={-3} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
    <Line x1={-13} y1={-1} x2={-3} y2={1} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
    <Line x1={-13} y1={3} x2={-3} y2={5} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
    <Line x1={-13} y1={7} x2={-3} y2={9} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
    {/* Right page lines */}
    <Line x1={3} y1={-3} x2={13} y2={-5} stroke={p.light} strokeWidth={0.5} opacity={0.15} />
    <Line x1={3} y1={1} x2={13} y2={-1} stroke={p.light} strokeWidth={0.5} opacity={0.15} />
    <Line x1={3} y1={5} x2={13} y2={3} stroke={p.light} strokeWidth={0.5} opacity={0.15} />
    {/* Cover edges */}
    <Path d="M-17,-13 L-1,-9 L-1,-7 L-15,-11 Z" fill={p.lightest} opacity={0.2} />
    {/* Page corner curl */}
    <Path d="M14,8 L16,10 L13,10 Z" fill={p.lightest} opacity={0.25} />
    {/* Glow sparkle — knowledge */}
    <Path d="M0,-15 L1,-12 L4,-11 L1,-10 L0,-7 L-1,-10 L-4,-11 L-1,-12 Z" fill={p.lightest} opacity={0.5} />
  </Svg>
);

// ── var_jack — Jack of All Trades: metallic Swiss army knife ──
export const VarJackIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={8} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Main body */}
    <Rect x={-5} y={-10} width={10} height={24} rx={4} fill="url(#m)" />
    {/* Body stripe */}
    <Line x1={0} y1={-8} x2={0} y2={12} stroke={p.dark} strokeWidth={0.5} opacity={0.4} />
    {/* Blade — top */}
    <Path d="M-3,-10 L-3,-18 L2,-18 L3,-16 L3,-10" fill="url(#ml)" />
    <Path d="M-2,-10 L-2,-17" stroke={p.lightest} strokeWidth={0.6} opacity={0.35} />
    {/* Screwdriver — right */}
    <Path d="M5,-4 L16,-8 L17,-6 L5,-2" fill="url(#ml)" />
    <Line x1={6} y1={-3.5} x2={15} y2={-7} stroke={p.lightest} strokeWidth={0.5} opacity={0.25} />
    {/* Bottle opener — left */}
    <Path d="M-5,0 L-14,-2 L-16,2 L-14,4 L-5,4" fill={p.mid} opacity={0.7} />
    <Circle cx={-13} cy={1} r={1.5} fill={p.dark} opacity={0.4} />
    {/* Scissors — bottom right */}
    <Path d="M5,6 L12,14" stroke="url(#ml)" strokeWidth={1.5} strokeLinecap="round" />
    <Path d="M5,8 L14,10" stroke={p.mid} strokeWidth={1.5} opacity={0.6} strokeLinecap="round" />
    {/* Pivot dots */}
    <Circle cx={0} cy={-10} r={1.5} fill="url(#ml)" />
    <Circle cx={0} cy={14} r={1.5} fill="url(#ml)" />
    {/* Body specular */}
    <Ellipse cx={-2} cy={-4} rx={2} ry={6} fill={p.lightest} opacity={0.25} />
  </Svg>
);

// ── var_cham — Chameleon: metallic morphing eye/prism ──
export const VarChamIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Outer diamond prism shape */}
    <Path d="M0,-18 L16,0 L0,18 L-16,0 Z" fill="url(#ml)" />
    {/* Facet lines — prismatic splits */}
    <Line x1={0} y1={-18} x2={-6} y2={6} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
    <Line x1={0} y1={-18} x2={6} y2={6} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
    <Line x1={-16} y1={0} x2={6} y2={6} stroke={p.lightest} strokeWidth={0.3} opacity={0.15} />
    <Line x1={16} y1={0} x2={-6} y2={6} stroke={p.lightest} strokeWidth={0.3} opacity={0.15} />
    {/* Inner facet planes */}
    <Path d="M0,-18 L-6,6 L0,18 Z" fill={p.light} opacity={0.15} />
    <Path d="M0,-18 L6,6 L16,0 Z" fill={p.dark} opacity={0.2} />
    {/* Center eye / iris */}
    <Circle cx={0} cy={0} r={5} fill={p.dark} opacity={0.5} />
    <Circle cx={0} cy={0} r={3.5} fill="url(#m)" />
    <Circle cx={0} cy={0} r={1.8} fill={p.darkest} opacity={0.7} />
    <Ellipse cx={-1} cy={-1} rx={1} ry={0.7} fill={p.lightest} opacity={0.8} />
    {/* Top specular */}
    <Ellipse cx={-4} cy={-10} rx={4} ry={3} fill={p.lightest} opacity={0.25} />
    {/* Spectral refraction accent */}
    <Path d="M-10,-5 L-8,-3 L-12,-1" fill="none" stroke={p.lightest} strokeWidth={0.8} opacity={0.3} strokeLinecap="round" />
  </Svg>
);
