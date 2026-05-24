/**
 * GradientBackdrop — Polish-B1 full-bleed gradient wrapper.
 *
 * Variants:
 *  - navy        → navyDeep → navyMid (auth splash, dark headers).
 *  - cream       → cream → creamSoft (parent dashboard, mission detail).
 *  - parchment   → parchment → cream (Hero's Wisdom).
 *  - magic       → magicViolet → magicCyan (evolution/celebration).
 *  - habitat-*   → habitat palettes by species.
 *
 * Direction:
 *  - vertical (default): top → bottom
 *  - diagonal: top-left → bottom-right
 *  - radial: faked via stacked vertical gradient w/ a soft radial vignette
 *            (we don't ship a separate Svg radial primitive — Polish-B2 may).
 *
 * Intensity adjusts the stop spread for subtle/normal/rich looks.
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';

export type GradientVariant =
  | 'navy'
  | 'cream'
  | 'parchment'
  | 'magic'
  | 'habitat-forest'
  | 'habitat-sky'
  | 'habitat-stone'
  | 'parentDashboard'
  | 'celebration';

export type GradientDirection = 'vertical' | 'diagonal' | 'radial';
export type GradientIntensity = 'subtle' | 'normal' | 'rich';

export interface GradientBackdropProps {
  variant?: GradientVariant;
  direction?: GradientDirection;
  intensity?: GradientIntensity;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
}

function stopsFor(variant: GradientVariant): readonly [string, string] {
  switch (variant) {
    case 'navy':
      return [colors.navyDeep, colors.navyMid];
    case 'cream':
      return [colors.cream, colors.creamSoft];
    case 'parchment':
      return [colors.parchment, colors.cream];
    case 'magic':
      return [colors.magicViolet, colors.magicCyan];
    case 'habitat-forest':
      return colors.habitat.forest as unknown as readonly [string, string];
    case 'habitat-sky':
      return colors.habitat.sky as unknown as readonly [string, string];
    case 'habitat-stone':
      return colors.habitat.stone as unknown as readonly [string, string];
    case 'parentDashboard':
      return ['#F2F6FF', '#FFFFFF'];
    case 'celebration':
      return [colors.accent, colors.magicViolet];
  }
}

function locationsFor(intensity: GradientIntensity): [number, number] {
  switch (intensity) {
    case 'subtle':
      return [0.2, 0.95];
    case 'rich':
      return [0, 0.7];
    case 'normal':
    default:
      return [0, 1];
  }
}

export function GradientBackdrop({
  variant = 'cream',
  direction = 'vertical',
  intensity = 'normal',
  style,
  children,
}: GradientBackdropProps) {
  const [c1, c2] = stopsFor(variant);
  const locations = locationsFor(intensity);

  // expo-linear-gradient uses start/end (0..1 coords).
  let start = { x: 0.5, y: 0 };
  let end = { x: 0.5, y: 1 };
  if (direction === 'diagonal') {
    start = { x: 0, y: 0 };
    end = { x: 1, y: 1 };
  } else if (direction === 'radial') {
    // Faked radial: center vignette via overlay.
    start = { x: 0.5, y: 0 };
    end = { x: 0.5, y: 1 };
  }

  return (
    <View style={[styles.root, style as any]}>
      <LinearGradient
        colors={[c1, c2] as [string, string]}
        locations={locations}
        start={start}
        end={end}
        style={StyleSheet.absoluteFill}
      />
      {direction === 'radial' ? (
        <LinearGradient
          colors={['rgba(255,255,255,0.25)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.15)'] as [string, string, string]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
