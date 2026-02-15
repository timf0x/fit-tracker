import React from 'react';
import Svg, { Path, Circle, Rect, Line, Ellipse } from 'react-native-svg';
import type { BadgeIconProps } from './types';
import { MetallicDefs } from './primitives';

// ── soc_friend1 — Sociable: metallic handshake ──
export const SocFriend1Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={16} rx={12} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Left hand */}
    <Path d="M-16,2 L-10,-2 L-6,0 L-2,0 L2,-2" fill="none" stroke="url(#ml)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    {/* Right hand */}
    <Path d="M16,2 L10,-2 L6,0 L2,0 L-2,-2" fill="none" stroke={p.mid} strokeWidth={4} opacity={0.7} strokeLinecap="round" strokeLinejoin="round" />
    {/* Clasped center */}
    <Circle cx={0} cy={-1} r={3} fill="url(#m)" />
    <Ellipse cx={-0.8} cy={-1.8} rx={1.2} ry={0.8} fill={p.lightest} opacity={0.5} />
    {/* Left sleeve */}
    <Rect x={-18} y={-2} width={6} height={8} rx={2} fill="url(#ml)" />
    {/* Right sleeve */}
    <Rect x={12} y={-2} width={6} height={8} rx={2} fill={p.mid} opacity={0.6} />
    {/* Sparkle */}
    <Path d="M0,-10 L1,-7 L4,-6 L1,-5 L0,-2" fill="none" stroke={p.lightest} strokeWidth={0.8} opacity={0.4} strokeLinecap="round" />
  </Svg>
);

// ── soc_friend2 — Popular: two connected metallic figures ──
export const SocFriend2Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={12} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Left figure head */}
    <Circle cx={-7} cy={-8} r={4.5} fill="url(#m)" />
    <Ellipse cx={-8.5} cy={-9.5} rx={1.5} ry={1} fill={p.lightest} opacity={0.5} />
    {/* Left figure body */}
    <Path d="M-12,0 L-7,-2 L-2,0 L-3,14 L-11,14 Z" fill="url(#ml)" />
    {/* Right figure head */}
    <Circle cx={7} cy={-8} r={4.5} fill="url(#m)" />
    <Ellipse cx={5.5} cy={-9.5} rx={1.5} ry={1} fill={p.lightest} opacity={0.4} />
    {/* Right figure body */}
    <Path d="M2,0 L7,-2 L12,0 L11,14 L3,14 Z" fill={p.mid} opacity={0.7} />
    {/* Connection arc */}
    <Path d="M-3,-4 C0,-8 0,-8 3,-4" fill="none" stroke={p.lightest} strokeWidth={1.5} opacity={0.3} strokeLinecap="round" />
    {/* Star between */}
    <Path d="M0,-14 L0.8,-12 L2.5,-12 L1.2,-10.8 L1.8,-9 L0,-10 L-1.8,-9 L-1.2,-10.8 L-2.5,-12 L-0.8,-12 Z" fill={p.lightest} opacity={0.45} />
  </Svg>
);

// ── soc_friend3 — Fitness Influencer: three figures with megaphone ──
export const SocFriend3Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={14} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Back left figure */}
    <Circle cx={-10} cy={-4} r={3.5} fill={p.mid} opacity={0.5} />
    <Path d="M-14,2 L-10,0 L-6,2 L-7,12 L-13,12 Z" fill={p.mid} opacity={0.4} />
    {/* Back right figure */}
    <Circle cx={10} cy={-4} r={3.5} fill={p.mid} opacity={0.5} />
    <Path d="M6,2 L10,0 L14,2 L13,12 L7,12 Z" fill={p.mid} opacity={0.4} />
    {/* Center figure — prominent */}
    <Circle cx={0} cy={-8} r={5} fill="url(#m)" />
    <Ellipse cx={-1.5} cy={-9.5} rx={2} ry={1.2} fill={p.lightest} opacity={0.5} />
    <Path d="M-5,-2 L0,-4 L5,-2 L4,14 L-4,14 Z" fill="url(#ml)" />
    {/* Megaphone from center figure */}
    <Path d="M5,-6 L12,-10 L14,-4 L7,-4 Z" fill="url(#ml)" />
    <Ellipse cx={13} cy={-7} rx={2} ry={3.5} fill={p.mid} opacity={0.3} />
    {/* Sound waves */}
    <Path d="M15,-9 C17,-7 17,-5 15,-3" fill="none" stroke={p.lightest} strokeWidth={1} opacity={0.3} strokeLinecap="round" />
    <Path d="M17,-10 C19.5,-7 19.5,-5 17,-2" fill="none" stroke={p.lightest} strokeWidth={0.8} opacity={0.2} strokeLinecap="round" />
  </Svg>
);

// ── soc_react1 — Encouraging: metallic thumbs up ──
export const SocReact1Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Thumb */}
    <Path d="M-2,-16 C-2,-18 2,-18 2,-14 L2,-4 L8,-4 C10,-4 12,-2 12,0 L10,12 L-4,12 L-4,-4 Z" fill="url(#m)" />
    {/* Fist base */}
    <Rect x={-12} y={-4} width={9} height={16} rx={2} fill="url(#ml)" />
    {/* Thumb specular */}
    <Ellipse cx={-1} cy={-12} rx={1.5} ry={2} fill={p.lightest} opacity={0.4} />
    {/* Palm specular */}
    <Ellipse cx={4} cy={2} rx={3} ry={4} fill={p.lightest} opacity={0.2} />
    {/* Finger lines */}
    <Line x1={2} y1={-2} x2={10} y2={-2} stroke={p.dark} strokeWidth={0.5} opacity={0.3} />
    <Line x1={2} y1={1} x2={10} y2={1} stroke={p.dark} strokeWidth={0.5} opacity={0.3} />
    <Line x1={2} y1={4} x2={10} y2={4} stroke={p.dark} strokeWidth={0.5} opacity={0.3} />
    {/* Fist specular */}
    <Ellipse cx={-9} cy={0} rx={2} ry={4} fill={p.lightest} opacity={0.25} />
  </Svg>
);

// ── soc_react2 — Supporter: metallic heart with glow ──
export const SocReact2Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Heart shape */}
    <Path d="M0,14 C-16,2 -16,-10 -8,-14 C-4,-16 0,-12 0,-8 C0,-12 4,-16 8,-14 C16,-10 16,2 0,14 Z" fill="url(#m)" />
    {/* Heart interior shading */}
    <Path d="M0,10 C-12,0 -12,-8 -6,-12 C-3,-14 0,-10 0,-6" fill={p.light} opacity={0.2} />
    {/* Specular on left lobe */}
    <Ellipse cx={-6} cy={-8} rx={3} ry={2.5} fill={p.lightest} opacity={0.5} />
    {/* Specular on right lobe */}
    <Ellipse cx={5} cy={-9} rx={2} ry={1.5} fill={p.lightest} opacity={0.3} />
    {/* Glow sparkle */}
    <Path d="M10,-12 L11,-9 L14,-8 L11,-7 L10,-4 L9,-7 L6,-8 L9,-9 Z" fill={p.lightest} opacity={0.5} />
  </Svg>
);

// ── soc_share — Sharer: metallic broadcast/share arrow ──
export const SocShareIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Top node */}
    <Circle cx={8} cy={-10} r={5} fill="url(#m)" />
    <Ellipse cx={6.5} cy={-11.5} rx={2} ry={1.3} fill={p.lightest} opacity={0.5} />
    {/* Middle left node */}
    <Circle cx={-8} cy={2} r={5} fill="url(#m)" />
    <Ellipse cx={-9.5} cy={0.5} rx={2} ry={1.3} fill={p.lightest} opacity={0.4} />
    {/* Bottom node */}
    <Circle cx={8} cy={14} r={5} fill="url(#m)" />
    <Ellipse cx={6.5} cy={12.5} rx={2} ry={1.3} fill={p.lightest} opacity={0.35} />
    {/* Connection lines */}
    <Line x1={-4} y1={0} x2={4} y2={-8} stroke="url(#ml)" strokeWidth={2} strokeLinecap="round" />
    <Line x1={-4} y1={4} x2={4} y2={12} stroke={p.mid} strokeWidth={2} opacity={0.6} strokeLinecap="round" />
  </Svg>
);

// ── soc_inspire — Inspiring: metallic heart with radiating lines ──
export const SocInspireIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Radiating lines */}
    <Line x1={0} y1={-18} x2={0} y2={-14} stroke={p.mid} strokeWidth={1.5} opacity={0.3} strokeLinecap="round" />
    <Line x1={-12} y1={-12} x2={-9} y2={-9} stroke={p.mid} strokeWidth={1.5} opacity={0.3} strokeLinecap="round" />
    <Line x1={12} y1={-12} x2={9} y2={-9} stroke={p.mid} strokeWidth={1.5} opacity={0.3} strokeLinecap="round" />
    <Line x1={-16} y1={0} x2={-13} y2={0} stroke={p.mid} strokeWidth={1.5} opacity={0.25} strokeLinecap="round" />
    <Line x1={16} y1={0} x2={13} y2={0} stroke={p.mid} strokeWidth={1.5} opacity={0.25} strokeLinecap="round" />
    {/* Heart — slightly smaller */}
    <Path d="M0,10 C-13,0 -13,-8 -7,-11 C-3,-13 0,-9 0,-6 C0,-9 3,-13 7,-11 C13,-8 13,0 0,10 Z" fill="url(#m)" />
    {/* Specular */}
    <Ellipse cx={-5} cy={-6} rx={2.5} ry={2} fill={p.lightest} opacity={0.45} />
    {/* Hands cupping (simplified) */}
    <Path d="M-10,6 C-8,10 -4,12 0,12" fill="none" stroke="url(#ml)" strokeWidth={2} strokeLinecap="round" />
    <Path d="M10,6 C8,10 4,12 0,12" fill="none" stroke={p.mid} strokeWidth={2} opacity={0.5} strokeLinecap="round" />
  </Svg>
);
