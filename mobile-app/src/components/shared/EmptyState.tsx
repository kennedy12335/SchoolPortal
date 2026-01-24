import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button onPress={onAction} style={styles.button}>
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
    marginBottom: spacing[4],
    opacity: 0.5,
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
  },
  button: {
    marginTop: spacing[6],
  },
});

export default EmptyState;
