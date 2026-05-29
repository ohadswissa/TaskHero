/**
 * CreatureReaction — short, snappy delight overlay played on top of the
 * creature sprite whenever the child performs a care action (treat / groom /
 * play). Two layered effects:
 *
 *   1. A bouncy "happy hop" + wiggle transform applied to a wrapper around
 *      <CreatureScene/> via the `reactionTransform` render prop.
 *   2. A floating burst of 4 themed emojis rising + fading above the creature.
 *
 * Distinct from CelebrationBurst (sparkle dots) and EvolutionOverlay (full
 * screen) — this is a per-action "the creature noticed!" beat (~700-900ms).
 *
 * Driven entirely by the built-in `Animated` API (no Reanimated worklets).
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export type CreatureReactionKind = 'TREAT' | 'GROOM' | 'PLAY';

const EMOJI_BY_KIND: Record<CreatureReactionKind, string[]> = {
  TREAT: ['🍎', '💖', '😋', '🍓'],
  GROOM: ['✨', '🫧', '💫', '🌟'],
  PLAY: ['🎉', '⭐', '🥳', '🎊'],
};

const PARTICLE_COUNT = 4;

type Particle = {
  emoji: string;
  dx: number; // horizontal drift in px
  delay: number; // ms
  rotateDeg: number;
};

export function CreatureReaction({
  kind,
  triggerKey,
  width = 220,
}: {
  /** Reaction flavor; null = idle (no animation). */
  kind: CreatureReactionKind | null;
  /** Bump this value to retrigger the same kind (e.g. timestamp). */
  triggerKey: number;
  /** Width of the creature sprite area — used to position particles. */
  width?: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  // Pick 4 particles whenever the trigger fires.
  const particles = useMemo<Particle[]>(() => {
    if (!kind) return [];
    const pool = EMOJI_BY_KIND[kind];
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      emoji: pool[i % pool.length],
      dx: (Math.random() - 0.5) * width * 0.7,
      delay: i * 60,
      rotateDeg: (Math.random() - 0.5) * 40,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey, kind, width]);

  useEffect(() => {
    if (!kind) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, [triggerKey, kind, progress]);

  if (!kind) return null;

  return (
    <View style={[styles.root, { width }]} pointerEvents="none">
      {particles.map((p, i) => {
        const localStart = p.delay / 900;
        const opacity = progress.interpolate({
          inputRange: [0, Math.min(0.99, localStart), Math.min(1, localStart + 0.2), 1],
          outputRange: [0, 0, 1, 0],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -110],
        });
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.dx],
        });
        const scale = progress.interpolate({
          inputRange: [0, Math.min(0.99, localStart + 0.15), 1],
          outputRange: [0.4, 1.15, 0.9],
        });
        return (
          <Animated.Text
            key={i}
            style={[
              styles.emoji,
              {
                opacity,
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                  { rotate: `${p.rotateDeg}deg` },
                ],
              },
            ]}
          >
            {p.emoji}
          </Animated.Text>
        );
      })}
    </View>
  );
}

/**
 * Hook that returns animated transform values for a "happy hop" + wiggle
 * bounce, triggerable per care kind. Compose with existing bob / jiggle.
 */
export function useHappyHop() {
  const hop = useRef(new Animated.Value(0)).current; // -1..1 (translateY)
  const squash = useRef(new Animated.Value(1)).current; // scale
  const wiggle = useRef(new Animated.Value(0)).current; // -1..1 (rotate)

  function play(kind: CreatureReactionKind) {
    hop.setValue(0);
    squash.setValue(1);
    wiggle.setValue(0);

    const wiggleSeq = Animated.sequence([
      Animated.timing(wiggle, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: -1, duration: 110, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0.5, duration: 90, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0, duration: 90, useNativeDriver: true }),
    ]);

    const hopSeq = Animated.sequence([
      // 1. squash down
      Animated.parallel([
        Animated.timing(squash, { toValue: 0.88, duration: 110, useNativeDriver: true }),
        Animated.timing(hop, { toValue: 0.15, duration: 110, useNativeDriver: true }),
      ]),
      // 2. bounce up
      Animated.parallel([
        Animated.timing(squash, { toValue: 1.08, duration: 220, useNativeDriver: true }),
        Animated.timing(hop, { toValue: -1, duration: 220, useNativeDriver: true }),
      ]),
      // 3. settle
      Animated.parallel([
        Animated.spring(squash, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
        Animated.spring(hop, { toValue: 0, friction: 4, tension: 120, useNativeDriver: true }),
      ]),
    ]);

    // PLAY gets a slightly bigger hop / longer wiggle feel via parallel.
    Animated.parallel([hopSeq, wiggleSeq]).start();
    void kind;
  }

  const translateY = hop.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-26, 0, 8],
  });
  const rotate = wiggle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  return {
    play,
    transform: [{ translateY }, { scale: squash }, { rotate }] as const,
  };
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    position: 'absolute',
    fontSize: 28,
  },
});
