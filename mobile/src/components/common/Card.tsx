import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof spacing | number;
}

export function Card({ children, style, variant = 'default', padding }: CardProps) {
  const paddingStyle = padding !== undefined
    ? { padding: typeof padding === 'number' ? padding : spacing[padding] }
    : undefined;

  return (
    <View style={[styles.base, styles[variant], paddingStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  default: {
    ...shadows.sm,
  },
  elevated: {
    ...shadows.md,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filled: {
    backgroundColor: colors.backgroundSecondary,
  },
});
