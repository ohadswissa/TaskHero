/**
 * Notifications API client (M5b).
 *
 * Backend contract (see backend/src/modules/notifications):
 *   GET  /notifications/mine?since=<ISO>  → { notifications, serverTime }
 *   POST /notifications/read              → body { ids: string[] } → { updated }
 *
 * Polling pattern: client sends the LAST `serverTime` as `since` on the next
 * tick to avoid client-clock skew. Hard cap server-side is 50 rows.
 *
 * `data` is a JSON column on the backend, typed as `unknown` here. Consumers
 * narrow it per notification.type (e.g. HeroMailData for type === 'hero_mail').
 */
import apiClient from './client';

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  data: unknown;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsPollResponse {
  notifications: NotificationRow[];
  serverTime: string;
}

/**
 * Hero-Mail payload shape — written by approvals.service step 7 when a
 * parent verifies (approves) a submission. Mirrors that source of truth.
 */
export interface HeroMailData {
  assignmentId: string;
  parentMessage: string | null;
  missionTitle: string;
  traitCategory: 'STRENGTH' | 'WISDOM' | 'HEART';
  careItemId: string | null;
  careItemName: string;
  xpAwarded: number;
  coinsAwarded: number;
  evolutionStage: 'EGG' | 'BABY' | 'ADOLESCENT' | 'ADULT' | null;
  rewardUnlockedId: string | null;
}

export const notificationsApi = {
  /**
   * Poll for new notifications. Pass the last response's `serverTime` as
   * `since` to fetch only items created after that moment.
   */
  listMine: async (params: { since?: string } = {}): Promise<NotificationsPollResponse> => {
    const res = await apiClient.get<NotificationsPollResponse>('/notifications/mine', {
      params: params.since ? { since: params.since } : undefined,
    });
    return res.data;
  },

  /**
   * Mark notifications read. Foreign ids are a silent no-op server-side.
   * Returns the number of rows actually flipped.
   */
  markRead: async (ids: string[]): Promise<{ updated: number }> => {
    if (ids.length === 0) return { updated: 0 };
    const res = await apiClient.post<{ updated: number }>('/notifications/read', { ids });
    return res.data;
  },
};
