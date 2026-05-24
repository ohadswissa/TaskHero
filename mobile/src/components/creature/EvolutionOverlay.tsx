/**
 * EvolutionOverlay — M7a (Polish-B3 visual upgrade).
 *
 * Fullscreen celebratory animation that plays on the Creature Hub when the
 * child's creature stage transitions. The shrink → burst → expand sequence
 * and ~1.8s timing are PRESERVED exactly. Polish-B3 swaps the visual chrome:
 *
 *   - Backdrop is `GradientBackdrop variant="magic" intensity="rich"` with
 *     a translucent navy overlay on top so the magic gradient glows behind
 *     a legible scrim.
 *   - The inline ✨ Animated.Text particles are replaced by a Reanimated
 *     `<CelebrationBurst />` activated only during the burst phase.
 *   - The caption View+Text is replaced by `<Surface variant="glass">` with
 *     `<Typography.Display tone="onNavy" />`.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import { SpeciesBadge } from './SpeciesBadge';
import type { CreatureSpecies, EvolutionStage } from '@/api/creatures.api';
import { colors, spacing } from '@/theme';
import {
  CelebrationBurst,
  GradientBackdrop,
  Surface,
  Typography,
} from '@/components/ui';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface EvolutionOverlayProps {
  species: CreatureSpecies;
  fromStage: EvolutionStage;
  toStage: EvolutionStage;
  creatureName: string;
  onComplete: () => void;
}

function stageLabel(stage: EvolutionStage): string {
  switch (stage) {
    case 'EGG':
      return 'an Egg';
    case 'BABY':
      return 'a Baby';
    case 'ADOLESCENT':
      return 'an Adolescent';
    case 'ADULT':
      return 'an Adult';
  }
}

export function EvolutionOverlay({
  species,
  fromStage,
  toStage,
  creatureName,
  onComplete,
}: EvolutionOverlayProps) {
  // 1. Old sprite shrink + tint
  const oldScale = useRef(new Animated.Value(1)).current;
  const tintOpacity = useRef(new Animated.Value(0)).current;
  // 2. Burst (also drives CelebrationBurst on/off via state)
  const burst = useRef(new Animated.Value(0)).current;
  const [burstActive, setBurstActive] = useState(false);
  // 3. New sprite reveal
  const newScale = useRef(new Animated.Value(0)).current;
  const newOpacity = useRef(new Animated.Value(0)).current;
  // 4. Caption
  const captionScale = useRef(new Animated.Value(0)).current;
  // Backdrop fade
  const backdrop = useRef(new Animated.Value(0)).current;

  const completedRef = useRef(false);
  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setBurstActive(false);
    Animated.timing(backdrop, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onComplete());
  };

  useEffect(() => {
    Animated.timing(backdrop, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      // Phase 1: shrink old + brighten tint
      Animated.parallel([
        Animated.timing(oldScale, {
          toValue: 0.3,
          duration: 600,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tintOpacity, {
          toValue: 0.9,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: burst — drive the legacy `burst` value AND flip the
      // CelebrationBurst on for the duration of this phase.
      Animated.timing(burst, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Phase 3: new sprite reveal — overshoot bounce
      Animated.parallel([
        Animated.timing(tintOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(newOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(newScale, {
            toValue: 1.1,
            duration: 400,
            easing: Easing.out(Easing.back(1.6)),
            useNativeDriver: true,
          }),
          Animated.timing(newScale, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Phase 4: caption
      Animated.spring(captionScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
      // Linger
      Animated.delay(700),
    ]).start(() => finish());

    // Burst window: arm CelebrationBurst when phase-1 completes, disarm when
    // phase-3 (expand) begins. Phase-1 = 600ms, burst phase = next 500ms.
    const armBurst = setTimeout(() => setBurstActive(true), 600);
    const disarmBurst = setTimeout(() => setBurstActive(false), 600 + 500);
    return () => {
      clearTimeout(armBurst);
      clearTimeout(disarmBurst);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable
      onPress={finish}
      style={StyleSheet.absoluteFill}
      pointerEvents="auto"
      accessibilityLabel="Evolution celebration. Tap to continue."
      accessibilityRole="button"
    >
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { opacity: backdrop }]}
        importantForAccessibility="no"
      >
        {/* Magic gradient underlay */}
        <GradientBackdrop variant="magic" intensity="rich" style={styles.fill}>
          {/* Navy scrim for legibility */}
          <View style={styles.scrim} pointerEvents="none" />

          {/* Sprite stage */}
          <View style={styles.spriteArea} importantForAccessibility="no">
            {/* Old sprite shrinking */}
            <Animated.View
              style={[
                styles.spriteCenter,
                {
                  opacity: newOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                  transform: [{ scale: oldScale }],
                },
              ]}
              pointerEvents="none"
              importantForAccessibility="no"
            >
              <SpeciesBadge species={species} stage={fromStage} size={180} />
            </Animated.View>

            {/* White/amber flash overlay */}
            <Animated.View
              pointerEvents="none"
              importantForAccessibility="no"
              style={[styles.flash, { opacity: tintOpacity }]}
            />

            {/* Reanimated burst — only active during burst phase */}
            <View
              pointerEvents="none"
              importantForAccessibility="no"
              style={StyleSheet.absoluteFill}
            >
              <CelebrationBurst
                active={burstActive}
                intensity="normal"
                spread={200}
              />
            </View>

            {/* New sprite rising in */}
            <Animated.View
              style={[
                styles.spriteCenter,
                {
                  opacity: newOpacity,
                  transform: [{ scale: newScale }],
                },
              ]}
              pointerEvents="none"
              importantForAccessibility="no"
            >
              <SpeciesBadge species={species} stage={toStage} size={200} />
            </Animated.View>
          </View>

          {/* Caption — glass Surface + Display typography */}
          <Animated.View
            style={[
              styles.captionWrap,
              { transform: [{ scale: captionScale }] },
            ]}
            pointerEvents="none"
          >
            <Surface variant="glass" padding="md" radius="lg">
              <Typography.Eyebrow tone="onNavy" align="center">
                EVOLUTION
              </Typography.Eyebrow>
              <Typography.Display tone="onNavy" align="center">
                {creatureName} evolved into {stageLabel(toStage)}!
              </Typography.Display>
            </Surface>
          </Animated.View>

          <Typography.Caption
            tone="onNavy"
            align="center"
            style={styles.tapHint}
          >
            tap to continue
          </Typography.Caption>
        </GradientBackdrop>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,26,51,0.55)',
  },
  spriteArea: {
    width: SCREEN_W,
    height: Math.min(360, SCREEN_H * 0.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  spriteCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flash: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.accent,
  },
  captionWrap: {
    marginTop: spacing.xl,
    maxWidth: SCREEN_W - spacing.xl * 2,
  },
  tapHint: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    opacity: 0.7,
    letterSpacing: 1.5,
  },
});
