/**
 * Banner — Polish-B2 inline status notice.
 *
 * One-line (with optional second line) tinted strip with an optional
 * icon. Tones map onto the design system soft palettes:
 *   error   → errorSoft + traitStrength ink
 *   info    → infoLight + traitWisdom ink
 *   success → successSoft + success ink
 *   warning → warningSoft + amberDeep ink
 *
 * Used by hatch errors, mission detail waiting state, CompletionSheet
 * submission errors, and assorted feed/error toasts.
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from 'react-native';
import { colors, spacing, borderRadius, typographyTokens } from '@/theme';
import { Icon, type IconName } from './Icon';

export type BannerTone = 'error' | 'info' | 'success' | 'warning';

export interface BannerProps {
  tone?: BannerTone;
  title?: string;
  message: string;
  icon?: IconName | React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

const TONES: Record<BannerTone, { bg: string; ink: string; defaultIcon: IconName }> = {
  error:   { bg: colors.errorSoft,   ink: colors.textTokens.error,   defaultIcon: 'sparkle' },
  info:    { bg: '#DCE8F4',          ink: '#1B4E72',                 defaultIcon: 'sparkle' },
  success: { bg: colors.successSoft, ink: colors.textTokens.success, defaultIcon: 'checkCircle' },
  warning: { bg: colors.warningSoft, ink: '#7A4F12',                 defaultIcon: 'bell' },
};

export function Banner({ tone = 'info', title, message, icon, style }: BannerProps) {
  const palette = TONES[tone];
  const iconNode = React.isValidElement(icon) ? (
    icon
  ) : (
    <Icon name={(typeof icon === 'string' ? icon : palette.defaultIcon) as IconName} size={18} color={palette.ink} />
  );
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: palette.bg },
        style as any,
      ]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.iconBox}>{iconNode}</View>
      <View style={styles.copy}>
        {title ? (
          <Text style={[styles.title, { color: palette.ink }]}>{title}</Text>
        ) : null}
        <Text style={[styles.message, { color: palette.ink }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
  },
  iconBox: { marginTop: 2 },
  copy: { flex: 1 },
  title: {
    ...typographyTokens.captionEmphasis,
    marginBottom: 2,
  },
  message: {
    ...typographyTokens.body,
    fontSize: 13,
    lineHeight: 18,
  },
});
