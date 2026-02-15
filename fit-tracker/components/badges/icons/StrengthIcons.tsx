import React from 'react';
import Svg, { Path, Circle, Rect, Line, Ellipse, Text as SvgText } from 'react-native-svg';
import type { BadgeIconProps } from './types';
import { MetallicDefs } from './primitives';

// ── str_pr_1 — First PR: classic metallic trophy cup ──
export const StrPr1Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={18} rx={8} ry={2} fill={p.darkest} opacity={0.3} />
    {/* Cup bowl */}
    <Path d="M-10,-14 L10,-14 L10,-5 C14,-5 16,-1 14,5 C12,9 8,9 6,7 L6,1 L-6,1 L-6,7 C-8,9 -12,9 -14,5 C-16,-1 -14,-5 -10,-5 Z" fill="url(#m)" />
    {/* Stem */}
    <Path d="M-4,7 L4,7 L3,13 L-3,13 Z" fill="url(#ml)" />
    {/* Base */}
    <Rect x={-7} y={13} width={14} height={4} rx={2} fill="url(#m)" />
    <Ellipse cx={-3} cy={14} rx={3} ry={1} fill={p.lightest} opacity={0.35} />
    {/* Cup interior shadow */}
    <Path d="M-6,-14 L6,-14 L4,-8 L-4,-8 Z" fill={p.dark} opacity={0.3} />
    {/* Cup specular */}
    <Ellipse cx={-4} cy={-8} rx={3.5} ry={2.5} fill={p.lightest} opacity={0.55} />
    {/* Star emboss on cup */}
    <Path d="M0,-6 L1,-3 L3.5,-3 L1.5,-1 L2.5,2 L0,0 L-2.5,2 L-1.5,-1 L-3.5,-3 L-1,-3 Z" fill={p.lightest} opacity={0.3} />
  </Svg>
);

// ── str_pr_2 — Record Hunter: metallic crosshair scope ──
export const StrPr2Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    {/* Outer ring */}
    <Circle cx={0} cy={0} r={15} fill="none" stroke="url(#ml)" strokeWidth={3} />
    {/* Inner ring */}
    <Circle cx={0} cy={0} r={9} fill="none" stroke={p.mid} strokeWidth={2} opacity={0.5} />
    {/* Crosshair lines */}
    <Line x1={0} y1={-19} x2={0} y2={-11} stroke="url(#ml)" strokeWidth={2.5} />
    <Line x1={0} y1={11} x2={0} y2={19} stroke={p.mid} strokeWidth={2.5} opacity={0.6} />
    <Line x1={-19} y1={0} x2={-11} y2={0} stroke="url(#ml)" strokeWidth={2.5} />
    <Line x1={11} y1={0} x2={19} y2={0} stroke={p.mid} strokeWidth={2.5} opacity={0.6} />
    {/* Center dot */}
    <Circle cx={0} cy={0} r={3} fill="url(#m)" />
    <Ellipse cx={-1} cy={-1} rx={1.2} ry={0.8} fill={p.lightest} opacity={0.7} />
    {/* Target indicator */}
    <Path d="M7,-11 L0,0 L11,-7 Z" fill={p.light} opacity={0.4} />
    {/* Tube highlight */}
    <Path d="M-1,-19 L-1,-11" stroke={p.lightest} strokeWidth={0.8} opacity={0.4} />
  </Svg>
);

// ── str_pr_3 — PR Machine: metallic rocket ──
export const StrPr3Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={20} rx={7} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Exhaust flames */}
    <Path d="M-3,15 L0,20 L3,15" fill={p.mid} opacity={0.4} />
    {/* Rocket body */}
    <Path d="M-5,16 L-4,2 L-7,4 L0,-18 L7,4 L4,2 L5,16 Z" fill="url(#ml)" />
    {/* Nose cone highlight */}
    <Path d="M0,-18 L-3,-8 L0,-10 Z" fill={p.lightest} opacity={0.4} />
    {/* Fins */}
    <Path d="M-9,14 L-13,18 L-7,16 Z" fill="url(#m)" />
    <Path d="M9,14 L13,18 L7,16 Z" fill={p.mid} opacity={0.6} />
    {/* Window */}
    <Circle cx={0} cy={2} r={2.5} fill={p.dark} opacity={0.5} />
    <Ellipse cx={-0.5} cy={1.5} rx={1} ry={0.7} fill={p.lightest} opacity={0.4} />
    {/* Body specular */}
    <Path d="M-3,-14 L-3,8" stroke={p.lightest} strokeWidth={1} opacity={0.3} />
  </Svg>
);

// ── str_pr_4 — Unstoppable: metallic fist/power emblem ──
export const StrPr4Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    <Ellipse cx={0} cy={19} rx={10} ry={2} fill={p.darkest} opacity={0.25} />
    {/* Shield background */}
    <Path d="M-13,-14 C-13,6 -7,14 0,18 C7,14 13,6 13,-14 Z" fill={p.dark} opacity={0.4} />
    <Path d="M-12,-14 C-12,6 -6,14 0,17 C6,14 12,6 12,-14 Z" fill="url(#m)" />
    {/* Fist / check emblem */}
    <Circle cx={0} cy={0} r={5} fill={p.lightest} opacity={0.35} />
    <Path d="M-3,0 L-1,3.5 L5,-4" stroke={p.lightest} strokeWidth={3} opacity={0.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {/* Embossed shadow of check */}
    <Path d="M-2.5,0.5 L-0.5,4 L5.5,-3.5" stroke={p.darkest} strokeWidth={1} opacity={0.15} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {/* Specular */}
    <Ellipse cx={-5} cy={-10} rx={4} ry={2.5} fill={p.lightest} opacity={0.4} />
  </Svg>
);

// ── str_pr_5 — +10% Club: metallic uptrend with text ──
export const StrPr5Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    {/* Trend line — thick metallic tube */}
    <Path d="M-15,8 L-7,8 L-7,0 L5,-12 L5,-8 L15,-8" fill="none" stroke={p.dark} strokeWidth={4.5} opacity={0.4} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M-15,8 L-7,8 L-7,0 L5,-12 L5,-8 L15,-8" fill="none" stroke="url(#ml)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    {/* Highlight on tube */}
    <Path d="M-14,7 L-7,7 L-7,-1" stroke={p.lightest} strokeWidth={0.8} opacity={0.35} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Arrow head */}
    <Path d="M11,-12 L15,-8 L11,-4" fill="none" stroke="url(#ml)" strokeWidth={3} strokeLinecap="round" />
    {/* Text */}
    <SvgText x={4} y={17} textAnchor="middle" fontSize={8} fontWeight="800" fill={p.mid} opacity={0.7} fontFamily="Plus Jakarta Sans">10%</SvgText>
  </Svg>
);

// ── str_pr_6 — +50% Club: steep metallic uptrend with text ──
export const StrPr6Icon: React.FC<BadgeIconProps> = ({ size, palette: p }) => (
  <Svg width={size} height={size} viewBox="-24 -24 48 48">
    <MetallicDefs p={p} />
    {/* Trend line */}
    <Path d="M-15,8 L-7,8 L-7,-4 L5,-16 L5,-8 L15,-8" fill="none" stroke={p.dark} strokeWidth={5} opacity={0.4} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M-15,8 L-7,8 L-7,-4 L5,-16 L5,-8 L15,-8" fill="none" stroke="url(#ml)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    {/* Highlight */}
    <Path d="M-14,7 L-7,7 L-7,-5" stroke={p.lightest} strokeWidth={0.8} opacity={0.35} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Arrow */}
    <Path d="M11,-12 L15,-8 L11,-4" fill="none" stroke="url(#ml)" strokeWidth={3.5} strokeLinecap="round" />
    {/* Filled wedge behind arrow */}
    <Path d="M5,-16 L11,-12 L5,-8" fill={p.light} opacity={0.3} />
    {/* Text */}
    <SvgText x={4} y={17} textAnchor="middle" fontSize={8} fontWeight="800" fill={p.mid} opacity={0.8} fontFamily="Plus Jakarta Sans">50%</SvgText>
  </Svg>
);
