import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TextStyle, ImageStyle, ImageSourcePropType } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

type AvatarSize = 'sm' | 'default' | 'lg' | 'xl';

interface AvatarProps {
  source?: ImageSourcePropType;
  fallback?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  color?: string;
}

type SizeContainerStyle = { width: number; height: number };

export const Avatar: React.FC<AvatarProps> = ({
  source,
  fallback,
  size = 'default',
  style,
  color,
}) => {
  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { width: 32, height: 32 },
          text: { fontSize: typography.xs },
        };
      case 'lg':
        return {
          container: { width: 48, height: 48 },
          text: { fontSize: typography.lg },
        };
      case 'xl':
        return {
          container: { width: 64, height: 64 },
          text: { fontSize: typography.xl },
        };
      default:
        return {
          container: { width: 40, height: 40 },
          text: { fontSize: typography.sm },
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const bgColor = color || colors.primary;

  if (source) {
    return (
      <Image
        source={source}
        style={[styles.image, sizeStyles.container as ImageStyle, style as ImageStyle]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.container, sizeStyles.container, { backgroundColor: bgColor + '18', borderColor: bgColor + '30' }, style]}>
      <Text style={[styles.text, sizeStyles.text, { color: bgColor }]}>{fallback || '?'}</Text>
    </View>
  );
};

// Helper function to get initials from name
export const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}` || '?';
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
  },
  text: {
    fontWeight: typography.bold,
  },
});

export default Avatar;
