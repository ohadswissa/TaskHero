/**
 * Compatibility shim — Polish-A removed the PNG-based creature art map
 * in favor of programmatic <Creature/> SVGs. This file remains so any
 * forgotten imports of `getCreatureArt` / `creatureArt` / `getEggArt`
 * don't crash; they return the brand-mark placeholder + log a warning.
 *
 * DELETE in a future cleanup once no call sites remain.
 */
import type { ImageSourcePropType } from 'react-native';
import type { CreatureSpecies, EvolutionStage } from '@/api/creatures.api';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const placeholder: ImageSourcePropType = require('../../../assets/taskhero.png');

let warned = false;
function warnDeprecated(fn: string) {
  if (warned) return;
  warned = true;
  // eslint-disable-next-line no-console
  console.warn(
    `[creature-art] ${fn} is deprecated — use <Creature/> from @/components/creature/Creature instead.`,
  );
}

export const creatureArt: Record<CreatureSpecies, Record<EvolutionStage, ImageSourcePropType>> = {
  FOREST_PUP: { EGG: placeholder, BABY: placeholder, ADOLESCENT: placeholder, ADULT: placeholder },
  SKY_SPRITE: { EGG: placeholder, BABY: placeholder, ADOLESCENT: placeholder, ADULT: placeholder },
  STONE_CUB: { EGG: placeholder, BABY: placeholder, ADOLESCENT: placeholder, ADULT: placeholder },
};

export function getCreatureArt(
  _species: CreatureSpecies,
  _stage: EvolutionStage,
): ImageSourcePropType {
  warnDeprecated('getCreatureArt');
  return placeholder;
}

export function getEggArt(_species: CreatureSpecies = 'FOREST_PUP'): ImageSourcePropType {
  warnDeprecated('getEggArt');
  return placeholder;
}
