/**
 * Creature art asset map.
 *
 * The visual demo needs 4 stages (EGG / BABY / ADOLESCENT / ADULT) × 3
 * species (FOREST_PUP / SKY_SPRITE / STONE_CUB) = 12 sprite slots. Real
 * artwork lands in M7. Until then every slot resolves to the existing
 * brand mark at mobile/assets/taskhero.png so the structure is wired but
 * the screens visually fall back to the SpeciesBadge gradient halo around
 * the placeholder.
 *
 * To swap in real art later, drop the PNGs into mobile/assets/creatures/
 * and replace the `require(...)` calls below — no other file needs to
 * change.
 */
import type { ImageSourcePropType } from 'react-native';
import type { CreatureSpecies, EvolutionStage } from '@/api/creatures.api';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const placeholder: ImageSourcePropType = require('../../../assets/taskhero.png');

export const creatureArt: Record<CreatureSpecies, Record<EvolutionStage, ImageSourcePropType>> = {
  FOREST_PUP: {
    EGG: placeholder,
    BABY: placeholder,
    ADOLESCENT: placeholder,
    ADULT: placeholder,
  },
  SKY_SPRITE: {
    EGG: placeholder,
    BABY: placeholder,
    ADOLESCENT: placeholder,
    ADULT: placeholder,
  },
  STONE_CUB: {
    EGG: placeholder,
    BABY: placeholder,
    ADOLESCENT: placeholder,
    ADULT: placeholder,
  },
};

export function getCreatureArt(
  species: CreatureSpecies,
  stage: EvolutionStage,
): ImageSourcePropType {
  return creatureArt[species]?.[stage] ?? placeholder;
}

/** Egg art is species-agnostic in the demo but the API takes species for forward compat. */
export function getEggArt(species: CreatureSpecies = 'FOREST_PUP'): ImageSourcePropType {
  return creatureArt[species].EGG;
}
