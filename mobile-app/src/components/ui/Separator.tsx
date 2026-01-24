import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';

interface SeparatorProps {
  style?: ViewStyle;
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
}

export const Separator: React.FC<SeparatorProps> = ({
  style,
  orientation = 'horizontal',
  thickness = 1,
}) => {
  return (
    <View
      style={[
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        { [orientation === 'horizontal' ? 'height' : 'width']: thickness },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
    backgroundColor: colors.border,
    marginVertical: spacing[2],
  },
  vertical: {
    height: '100%',
    backgroundColor: colors.border,
    marginHorizontal: spacing[2],
  },
});

export default Separator;
