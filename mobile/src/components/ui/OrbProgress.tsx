/**
 * OrbProgress — happiness orb (Polish-B1 + demo-prep contrast pass).
 *
 * Animated glowing sphere: clipped fill (bottom-up wave) tweens between
 * values over 600ms. Always interpolates FROM the previous value so the
 * orb never resets to 0 mid-update (was causing a brief white flash on
 * happiness changes). The current percent is rendered as a bold label
 * inside the orb for at-a-glance readability against the cream bg.
 */
import React, { useEffect, useRef } from 'react';
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
import { Caption, Heading } from './Typography';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface OrbProgressProps {
  value: number;
  size?: number;
  color?: string;
  /** When null/undefined no caption is rendered below the orb. */
  label?: string | null;
  /** When false the inner percent number is hidden (default true). */
  showPercent?: boolean;
}

export function OrbProgress({
  value,
  size = 56,
  color = colors.accent,
  label,
  showPercent = true,
}: OrbProgressProps) {
  const initial = clamp01(value) / 100;
  const progress = useSharedValue(initial);
  // Track the previous prop value across renders so the animated fill
  // always tweens FROM the current visual state TO the new target —
  // never snaps to 0 (which previously caused a brief white flash).
  const lastValueRef = useRef<number>(initial);

  useEffect(() => {
    const next = clamp01(value) / 100;
    // Ensure the shared value matches our last-known target before
    // starting the new tween (handles edge cases where the JS-thread
    // shared value drifted away from our ref).
    progress.value = lastValueRef.current;
    progress.value = withTiming(next, { duration: 600 });
    lastValueRef.current = next;
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

  const pctLabel = Math.round(clamp01(value));

  return (
    <View style={styles.root}>
      <View style={[styles.orbShadow, { width: size + 16, height: size + 16 }]}>
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
            {/* base track — darker navy at 12% so it reads on cream bg */}
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              fill="rgba(15,27,61,0.12)"
              stroke={color}
              strokeWidth={3.5}
            />
            {/* animated fill */}
            <AnimatedRect
              x={cx - r}
              width={2 * r}
              fill={color}
              clipPath="url(#orb-clip)"
              animatedProps={fillProps}
            />
            {/* highlight */}
            <Circle cx={cx - r / 3} cy={cy - r / 3} r={r / 4} fill="rgba(255,255,255,0.55)" />
          </G>
        </Svg>
        {showPercent ? (
          <View pointerEvents="none" style={styles.percentWrap}>
            <Heading level={3} tone="primary" align="center" style={styles.percentLabel}>
              {pctLabel}%
            </Heading>
          </View>
        ) : null}
      </View>
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
  orbShadow: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navyDeep,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  percentWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentLabel: {
    fontSize: 14,
    lineHeight: 16,
  },
  label: { marginTop: 4 },
});
