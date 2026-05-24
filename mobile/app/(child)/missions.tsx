/**
 * Child Mission List — Polish-B2 rebuild.
 *
 * Inherits cream gradient from (child)/_layout.tsx.
 *
 * Layout:
 *  - <SectionHeader title="Your missions" subtitle="Tap one to begin." eyebrow="Today">
 *  - Two sections (Active, Awaiting verify), each headed by its own eyebrow row.
 *  - Mission rows are Surface(card) wrapped in AnimatedPressable:
 *     • 4px trait-colored left stripe
 *     • Small trait Icon in a tinted circle
 *     • Title + category caption
 *     • Status Chip (warning / success) when relevant
 *     • Trailing chevron
 *  - <EmptyState/> when nothing's loaded.
 */
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { assignmentsApi, extractApiError, queryKeys } from '@/api';
import type { Assignment, TraitCategory } from '@/api';
import {
  AnimatedPressable,
  Banner,
  Caption,
  Chip,
  EmptyState,
  FLOATING_TAB_BAR_SCREEN_PADDING,
  Icon,
  SectionHeader,
  Surface,
  Typography,
  type IconName,
} from '@/components/ui';
import {
  colors,
  spacing,
  traitColor,
  traitLabel,
} from '@/theme';

const TRAIT_ICON: Record<TraitCategory, IconName> = {
  STRENGTH: 'strength',
  WISDOM: 'wisdom',
  HEART: 'heart',
};

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

  const isEmpty = !isPending && !error && active.length === 0 && awaiting.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <SectionHeader
          eyebrow="Today"
          title="Your missions"
          subtitle="Tap one to begin."
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.amberDeep}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isPending && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.amberDeep} />
          </View>
        )}

        {!isPending && error && (
          <View style={styles.errBlock}>
            <Banner tone="error" title="Something's not right" message={extractApiError(error)} />
            <AnimatedPressable
              onPress={() => refetch()}
              style={styles.retryBtn}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <Typography.Heading level={3} tone="primary">Try again</Typography.Heading>
            </AnimatedPressable>
          </View>
        )}

        {isEmpty && (
          <EmptyState
            illustration={<Icon name="sparkle" size={32} color={colors.amberDeep} />}
            title="Your next adventure is coming"
            body="Check back soon, hero."
          />
        )}

        {active.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Typography.Eyebrow tone="accent">Active</Typography.Eyebrow>
              <Chip label={`${active.length}`} tone="navy" size="sm" />
            </View>
            {active.map((a) => (
              <MissionRow key={a.id} assignment={a} />
            ))}
          </View>
        )}

        {awaiting.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Typography.Eyebrow tone="accent">Awaiting verify</Typography.Eyebrow>
              <Chip label={`${awaiting.length}`} tone="navy" size="sm" />
            </View>
            {awaiting.map((a) => (
              <MissionRow key={a.id} assignment={a} />
            ))}
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MissionRow({ assignment }: { assignment: Assignment }) {
  const mission = assignment.mission;
  const trait = mission?.traitCategory ?? null;
  const stripe = traitColor(trait);
  const isAwaiting = assignment.status === 'SUBMITTED';

  return (
    <AnimatedPressable
      onPress={() => router.push(`/(child)/mission/${assignment.id}` as never)}
      accessibilityRole="button"
      accessibilityLabel={`Open mission ${mission?.title ?? ''}`}
      style={styles.rowOuter}
    >
      <Surface variant="card" radius="lg" padding="none" shadow="card" style={styles.rowSurface as any}>
        <View style={[styles.stripe, { backgroundColor: stripe }]} />
        <View style={styles.rowBody}>
          <View style={styles.rowLeft}>
            {trait && (
              <View style={[styles.traitCircle, { backgroundColor: stripe + '22', borderColor: stripe + '55' }]}>
                <Icon name={TRAIT_ICON[trait]} size={18} color={stripe} />
              </View>
            )}
          </View>
          <View style={styles.rowMid}>
            <Typography.Heading level={2} tone="primary" numberOfLines={1}>
              {mission?.title ?? 'Mission'}
            </Typography.Heading>
            <Caption tone="secondary" numberOfLines={1}>
              {trait ? traitLabel(trait) : 'Mission'}
              {mission?.description ? ` · ${mission.description}` : ''}
            </Caption>
            {isAwaiting && (
              <View style={styles.statusChipRow}>
                <Chip label="Awaiting verify" tone="warning" size="sm" />
              </View>
            )}
          </View>
          <Icon name="chevronRight" size={20} color={colors.textTertiary} />
        </View>
      </Surface>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 0,
  },
  scroll: { paddingBottom: FLOATING_TAB_BAR_SCREEN_PADDING, paddingTop: spacing.sm },

  loading: { paddingVertical: spacing.xxl, alignItems: 'center' },
  errBlock: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  retryBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.amberDeep,
    borderRadius: 999,
  },

  section: { marginTop: spacing.md },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },

  rowOuter: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowSurface: { overflow: 'hidden' },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  rowBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingLeft: spacing.md + 4,
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  rowLeft: { width: 40 },
  rowMid: { flex: 1 },
  traitCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipRow: { flexDirection: 'row', marginTop: 6 },
});
