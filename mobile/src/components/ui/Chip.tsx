/**
 * Chip — Polish-B1 pill-shaped label.
 *
 * Tones: neutral | accent | strength | wisdom | heart | success | error | warning | navy.
 * Sizes: sm (10px) | md (12px).
 * Filled vs outline. Optional left icon + onPress (wraps Pressable).
 */
import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, traits, borderRadius, spacing, typographyTokens } from '@/theme';
import { Text } from 'react-native';

export type ChipTone =
  | 'neutral'
  | 'accent'
  | 'strength'
  | 'wisdom'
  | 'heart'
  | 'success'
  | 'error'
  | 'warning'
  | 'navy';

export type ChipSize = 'sm' | 'md';

export interface ChipProps {
  label: string;
  tone?: ChipTone;
  icon?: React.ReactNode;
  size?: ChipSize;
  filled?: boolean;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
}

interface TonePalette {
  base: string;
  soft: string;
  ink: string;
}

const TONES: Record<ChipTone, TonePalette> = {
  neutral:  { base: colors.textSecondary, soft: '#EDEDED',           ink: colors.textPrimary },
  accent:   { base: colors.amberDeep,     soft: colors.amberSoft,    ink: '#5C3D0E' },
  strength: { base: traits.strength,      soft: '#FADEDB',           ink: '#7A1F12' },
  wisdom:   { base: traits.wisdom,        soft: '#D4E6F1',           ink: '#1B4E72' },
  heart:    { base: traits.heart,         soft: '#FBE0CA',           ink: '#8A4316' },
  success:  { base: '#1F7A3A',            soft: colors.successSoft,  ink: '#0F4A20' },
  error:    { base: traits.strength,      soft: colors.errorSoft,    ink: '#7A1F12' },
  warning:  { base: colors.amberDeep,     soft: colors.warningSoft,  ink: '#7A4F12' },
  navy:     { base: colors.primary,       soft: '#DAE1EF',           ink: colors.navyDeep },
};

export function Chip({
  label,
  tone = 'neutral',
  icon,
  size = 'md',
  filled = true,
  onPress,
  style,
}: ChipProps) {
  const palette = TONES[tone];
  const fontSize = size === 'sm' ? 10 : 12;
  const paddingV = size === 'sm' ? 3 : 5;
  const paddingH = size === 'sm' ? spacing.sm : spacing.md - 4;

  const containerStyle: ViewStyle = {
    backgroundColor: filled ? palette.base : 'transparent',
    borderColor: palette.base,
    borderWidth: 1,
    paddingVertical: paddingV,
    paddingHorizontal: paddingH,
    borderRadius: borderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  };

  const textColor = filled
    ? tone === 'navy' || tone === 'wisdom' || tone === 'success' || tone === 'strength'
      ? colors.white
      : tone === 'accent' || tone === 'warning' || tone === 'heart'
        ? '#FFF8EC'
        : colors.white
    : palette.ink;

  const content = (
    <View style={[containerStyle, style as any]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text
        style={{
          ...typographyTokens.captionEmphasis,
          fontSize,
          lineHeight: fontSize + 2,
          color: textColor,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        hitSlop={6}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  icon: { marginRight: 2 },
});
