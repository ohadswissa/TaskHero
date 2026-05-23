/**
 * Species defaults — client-side mirror of backend SPECIES_META.
 *
 * Source of truth: backend/src/common/utils/progression.ts (SPECIES_META).
 * Trait associations match plans/demo-flow.md §6.
 *
 * TODO (post-M4): promote to packages/shared-types and import in both
 * backend and mobile.
 */
import type { CreatureSpecies, TraitCategory } from '@/api/creatures.api';

export interface SpeciesDefaultMeta {
  species: CreatureSpecies;
  defaultName: string;
  displayName: string;
  /** "the path of {trait}" tag shown on the species card. */
  trait: TraitCategory;
  /** One-line personality blurb for the species card. */
  personality: string;
  /** Short narrative shown on the species detail card. */
  shortDescription: string;
  /** Soft gradient colors for SpeciesBadge (light → primary). */
  gradient: readonly [string, string];
}

export const SPECIES_DEFAULTS: Record<CreatureSpecies, SpeciesDefaultMeta> = {
  FOREST_PUP: {
    species: 'FOREST_PUP',
    defaultName: 'Mossy',
    displayName: 'Forest Pup',
    trait: 'WISDOM',
    personality: 'Curious and quick to learn.',
    shortDescription: 'A bright-eyed cub of the deep woods — grows wiser with every page you turn.',
    gradient: ['#D8ECC8', '#6B8E4E'] as const,
  },
  SKY_SPRITE: {
    species: 'SKY_SPRITE',
    defaultName: 'Lumi',
    displayName: 'Sky Sprite',
    trait: 'HEART',
    personality: 'Warm and kind, full of light.',
    shortDescription: 'A tiny dawn-spark — its glow brightens when you help the people you love.',
    gradient: ['#E6F0FA', '#9FB8E4'] as const,
  },
  STONE_CUB: {
    species: 'STONE_CUB',
    defaultName: 'Rocky',
    displayName: 'Stone Cub',
    trait: 'STRENGTH',
    personality: 'Sturdy, steady, and brave.',
    shortDescription: 'Forged from mountain moss and quiet courage — grows mighty with every task you tackle.',
    gradient: ['#EFE7D3', '#C0B9A8'] as const,
  },
};

export const ALL_SPECIES: CreatureSpecies[] = ['FOREST_PUP', 'SKY_SPRITE', 'STONE_CUB'];

/** Lightweight regex used by the name input (1–24 chars, letters/digits/space/hyphen). */
export const CREATURE_NAME_REGEX = /^[A-Za-z0-9 \-]{1,24}$/;
export const CREATURE_NAME_MAX_LENGTH = 24;
