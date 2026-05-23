/**
 * Child shell layout — Tabs with onboarding gate + M5b notification polling.
 *
 * M5b additions:
 *  - Mount `useNotificationPolling()` once per child session, gated off the
 *    /onboarding/* segment (no Hero Mail should pop during egg hatch).
 *  - Maintain a local queue of unread `hero_mail` notifications. Each tick,
 *    append any newly-arrived rows we haven't already queued or dismissed.
 *    On dismiss → markRead + invalidate creature / assignments / rewards
 *    (Hub re-renders with the new care item / happiness / progress).
 *  - Tab bar shows a small amber dot on the Hub icon while there is at
 *    least one queued unread Hero Mail.
 *
 * The overlay is an absolute-positioned Modal living above the Tabs tree —
 * see HeroMailOverlay.tsx (it uses RN's <Modal> so platform z-order is
 * handled for us). We render at most one overlay at a time; the queue is
 * FIFO (oldest first).
 */
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Tabs, useSegments, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, shadows, fonts } from '@/theme';
import { creaturesApi, queryKeys } from '@/api';
import type { NotificationRow } from '@/api';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationPolling } from '@/hooks/useNotificationPolling';
import { HeroMailOverlay } from '@/components/notifications/HeroMailOverlay';

export default function ChildLayout() {
  const segments = useSegments();
  const inOnboarding = (segments as readonly string[]).includes('onboarding');
  const isChild = useAuthStore((s) => s.user?.role === 'CHILD');
  const queryClient = useQueryClient();

  const {
    data: creature,
    isPending,
    isError,
  } = useQuery({
    queryKey: queryKeys.creature.me,
    queryFn: creaturesApi.getMyCreature,
    enabled: isChild,
    staleTime: 1000 * 60,
  });

  // Routing gate: when creature is missing and we're not already in
  // onboarding, redirect into the origin story.
  useEffect(() => {
    if (isPending || !isChild) return;
    if (!creature && !inOnboarding) {
      router.replace('/(child)/onboarding/origin' as never);
    }
  }, [creature, isPending, inOnboarding, isChild]);

  // --------------------------------------------------------------------
  // M5b — notification polling + Hero Mail queue
  // --------------------------------------------------------------------
  // Polling is paused while we're in onboarding (no Hero Mail can land
  // during a fresh hatch anyway, and showing one would feel jarring).
  const pollingEnabled = isChild && !inOnboarding;
  const { newNotifications, markRead } = useNotificationPolling({ enabled: pollingEnabled });

  const [queuedHeroMails, setQueuedHeroMails] = useState<NotificationRow[]>([]);
  // Track every id we've ever queued (or dismissed) so re-polls don't
  // re-add the same row. Membership-only — no need for ordering.
  const [seenIds] = useState<Set<string>>(() => new Set<string>());

  // Append newly-arrived hero_mail rows to the queue. We rely on the
  // backend's createdAt-desc ordering and reverse so the OLDEST unread
  // pops first (per spec — feels more natural than newest-first).
  useEffect(() => {
    if (newNotifications.length === 0) return;
    const incoming = newNotifications
      .filter((n) => n.type === 'hero_mail' && !n.isRead && !seenIds.has(n.id))
      .slice()
      .reverse();
    if (incoming.length === 0) return;
    incoming.forEach((n) => seenIds.add(n.id));
    setQueuedHeroMails((q) => [...q, ...incoming]);
  }, [newNotifications, seenIds]);

  // Dismiss current overlay → mark read, refresh hub-relevant caches,
  // and pop the queue (next overlay shows immediately if any remain).
  const dismissTopOverlay = () => {
    setQueuedHeroMails((q) => {
      if (q.length === 0) return q;
      const [head, ...rest] = q;
      markRead([head.id]);
      queryClient.invalidateQueries({ queryKey: queryKeys.creature.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.mineActive });
      return rest;
    });
  };

  const currentOverlay = queuedHeroMails[0] ?? null;
  const unreadHeroMailCount = useMemo(() => queuedHeroMails.length, [queuedHeroMails]);

  if (isPending && isChild) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  void isError;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: inOnboarding
            ? { display: 'none' }
            : {
                backgroundColor: colors.surface,
                borderTopWidth: 0,
                ...shadows.md,
                height: 68,
                paddingBottom: 10,
                paddingTop: 8,
              },
          tabBarLabelStyle: {
            fontFamily: fonts.semiBold,
            fontSize: 10,
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Hub',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="home"
                color={color}
                focused={focused}
                badge={unreadHeroMailCount > 0}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="missions"
          options={{
            title: 'Missions',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="flag" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="rewards"
          options={{
            title: 'Rewards',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="gift" color={color} focused={focused} />
            ),
          }}
        />
        {/* Hidden routes (legacy + onboarding + dynamic detail) */}
        <Tabs.Screen name="onboarding" options={{ href: null }} />
        <Tabs.Screen name="mission" options={{ href: null }} />
        <Tabs.Screen name="creature" options={{ href: null }} />
        <Tabs.Screen name="avatar" options={{ href: null }} />
        <Tabs.Screen name="room" options={{ href: null }} />
        <Tabs.Screen name="games" options={{ href: null }} />
      </Tabs>

      {/* Hero Mail overlay — one at a time, FIFO queue */}
      {currentOverlay && (
        <HeroMailOverlay
          key={currentOverlay.id}
          notification={currentOverlay}
          onDismiss={dismissTopOverlay}
          creatureSpecies={creature?.species}
        />
      )}
    </>
  );
}

function TabIcon({
  name,
  color,
  focused,
  badge,
}: {
  name: string;
  color: string;
  focused: boolean;
  badge?: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 32 }}>
      <View>
        <Ionicons
          name={(focused ? name : `${name}-outline`) as keyof typeof Ionicons.glyphMap}
          size={22}
          color={color}
        />
        {badge && <View style={styles.badge} />}
      </View>
      {focused && (
        <View
          style={{
            width: 18,
            height: 3,
            borderRadius: 2,
            backgroundColor: colors.accent,
            marginTop: 4,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.surface,
  },
});
