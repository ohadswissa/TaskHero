/**
 * OrbProgress — Polish-B1 happiness orb.
 *
 * Animated glowing sphere: clipped fill (bottom-up wave) tweens between
 * values over 600ms; outer halo opacity scales with value (≥70% bright,
 * ≤30% dim). Defaults to the amber accent — caller may override.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Rect } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { colors } from '@/theme';
import { Caption } from './Typography';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface OrbProgressProps {
  value: number;
  size?: number;
  color?: string;
  label?: string;
}

export function OrbProgress({
  value,
  size = 56,
  color = colors.accent,
  label,
}: OrbProgressProps) {
  const progress = useSharedValue(clamp01(value) / 100);

  useEffect(() => {
    progress.value = withTiming(clamp01(value) / 100, { duration: 600 });
  }, [value, progress]);

  const r = size / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;

  const fillProps = useAnimatedProps(() => ({
    y: cy - r + (1 - progress.value) * (2 * r),
    height: progress.value * (2 * r),
  }));

  const haloProps = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [0.3, 0.7, 1], [0.1, 0.4, 0.75], Extrapolation.CLAMP),
    r: interpolate(progress.value, [0, 1], [r + 2, r + 6], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.root}>
      <Svg width={size + 16} height={size + 16}>
        {/* halo */}
        <AnimatedCircle
          cx={cx + 8}
          cy={cy + 8}
          fill={color}
          animatedProps={haloProps}
        />
        <G transform={`translate(8, 8)`}>
          <Defs>
            <ClipPath id="orb-clip">
              <Circle cx={cx} cy={cy} r={r} />
            </ClipPath>
          </Defs>
          {/* base */}
          <Circle cx={cx} cy={cy} r={r} fill={colors.creamSoft} stroke={color} strokeWidth={1.5} opacity={0.6} />
          {/* animated fill */}
          <AnimatedRect
            x={cx - r}
            width={2 * r}
            fill={color}
            clipPath="url(#orb-clip)"
            animatedProps={fillProps}
          />
          {/* highlight */}
          <Circle cx={cx - r / 3} cy={cy - r / 3} r={r / 4} fill="rgba(255,255,255,0.6)" />
        </G>
      </Svg>
      {label ? (
        <Caption tone="secondary" align="center" style={styles.label}>
          {label}
        </Caption>
      ) : null}
    </View>
  );
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  label: { marginTop: 4 },
});
