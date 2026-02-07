/**
 * Onset Design System
 * Dark theme fitness app with orange accent
 */

import { Platform } from 'react-native';

export const Colors = {
  // Primary - Brand Orange
  primary: '#FF6B35',
  primaryDark: '#E55A2B',
  primaryLight: '#FF8A5C',

  // Background
  background: '#0C0C0C',
  card: '#1A1A1A',
  cardElevated: '#1C1C1E',
  cardLight: '#242424',
  badgePill: '#2C2C2E',
  surface: 'rgba(28, 28, 30, 0.85)',

  // Text
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textMuted: 'rgba(255, 255, 255, 0.4)',
  textDisabled: 'rgba(255, 255, 255, 0.3)',

  // Glass Effect
  glassBorder: 'rgba(255, 255, 255, 0.05)',
  glassBorderLight: 'rgba(255, 255, 255, 0.08)',
  glassBorderMedium: 'rgba(255, 255, 255, 0.1)',
  glassBackground: 'rgba(255, 255, 255, 0.03)',
  glassBackgroundHover: 'rgba(255, 255, 255, 0.05)',

  // Timer Phase Colors
  phases: {
    prepare: '#FBBF24',
    exercise: '#FF6B00',
    rest: '#4A90E2',
    break: '#9333EA',
    finished: '#4ADE80',
  },

  // Semantic Colors
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#FF4B4B',
  info: '#3B82F6',

  // Category Colors
  categories: {
    push: '#FF6B35',
    pull: '#3B82F6',
    legs: '#4ADE80',
    core: '#FBBF24',
    cardio: '#FF4B4B',
  },

  // Level Colors
  levels: {
    beginner: '#4ADE80',
    intermediate: '#FBBF24',
    advanced: '#FF4B4B',
  },

  // Tab Bar
  tabBar: {
    background: '#0C0C0C',
    border: 'rgba(255, 255, 255, 0.1)',
    active: '#FF6B35',
    inactive: '#6B7280',
  },

  // Theme compat
  dark: {
    text: '#FFFFFF',
    background: '#0C0C0C',
    tint: '#FF6B35',
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#FF6B35',
  },
  light: {
    text: '#FFFFFF',
    background: '#0C0C0C',
    tint: '#FF6B35',
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#FF6B35',
  },
};

export const Typography = {
  fontFamily: 'PlusJakartaSans',

  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    timer: 72,
  },

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  lineHeights: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const Spacing = {
  xs: 6,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
  card: 24,
  cardLarge: 32,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const GlassStyle = {
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  workoutCard: {
    backgroundColor: 'rgba(28, 28, 30, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modal: {
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabBar: {
    backgroundColor: 'rgba(13, 13, 13, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semibold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
    mono: 'ui-monospace',
  },
  android: {
    sans: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semibold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
    mono: 'monospace',
  },
  default: {
    sans: 'Plus Jakarta Sans',
    medium: 'Plus Jakarta Sans',
    semibold: 'Plus Jakarta Sans',
    bold: 'Plus Jakarta Sans',
    mono: 'monospace',
  },
});
