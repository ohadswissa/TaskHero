import apiClient from './client';
import type { PendingApprovalRow, VerifyResponse } from './types';

export interface VerifyPayload {
  assignmentId: string;
  approved: boolean;
  parentMessage?: string;
}

export interface ApprovalsTodayStats {
  approvedToday: number;
}

export const approvalsApi = {
  /**
   * `GET /approvals/pending` — pending submissions across the family, oldest first.
   * Returns full MissionAssignment rows with mission, submission and childProfile joined.
   */
  listPending: async (): Promise<PendingApprovalRow[]> => {
    const res = await apiClient.get<PendingApprovalRow[]>('/approvals/pending');
    return res.data;
  },

  /**
   * `GET /approvals/stats/today` — count of approvals decided today in the
   * family timezone. Used by the parent dashboard "Approved today" StatCard.
   */
  getTodayStats: async (): Promise<ApprovalsTodayStats> => {
    const res = await apiClient.get<ApprovalsTodayStats>('/approvals/stats/today');
    return res.data;
  },

  /**
   * `POST /approvals/:assignmentId/verify` — approve or reject a submitted
   * assignment. On approve, runs the full side-effect chain (XP/coins/trait,
   * CareItem spawn, evolution check, reward progress, Hero Mail Notification).
   */
  verify: async ({
    assignmentId,
    approved,
    parentMessage,
  }: VerifyPayload): Promise<VerifyResponse> => {
    const res = await apiClient.post<VerifyResponse>(`/approvals/${assignmentId}/verify`, {
      approved,
      parentMessage,
    });
    return res.data;
  },
};
