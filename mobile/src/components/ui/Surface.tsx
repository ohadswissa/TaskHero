/**
 * Surface — Polish-B1 semantic card primitive.
 *
 * Variants: card | cardHover | parchment | navy | cream | glass.
 * Shadows pulled from `theme.shadows`; default radius `lg` (20).
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '@/theme';

export type SurfaceVariant = 'card' | 'cardHover' | 'parchment' | 'navy' | 'cream' | 'glass';
export type SurfacePadding = 'none' | 'sm' | 'md' | 'lg';
export type SurfaceRadius = 'sm' | 'md' | 'lg' | 'xl';
export type SurfaceShadow = keyof typeof shadows | 'none';

export interface SurfaceProps {
  variant?: SurfaceVariant;
  padding?: SurfacePadding;
  radius?: SurfaceRadius;
  shadow?: SurfaceShadow;
  bordered?: boolean;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

const PADDING_MAP: Record<SurfacePadding, number> = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
};

const RADIUS_MAP: Record<SurfaceRadius, number> = {
  sm: borderRadius.sm,
  md: borderRadius.md,
  lg: borderRadius.lg,
  xl: borderRadius.xl,
};

interface VariantStyle {
  backgroundColor: string;
  borderColor: string;
  defaultShadow: SurfaceShadow;
}

const VARIANTS: Record<SurfaceVariant, VariantStyle> = {
  card:       { backgroundColor: colors.surface,    borderColor: colors.border,         defaultShadow: 'card' },
  cardHover:  { backgroundColor: colors.surface,    borderColor: colors.border,         defaultShadow: 'cardHover' },
  parchment:  { backgroundColor: colors.parchment,  borderColor: colors.parchmentDark,  defaultShadow: 'parchment' },
  navy:       { backgroundColor: colors.navyDeep,   borderColor: colors.navyMid,        defaultShadow: 'navyGlow' },
  cream:      { backgroundColor: colors.creamSoft,  borderColor: colors.border,         defaultShadow: 'card' },
  glass:      { backgroundColor: colors.glass,      borderColor: 'rgba(255,255,255,0.6)', defaultShadow: 'card' },
};

export function Surface({
  variant = 'card',
  padding = 'md',
  radius = 'lg',
  shadow,
  bordered = false,
  style,
  children,
}: SurfaceProps) {
  const v = VARIANTS[variant];
  const shadowKey = shadow ?? v.defaultShadow;
  const shadowStyle = shadowKey === 'none' ? undefined : shadows[shadowKey];
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: v.backgroundColor,
          borderRadius: RADIUS_MAP[radius],
          padding: PADDING_MAP[padding],
          borderWidth: bordered ? StyleSheet.hairlineWidth * 2 : 0,
          borderColor: v.borderColor,
        },
        shadowStyle as ViewStyle | undefined,
        style as any,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
