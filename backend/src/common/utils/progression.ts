/**
 * Progression constants — single source of truth for the creature evolution
 * thresholds, happiness mechanics, and reward goal limits used by the demo.
 *
 * See plans/demo-flow.md §3.2 and §3.3 for the design rationale.
 */

import { CreatureSpecies, EvolutionStage, TraitCategory } from '@prisma/client';

// =========================================================================
// Evolution thresholds (mission count required to reach each stage)
// Production spec values — see plans/demo-flow.md §3.2 decision (2026-05-23).
// =========================================================================
export const BABY_THRESHOLD = 20;
export const ADOLESCENT_THRESHOLD = 60;
export const ADULT_THRESHOLD = 120;

/**
 * Compute the current evolution stage from total verified missions.
 * The "egg → baby" transition only happens after the child has selected a
 * species (onboarded). For a creature still in EGG state, callers must check
 * `stage === EGG` separately.
 */
export function stageForMissionCount(count: number): EvolutionStage {
  if (count >= ADULT_THRESHOLD) return EvolutionStage.ADULT;
  if (count >= ADOLESCENT_THRESHOLD) return EvolutionStage.ADOLESCENT;
  if (count >= BABY_THRESHOLD) return EvolutionStage.BABY;
  return EvolutionStage.EGG;
}

/**
 * The dominant trait at the moment of evolution. Used to record the visual
 * form so it stays stable even if dominance shifts later.
 * Ties broken in order: STRENGTH > WISDOM > HEART.
 */
export function dominantTrait(strength: number, wisdom: number, heart: number): TraitCategory {
  const max = Math.max(strength, wisdom, heart);
  if (strength === max) return TraitCategory.STRENGTH;
  if (wisdom === max) return TraitCategory.WISDOM;
  return TraitCategory.HEART;
}

// =========================================================================
// Happiness mechanics
// =========================================================================
export const HAPPINESS_MAX = 100;
export const HAPPINESS_MIN = 0;
/** Default happiness for a freshly hatched creature. */
export const HAPPINESS_DEFAULT = 50;
/** Points the happiness bar depletes per hour without interaction. */
export const HAPPINESS_DEPLETION_PER_HOUR = 3;
/** Default happiness gain when a single CareItem is consumed. */
export const HAPPINESS_PER_CARE_ITEM = 10;

/**
 * Apply happiness depletion based on elapsed time since the last tick.
 * Pure function — caller persists the result.
 */
export function tickHappiness(
  currentHappiness: number,
  lastTickAt: Date,
  now: Date = new Date(),
): number {
  const hoursElapsed = (now.getTime() - lastTickAt.getTime()) / (1000 * 60 * 60);
  const depletion = hoursElapsed * HAPPINESS_DEPLETION_PER_HOUR;
  return Math.max(HAPPINESS_MIN, Math.round(currentHappiness - depletion));
}

// =========================================================================
// Species metadata — default name + display info per species
// =========================================================================
export interface SpeciesMeta {
  species: CreatureSpecies;
  defaultName: string;
  displayName: string;
  shortDescription: string;
  personality: string;
  palette: { primary: string; accent: string };
}

export const SPECIES_META: Record<CreatureSpecies, SpeciesMeta> = {
  [CreatureSpecies.FOREST_PUP]: {
    species: CreatureSpecies.FOREST_PUP,
    defaultName: 'Mossy',
    displayName: 'Forest Pup',
    shortDescription: 'Playful and loyal — grows wild and adventurous.',
    personality: 'playful, loyal',
    palette: { primary: '#6B8E4E', accent: '#A8C97F' },
  },
  [CreatureSpecies.SKY_SPRITE]: {
    species: CreatureSpecies.SKY_SPRITE,
    defaultName: 'Lumi',
    displayName: 'Sky Sprite',
    shortDescription: 'Curious and bright — grows ethereal and glowing.',
    personality: 'curious, bright',
    palette: { primary: '#F5C16C', accent: '#9FB8E4' },
  },
  [CreatureSpecies.STONE_CUB]: {
    species: CreatureSpecies.STONE_CUB,
    defaultName: 'Rocky',
    displayName: 'Stone Cub',
    shortDescription: 'Calm and steady — grows sturdy and noble.',
    personality: 'calm, steady',
    palette: { primary: '#8C8478', accent: '#C0B9A8' },
  },
};

// =========================================================================
// Trait → CareItem mapping (Strength→food, Wisdom→toy, Heart→accessory)
// =========================================================================
export interface CareItemSpec {
  itemSlug: string;
  happinessDelta: number;
  traitPointDelta: number;
}

/**
 * Returns a deterministic-ish CareItem spec for a given trait.
 * For the demo we cycle through a small pool per trait.
 */
const CARE_ITEM_POOLS: Record<TraitCategory, string[]> = {
  [TraitCategory.STRENGTH]: ['berry', 'honeycake', 'roast_root'],
  [TraitCategory.WISDOM]: ['puzzle_cube', 'star_chart', 'feather_quill'],
  [TraitCategory.HEART]: ['flower_crown', 'silk_ribbon', 'glowing_leaf'],
};

export function careItemForTrait(trait: TraitCategory, seed: number = Date.now()): CareItemSpec {
  const pool = CARE_ITEM_POOLS[trait];
  const itemSlug = pool[seed % pool.length];
  return {
    itemSlug,
    happinessDelta: HAPPINESS_PER_CARE_ITEM,
    traitPointDelta: 1,
  };
}

/**
 * Maps the legacy MissionCategory enum to a TraitCategory when a mission
 * lacks an explicit traitCategory field. See plans/demo-flow.md §3.1.
 */
export function deriveTraitFromCategory(category: string): TraitCategory {
  switch (category) {
    case 'DAILY_CHORE':
    case 'PHYSICAL':
    case 'OUTDOOR':
      return TraitCategory.STRENGTH;
    case 'EDUCATIONAL':
    case 'CREATIVE':
      return TraitCategory.WISDOM;
    case 'HABIT':
    default:
      return TraitCategory.HEART;
  }
}

// =========================================================================
// Reward goal templates — surfaced to parents in the Create Reward screen
// =========================================================================
export interface RewardGoalTemplate {
  name: string;
  coinThreshold: number;
  rewardDetails: string;
}

export const REWARD_GOAL_TEMPLATES: RewardGoalTemplate[] = [
  {
    name: 'Pizza night',
    coinThreshold: 80,
    rewardDetails: 'Parent orders / prepares pizza for dinner',
  },
  {
    name: 'Extra screen time (30 min)',
    coinThreshold: 40,
    rewardDetails: 'Parent grants 30 extra minutes of screen time',
  },
  {
    name: 'Trip to the park / playground',
    coinThreshold: 60,
    rewardDetails: 'Parent takes the child on a trip out',
  },
  {
    name: 'Choose the movie tonight',
    coinThreshold: 30,
    rewardDetails: 'Child picks the family movie',
  },
  {
    name: 'New book (child picks)',
    coinThreshold: 100,
    rewardDetails: 'Parent purchases a book the child chooses',
  },
];

// =========================================================================
// Demo limits
// =========================================================================
/** Demo enforces single active reward goal per child (UI + service guard). */
export const MAX_ACTIVE_REWARD_GOALS_PER_CHILD = 1;
/** Max characters of a parent's Hero Mail message. */
export const HERO_MAIL_MAX_LENGTH = 280;
