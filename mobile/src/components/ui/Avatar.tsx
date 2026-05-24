/**
 * Avatar — Polish-B2 circular identity primitive.
 *
 * Renders initials, an image, or an icon inside a tinted circle.
 * Sizes: xs (24) | sm (32) | md (44) | lg (64).
 * Used by Hub greeting, mission row badges, child-login peek, parent dashboard (B3).
 */
import React from 'react';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, typographyTokens } from '@/theme';
import { Text } from 'react-native';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';
export type AvatarTone = 'navy' | 'amber' | 'cream' | 'parchment';

export interface AvatarProps {
  /** Initials to render (will be uppercased + truncated to 2 chars). */
  initials?: string;
  /** Optional remote image source. Falls back to initials/icon if not loaded. */
  uri?: string;
  /** Optional icon node (e.g. <Icon name="crown"/>). Overrides initials when set. */
  icon?: React.ReactNode;
  size?: AvatarSize;
  tone?: AvatarTone;
  bordered?: boolean;
  style?: ViewStyle | ViewStyle[];
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
};

const TONE_MAP: Record<AvatarTone, { bg: string; fg: string; border: string }> = {
  navy:      { bg: colors.primary,    fg: colors.cream,         border: colors.navyMid },
  amber:     { bg: colors.amberDeep,  fg: '#5C3D0E',            border: colors.amberSoft },
  cream:     { bg: colors.creamSoft,  fg: colors.primary,       border: colors.border },
  parchment: { bg: colors.parchment,  fg: colors.parchmentInk,  border: colors.parchmentDark },
};

export function Avatar({
  initials,
  uri,
  icon,
  size = 'md',
  tone = 'navy',
  bordered = false,
  style,
}: AvatarProps) {
  const dim = SIZE_MAP[size];
  const palette = TONE_MAP[tone];
  const safe = (initials ?? '').trim().slice(0, 2).toUpperCase();
  const fontSize = Math.round(dim * 0.42);

  return (
    <View
      style={[
        styles.root,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: palette.bg,
          borderWidth: bordered ? 2 : 0,
          borderColor: palette.border,
        },
        style as any,
      ]}
      accessibilityRole="image"
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dim, height: dim, borderRadius: dim / 2 }}
          accessibilityIgnoresInvertColors
        />
      ) : icon ? (
        <View style={styles.center}>{icon}</View>
      ) : (
        <Text
          style={{
            ...typographyTokens.heading2,
            fontSize,
            lineHeight: fontSize + 2,
            color: palette.fg,
          }}
        >
          {safe || '?'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  center: { alignItems: 'center', justifyContent: 'center' },
});
