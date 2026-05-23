import apiClient from './client';
import type { Submission } from './types';

export interface CreateSubmissionPayload {
  assignmentId: string;
  notes?: string;
  /** Canonical public URLs returned by the presign endpoint. */
  photoUrls?: string[];
}

export const submissionsApi = {
  /**
   * Submit a mission for parent verification. The backend will atomically
   * create a `MissionSubmission` row and flip the assignment to SUBMITTED.
   */
  createSubmission: async (payload: CreateSubmissionPayload): Promise<Submission> => {
    const res = await apiClient.post<Submission>('/submissions', payload);
    return res.data;
  },
};

export type { Submission };
