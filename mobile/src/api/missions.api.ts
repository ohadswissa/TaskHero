import apiClient from './client';
import type { CreateMissionRequest, Mission, MissionTemplate } from './types';

export const missionsApi = {
  listTemplates: async (theme?: string): Promise<MissionTemplate[]> => {
    const res = await apiClient.get<MissionTemplate[]>('/mission-templates', {
      params: theme ? { theme } : undefined,
    });
    return res.data;
  },

  createMission: async (payload: CreateMissionRequest): Promise<Mission> => {
    const res = await apiClient.post<Mission>('/missions', payload);
    return res.data;
  },

  listMyMissions: async (): Promise<Mission[]> => {
    const res = await apiClient.get<Mission[]>('/missions');
    return res.data;
  },
};

export type { CreateMissionRequest, Mission, MissionTemplate };
