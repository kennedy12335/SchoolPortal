import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

interface ButtonProps {
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}) => {
  const isDisabled = disabled;

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.border,
          },
          text: { color: colors.foreground },
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: colors.foreground },
        };
      case 'destructive':
        return {
          container: { backgroundColor: colors.error },
          text: { color: '#FFFFFF' },
        };
      case 'secondary':
        return {
          container: { backgroundColor: colors.gray200 },
          text: { color: colors.foreground },
        };
      default:
        return {
          container: { backgroundColor: colors.gray900 },
          text: { color: '#FFFFFF' },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingVertical: spacing[2],
            paddingHorizontal: spacing[3],
            minHeight: 36,
          },
          text: { fontSize: typography.sm },
        };
      case 'lg':
        return {
          container: {
            paddingVertical: spacing[3.5],
            paddingHorizontal: spacing[8],
            minHeight: 48,
          },
          text: { fontSize: typography.base },
        };
      case 'icon':
        return {
          container: {
            width: 40,
            height: 40,
            paddingVertical: 0,
            paddingHorizontal: 0,
            justifyContent: 'center',
            alignItems: 'center',
          },
          text: { fontSize: typography.base },
        };
      default:
        return {
          container: {
            paddingVertical: spacing[2.5],
            paddingHorizontal: spacing[4],
            minHeight: 40,
          },
          text: { fontSize: typography.sm },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.container,
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
        {typeof children === 'string' ? (
          <Text style={[styles.text, variantStyles.text, sizeStyles.text, textStyle]}>
            {children}
          </Text>
        ) : (
          children
        )}
        {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: typography.semibold,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: spacing[2],
  },
  iconRight: {
    marginLeft: spacing[2],
  },
});

export default Button;
