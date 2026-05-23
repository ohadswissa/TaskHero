/**
 * Progression API client (M7a).
 *
 * Backend:
 *   GET /progression/trait-summary?childProfileId=<id>  → parent reads any
 *     child in their family. Response: { strength, wisdom, heart, total }.
 *   GET /progression/mine                               → child reads self.
 *
 * Used by the parent dashboard radar chart.
 */
import apiClient from './client';

export interface TraitSummary {
  strength: number;
  wisdom: number;
  heart: number;
  total: number;
}

export const progressionApi = {
  /** Parent reads any child in the family. */
  traitSummary: async (childProfileId: string): Promise<TraitSummary> => {
    const res = await apiClient.get<TraitSummary>('/progression/trait-summary', {
      params: { childProfileId },
    });
    return res.data;
  },

  /** Child reads their own. */
  mine: async (): Promise<TraitSummary> => {
    const res = await apiClient.get<TraitSummary>('/progression/mine');
    return res.data;
  },
};
