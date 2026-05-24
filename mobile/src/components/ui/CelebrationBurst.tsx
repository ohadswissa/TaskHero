/**
 * CelebrationBurst — Polish-B3 burst-of-particles celebration overlay.
 *
 * Reanimated v3 port of the BurstParticles helper used in onboarding/hatch.
 * Each particle is a 6×6 rounded square that animates outward along a
 * randomized angle/distance and fades while scaling up.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/theme';

export type CelebrationIntensity = 'subtle' | 'normal' | 'rich';

export interface CelebrationBurstProps {
  active: boolean;
  intensity?: CelebrationIntensity;
  colors?: string[];
  spread?: number;
  durationMs?: number;
  onComplete?: () => void;
}

const COUNT_MAP: Record<CelebrationIntensity, number> = {
  subtle: 8,
  normal: 16,
  rich: 28,
};

interface ParticleSpec {
  angle: number;
  distanceFactor: number;
  color: string;
}

interface ParticleProps {
  spec: ParticleSpec;
  active: boolean;
  spread: number;
  durationMs: number;
}

function Particle({ spec, active, spread, durationMs }: ParticleProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (active) {
      t.value = 0;
      t.value = withTiming(1, {
        duration: durationMs,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      t.value = 0;
    }
  }, [active, durationMs, t]);

  const animatedStyle = useAnimatedStyle(() => {
    const dx = Math.cos(spec.angle) * spread * spec.distanceFactor;
    const dy = Math.sin(spec.angle) * spread * spec.distanceFactor;
    return {
      opacity: 1 - t.value,
      transform: [
        { translateX: t.value * dx },
        { translateY: t.value * dy },
        { scale: t.value },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: spec.color },
        animatedStyle,
      ]}
    />
  );
}

export function CelebrationBurst({
  active,
  intensity = 'normal',
  colors: colorOverrides,
  spread = 180,
  durationMs = 1400,
  onComplete,
}: CelebrationBurstProps) {
  const count = COUNT_MAP[intensity];

  const palette = useMemo(
    () =>
      colorOverrides ?? [
        colors.accent,
        colors.amberDeep,
        colors.magicViolet,
        colors.magicCyan,
        '#FFFFFF',
      ],
    [colorOverrides],
  );

  const specs = useMemo<ParticleSpec[]>(() => {
    const arr: ParticleSpec[] = [];
    for (let i = 0; i < count; i++) {
      const baseAngle = (i / count) * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * (Math.PI / count);
      arr.push({
        angle: baseAngle + jitter,
        distanceFactor: 0.6 + Math.random() * 0.4,
        color: palette[i % palette.length] ?? colors.accent,
      });
    }
    return arr;
  }, [count, palette]);

  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) {
      if (completeTimer.current) {
        clearTimeout(completeTimer.current);
        completeTimer.current = null;
      }
      return;
    }
    if (onComplete) {
      completeTimer.current = setTimeout(() => {
        onComplete();
      }, durationMs + 50);
    }
    return () => {
      if (completeTimer.current) {
        clearTimeout(completeTimer.current);
        completeTimer.current = null;
      }
    };
  }, [active, durationMs, onComplete]);

  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no"
      accessibilityElementsHidden
      style={styles.root}
    >
      {specs.map((spec, i) => (
        <Particle
          key={i}
          spec={spec}
          active={active}
          spread={spread}
          durationMs={durationMs}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
