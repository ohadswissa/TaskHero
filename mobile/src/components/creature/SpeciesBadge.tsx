/**
 * SpeciesBadge — species-tinted gradient halo wrapping the programmatic
 * SVG Creature (Polish-A).
 *
 * Previously rendered a single emoji glyph on top of a colored halo
 * (M7b placeholder). Now the halo houses a real <Creature /> drawn in
 * react-native-svg + reanimated. Callers can pass `emotion` and
 * `animated` props through — defaults preserve the prior visual where
 * the badge was a card thumbnail (animated=false for tiny sizes).
 *
 * The `source` prop on the legacy API is intentionally ignored — the
 * sprite is now generated, not loaded.
 */
import React from 'react';
import { View, StyleSheet, ImageSourcePropType } from 'react-native';
import { Gradient as LinearGradient } from '@/components/common/Gradient';
import { SPECIES_DEFAULTS } from '@/constants/species';
import type { CreatureSpecies, EvolutionStage } from '@/api/creatures.api';
import { shadows } from '@/theme';
import { Creature } from './Creature';
import type { EmotionState } from '@/constants/creatureSpec';

interface SpeciesBadgeProps {
  species: CreatureSpecies;
  stage?: EvolutionStage;
  size?: number;
  /** Default emotion for the inner creature. Defaults to HAPPY. */
  emotion?: EmotionState;
  /** Whether the inner creature animates. Defaults to true for size >= 120, false otherwise. */
  animated?: boolean;
  /** Deprecated — legacy override, ignored. */
  source?: ImageSourcePropType;
  onPress?: () => void;
}

export function SpeciesBadge({
  species,
  stage = 'BABY',
  size = 140,
  emotion = 'HAPPY',
  animated,
  onPress,
}: SpeciesBadgeProps) {
  const meta = SPECIES_DEFAULTS[species];
  const inner = size * 0.78;
  // Default animation policy: only animate for prominent sizes to keep
  // cards/list rows performant.
  const shouldAnimate = animated ?? size >= 120;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <LinearGradient
        colors={meta.gradient}
        style={[styles.halo, { width: size, height: size, borderRadius: size / 2 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View
          style={[
            styles.inner,
            {
              width: inner,
              height: inner,
              borderRadius: inner / 2,
            },
          ]}
        >
          <Creature
            species={species}
            stage={stage}
            emotion={emotion}
            size={inner * 0.92}
            animated={shouldAnimate}
            onPress={onPress}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  inner: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
