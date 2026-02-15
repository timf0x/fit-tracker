import React from 'react';
import Svg, { Path, Circle, Rect, Line, Ellipse, Text as SvgText } from 'react-native-svg';
import type { BadgeIconProps } from './types';
import { MetallicDefs } from './primitives';

// ── sp_early — Early Adopter: metallic rising sun emblem ──
export const SpEarlyIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={14} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Horizon line */}
    <Rect x={-18} y={4} width={36} height={12} rx={2} fill={p.dark} opacity={0.3} />
    {/* Sun half-disc */}
    <Path d="M-12,4 A12,12 0 0,1 12,4 Z" fill="url(#m)" />
    {/* Rays */}
    <Line x1={0} y1={-14} x2={0} y2={-8} stroke="url(#ml)" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={-10} y1={-10} x2={-7} y2={-6} stroke={p.mid} strokeWidth={2} opacity={0.6} strokeLinecap="round" />
    <Line x1={10} y1={-10} x2={7} y2={-6} stroke="url(#ml)" strokeWidth={2} strokeLinecap="round" />
    <Line x1={-15} y1={-2} x2={-13} y2={0} stroke={p.mid} strokeWidth={1.5} opacity={0.5} strokeLinecap="round" />
    <Line x1={15} y1={-2} x2={13} y2={0} stroke={p.mid} strokeWidth={1.5} opacity={0.5} strokeLinecap="round" />
    {/* Sun specular */}
    <Ellipse cx={-3} cy={-1} rx={4} ry={2.5} fill={p.lightest} opacity={0.45} />
    {/* Reflection on ground */}
    <Ellipse cx={0} cy={10} rx={6} ry={2} fill={p.lightest} opacity={0.1} />
  </Svg>
);

// ── sp_early_bird — Early Bird: metallic bird with sunrise ──
export const SpEarlyBirdIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Small sunrise in background */}
    <Path d="M-10,10 A8,8 0 0,1 10,10" fill={p.mid} opacity={0.2} />
    <Line x1={0} y1={0} x2={0} y2={4} stroke={p.mid} strokeWidth={1} opacity={0.2} />
    {/* Bird body */}
    <Ellipse cx={0} cy={2} rx={7} ry={5} fill="url(#m)" />
    {/* Right wing — spread */}
    <Path d="M5,0 L16,-8 L18,-2 L8,2 Z" fill="url(#ml)" />
    <Path d="M6,-0.5 L15,-7" stroke={p.lightest} strokeWidth={0.5} opacity={0.3} />
    {/* Left wing — spread */}
    <Path d="M-5,0 L-16,-8 L-18,-2 L-8,2 Z" fill={p.mid} opacity={0.7} />
    {/* Head */}
    <Circle cx={0} cy={-6} r={4.5} fill="url(#m)" />
    <Ellipse cx={-1.5} cy={-7.5} rx={1.5} ry={1} fill={p.lightest} opacity={0.55} />
    {/* Beak */}
    <Path d="M3,-6 L8,-5 L3,-4 Z" fill={p.lightest} opacity={0.7} />
    {/* Eye */}
    <Circle cx={1} cy={-7} r={1} fill={p.darkest} opacity={0.7} />
    <Ellipse cx={0.7} cy={-7.3} rx={0.4} ry={0.3} fill={p.lightest} opacity={0.6} />
    {/* Tail */}
    <Path d="M-4,6 L-8,14 L-2,10 L2,14 L0,6" fill={p.mid} opacity={0.5} />
  </Svg>
);

// ── sp_night_owl — Night Owl: metallic owl face with moon ──
export const SpNightOwlIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Small crescent moon */}
    <Path d="M12,-16 A5,5 0 1,0 12,-6 A3.5,3.5 0 1,1 12,-16 Z" fill={p.lightest} opacity={0.4} />
    {/* Owl head — large rounded shape */}
    <Path d="M-14,0 C-14,-10 -8,-16 0,-16 C8,-16 14,-10 14,0 C14,8 8,14 0,14 C-8,14 -14,8 -14,0 Z" fill="url(#m)" />
    {/* Ear tufts */}
    <Path d="M-10,-14 L-8,-20 L-6,-14" fill="url(#ml)" />
    <Path d="M6,-14 L8,-20 L10,-14" fill={p.mid} opacity={0.7} />
    {/* Left eye socket */}
    <Circle cx={-5} cy={-2} r={5.5} fill={p.dark} opacity={0.5} />
    <Circle cx={-5} cy={-2} r={4} fill={p.lightest} opacity={0.35} />
    <Circle cx={-5} cy={-2} r={2} fill={p.darkest} opacity={0.8} />
    <Ellipse cx={-5.8} cy={-2.8} rx={0.8} ry={0.6} fill={p.lightest} opacity={0.8} />
    {/* Right eye socket */}
    <Circle cx={5} cy={-2} r={5.5} fill={p.dark} opacity={0.5} />
    <Circle cx={5} cy={-2} r={4} fill={p.lightest} opacity={0.3} />
    <Circle cx={5} cy={-2} r={2} fill={p.darkest} opacity={0.8} />
    <Ellipse cx={4.2} cy={-2.8} rx={0.8} ry={0.6} fill={p.lightest} opacity={0.7} />
    {/* Beak */}
    <Path d="M-2,3 L0,7 L2,3 Z" fill={p.mid} opacity={0.6} />
    {/* Head specular */}
    <Ellipse cx={-6} cy={-12} rx={4} ry={2.5} fill={p.lightest} opacity={0.2} />
  </Svg>
);

// ── sp_ironman — Iron Man/Woman: metallic armored helmet ──
export const SpIronmanIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={10} ry={2} fill={p.darkest} opacity={0.3} />
    {/* Helmet outer shell */}
    <Path d="M-12,4 C-12,-8 -8,-16 0,-18 C8,-16 12,-8 12,4 L8,14 L-8,14 Z" fill="url(#m)" />
    {/* Visor slit */}
    <Path d="M-8,0 L0,-2 L8,0 L6,4 L-6,4 Z" fill={p.darkest} opacity={0.7} />
    {/* Visor glow */}
    <Ellipse cx={0} cy={1} rx={5} ry={1.5} fill={p.lightest} opacity={0.25} />
    {/* Center ridge */}
    <Line x1={0} y1={-18} x2={0} y2={-3} stroke={p.lightest} strokeWidth={1.5} opacity={0.3} />
    {/* Chin guard */}
    <Path d="M-6,6 L0,12 L6,6" fill="none" stroke={p.mid} strokeWidth={1.5} opacity={0.4} />
    {/* Side panels */}
    <Path d="M-10,-4 L-12,4 L-8,8" fill="none" stroke={p.dark} strokeWidth={0.8} opacity={0.3} />
    <Path d="M10,-4 L12,4 L8,8" fill="none" stroke={p.dark} strokeWidth={0.8} opacity={0.3} />
    {/* Specular */}
    <Ellipse cx={-5} cy={-12} rx={4} ry={3} fill={p.lightest} opacity={0.4} />
    {/* Cheek accent */}
    <Ellipse cx={-7} cy={5} rx={2} ry={3} fill={p.lightest} opacity={0.15} />
  </Svg>
);

// ── sp_marathon — Marathoner: metallic stopwatch ──
export const SpMarathonIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={20} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Crown button */}
    <Rect x={-2} y={-19} width={4} height={4} rx={1.5} fill="url(#ml)" />
    {/* Side button */}
    <Rect x={10} y={-10} width={4} height={3} rx={1} fill="url(#ml)" />
    {/* Watch body */}
    <Circle cx={0} cy={2} r={15} fill="url(#m)" />
    <Circle cx={0} cy={2} r={12.5} fill={p.darkest} opacity={0.6} />
    <Circle cx={0} cy={2} r={12} fill="none" stroke={p.mid} strokeWidth={0.5} opacity={0.4} />
    {/* Hour marks */}
    <Line x1={0} y1={-9} x2={0} y2={-7} stroke={p.lightest} strokeWidth={1} opacity={0.5} />
    <Line x1={0} y1={11} x2={0} y2={13} stroke={p.mid} strokeWidth={1} opacity={0.3} />
    <Line x1={-10} y1={2} x2={-8} y2={2} stroke={p.mid} strokeWidth={1} opacity={0.3} />
    <Line x1={8} y1={2} x2={10} y2={2} stroke={p.mid} strokeWidth={1} opacity={0.3} />
    {/* Stopwatch hand — pointing at 2h mark */}
    <Line x1={0} y1={2} x2={6} y2={-5} stroke={p.lightest} strokeWidth={1.5} opacity={0.8} strokeLinecap="round" />
    {/* Center dot */}
    <Circle cx={0} cy={2} r={1.5} fill="url(#ml)" />
    {/* Text "2h" */}
    <SvgText x={0} y={8} textAnchor="middle" fontSize={5} fontWeight="700" fill={p.mid} opacity={0.5} fontFamily="Plus Jakarta Sans">2h</SvgText>
    {/* Bezel specular */}
    <Ellipse cx={-6} cy={-8} rx={5} ry={3} fill={p.lightest} opacity={0.2} />
  </Svg>
);

// ── sp_weekend — Weekend Warrior: metallic shield with 'S' marks ──
export const SpWeekendIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={20} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Shield shape */}
    <Path d="M0,-18 L14,-10 L14,2 C14,12 8,18 0,20 C-8,18 -14,12 -14,2 L-14,-10 Z" fill="url(#m)" />
    {/* Inner field */}
    <Path d="M0,-14 L11,-8 L11,1 C11,9 6,14 0,16 C-6,14 -11,9 -11,1 L-11,-8 Z" fill={p.dark} opacity={0.35} />
    {/* S + S for Sat/Sun */}
    <SvgText x={-5} y={4} textAnchor="middle" fontSize={10} fontWeight="800" fill={p.lightest} opacity={0.6} fontFamily="Plus Jakarta Sans">S</SvgText>
    <SvgText x={5} y={4} textAnchor="middle" fontSize={10} fontWeight="800" fill={p.lightest} opacity={0.4} fontFamily="Plus Jakarta Sans">S</SvgText>
    {/* Divider */}
    <Line x1={0} y1={-6} x2={0} y2={12} stroke={p.lightest} strokeWidth={0.8} opacity={0.2} />
    {/* Specular */}
    <Ellipse cx={-6} cy={-12} rx={4} ry={2.5} fill={p.lightest} opacity={0.3} />
  </Svg>
);

// ── sp_newyear — New Year New Me: metallic champagne bottle ──
export const SpNewyearIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={20} rx={7} ry={2} fill={p.darkest} opacity={0.3} />
    {/* Bottle body */}
    <Path d="M-5,18 L-5,2 L-3,-4 L-2,-10 L2,-10 L3,-4 L5,2 L5,18 Z" fill="url(#ml)" />
    {/* Bottle neck */}
    <Rect x={-2} y={-16} width={4} height={7} rx={1.5} fill="url(#m)" />
    {/* Cork top */}
    <Rect x={-1.5} y={-19} width={3} height={4} rx={1} fill={p.light} opacity={0.6} />
    {/* Label */}
    <Rect x={-4} y={4} width={8} height={8} rx={1} fill={p.lightest} opacity={0.2} />
    <Line x1={-2} y1={7} x2={2} y2={7} stroke={p.lightest} strokeWidth={0.5} opacity={0.3} />
    <Line x1={-2} y1={9} x2={2} y2={9} stroke={p.lightest} strokeWidth={0.5} opacity={0.3} />
    {/* Foil wrap at neck */}
    <Rect x={-2.5} y={-11} width={5} height={2} rx={0.5} fill={p.lightest} opacity={0.4} />
    {/* Sparkle confetti */}
    <Path d="M-10,-14 L-9,-11 L-7,-12 L-9,-13 Z" fill={p.lightest} opacity={0.5} />
    <Path d="M8,-16 L9,-13 L11,-14 L9,-15 Z" fill={p.lightest} opacity={0.4} />
    <Circle cx={-7} cy={-18} r={1} fill={p.mid} opacity={0.4} />
    <Circle cx={10} cy={-10} r={0.8} fill={p.mid} opacity={0.3} />
    <Path d="M12,-18 L13,-16 L14,-18 L13,-20 Z" fill={p.lightest} opacity={0.3} />
    {/* Body specular */}
    <Path d="M-4,3 L-4,16" stroke={p.lightest} strokeWidth={0.8} opacity={0.3} />
  </Svg>
);

// ── sp_king — The King: ornate metallic crown ──
export const SpKingIcon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={16} rx={13} ry={2.5} fill={p.darkest} opacity={0.3} />
    {/* Crown body */}
    <Path d="M-14,12 L-14,-2 L-8,-8 L-4,0 L0,-12 L4,0 L8,-8 L14,-2 L14,12 Z" fill="url(#m)" />
    {/* Crown base band */}
    <Rect x={-14} y={8} width={28} height={5} rx={1} fill="url(#ml)" />
    <Ellipse cx={-6} cy={9.5} rx={4} ry={1.5} fill={p.lightest} opacity={0.2} />
    {/* Jewels on points */}
    <Circle cx={0} cy={-10} r={2.5} fill={p.lightest} opacity={0.6} />
    <Ellipse cx={-0.5} cy={-10.5} rx={1} ry={0.7} fill={p.lightest} opacity={0.9} />
    <Circle cx={-8} cy={-6} r={2} fill={p.lightest} opacity={0.45} />
    <Circle cx={8} cy={-6} r={2} fill={p.lightest} opacity={0.35} />
    {/* Band gems */}
    <Circle cx={-7} cy={10} r={1.5} fill="url(#m)" />
    <Circle cx={0} cy={10} r={1.5} fill="url(#m)" />
    <Circle cx={7} cy={10} r={1.5} fill="url(#m)" />
    {/* Crown inner shadow */}
    <Path d="M-12,-1 L-8,-6 L-4,0 L0,-10 L4,0 L8,-6 L12,-1 L12,7 L-12,7 Z" fill={p.dark} opacity={0.2} />
    {/* Specular on crown */}
    <Ellipse cx={-7} cy={2} rx={4} ry={3} fill={p.lightest} opacity={0.3} />
    {/* Cross on center point */}
    <Line x1={0} y1={-13} x2={0} y2={-15} stroke={p.lightest} strokeWidth={1} opacity={0.5} strokeLinecap="round" />
    <Line x1={-1} y1={-14} x2={1} y2={-14} stroke={p.lightest} strokeWidth={1} opacity={0.5} strokeLinecap="round" />
  </Svg>
);
