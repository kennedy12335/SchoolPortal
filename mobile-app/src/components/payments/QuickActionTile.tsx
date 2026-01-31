import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

interface QuickActionTileProps {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  iconColor: string;
  backgroundColor: string;
  onPress: () => void;
  badge?: number;
}

export function QuickActionTile({
  iconName,
  label,
  description,
  iconColor,
  backgroundColor,
  onPress,
  badge,
}: QuickActionTileProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Icon Circle */}
        <View style={[styles.iconCircle, { backgroundColor }]}>
          <Ionicons name={iconName} size={28} color={iconColor} />
        </View>

        {/* Label */}
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        {description && (
          <Text style={styles.description} numberOfLines={1}>{description}</Text>
        )}

        {/* Optional Badge */}
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[3],
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.foreground,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.xs,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing[0.5],
  },
  badge: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1.5],
  },
  badgeText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.white,
  },
});
