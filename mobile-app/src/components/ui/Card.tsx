import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'warning' | 'success' | 'error';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'warning':
        return {
          backgroundColor: colors.warningLight,
          borderColor: colors.warningBorder,
        };
      case 'success':
        return {
          backgroundColor: colors.successLight,
          borderColor: colors.success,
        };
      case 'error':
        return {
          backgroundColor: colors.errorLight,
          borderColor: colors.error,
        };
      default:
        return {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        };
    }
  };

  return (
    <View style={[styles.card, getVariantStyles(), shadows.sm, style]}>
      {children}
    </View>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => (
  <View style={[styles.header, style]}>{children}</View>
);

interface CardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
  size?: 'sm' | 'default' | 'lg';
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, style, size = 'default' }) => {
  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return typography.sm;
      case 'lg':
        return typography.xl;
      default:
        return typography.lg;
    }
  };

  return (
    <Text style={[styles.title, { fontSize: getFontSize() }, style]}>
      {children}
    </Text>
  );
};

interface CardDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, style }) => (
  <Text style={[styles.description, style]}>{children}</Text>
);

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => (
  <View style={[styles.content, style]}>{children}</View>
);

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => (
  <View style={[styles.footer, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    padding: spacing[4],
    paddingBottom: spacing[2],
  },
  title: {
    fontWeight: typography.semibold,
    color: colors.foreground,
  },
  description: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
  content: {
    padding: spacing[4],
    paddingTop: 0,
  },
  footer: {
    padding: spacing[4],
    paddingTop: spacing[2],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
});

export default Card;
