/**
 * CREATURE_SPECS — typed palette + adornment catalog driving the
 * programmatic SVG creature renderer (Polish-A).
 *
 * Source of truth for visual direction:
 *   plans/demo-flow.md §6 (3 species) and §7 (warm fantasy, navy + amber).
 *
 * Each species defines:
 *   - palette: body / shading / accent / eye / glow / sparkle colors
 *   - habitatGradient: soft backdrop tint used by <CreatureScene/>
 *   - stageSizes: per-stage scale multiplier (1.0 = baseline)
 *   - adornments: species-specific flags read by the species components
 *
 * The palettes are bright enough to read clearly on the navy app shell
 * while remaining inside the warm-fantasy color universe (cohesive with
 * amber/cream accents in theme/index.ts).
 */
import type {
  CreatureSpecies,
  EvolutionStage,
  TraitCategory,
} from '@/api/creatures.api';

export type EmotionState = 'HAPPY' | 'SAD' | 'EXCITED' | 'SLEEPING';

export interface CreaturePalette {
  /** main body fill */
  body: string;
  /** shading / underside */
  bodyDark: string;
  /** highlight */
  bodyLight: string;
  /** ears, tail tip, secondary accents */
  accent: string;
  /** color of the emotion glow ring */
  glow: string;
  /** iris fill */
  eye: string;
  /** pupil + eye outline */
  pupil: string;
  /** tiny shine highlight on the eye */
  sparkle: string;
  /** egg shell tint (used in EGG stage) */
  egg: string;
  /** egg shell mottled spot tint */
  eggSpot: string;
}

export interface CreatureAdornments {
  /** Forest Pup: visible moss tuft from adolescent onward. */
  mossTuft?: boolean;
  /** Sky Sprite: visible wisp wings from adolescent onward. */
  wispWings?: boolean;
  /** Stone Cub: visible chest stone from baby onward (small), full crack pattern at adult. */
  chestStone?: boolean;
}

export interface CreatureSpec {
  species: CreatureSpecies;
  defaultName: string;
  trait: TraitCategory;
  palette: CreaturePalette;
  /** Soft radial backdrop gradient used by <CreatureScene/>. */
  habitatGradient: readonly [string, string];
  /** Body scale multiplier per stage (1.0 = baseline 100px in a 100 viewBox). */
  stageSizes: Record<EvolutionStage, number>;
  adornments: CreatureAdornments;
}

// ---------------------------------------------------------------------------
// Forest Pup — Mossy, WISDOM, deep-forest greens with golden accents.
// ---------------------------------------------------------------------------
const FOREST_PUP_SPEC: CreatureSpec = {
  species: 'FOREST_PUP',
  defaultName: 'Mossy',
  trait: 'WISDOM',
  palette: {
    body: '#A8C97A',
    bodyDark: '#6E8E47',
    bodyLight: '#D6E8B0',
    accent: '#E8B547',
    glow: '#F4D77A',
    eye: '#F5B742',
    pupil: '#3A2B12',
    sparkle: '#FFF6D9',
    egg: '#C8DDA0',
    eggSpot: '#7C9A52',
  },
  habitatGradient: ['#E8F2D4', '#A8C97A'] as const,
  stageSizes: { EGG: 0.78, BABY: 0.88, ADOLESCENT: 0.96, ADULT: 1.04 },
  adornments: { mossTuft: true },
};

// ---------------------------------------------------------------------------
// Sky Sprite — Lumi, HEART, pearl-azure & lavender with silver wisps.
// ---------------------------------------------------------------------------
const SKY_SPRITE_SPEC: CreatureSpec = {
  species: 'SKY_SPRITE',
  defaultName: 'Lumi',
  trait: 'HEART',
  palette: {
    body: '#D8E6FA',
    bodyDark: '#9AB0DA',
    bodyLight: '#F2F6FF',
    accent: '#C9B6F0',
    glow: '#BFE6FF',
    eye: '#8B6CD8',
    pupil: '#2A1A55',
    sparkle: '#FFFFFF',
    egg: '#E6F0FA',
    eggSpot: '#A8C0E6',
  },
  habitatGradient: ['#F2F6FF', '#BFD4F2'] as const,
  stageSizes: { EGG: 0.78, BABY: 0.86, ADOLESCENT: 0.94, ADULT: 1.02 },
  adornments: { wispWings: true },
};

// ---------------------------------------------------------------------------
// Stone Cub — Rocky, STRENGTH, warm tan & slate with amber chest stone.
// ---------------------------------------------------------------------------
const STONE_CUB_SPEC: CreatureSpec = {
  species: 'STONE_CUB',
  defaultName: 'Rocky',
  trait: 'STRENGTH',
  palette: {
    body: '#D6B98A',
    bodyDark: '#8E7250',
    bodyLight: '#EFD9B2',
    accent: '#6F6A60',
    glow: '#F2A65A',
    eye: '#E48A2D',
    pupil: '#2E1A08',
    sparkle: '#FFF1D6',
    egg: '#E2CCA4',
    eggSpot: '#A88556',
  },
  habitatGradient: ['#F0E2C6', '#C0A37A'] as const,
  stageSizes: { EGG: 0.78, BABY: 0.90, ADOLESCENT: 1.00, ADULT: 1.08 },
  adornments: { chestStone: true },
};

export const CREATURE_SPECS: Record<CreatureSpecies, CreatureSpec> = {
  FOREST_PUP: FOREST_PUP_SPEC,
  SKY_SPRITE: SKY_SPRITE_SPEC,
  STONE_CUB: STONE_CUB_SPEC,
};

export const ALL_EVOLUTION_STAGES: EvolutionStage[] = [
  'EGG',
  'BABY',
  'ADOLESCENT',
  'ADULT',
];

export const ALL_EMOTIONS: EmotionState[] = ['HAPPY', 'SAD', 'EXCITED', 'SLEEPING'];
