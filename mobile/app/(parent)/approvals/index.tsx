/**
 * Parent Approvals — Polish-B3 rebuild.
 *
 * Cream backdrop scroll over a FIFO list of ApprovalCardFrame rows. Each
 * submission older than 24h gets an "Urgent" chip stacked beneath the
 * card. Empty + loading + error states use design-system primitives.
 *
 * API wiring (approvalsApi.listPending, storageApi.presignRead for
 * thumbnails) is preserved exactly from the prior implementation.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approvalsApi,
  extractApiError,
  queryKeys,
  storageApi,
} from '@/api';
import type { PendingApprovalRow, TraitCategory } from '@/api/types';
import {
  AnimatedPressable,
  ApprovalCardFrame,
  Banner,
  Chip,
  EmptyState,
  FLOATING_TAB_BAR_SCREEN_PADDING,
  GradientBackdrop,
  Icon,
  SectionHeader,
  Typography,
} from '@/components/ui';
import { colors, spacing } from '@/theme';

const URGENT_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export default function ApprovalsListScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  const pendingQ = useQuery({
    queryKey: [...queryKeys.approvals.pending],
    queryFn: approvalsApi.listPending,
  });

  // Oldest first — FIFO.
  const rows = useMemo<PendingApprovalRow[]>(() => {
    const list = pendingQ.data ?? [];
    return [...list].sort((a, b) => {
      const ta = a.submission?.submittedAt
        ? new Date(a.submission.submittedAt).getTime()
        : 0;
      const tb = b.submission?.submittedAt
        ? new Date(b.submission.submittedAt).getTime()
        : 0;
      return ta - tb;
    });
  }, [pendingQ.data]);

  // Presign the first photo of each row, lazy + cached in component state.
  useEffect(() => {
    const firstPhotos = rows
      .map((r) => r.submission?.photoUrls?.[0])
      .filter((u): u is string => !!u && !thumbUrls[u]);
    if (firstPhotos.length === 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const items = await storageApi.presignRead(firstPhotos);
        if (cancelled) return;
        setThumbUrls((prev) => {
          const next = { ...prev };
          firstPhotos.forEach((orig, i) => {
            const signed = items[i]?.url;
            if (signed) next[orig] = signed;
          });
          return next;
        });
      } catch {
        // silent — placeholder remains
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.map((r) => r.submission?.photoUrls?.[0]).join('|')]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.approvals.pending],
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GradientBackdrop variant="cream" style={StyleSheet.absoluteFill as any} />

      <View style={styles.headerWrap}>
        <SectionHeader
          title="Verifications"
          subtitle="Tap to verify with care."
        />
      </View>

      {pendingQ.isPending ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : pendingQ.error ? (
        <View style={styles.centerFill}>
          <Banner
            tone="error"
            icon="warning"
            message={extractApiError(pendingQ.error)}
          />
          <AnimatedPressable
            onPress={() => pendingQ.refetch()}
            accessibilityLabel="Retry loading approvals"
            style={styles.retryBtn}
          >
            <Typography.Body tone="onNavy" emphasis>
              Try again
            </Typography.Body>
          </AnimatedPressable>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                illustration={
                  <Icon name="checkCircle" size={56} color={colors.success} />
                }
                title="All caught up ✓"
                body="Your Heroes haven't submitted anything new."
              />
            </View>
          }
          renderItem={({ item }) => {
            const submittedIso =
              item.submission?.submittedAt ?? item.completedAt ?? '';
            const submittedMs = submittedIso
              ? new Date(submittedIso).getTime()
              : 0;
            const isUrgent =
              submittedMs > 0 && Date.now() - submittedMs > URGENT_THRESHOLD_MS;
            const firstPhoto = item.submission?.photoUrls?.[0];
            const thumb = firstPhoto ? thumbUrls[firstPhoto] : undefined;
            // Backend allows null trait; fall back to STRENGTH so the
            // stripe colour stays meaningful (ApprovalCardFrame requires
            // a TraitCategory).
            const trait: TraitCategory =
              item.mission.traitCategory ?? 'STRENGTH';
            return (
              <View>
                <ApprovalCardFrame
                  childName={item.childProfile.displayName}
                  missionTitle={item.mission.title}
                  trait={trait}
                  submittedAt={submittedIso}
                  photoUri={thumb}
                  notesExcerpt={item.submission?.notes ?? undefined}
                  size="compact"
                  onPress={() =>
                    router.push(`/(parent)/approvals/${item.id}` as never)
                  }
                />
                {isUrgent ? (
                  <View style={styles.urgentSlot}>
                    <Chip tone="error" label="Urgent · 24h+" size="sm" />
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  headerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: 999,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: FLOATING_TAB_BAR_SCREEN_PADDING,
  },
  emptyWrap: { marginTop: spacing.xl },
  urgentSlot: {
    marginTop: -spacing.xs,
    paddingLeft: spacing.md,
  },
});
