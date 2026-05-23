/**
 * useNotificationPolling — M5b.
 *
 * Polls `GET /notifications/mine?since=<cursor>` every 5s while the app
 * is foregrounded. Backgrounding pauses polling to avoid battery burn
 * (and the next foreground tick will sweep any notifications missed).
 *
 * Cursor strategy:
 *  - Initialized to "now" on first mount → historical notifications are
 *    NOT surfaced (the user already saw them in a prior session).
 *  - Each successful response advances the cursor to the server-supplied
 *    `serverTime` (skew-free; never our own clock).
 *  - Cursor lives in a ref + state pair. State drives the TanStack Query
 *    key (so each `since` is its own cache entry, freeing old payloads);
 *    ref is used inside the effect to avoid stale closure on the cursor.
 *
 * No on-disk persistence — for the demo a fresh "now" cursor on cold
 * boot is fine; the trade-off is that any unread Hero Mail that landed
 * while the app was force-killed will not pop as an overlay (it remains
 * unread in the DB and is reachable through a future inbox view). The
 * tab-bar badge can still surface them if the consumer queries all-unread
 * separately (out of M5b scope).
 *
 * Returns:
 *   newNotifications  — rows from the most recent poll (descending by
 *                       createdAt — backend default). Consumers should
 *                       react idempotently as React Query may keep this
 *                       reference across re-renders until the next tick.
 *   markRead(ids)     — fire-and-forget POST /notifications/read; on
 *                       success invalidates the polling key so the next
 *                       tick reflects fresh `isRead` state.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, queryKeys } from '@/api';
import type { NotificationRow } from '@/api';

const POLL_INTERVAL_MS = 5_000;

export interface UseNotificationPollingResult {
  /** Newest batch returned by the last successful poll (may be empty). */
  newNotifications: NotificationRow[];
  /** POST /notifications/read for the given ids. No-op for empty arrays. */
  markRead: (ids: string[]) => void;
  /** Convenience — true while a markRead request is in flight. */
  isMarkingRead: boolean;
}

export function useNotificationPolling(options?: {
  enabled?: boolean;
}): UseNotificationPollingResult {
  const enabledExternal = options?.enabled ?? true;
  const queryClient = useQueryClient();

  // Initial cursor = right now. Anything created strictly after counts as new.
  const initialSinceRef = useRef<string>(new Date().toISOString());
  const [since, setSince] = useState<string>(initialSinceRef.current);

  // Pause when app is backgrounded.
  const [appActive, setAppActive] = useState<boolean>(
    AppState.currentState === 'active' || AppState.currentState === 'inactive',
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      setAppActive(next === 'active');
    });
    return () => sub.remove();
  }, []);

  const enabled = enabledExternal && appActive;

  const pollQuery = useQuery({
    queryKey: queryKeys.notifications.list(since),
    queryFn: () => notificationsApi.listMine({ since }),
    refetchInterval: enabled ? POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    enabled,
    // Avoid retry storms during dev (backend restart, lost wifi).
    retry: 1,
    staleTime: 0,
    gcTime: 60_000,
  });

  // Advance cursor after each successful tick. We use a ref to dedupe in
  // case React Query re-renders us with the same data object.
  const lastAdvancedToRef = useRef<string | null>(null);
  useEffect(() => {
    const data = pollQuery.data;
    if (!data) return;
    if (lastAdvancedToRef.current === data.serverTime) return;
    lastAdvancedToRef.current = data.serverTime;
    setSince(data.serverTime);
  }, [pollQuery.data]);

  // markRead mutation — invalidates the current polling key on success so
  // the consumer's count of unread rows refreshes on the next render.
  const markReadM = useMutation({
    mutationFn: (ids: string[]) => notificationsApi.markRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.mine });
    },
  });

  const markRead = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      markReadM.mutate(ids);
    },
    [markReadM],
  );

  return {
    newNotifications: pollQuery.data?.notifications ?? [],
    markRead,
    isMarkingRead: markReadM.isPending,
  };
}
