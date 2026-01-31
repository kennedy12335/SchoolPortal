// EduPay Design System
// A warm, premium design system for a parent-school engagement app.
// Combines deep teal for trust/education with warm amber accents and soft neutrals.

export const colors = {
  // Primary - Deep Teal (trust, education, sophistication)
  primary: '#0D7377',
  primaryDark: '#095B5E',
  primaryForeground: '#FFFFFF',
  primaryLight: 'rgba(13, 115, 119, 0.08)',
  primaryBorder: 'rgba(13, 115, 119, 0.2)',
  primaryMuted: '#E6F4F4',

  // Accent - Warm Amber (warmth, attention, value)
  accent: '#E8913A',
  accentDark: '#C97A2E',
  accentForeground: '#FFFFFF',
  accentLight: 'rgba(232, 145, 58, 0.1)',
  accentBorder: 'rgba(232, 145, 58, 0.25)',

  // Background & Surface
  background: '#FFFFFF',
  surface: '#FAFAF8', // warm off-white
  surfaceRaised: '#FFFFFF',
  foreground: '#1A1D21',
  muted: '#F5F4F1', // warm muted
  mutedForeground: '#6B7280',

  // Base
  white: '#FFFFFF',
  black: '#000000',

  // Semantic Colors
  success: '#059669',
  successLight: '#ECFDF5',
  successForeground: '#065F46',
  successBorder: '#A7F3D0',

  warning: '#D97706',
  warningLight: '#FFFBEB',
  warningForeground: '#92400E',
  warningBorder: '#FDE68A',

  error: '#DC2626',
  errorLight: '#FEF2F2',
  errorForeground: '#991B1B',
  errorBorder: '#FECACA',

  info: '#2563EB',
  infoLight: '#EFF6FF',
  infoForeground: '#1E40AF',

  // Feature-specific accents
  schoolFees: '#0D7377', // primary teal
  examFees: '#7C3AED',   // purple
  pocketMoney: '#059669', // green
  results: '#2563EB',     // blue

  schoolFeesLight: 'rgba(13, 115, 119, 0.08)',
  examFeesLight: 'rgba(124, 58, 237, 0.08)',
  pocketMoneyLight: 'rgba(5, 150, 105, 0.08)',
  resultsLight: 'rgba(37, 99, 235, 0.08)',

  // Neutral - Warm grays
  gray50: '#FAFAF8',
  gray100: '#F5F4F1',
  gray200: '#E8E6E1',
  gray300: '#D4D1CA',
  gray400: '#9C9891',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Border
  border: '#E8E6E1',
  borderLight: '#F5F4F1',
  borderFocused: '#0D7377',

  // Card
  card: '#FFFFFF',
  cardBorder: '#E8E6E1',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.04)',
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
  '4xl': 36,

  // Font Weights
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,

  // Line Heights
  tight: 1.25,
  lineHeightNormal: 1.5,
  relaxed: 1.75,

  // Letter Spacing
  tighter: -0.5,
  tight_ls: -0.25,
  normal_ls: 0,
  wide: 0.25,
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
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#1A1D21',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A1D21',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1A1D21',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  colored: {
    shadowColor: '#0D7377',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
};

// Common style patterns
export const commonStyles = {
  // Text styles
  title: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.foreground,
    letterSpacing: typography.tighter,
  },
  heading: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.foreground,
    letterSpacing: typography.tight_ls,
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
    backgroundColor: colors.surface,
  },
  contentPadding: {
    paddingHorizontal: spacing[5],
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
