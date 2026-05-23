import apiClient from './client';
import type { ChildProfile, CreateChildRequest, CreateChildResponse } from './types';

export const childrenApi = {
  createChild: async (data: CreateChildRequest): Promise<CreateChildResponse> => {
    const res = await apiClient.post<CreateChildResponse>('/children', data);
    return res.data;
  },

  listChildren: async (): Promise<ChildProfile[]> => {
    const res = await apiClient.get<ChildProfile[]>('/children');
    return res.data;
  },

  resetPin: async (id: string): Promise<{ pin: string }> => {
    const res = await apiClient.post<{ pin: string }>(`/children/${id}/reset-pin`);
    return res.data;
  },
};

export type { ChildProfile, CreateChildRequest, CreateChildResponse };
