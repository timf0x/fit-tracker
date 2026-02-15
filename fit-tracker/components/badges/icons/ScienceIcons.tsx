import React from 'react';
import Svg, { Path, Circle, Rect, Line, Ellipse, Text as SvgText } from 'react-native-svg';
import type { BadgeIconProps } from './types';
import { MetallicDefs } from './primitives';

// ── sci_rir_1 — RIR Logger: metallic gauge/meter with needle ──
export const SciRir1Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={16} rx={12} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Gauge body — half circle */}
    <Path d="M-16,8 A16,16 0 0,1 16,8 L14,14 L-14,14 Z" fill="url(#m)" />
    {/* Inner gauge face */}
    <Path d="M-12,8 A12,12 0 0,1 12,8" fill={p.darkest} opacity={0.5} />
    {/* Gauge scale marks */}
    <Line x1={-10} y1={4} x2={-8} y2={5} stroke={p.lightest} strokeWidth={1} opacity={0.4} strokeLinecap="round" />
    <Line x1={-6} y1={-2} x2={-5} y2={0} stroke={p.lightest} strokeWidth={1} opacity={0.4} strokeLinecap="round" />
    <Line x1={0} y1={-4} x2={0} y2={-2} stroke={p.lightest} strokeWidth={1} opacity={0.5} strokeLinecap="round" />
    <Line x1={6} y1={-2} x2={5} y2={0} stroke={p.lightest} strokeWidth={1} opacity={0.4} strokeLinecap="round" />
    <Line x1={10} y1={4} x2={8} y2={5} stroke={p.lightest} strokeWidth={1} opacity={0.4} strokeLinecap="round" />
    {/* Needle — pointing to mid-high (RIR ~2) */}
    <Line x1={0} y1={8} x2={4} y2={-1} stroke={p.lightest} strokeWidth={2} opacity={0.8} strokeLinecap="round" />
    {/* Needle pivot */}
    <Circle cx={0} cy={8} r={2.5} fill="url(#ml)" />
    <Ellipse cx={-0.5} cy={7.5} rx={1} ry={0.7} fill={p.lightest} opacity={0.6} />
    {/* RIR label */}
    <SvgText x={0} y={-8} textAnchor="middle" fontSize={5} fontWeight="700" fill={p.mid} opacity={0.5} fontFamily="Plus Jakarta Sans">RIR</SvgText>
    {/* Bezel specular */}
    <Ellipse cx={-8} cy={4} rx={4} ry={2} fill={p.lightest} opacity={0.2} />
  </Svg>
);

// ── sci_rir_2 — Effort Master: metallic heartbeat/EKG line ──
export const SciRir2Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={16} rx={12} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Monitor frame */}
    <Rect x={-16} y={-12} width={32} height={24} rx={4} fill="url(#ml)" />
    <Rect x={-14} y={-10} width={28} height={20} rx={3} fill={p.darkest} opacity={0.6} />
    {/* EKG line — dramatic heartbeat */}
    <Path d="M-12,2 L-6,2 L-4,-2 L-2,2 L0,-8 L2,8 L4,-4 L6,2 L12,2" fill="none" stroke="url(#ml)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    {/* Grid lines on screen */}
    <Line x1={-12} y1={-4} x2={12} y2={-4} stroke={p.mid} strokeWidth={0.3} opacity={0.15} />
    <Line x1={-12} y1={0} x2={12} y2={0} stroke={p.mid} strokeWidth={0.3} opacity={0.15} />
    <Line x1={-12} y1={4} x2={12} y2={4} stroke={p.mid} strokeWidth={0.3} opacity={0.15} />
    {/* Signal highlight on peak */}
    <Circle cx={0} cy={-8} r={1.5} fill={p.lightest} opacity={0.35} />
    {/* Frame specular */}
    <Ellipse cx={-10} cy={-10} rx={4} ry={2} fill={p.lightest} opacity={0.2} />
  </Svg>
);

// ── sci_zone_1 — Zone Keeper: metallic target with zone rings ──
export const SciZone1Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={12} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Outer ring — MRV zone */}
    <Circle cx={0} cy={0} r={16} fill="url(#ml)" />
    <Circle cx={0} cy={0} r={14} fill={p.darkest} opacity={0.5} />
    {/* Middle ring — MAV zone */}
    <Circle cx={0} cy={0} r={11} fill="url(#ml)" opacity={0.7} />
    <Circle cx={0} cy={0} r={9} fill={p.darkest} opacity={0.5} />
    {/* Inner ring — MEV zone */}
    <Circle cx={0} cy={0} r={6} fill="url(#m)" opacity={0.8} />
    <Circle cx={0} cy={0} r={4} fill={p.darkest} opacity={0.4} />
    {/* Bullseye */}
    <Circle cx={0} cy={0} r={2} fill="url(#m)" />
    <Ellipse cx={-0.5} cy={-0.5} rx={0.8} ry={0.6} fill={p.lightest} opacity={0.7} />
    {/* Crosshair lines */}
    <Line x1={0} y1={-16} x2={0} y2={-6} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
    <Line x1={0} y1={6} x2={0} y2={16} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
    <Line x1={-16} y1={0} x2={-6} y2={0} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
    <Line x1={6} y1={0} x2={16} y2={0} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
    {/* Bezel specular */}
    <Ellipse cx={-7} cy={-10} rx={4} ry={2.5} fill={p.lightest} opacity={0.2} />
  </Svg>
);

// ── sci_zone_2 — Volume Architect: metallic ascending bar chart ──
export const SciZone2Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={14} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Base line */}
    <Line x1={-16} y1={14} x2={16} y2={14} stroke={p.mid} strokeWidth={1.5} opacity={0.4} />
    {/* Bar 1 — shortest */}
    <Rect x={-14} y={6} width={5} height={8} rx={1.5} fill={p.mid} opacity={0.5} />
    {/* Bar 2 */}
    <Rect x={-7} y={0} width={5} height={14} rx={1.5} fill="url(#ml)" opacity={0.7} />
    {/* Bar 3 — MAV sweet spot (highlighted) */}
    <Rect x={0} y={-6} width={5} height={20} rx={1.5} fill="url(#m)" />
    <Ellipse cx={2} cy={-3} rx={1.5} ry={2} fill={p.lightest} opacity={0.35} />
    {/* Bar 4 */}
    <Rect x={7} y={-2} width={5} height={16} rx={1.5} fill="url(#ml)" opacity={0.7} />
    {/* Zone bracket for best bar */}
    <Path d="M0,-8 L2.5,-10 L5,-8" fill="none" stroke={p.lightest} strokeWidth={1} opacity={0.5} strokeLinecap="round" />
    {/* Star accent above best bar */}
    <Path d="M2.5,-13 L3,-11 L5,-10.5 L3,-10 L2.5,-8" fill="none" stroke={p.lightest} strokeWidth={0.8} opacity={0.4} strokeLinecap="round" />
  </Svg>
);

// ── sci_deload — Deload Discipline: metallic shield with recovery arrow ──
export const SciDeloadIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={20} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Shield */}
    <Path d="M0,-16 L13,-8 L13,2 C13,12 7,18 0,20 C-7,18 -13,12 -13,2 L-13,-8 Z" fill="url(#m)" />
    {/* Inner field */}
    <Path d="M0,-12 L10,-6 L10,1 C10,9 5,14 0,16 C-5,14 -10,9 -10,1 L-10,-6 Z" fill={p.dark} opacity={0.35} />
    {/* Curved recovery arrow — pointing down then curving up */}
    <Path d="M-5,-4 L0,4 L5,-4" fill="none" stroke={p.lightest} strokeWidth={3} opacity={0.7} strokeLinecap="round" strokeLinejoin="round" />
    {/* Arrow head at bottom */}
    <Path d="M-3,2 L0,6 L3,2" fill="none" stroke={p.lightest} strokeWidth={2} opacity={0.5} strokeLinecap="round" strokeLinejoin="round" />
    {/* Rest/pause symbol — ZZz */}
    <SvgText x={8} y={-8} textAnchor="middle" fontSize={6} fontWeight="800" fill={p.lightest} opacity={0.35} fontFamily="Plus Jakarta Sans">z</SvgText>
    <SvgText x={11} y={-12} textAnchor="middle" fontSize={4} fontWeight="800" fill={p.lightest} opacity={0.25} fontFamily="Plus Jakarta Sans">z</SvgText>
    {/* Shield specular */}
    <Ellipse cx={-5} cy={-10} rx={4} ry={3} fill={p.lightest} opacity={0.25} />
  </Svg>
);

// ── sci_freq — Frequency Champion: metallic grid dots pattern ──
export const SciFreqIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={12} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Frame */}
    <Rect x={-16} y={-14} width={32} height={28} rx={4} fill="url(#ml)" />
    <Rect x={-14} y={-12} width={28} height={24} rx={3} fill={p.darkest} opacity={0.5} />
    {/* 7-column × 2-row grid of muscle frequency dots */}
    {/* Row 1 — all lit (2x/week) */}
    <Circle cx={-10} cy={-5} r={2} fill="url(#m)" />
    <Circle cx={-6} cy={-5} r={2} fill="url(#m)" />
    <Circle cx={-2} cy={-5} r={2} fill="url(#m)" />
    <Circle cx={2} cy={-5} r={2} fill="url(#m)" />
    <Circle cx={6} cy={-5} r={2} fill="url(#m)" />
    <Circle cx={10} cy={-5} r={2} fill="url(#m)" />
    {/* Row 2 — all lit */}
    <Circle cx={-10} cy={3} r={2} fill="url(#m)" />
    <Circle cx={-6} cy={3} r={2} fill="url(#m)" />
    <Circle cx={-2} cy={3} r={2} fill="url(#m)" />
    <Circle cx={2} cy={3} r={2} fill="url(#m)" />
    <Circle cx={6} cy={3} r={2} fill="url(#m)" />
    <Circle cx={10} cy={3} r={2} fill="url(#m)" />
    {/* Connecting vertical lines (frequency) */}
    <Line x1={-10} y1={-3} x2={-10} y2={1} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
    <Line x1={-2} y1={-3} x2={-2} y2={1} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
    <Line x1={6} y1={-3} x2={6} y2={1} stroke={p.lightest} strokeWidth={0.5} opacity={0.2} />
    {/* 2x label */}
    <SvgText x={0} y={10} textAnchor="middle" fontSize={5} fontWeight="700" fill={p.lightest} opacity={0.4} fontFamily="Plus Jakarta Sans">2x</SvgText>
    {/* Frame specular */}
    <Ellipse cx={-10} cy={-12} rx={4} ry={2} fill={p.lightest} opacity={0.15} />
  </Svg>
);

// ── sci_overload — Progressive Beast: metallic ascending staircase ──
export const SciOverloadIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={14} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Step 1 — lowest */}
    <Rect x={-14} y={8} width={8} height={6} rx={1} fill={p.mid} opacity={0.5} />
    {/* Step 2 */}
    <Rect x={-6} y={2} width={8} height={12} rx={1} fill="url(#ml)" opacity={0.7} />
    {/* Step 3 — highest (current) */}
    <Rect x={2} y={-4} width={8} height={18} rx={1} fill="url(#m)" />
    <Ellipse cx={5} cy={-2} rx={2} ry={3} fill={p.lightest} opacity={0.25} />
    {/* Arrow pointing up from top step */}
    <Path d="M6,-8 L6,-16 M3,-13 L6,-16 L9,-13" fill="none" stroke="url(#ml)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    {/* Weight plates on steps */}
    <Ellipse cx={-10} cy={7} rx={2.5} ry={1.5} fill={p.lightest} opacity={0.15} />
    <Ellipse cx={-2} cy={1} rx={2.5} ry={1.5} fill={p.lightest} opacity={0.2} />
    <Ellipse cx={6} cy={-5} rx={2.5} ry={1.5} fill={p.lightest} opacity={0.25} />
    {/* +2.5 text */}
    <SvgText x={-10} y={16} textAnchor="middle" fontSize={4} fontWeight="700" fill={p.mid} opacity={0.4} fontFamily="Plus Jakarta Sans">+2.5</SvgText>
  </Svg>
);

// ── sci_readiness — Recovery Scholar: metallic clipboard with check ──
export const SciReadinessIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Clipboard body */}
    <Rect x={-11} y={-10} width={22} height={26} rx={3} fill="url(#ml)" />
    {/* Clipboard face */}
    <Rect x={-9} y={-4} width={18} height={18} rx={2} fill={p.mid} opacity={0.25} />
    {/* Clip at top */}
    <Rect x={-4} y={-14} width={8} height={6} rx={2} fill="url(#m)" />
    <Rect x={-2} y={-16} width={4} height={3} rx={1.5} fill={p.lightest} opacity={0.4} />
    {/* Checkmark */}
    <Path d="M-4,4 L-1,9 L7,0" fill="none" stroke={p.lightest} strokeWidth={3} opacity={0.7} strokeLinecap="round" strokeLinejoin="round" />
    {/* Embossed check shadow */}
    <Path d="M-3.5,4.5 L-0.5,9.5 L7.5,0.5" fill="none" stroke={p.darkest} strokeWidth={1} opacity={0.15} strokeLinecap="round" strokeLinejoin="round" />
    {/* Specular */}
    <Ellipse cx={-6} cy={-8} rx={3} ry={2} fill={p.lightest} opacity={0.25} />
  </Svg>
);

// ── sci_feedback — The Scientist: metallic lab flask with bubbles ──
export const SciFeedbackIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Flask neck */}
    <Rect x={-3} y={-16} width={6} height={10} rx={2} fill="url(#ml)" />
    <Line x1={-2} y1={-15} x2={-2} y2={-7} stroke={p.lightest} strokeWidth={0.5} opacity={0.3} />
    {/* Flask body — conical */}
    <Path d="M-3,-6 L-12,14 C-12,17 12,17 12,14 L3,-6 Z" fill="url(#m)" />
    {/* Liquid level */}
    <Path d="M-8,6 L8,6 L12,14 C12,17 -12,17 -12,14 Z" fill={p.mid} opacity={0.3} />
    {/* Bubbles */}
    <Circle cx={-3} cy={8} r={1.5} fill={p.lightest} opacity={0.3} />
    <Circle cx={2} cy={4} r={1} fill={p.lightest} opacity={0.25} />
    <Circle cx={-1} cy={11} r={2} fill={p.lightest} opacity={0.2} />
    <Circle cx={4} cy={9} r={0.8} fill={p.lightest} opacity={0.35} />
    {/* Flask rim */}
    <Rect x={-5} y={-17} width={10} height={2} rx={1} fill="url(#m)" />
    {/* Specular on flask body */}
    <Ellipse cx={-6} cy={4} rx={3} ry={5} fill={p.lightest} opacity={0.2} />
    {/* Steam/vapor from top */}
    <Path d="M-1,-18 C-2,-20 1,-21 0,-23" fill="none" stroke={p.lightest} strokeWidth={0.8} opacity={0.2} strokeLinecap="round" />
    <Path d="M2,-18 C3,-20 0,-21 1,-23" fill="none" stroke={p.lightest} strokeWidth={0.6} opacity={0.15} strokeLinecap="round" />
  </Svg>
);

// ── sci_intensity — Mind-Muscle: metallic lightning bolt through muscle ──
export const SciIntensityIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Muscle fiber background — bicep silhouette */}
    <Path d="M-8,14 C-12,10 -14,2 -12,-4 C-10,-10 -6,-14 0,-14 C6,-14 10,-10 12,-4 C14,2 12,10 8,14 Z" fill={p.dark} opacity={0.35} />
    {/* Lightning bolt — main shape */}
    <Path d="M2,-16 L-4,-2 L2,-2 L-2,16 L8,0 L2,0 Z" fill="url(#m)" />
    {/* Lightning specular */}
    <Path d="M1,-14 L-2,-4 L1,-4" fill={p.lightest} opacity={0.4} />
    {/* Glow effect around bolt */}
    <Path d="M2,-16 L-4,-2 L2,-2 L-2,16 L8,0 L2,0 Z" fill="none" stroke={p.lightest} strokeWidth={1} opacity={0.15} />
    {/* Energy sparks */}
    <Circle cx={-6} cy={-6} r={1} fill={p.lightest} opacity={0.4} />
    <Circle cx={6} cy={4} r={0.8} fill={p.lightest} opacity={0.3} />
    <Path d="M-8,2 L-10,0 L-8,-2" fill="none" stroke={p.lightest} strokeWidth={0.8} opacity={0.3} strokeLinecap="round" />
  </Svg>
);

// ── sci_balanced — Balanced Week: metallic balance scale ──
export const SciBalancedIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={12} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Central pillar */}
    <Rect x={-1.5} y={-8} width={3} height={22} rx={1} fill="url(#ml)" />
    <Line x1={-0.5} y1={-6} x2={-0.5} y2={12} stroke={p.lightest} strokeWidth={0.5} opacity={0.25} />
    {/* Base */}
    <Rect x={-8} y={12} width={16} height={3} rx={1.5} fill="url(#m)" />
    {/* Beam */}
    <Rect x={-16} y={-10} width={32} height={3} rx={1.5} fill="url(#m)" />
    <Ellipse cx={-6} cy={-9.5} rx={6} ry={1} fill={p.lightest} opacity={0.25} />
    {/* Top ornament */}
    <Circle cx={0} cy={-12} r={2.5} fill="url(#m)" />
    <Ellipse cx={-0.7} cy={-12.7} rx={1} ry={0.7} fill={p.lightest} opacity={0.6} />
    {/* Left chain */}
    <Line x1={-14} y1={-8} x2={-14} y2={2} stroke="url(#ml)" strokeWidth={1.5} />
    <Line x1={-10} y1={-8} x2={-10} y2={2} stroke={p.mid} strokeWidth={1} opacity={0.5} />
    {/* Left plate */}
    <Path d="M-17,2 C-17,5 -7,5 -7,2 Z" fill="url(#m)" />
    <Ellipse cx={-12} cy={2} rx={5} ry={1.5} fill="url(#ml)" />
    {/* Right chain */}
    <Line x1={14} y1={-8} x2={14} y2={2} stroke={p.mid} strokeWidth={1.5} opacity={0.6} />
    <Line x1={10} y1={-8} x2={10} y2={2} stroke={p.mid} strokeWidth={1} opacity={0.4} />
    {/* Right plate */}
    <Path d="M7,2 C7,5 17,5 17,2 Z" fill={p.mid} opacity={0.7} />
    <Ellipse cx={12} cy={2} rx={5} ry={1.5} fill={p.mid} opacity={0.6} />
    <Ellipse cx={11} cy={1} rx={2} ry={0.8} fill={p.lightest} opacity={0.2} />
  </Svg>
);

// ── sci_program — Program Graduate: metallic graduation scroll/diploma ──
export const SciProgramIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Scroll body — rolled parchment */}
    <Rect x={-10} y={-10} width={20} height={24} rx={2} fill="url(#ml)" />
    {/* Top roll */}
    <Ellipse cx={0} cy={-10} rx={11} ry={3} fill="url(#m)" />
    <Ellipse cx={-3} cy={-11} rx={4} ry={1.2} fill={p.lightest} opacity={0.35} />
    {/* Bottom roll */}
    <Ellipse cx={0} cy={14} rx={11} ry={3} fill="url(#m)" />
    <Ellipse cx={-3} cy={13} rx={4} ry={1.2} fill={p.lightest} opacity={0.25} />
    {/* Text lines on scroll */}
    <Line x1={-6} y1={-4} x2={6} y2={-4} stroke={p.lightest} strokeWidth={0.8} opacity={0.2} />
    <Line x1={-6} y1={0} x2={6} y2={0} stroke={p.lightest} strokeWidth={0.8} opacity={0.2} />
    <Line x1={-6} y1={4} x2={6} y2={4} stroke={p.lightest} strokeWidth={0.8} opacity={0.2} />
    <Line x1={-4} y1={8} x2={4} y2={8} stroke={p.lightest} strokeWidth={0.8} opacity={0.15} />
    {/* Seal / ribbon at bottom */}
    <Circle cx={0} cy={10} r={3} fill="url(#m)" />
    <Ellipse cx={-0.8} cy={9.2} rx={1.2} ry={0.8} fill={p.lightest} opacity={0.5} />
    {/* Ribbon tails */}
    <Path d="M-2,12 L-4,18 L-1,15" fill={p.mid} opacity={0.5} />
    <Path d="M2,12 L4,18 L1,15" fill={p.mid} opacity={0.4} />
    {/* Star on seal */}
    <Path d="M0,9 L0.6,10 L1.8,10 L0.9,10.7 L1.2,11.8 L0,11.2 L-1.2,11.8 L-0.9,10.7 L-1.8,10 L-0.6,10 Z" fill={p.lightest} opacity={0.6} />
  </Svg>
);
