/**
 * EvolutionOverlay — M7a.
 *
 * Fullscreen celebratory animation that plays on the Creature Hub when the
 * child's creature stage transitions (BABY → ADOLESCENT, ADOLESCENT → ADULT,
 * or EGG → BABY for completeness). Sequence (~1.8s total):
 *
 *   0-600ms   Old sprite shrinks scale 1.0 → 0.3, white tint fades 0 → 0.9
 *   500-1000ms Burst — 8 ✨ particles emanate outward from center
 *   900-1500ms New sprite fades in scale 0.5 → 1.1 → 1.0 (overshoot bounce)
 *   1300-1800ms Caption card slides up + scales 0 → 1
 *
 * Tap anywhere to skip the rest of the sequence. After completion the
 * overlay auto-dismisses via onComplete.
 *
 * Visual direction (plans/demo-flow.md §7): warm fantasy, navy + amber.
 * The white tint flashes amber-tinted, the caption card uses cream +
 * amber border.
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { SpeciesBadge } from './SpeciesBadge';
import type { CreatureSpecies, EvolutionStage } from '@/api/creatures.api';
import { borderRadius, colors, fonts, shadows, spacing } from '@/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface EvolutionOverlayProps {
  species: CreatureSpecies;
  fromStage: EvolutionStage;
  toStage: EvolutionStage;
  creatureName: string;
  onComplete: () => void;
}

const PARTICLE_COUNT = 8;

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
  // 2. Burst
  const burst = useRef(new Animated.Value(0)).current;
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
      // Phase 2: burst
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable
      onPress={finish}
      style={StyleSheet.absoluteFill}
      pointerEvents="auto"
    >
      <Animated.View
        style={[
          styles.root,
          { opacity: backdrop },
        ]}
      >
        {/* Sprite stage */}
        <View style={styles.spriteArea}>
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
          >
            <SpeciesBadge species={species} stage={fromStage} size={180} />
          </Animated.View>

          {/* White/amber flash overlay */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.flash,
              { opacity: tintOpacity },
            ]}
          />

          {/* Burst particles */}
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
            const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
            const dist = 140;
            const tx = burst.interpolate({
              inputRange: [0, 1],
              outputRange: [0, Math.cos(angle) * dist],
            });
            const ty = burst.interpolate({
              inputRange: [0, 1],
              outputRange: [0, Math.sin(angle) * dist],
            });
            const opacity = burst.interpolate({
              inputRange: [0, 0.2, 1],
              outputRange: [0, 1, 0],
            });
            const scale = burst.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.5, 1.4, 0.6],
            });
            return (
              <Animated.Text
                key={i}
                pointerEvents="none"
                style={[
                  styles.particle,
                  {
                    opacity,
                    transform: [{ translateX: tx }, { translateY: ty }, { scale }],
                  },
                ]}
              >
                ✨
              </Animated.Text>
            );
          })}

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
          >
            <SpeciesBadge species={species} stage={toStage} size={200} />
          </Animated.View>
        </View>

        {/* Caption */}
        <Animated.View
          style={[
            styles.caption,
            { transform: [{ scale: captionScale }] },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.captionEyebrow}>EVOLUTION</Text>
          <Text style={styles.captionTitle}>
            {creatureName} evolved into {stageLabel(toStage)}!
          </Text>
        </Animated.View>

        <Text style={styles.tapHint}>tap to continue</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 27, 61, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
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
  particle: {
    position: 'absolute',
    fontSize: 26,
    color: colors.accent,
  },
  caption: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    maxWidth: SCREEN_W - spacing.xl * 2,
    ...shadows.lg,
  },
  captionEyebrow: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.primary,
    opacity: 0.7,
    marginBottom: 4,
  },
  captionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.primary,
    textAlign: 'center',
  },
  tapHint: {
    position: 'absolute',
    bottom: spacing.xl,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.white,
    opacity: 0.6,
    letterSpacing: 1.5,
  },
});
