import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';

type SpinnerSize = 'sm' | 'default' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  text?: string;
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  text,
  color = colors.primary,
}) => {
  const getSize = (): 'small' | 'large' => {
    return size === 'lg' ? 'large' : 'small';
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size={getSize()} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  text: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    marginTop: spacing[2],
  },
});

export default LoadingSpinner;
