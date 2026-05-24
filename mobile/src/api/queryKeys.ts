/**
 * Centralised React-Query key registry.
 *
 * Single source of truth — pass these factories everywhere (`useQuery`,
 * `useMutation.onSuccess` → `queryClient.invalidateQueries`) so a wrong
 * key never silently fails to invalidate.
 *
 * Convention: each entry is a stable array (or factory returning one).
 * Append new keys here as features land; never inline tuple literals in
 * screen files.
 */

export const queryKeys = {
  // ---------- Auth / user ----------
  me: ['me'] as const,

  // ---------- Creature ----------
  creature: {
    me: ['creature', 'me'] as const,
  },

  // ---------- Assignments ----------
  assignments: {
    mine: ['assignments', 'mine'] as const,
    detail: (id: string) => ['assignments', 'detail', id] as const,
  },

  // ---------- Missions (parent) ----------
  missions: {
    list: ['missions', 'list'] as const,
    detail: (id: string) => ['missions', 'detail', id] as const,
  },

  missionTemplates: {
    list: ['mission-templates', 'list'] as const,
  },

  // ---------- Children (parent) ----------
  children: {
    list: ['children', 'list'] as const,
  },

  // ---------- Rewards ----------
  rewards: {
    family: ['rewards', 'family'] as const,
    mineActive: ['rewards', 'mine', 'active'] as const,
  },

  // ---------- Approvals (parent) ----------
  approvals: {
    pending: ['approvals', 'pending'] as const,
    todayStats: ['approvals', 'stats', 'today'] as const,
  },

  // ---------- Progression / traits ----------
  progression: {
    summary: (childProfileId: string) =>
      ['progression', 'summary', childProfileId] as const,
    mine: ['progression', 'mine'] as const,
  },

  // ---------- Notifications ----------
  notifications: {
    mine: ['notifications', 'mine'] as const,
    /** Polling-cursor-scoped key so each `since` window is cached separately. */
    list: (since?: string) => ['notifications', 'mine', since ?? 'initial'] as const,
  },
} as const;
