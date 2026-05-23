/**
 * Child Mission List — M5a.
 *
 * Fetches `GET /assignments/mine`, groups by status:
 *   - Active        : PENDING + IN_PROGRESS
 *   - Awaiting verify: SUBMITTED
 *
 * Each row card has a left trait-color stripe (red/blue/orange), a status
 * badge, a category chip, and a 1-line description excerpt. Tap → mission
 * detail. Pull-to-refresh refetches. Approved/rejected are intentionally
 * hidden to keep the surface clean.
 */
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { assignmentsApi, extractApiError, queryKeys } from '@/api';
import type { Assignment } from '@/api';
import {
  borderRadius,
  colors,
  fonts,
  shadows,
  spacing,
  traitColor,
  traitLabel,
} from '@/theme';

export default function ChildMissionsScreen() {
  const {
    data: assignments,
    isPending,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.assignments.mine,
    queryFn: () => assignmentsApi.listMineForChild(),
    staleTime: 1000 * 30,
  });

  const { active, awaiting } = useMemo(() => {
    const a: Assignment[] = [];
    const w: Assignment[] = [];
    (assignments ?? []).forEach((row) => {
      if (row.status === 'PENDING' || row.status === 'IN_PROGRESS') a.push(row);
      else if (row.status === 'SUBMITTED') w.push(row);
    });
    return { active: a, awaiting: w };
  }, [assignments]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>YOUR ADVENTURES</Text>
        <Text style={styles.title}>Missions</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isPending && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        )}

        {!isPending && error && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Hmm, something went wrong</Text>
            <Text style={styles.emptyBody}>{extractApiError(error)}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => refetch()}>
              <Text style={styles.emptyBtnTxt}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isPending && !error && active.length === 0 && awaiting.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="sparkles" size={40} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Your next adventure is being prepared</Text>
            <Text style={styles.emptyBody}>Check back soon, hero.</Text>
          </View>
        )}

        {active.length > 0 && (
          <>
            <SectionHeader label="Active" count={active.length} />
            {active.map((a) => (
              <MissionRow key={a.id} assignment={a} />
            ))}
          </>
        )}

        {awaiting.length > 0 && (
          <>
            <SectionHeader label="Awaiting verify" count={awaiting.length} />
            {awaiting.map((a) => (
              <MissionRow key={a.id} assignment={a} />
            ))}
          </>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionCount}>
        <Text style={styles.sectionCountTxt}>{count}</Text>
      </View>
    </View>
  );
}

function MissionRow({ assignment }: { assignment: Assignment }) {
  const mission = assignment.mission;
  const trait = mission?.traitCategory ?? null;
  const stripe = traitColor(trait);
  const isAwaiting = assignment.status === 'SUBMITTED';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => router.push(`/(child)/mission/${assignment.id}` as never)}
      style={styles.row}
    >
      <View style={[styles.stripe, { backgroundColor: stripe }]} />
      <View style={styles.rowBody}>
        <View style={styles.rowTopLine}>
          {trait && (
            <Text style={[styles.traitTag, { color: stripe }]}>
              {traitLabel(trait).toUpperCase()}
            </Text>
          )}
          {isAwaiting && (
            <View style={styles.awaitingBadge}>
              <Text style={styles.awaitingBadgeTxt}>Awaiting</Text>
            </View>
          )}
        </View>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {mission?.title ?? 'Mission'}
        </Text>
        {mission?.description && (
          <Text style={styles.rowDesc} numberOfLines={1}>
            {mission.description}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textSecondary,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    color: colors.primary,
  },

  scroll: { paddingBottom: spacing.xl },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center' },

  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.primary,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  emptyBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
  },
  emptyBtnTxt: { fontFamily: fonts.bold, color: colors.primary },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.textSecondary,
  },
  sectionCount: {
    minWidth: 22,
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCountTxt: { fontFamily: fonts.bold, fontSize: 11, color: colors.textSecondary },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    paddingRight: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  stripe: {
    width: 5,
    alignSelf: 'stretch',
  },
  rowBody: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  traitTag: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  awaitingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.infoLight,
  },
  awaitingBadgeTxt: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.info,
    letterSpacing: 0.4,
  },
  rowTitle: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.primary },
  rowDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
