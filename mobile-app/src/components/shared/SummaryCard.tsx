import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = colors.mutedForeground,
}) => {
  // Extract RGB from hex color and add opacity
  const getBackgroundColor = (color: string) => {
    // For common colors, return a lighter version
    if (color === colors.warning) return 'rgba(251, 191, 36, 0.15)';
    if (color === colors.success) return 'rgba(16, 185, 129, 0.15)';
    return 'rgba(156, 163, 175, 0.15)'; // gray fallback
  };

  return (
    <Card style={styles.card}>
      <CardHeader style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title}</Text>
          {icon && <View style={[styles.iconContainer, { backgroundColor: getBackgroundColor(iconColor) }]}>{icon}</View>}
        </View>
      </CardHeader>
      <CardContent style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
  },
  header: {
    paddingBottom: spacing[1],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.mutedForeground,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: 0,
  },
  value: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.foreground,
  },
  subtitle: {
    fontSize: typography.xs,
    color: colors.mutedForeground,
    marginTop: spacing[0.5],
  },
});

export default SummaryCard;
