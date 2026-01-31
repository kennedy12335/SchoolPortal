import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'accent';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  style,
  textStyle,
  size = 'default',
}) => {
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          container: { backgroundColor: colors.gray100 },
          text: { color: colors.gray700 },
        };
      case 'success':
        return {
          container: { backgroundColor: colors.successLight },
          text: { color: colors.successForeground },
        };
      case 'warning':
        return {
          container: { backgroundColor: colors.warningLight },
          text: { color: colors.warningForeground },
        };
      case 'destructive':
        return {
          container: { backgroundColor: colors.errorLight },
          text: { color: colors.errorForeground },
        };
      case 'outline':
        return {
          container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
          text: { color: colors.foreground },
        };
      case 'accent':
        return {
          container: { backgroundColor: colors.accentLight },
          text: { color: colors.accent },
        };
      default:
        return {
          container: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primaryBorder },
          text: { color: colors.primary },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingVertical: spacing[0.5],
            paddingHorizontal: spacing[2],
          },
          text: { fontSize: typography.xs - 1 },
        };
      default:
        return {
          container: {
            paddingVertical: spacing[1],
            paddingHorizontal: spacing[2.5],
          },
          text: { fontSize: typography.xs },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, variantStyles.container, sizeStyles.container, style]}>
      <Text style={[styles.text, variantStyles.text, sizeStyles.text, textStyle]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: typography.semibold,
  },
});

export default Badge;
