import apiClient from './client';
import type {
  CreateRewardRequest,
  FamilyRewardsResponse,
  Reward,
  RewardWithProgress,
} from './types';

export const rewardsApi = {
  createReward: async (payload: CreateRewardRequest): Promise<Reward> => {
    const res = await apiClient.post<Reward>('/rewards', payload);
    return res.data;
  },

  listFamilyRewards: async (): Promise<FamilyRewardsResponse> => {
    const res = await apiClient.get<FamilyRewardsResponse>('/rewards/family');
    return res.data;
  },

  /** Child-role — single active reward goal with derived progress. M5 will consume. */
  getMyActiveReward: async (): Promise<RewardWithProgress | null> => {
    const res = await apiClient.get<RewardWithProgress | null>('/rewards/mine/active');
    return res.data;
  },

  /** Child-role — all ACTIVE family rewards visible to the child with per-child progress. */
  listMyFamilyRewards: async (): Promise<RewardWithProgress[]> => {
    const res = await apiClient.get<RewardWithProgress[]>('/rewards/mine/family');
    return res.data;
  },

  redeemReward: async (id: string): Promise<Reward> => {
    const res = await apiClient.post<Reward>(`/rewards/${id}/redeem`);
    return res.data;
  },
};

export type { CreateRewardRequest, FamilyRewardsResponse, Reward, RewardWithProgress };
