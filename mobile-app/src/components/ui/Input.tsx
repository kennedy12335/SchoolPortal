import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  prefix,
  suffix,
  ...props
}) => {
  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {prefix && <View style={styles.prefix}>{prefix}</View>}
        <TextInput
          style={[styles.input, prefix && styles.inputWithPrefix, suffix && styles.inputWithSuffix, inputStyle]}
          placeholderTextColor={colors.gray400}
          {...props}
        />
        {suffix && <View style={styles.suffix}>{suffix}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

interface LabelProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const Label: React.FC<LabelProps> = ({ children, style }) => (
  <Text style={[styles.label, style]}>{children}</Text>
);

const styles = StyleSheet.create({
  label: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    fontSize: typography.base,
    color: colors.foreground,
    minHeight: 44,
  },
  inputWithPrefix: {
    paddingLeft: spacing[1],
  },
  inputWithSuffix: {
    paddingRight: spacing[1],
  },
  prefix: {
    paddingLeft: spacing[3],
  },
  suffix: {
    paddingRight: spacing[3],
  },
  errorText: {
    fontSize: typography.sm,
    color: colors.error,
    marginTop: spacing[1],
  },
});

export default Input;
