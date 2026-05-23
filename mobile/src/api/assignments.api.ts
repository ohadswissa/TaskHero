import apiClient from './client';
import type { Assignment, CreateAssignmentRequest } from './types';

export const assignmentsApi = {
  createAssignment: async (payload: CreateAssignmentRequest): Promise<Assignment> => {
    const res = await apiClient.post<Assignment>('/assignments', payload);
    return res.data;
  },

  /** Child-role only — used in M4/M5. Included now so the surface is complete. */
  listMineForChild: async (): Promise<Assignment[]> => {
    const res = await apiClient.get<Assignment[]>('/assignments/mine');
    return res.data;
  },

  getAssignment: async (id: string): Promise<Assignment> => {
    const res = await apiClient.get<Assignment>(`/assignments/${id}`);
    return res.data;
  },
};

export type { Assignment, CreateAssignmentRequest };
