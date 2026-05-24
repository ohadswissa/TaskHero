/**
 * <Creature /> — the single consumer-facing programmatic SVG creature.
 *
 * Picks the correct species body component, drives idle motion via
 * react-native-reanimated (emotion-dependent loops), runs a periodic eye
 * blink, and reacts to taps with a one-shot scale bump.
 *
 * API:
 *   <Creature
 *     species={CreatureSpecies}
 *     stage={EvolutionStage}
 *     emotion={EmotionState}    // default 'HAPPY'
 *     size={number}             // default 160
 *     animated={boolean}        // default true
 *     onPress={() => void}
 *     testID={string}
 *   />
 *
 * Idle motion per emotion (worklets, native-driven on RN 0.81+):
 *   HAPPY    — translateY 0 → -4 → 0 over 1500ms ease-in-out, loop.
 *   SAD      — translateX -1 → 1 → -1 over 4500ms, lethargic sway.
 *   EXCITED  — translateY 0 → -8 → 0 over 800ms + scale 1 → 1.04 → 1.
 *   SLEEPING — scale 1 → 1.015 → 1 over 3000ms (breathing).
 *
 * Eye blinks every 4–7 seconds, briefly drops eye height to ~10%.
 *
 * Source of truth for visual direction: plans/demo-flow.md §6 + §7.
 */
import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg from 'react-native-svg';
import type { CreatureSpecies, EvolutionStage } from '@/api/creatures.api';
import { CREATURE_SPECS, type EmotionState } from '@/constants/creatureSpec';
import { ForestPupBody } from './species/ForestPup';
import { SkySpriteBody } from './species/SkySprite';
import { StoneCubBody } from './species/StoneCub';

export interface CreatureProps {
  species: CreatureSpecies;
  stage: EvolutionStage;
  emotion?: EmotionState;
  size?: number;
  animated?: boolean;
  onPress?: () => void;
  testID?: string;
  /** Optional accessibility label override (defaults to "${species} ${stage}"). */
  accessibilityLabel?: string;
}

const SPECIES_BODY = {
  FOREST_PUP: ForestPupBody,
  SKY_SPRITE: SkySpriteBody,
  STONE_CUB: StoneCubBody,
} as const;

export function Creature({
  species,
  stage,
  emotion = 'HAPPY',
  size = 160,
  animated = true,
  onPress,
  testID,
  accessibilityLabel,
}: CreatureProps) {
  const spec = CREATURE_SPECS[species];
  const Body = SPECIES_BODY[species];

  // ---- Idle motion shared values --------------------------------------
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const idleScale = useSharedValue(1);
  const tapScale = useSharedValue(1);

  // Blink shared value: 1 = eyes open, 0.1 = closed.
  const blink = useSharedValue(1);
  const [blinkN, setBlinkN] = React.useState(1);

  // Drive idle animation per emotion.
  useEffect(() => {
    cancelAnimation(translateY);
    cancelAnimation(translateX);
    cancelAnimation(idleScale);
    translateY.value = 0;
    translateX.value = 0;
    idleScale.value = 1;
    if (!animated) return;

    if (emotion === 'HAPPY') {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 750, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 750, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else if (emotion === 'SAD') {
      translateX.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2250, easing: Easing.inOut(Easing.quad) }),
          withTiming(-1, { duration: 2250, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else if (emotion === 'EXCITED') {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      );
      idleScale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 400, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else if (emotion === 'SLEEPING') {
      idleScale.value = withRepeat(
        withSequence(
          withTiming(1.015, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }
    return () => {
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(idleScale);
    };
  }, [emotion, animated, translateY, translateX, idleScale]);

  // Blink loop — not when sleeping or sad (eyes already closed/droopy).
  useEffect(() => {
    if (!animated || emotion === 'SLEEPING' || emotion === 'SAD') {
      setBlinkN(1);
      return;
    }
    let cancelled = false;
    const schedule = () => {
      if (cancelled) return;
      const wait = 4000 + Math.random() * 3000;
      const timeout = setTimeout(() => {
        if (cancelled) return;
        setBlinkN(0.1);
        const close = setTimeout(() => {
          if (cancelled) return;
          setBlinkN(1);
          schedule();
        }, 120);
        // hold for next blink
        return () => clearTimeout(close);
      }, wait);
      return () => clearTimeout(timeout);
    };
    const stop = schedule();
    return () => {
      cancelled = true;
      if (typeof stop === 'function') stop();
    };
  }, [animated, emotion]);

  // Tap reaction — one-shot scale bump, composed atop idle.
  const handlePress = useCallback(() => {
    if (animated) {
      tapScale.value = withSequence(
        withTiming(1.08, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 130, easing: Easing.in(Easing.quad) }),
      );
    }
    onPress?.();
  }, [animated, onPress, tapScale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: idleScale.value * tapScale.value },
      ],
    };
  }, []);

  const label = accessibilityLabel ?? `${spec.defaultName} the ${stageLabel(stage)} ${species.replace('_', ' ').toLowerCase()}`;

  const inner = useMemo(
    () => (
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Body spec={spec} stage={stage} emotion={emotion} blink={blinkN} />
      </Svg>
    ),
    [Body, spec, stage, emotion, size, blinkN],
  );

  const content = (
    <Animated.View style={animatedStyle} testID={testID}>
      {inner}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={8}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View accessibilityRole="image" accessibilityLabel={label}>
      {content}
    </View>
  );
}

function stageLabel(stage: EvolutionStage): string {
  switch (stage) {
    case 'EGG':
      return 'egg';
    case 'BABY':
      return 'baby';
    case 'ADOLESCENT':
      return 'adolescent';
    case 'ADULT':
      return 'adult';
  }
}
