/**
 * Creatures API client. See plans/demo-flow.md §4 — endpoints:
 *   GET  /creatures/me              → current creature (or 404 if not hatched)
 *   POST /creatures/me/onboard      → hatch the egg with species + name
 *   POST /creatures/me/feed         → consume a care item (M5)
 *
 * Backend 404 contract (see backend/src/modules/creatures/creatures.service.ts):
 *   message === 'Creature has not been hatched yet'
 *
 * Our shared axios client (mobile/src/api/client.ts) rethrows a plain Error
 * but now decorates it with `.status`. We treat status===404 OR the known
 * message string as the "no creature yet" signal and return null.
 */
import apiClient from './client';

// =====================================================================
// Types — minimal local mirrors of the backend Prisma enums + model.
// TODO (M5+): promote to packages/shared-types and consume from there.
// =====================================================================
export type CreatureSpecies = 'FOREST_PUP' | 'SKY_SPRITE' | 'STONE_CUB';
export type EvolutionStage = 'EGG' | 'BABY' | 'ADOLESCENT' | 'ADULT';
export type TraitCategory = 'STRENGTH' | 'WISDOM' | 'HEART';

export interface CareItem {
  id: string;
  creatureId: string;
  traitCategory: TraitCategory;
  itemSlug: string;
  happinessDelta: number;
  traitPointDelta: number;
  earnedFromAssignmentId: string | null;
  earnedAt: string;
  consumedAt: string | null;
}

export interface Creature {
  id: string;
  childProfileId: string;
  species: CreatureSpecies;
  name: string;
  stage: EvolutionStage;
  happiness: number;
  lastHappinessTickAt: string;
  strengthPoints: number;
  wisdomPoints: number;
  heartPoints: number;
  babyEvolvedAt: string | null;
  adolescentEvolvedAt: string | null;
  adolescentDominantTrait: TraitCategory | null;
  adultEvolvedAt: string | null;
  adultDominantTrait: TraitCategory | null;
  createdAt: string;
  updatedAt: string;
  pendingCareItems?: CareItem[];
}

export interface OnboardPayload {
  species: CreatureSpecies;
  name?: string;
}

export interface FeedPayload {
  careItemId: string;
}

// =====================================================================
// API surface
// =====================================================================
function isNotHatchedError(err: unknown): boolean {
  const e = err as { status?: number; message?: string } | null;
  if (!e) return false;
  if (e.status === 404) return true;
  // Backend message is stable — see creatures.service.getMine().
  if (typeof e.message === 'string' && /has not been hatched/i.test(e.message)) {
    return true;
  }
  return false;
}

export const creaturesApi = {
  /**
   * Returns the calling child's creature, or `null` if it hasn't been
   * hatched yet (backend responds 404 with message
   * "Creature has not been hatched yet").
   */
  getMyCreature: async (): Promise<Creature | null> => {
    try {
      const res = await apiClient.get<Creature>('/creatures/me');
      return res.data;
    } catch (err) {
      if (isNotHatchedError(err)) return null;
      throw err;
    }
  },

  /** Hatch the egg. Transitions EGG → BABY server-side. */
  onboardCreature: async (payload: OnboardPayload): Promise<Creature> => {
    const res = await apiClient.post<Creature>('/creatures/me/onboard', payload);
    return res.data;
  },

  /**
   * Consume a pending CareItem. Defined now so M5 can wire it in without
   * touching this file again — NOT used during M4 onboarding.
   */
  feedCreature: async (careItemId: string): Promise<Creature> => {
    const res = await apiClient.post<Creature>('/creatures/me/feed', { careItemId });
    return res.data;
  },
};
