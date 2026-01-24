// Design System - Colors, Typography, Spacing
// Matches web frontend design tokens

export const colors = {
  // Primary
  primary: '#3B82F6', // Blue
  primaryForeground: '#FFFFFF',
  primaryLight: 'rgba(59, 130, 246, 0.1)',
  primaryBorder: 'rgba(59, 130, 246, 0.2)',

  // Background
  background: '#FFFFFF',
  foreground: '#0f172a',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',

  // Base
  white: '#FFFFFF',
  black: '#000000',

  // Semantic Colors
  success: '#10B981',
  successLight: '#DCFCE7',
  successForeground: '#166534',

  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.15)',
  warningForeground: '#92400E',
  warningBorder: '#FDE68A',

  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorForeground: '#991B1B',

  // Accents
  indigo: '#6366F1',
  indigoLight: 'rgba(99, 102, 241, 0.1)',
  purple: '#A855F7',

  // Neutral
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',

  // Border
  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  // Card
  card: '#FFFFFF',
  cardBorder: '#e2e8f0',
};

export const typography = {
  // Font Sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,

  // Font Weights
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,

  // Line Heights
  tight: 1.25,
  lineHeightNormal: 1.5,
  relaxed: 1.75,
};

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
};

// Common style patterns
export const commonStyles = {
  // Text styles
  title: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.foreground,
  },
  subheading: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.foreground,
  },
  body: {
    fontSize: typography.base,
    fontWeight: typography.normal,
    color: colors.foreground,
  },
  bodySmall: {
    fontSize: typography.sm,
    fontWeight: typography.normal,
    color: colors.mutedForeground,
  },
  caption: {
    fontSize: typography.xs,
    fontWeight: typography.normal,
    color: colors.mutedForeground,
  },

  // Layout patterns
  screenContainer: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  contentPadding: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[6],
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  commonStyles,
};
