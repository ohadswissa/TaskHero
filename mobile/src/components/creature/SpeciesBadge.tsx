/**
 * SpeciesBadge — a soft, species-themed gradient halo wrapping the
 * (currently placeholder) creature sprite. Gives each species card a
 * distinct visual identity before real art lands in M7.
 */
import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { Gradient as LinearGradient } from '@/components/common/Gradient';
import { SPECIES_DEFAULTS } from '@/constants/species';
import type { CreatureSpecies, EvolutionStage } from '@/api/creatures.api';
import { getCreatureArt } from '@/assets/creatures/creature-art';
import { shadows } from '@/theme';

interface SpeciesBadgeProps {
  species: CreatureSpecies;
  stage?: EvolutionStage;
  size?: number;
  /** Optional override for the sprite image; defaults to the asset map lookup. */
  source?: ImageSourcePropType;
}

export function SpeciesBadge({
  species,
  stage = 'BABY',
  size = 140,
  source,
}: SpeciesBadgeProps) {
  const meta = SPECIES_DEFAULTS[species];
  const img = source ?? getCreatureArt(species, stage);
  const inner = size * 0.62;

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
          <Image
            source={img}
            style={{ width: inner * 0.78, height: inner * 0.78, resizeMode: 'contain' }}
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
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
