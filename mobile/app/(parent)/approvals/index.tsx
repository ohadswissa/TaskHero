/**
 * Parent Approvals — pending submissions list (M6).
 *
 * Live FIFO queue (oldest first) of children's submissions awaiting verify.
 * Each row shows: child avatar + name, mission title, trait chip, relative
 * submitted timestamp, and a photo thumbnail (presigned read URL) or a
 * "Note only" pill. Tap → opens `/(parent)/approvals/[id]` detail.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { approvalsApi, extractApiError, queryKeys, storageApi } from '@/api';
import type { PendingApprovalRow } from '@/api/types';
import { ScreenHeader } from '@/components/common';
import {
  borderRadius,
  colors,
  fonts,
  shadows,
  spacing,
  traitColor,
  traitLabel,
} from '@/theme';

/** Render "N minutes/hours/days ago" without bringing in dayjs. */
function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.round(hr / 24);
  return `${day} day${day === 1 ? '' : 's'} ago`;
}

export default function ApprovalsListScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  const pendingQ = useQuery({
    queryKey: [...queryKeys.approvals.pending],
    queryFn: approvalsApi.listPending,
  });

  /** Oldest first — parents should clear FIFO. */
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

  // Mint short-lived read URLs for the first photo of each row.
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
          // Map each requested URL → resolved signed URL. Backend keeps order.
          firstPhotos.forEach((orig, i) => {
            const signed = items[i]?.url;
            if (signed) next[orig] = signed;
          });
          return next;
        });
      } catch {
        // Silent — the row card just shows the "no photo" placeholder.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.map((r) => r.submission?.photoUrls?.[0]).join('|')]);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: [...queryKeys.approvals.pending],
    });
    setRefreshing(false);
  };

  if (pendingQ.isPending) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Approvals" subtitle="Loading…" />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (pendingQ.error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Approvals" />
        <View style={styles.centerFill}>
          <Text style={styles.errorText}>{extractApiError(pendingQ.error)}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => pendingQ.refetch()}>
            <Text style={styles.retryTxt}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Approvals"
        subtitle={
          rows.length === 0
            ? 'All caught up ✓'
            : `${rows.length} mission${rows.length === 1 ? '' : 's'} awaiting review`
        }
      />
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 2 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.emptyTitle}>All caught up ✓</Text>
            <Text style={styles.emptySub}>
              Your Heroes haven&apos;t submitted anything new.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ApprovalRow
            row={item}
            thumbUrl={
              item.submission?.photoUrls?.[0]
                ? thumbUrls[item.submission.photoUrls[0]]
                : undefined
            }
            onPress={() =>
              router.push(`/(parent)/approvals/${item.id}` as never)
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

interface ApprovalRowProps {
  row: PendingApprovalRow;
  thumbUrl?: string;
  onPress: () => void;
}

function ApprovalRow({ row, thumbUrl, onPress }: ApprovalRowProps) {
  const trait = row.mission.traitCategory;
  const tColor = traitColor(trait);
  const initial = row.childProfile.displayName.charAt(0).toUpperCase();
  const hasPhoto = (row.submission?.photoUrls?.length ?? 0) > 0;
  const hasNotes = !!row.submission?.notes;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      {/* Thumbnail / icon column */}
      <View style={styles.thumbCol}>
        {hasPhoto ? (
          thumbUrl ? (
            <Image source={{ uri: thumbUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbLoading]}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
            </View>
          )
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons
              name={hasNotes ? 'document-text-outline' : 'image-outline'}
              size={24}
              color={colors.textSecondary}
            />
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.bodyHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.childName} numberOfLines={1}>
            {row.childProfile.displayName}
          </Text>
          <Text style={styles.timestamp}>
            {relativeTime(row.submission?.submittedAt ?? row.completedAt)}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {row.mission.title}
        </Text>

        <View style={styles.chipsRow}>
          {trait && (
            <View style={[styles.traitChip, { backgroundColor: tColor + '20' }]}>
              <View style={[styles.traitDot, { backgroundColor: tColor }]} />
              <Text style={[styles.traitChipTxt, { color: tColor }]}>
                {traitLabel(trait)}
              </Text>
            </View>
          )}
          {!hasPhoto && hasNotes && (
            <View style={styles.notePill}>
              <Text style={styles.notePillTxt}>📝 Note only</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.textSecondary}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

const THUMB = 72;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  errorText: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
  },
  retryTxt: { fontFamily: fonts.bold, color: colors.primary },

  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  thumbCol: { width: THUMB, height: THUMB, marginRight: spacing.sm },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: borderRadius.md,
    backgroundColor: colors.borderLight,
  },
  thumbLoading: { alignItems: 'center', justifyContent: 'center' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 4 },
  bodyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 11, color: colors.accent },
  childName: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.primary,
    flex: 1,
  },
  timestamp: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primary,
    lineHeight: 20,
  },
  chipsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  traitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  traitDot: { width: 6, height: 6, borderRadius: 3 },
  traitChipTxt: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.5 },
  notePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: colors.warningLight,
  },
  notePillTxt: { fontFamily: fonts.semiBold, fontSize: 10, color: colors.warning },
  chevron: { marginLeft: spacing.xs },
});
