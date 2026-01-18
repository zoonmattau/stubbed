export const colors = {
  // Primary palette - Masters Green
  primary: '#006747', // Masters Green
  primaryDark: '#004d35',
  primaryLight: '#008c5e',

  // Secondary palette
  secondary: '#c8a951', // Gold accent
  secondaryDark: '#a68b3d',
  secondaryLight: '#d4bc6a',

  // Accent colors - Masters Green
  accent: '#006747', // Masters Green
  accentDark: '#004d35',
  accentLight: '#008c5e',

  // Background colors - Cream White
  background: '#FAF8F5', // Cream white
  backgroundLight: '#FFFFFF',
  backgroundLighter: '#F5F3F0',

  // Surface colors - Light cream variations
  surface: '#FFFFFF',
  surfaceLight: '#FAF8F5',
  surfaceLighter: '#F0EDE8',

  // Text colors - Dark for readability
  text: '#1a1a1a',
  textSecondary: '#4a4a4a',
  textMuted: '#7a7a7a',

  // Status colors
  success: '#22c55e',
  successDark: '#16a34a',
  warning: '#f59e0b',
  warningDark: '#d97706',
  error: '#ef4444',
  errorDark: '#dc2626',
  info: '#3b82f6',
  infoDark: '#2563eb',

  // Rating colors
  gold: '#fbbf24',
  silver: '#9ca3af',
  bronze: '#d97706',

  // Sport colors
  sportAFL: '#e11d48',
  sportNRL: '#0891b2',
  sportCricket: '#16a34a',
  sportRugby: '#f59e0b',
  sportTennis: '#84cc16',
  sportSoccer: '#8b5cf6',
  sportBasketball: '#f97316',
  sportHorseRacing: '#7c3aed',
  sportHarnessRacing: '#0ea5e9',
  sportGreyhoundRacing: '#10b981',
  sportMotorsport: '#dc2626',
  sportGolf: '#059669',
  sportMMA: '#b91c1c',
  sportNetball: '#c026d3',
  sportDefault: '#006747',

  // Utility
  border: '#e0dcd5',
  borderLight: '#d0ccc5',
  overlay: 'rgba(0, 0, 0, 0.4)',
  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 30,
  '5xl': 36,
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
};

export type Theme = typeof theme;
export type Colors = typeof colors;
export type Spacing = typeof spacing;
