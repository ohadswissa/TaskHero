import apiClient from './client';

export interface FamilyMe {
  id: string;
  name: string;
  inviteCode: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export const familiesApi = {
  getMyFamily: async (): Promise<FamilyMe> => {
    const res = await apiClient.get<FamilyMe>('/families/me');
    return res.data;
  },
};
