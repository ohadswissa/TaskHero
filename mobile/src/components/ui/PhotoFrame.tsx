/**
 * PhotoFrame — Polish-B3 parchment-framed photo display.
 *
 * Pressable parchment-bordered image tile. Optional fullscreen request
 * callback; otherwise still animates on tap to feel responsive.
 */
import React from 'react';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import { borderRadius, colors, shadows } from '@/theme';
import { AnimatedPressable } from './AnimatedPressable';

export interface PhotoFrameProps {
  uri: string;
  size?: number;
  aspectRatio?: number;
  onFullscreenRequest?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle | ViewStyle[];
}

export function PhotoFrame({
  uri,
  size,
  aspectRatio,
  onFullscreenRequest,
  accessibilityLabel,
  style,
}: PhotoFrameProps) {
  const ratio = aspectRatio ?? 1;
  const widthStyle: ViewStyle =
    size != null && aspectRatio == null
      ? { width: size, height: size }
      : { width: size ?? '100%' };

  return (
    <AnimatedPressable
      onPress={onFullscreenRequest ?? (() => {})}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ?? 'Photo, tap to view full size'
      }
      style={[styles.frame, widthStyle, style as ViewStyle]}
    >
      <View style={styles.inner}>
        <Image
          source={{ uri }}
          resizeMode="cover"
          style={{
            width: '100%',
            aspectRatio: ratio,
            borderRadius: borderRadius.md,
          }}
          accessibilityIgnoresInvertColors
        />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: borderRadius.lg,
    borderWidth: 6,
    borderColor: colors.parchmentDark,
    backgroundColor: colors.parchment,
    padding: 4,
    ...shadows.parchment,
  },
  inner: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
});
