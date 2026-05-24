/**
 * PinDots — Polish-B2 fill indicator (PIN entry, step counters).
 *
 * Renders `total` circles where `filled` count are amber and the rest
 * are navy at low opacity. Each newly-filled dot animates a quick
 * scale-in via Reanimated.
 *
 * Variants:
 *  - tone="onNavy" (default): cream outline, amber fill — for the
 *    navy auth backdrop.
 *  - tone="onLight": navy outline, amber fill — for cream backdrops
 *    (re-used as the step indicator on origin onboarding).
 */
import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/theme';

export type PinDotsTone = 'onNavy' | 'onLight';
export type PinDotsSize = 'sm' | 'md';

export interface PinDotsProps {
  filled: number;
  total?: number;
  tone?: PinDotsTone;
  size?: PinDotsSize;
  style?: ViewStyle | ViewStyle[];
}

const DOT_SIZE: Record<PinDotsSize, number> = { sm: 10, md: 16 };

export function PinDots({
  filled,
  total = 4,
  tone = 'onNavy',
  size = 'md',
  style,
}: PinDotsProps) {
  const dot = DOT_SIZE[size];
  return (
    <View style={[styles.row, style as any]}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} filled={i < filled} tone={tone} dim={dot} />
      ))}
    </View>
  );
}

function Dot({
  filled,
  tone,
  dim,
}: {
  filled: boolean;
  tone: PinDotsTone;
  dim: number;
}) {
  const scale = useSharedValue(filled ? 1 : 0.7);
  useEffect(() => {
    scale.value = withSpring(filled ? 1 : 0.7, { stiffness: 260, damping: 14 });
  }, [filled, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bg = filled
    ? colors.amberDeep
    : tone === 'onNavy'
      ? 'rgba(251, 247, 240, 0.18)'
      : 'rgba(27, 42, 78, 0.12)';
  const border = filled
    ? colors.amberDeep
    : tone === 'onNavy'
      ? 'rgba(251, 247, 240, 0.45)'
      : 'rgba(27, 42, 78, 0.30)';

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: bg,
          borderWidth: 1.5,
          borderColor: border,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
