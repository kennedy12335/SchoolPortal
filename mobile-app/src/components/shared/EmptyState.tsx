import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconName,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      {(icon || iconName) && (
        <View style={styles.iconContainer}>
          {icon || (
            iconName && <Ionicons name={iconName} size={48} color={colors.gray300} />
          )}
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button onPress={onAction} variant="outline" style={styles.button}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[6],
  },
  iconContainer: {
    marginBottom: spacing[5],
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.foreground,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing[2],
    maxWidth: 280,
    lineHeight: typography.sm * 1.5,
  },
  button: {
    marginTop: spacing[6],
  },
});

export default EmptyState;
