import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius } from '../../theme';

interface CheckboxProps {
  checked?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  style?: ViewStyle;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onPress,
  disabled = false,
  size = 'default',
  style,
}) => {
  const getSize = (): number => {
    switch (size) {
      case 'sm':
        return 16;
      case 'lg':
        return 24;
      default:
        return 20;
    }
  };

  const boxSize = getSize();
  const checkmarkSize = boxSize * 0.6;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          width: boxSize,
          height: boxSize,
        },
        checked && styles.checked,
        disabled && styles.disabled,
        style,
      ]}
    >
      {checked && (
        <View
          style={[
            styles.checkmark,
            {
              width: checkmarkSize,
              height: checkmarkSize * 0.5,
            },
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checked: {
    backgroundColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  checkmark: {
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
});

export default Checkbox;
