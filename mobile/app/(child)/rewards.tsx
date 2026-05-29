/**
 * Child Rewards — Polish-B2 rebuild + Round-11 "more rewards" shelf.
 *
 * Layout:
 *  - Parchment GradientBackdrop.
 *  - SectionHeader "Your reward quest".
 *  - <ScrollCard/> wrapping the active reward narrative, plus a progress
 *    orb-band underneath. When unlocked, amber Redeem CTA.
 *  - Secondary section: "More rewards to chase" — family-wide ACTIVE
 *    rewards with per-child progress chips + Redeem CTA when unlocked.
 *  - <EmptyState/> when no active quest.
 */
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AnimatedPressable,
  Banner,
  Caption,
  Chip,
  EmptyState,
  FLOATING_TAB_BAR_SCREEN_PADDING,
  GradientBackdrop,
  Icon,
  SectionHeader,
  Surface,
  Typography,
} from '@/components/ui';
import { ScrollCard } from '@/components/ui/ScrollCard';
import { RewardCelebration } from '@/components/rewards/RewardCelebration';
import { extractApiError, queryKeys, rewardsApi } from '@/api';
import type { RewardWithProgress } from '@/api/types';
import { borderRadius, colors, spacing } from '@/theme';

function conditionLabel(r: RewardWithProgress): string {
  switch (r.conditionType) {
    case 'COIN_THRESHOLD':
      return `${r.target} coins`;
    case 'STREAK_DAYS':
      return `${r.target}-day streak`;
    case 'MISSION_COUNT':
      return `${r.target} missions`;
    case 'LEVEL_REACHED':
      return `Level ${r.target}`;
    case 'XP_THRESHOLD':
      return `${r.target} XP`;
    default:
      return `${r.target}`;
  }
}

export default function ChildRewardsScreen() {
  const queryClient = useQueryClient();
  const rewardQuery = useQuery({
    queryKey: queryKeys.rewards.mineActive,
    queryFn: rewardsApi.getMyActiveReward,
    staleTime: 1000 * 30,
  });
  const familyQuery = useQuery({
    queryKey: queryKeys.rewards.mineFamily,
    queryFn: rewardsApi.listMyFamilyRewards,
    staleTime: 1000 * 30,
  });

  const [celebrate, setCelebrate] = React.useState<string | null>(null);

  const redeem = useMutation({
    mutationFn: (vars: { id: string; name: string }) =>
      rewardsApi.redeemReward(vars.id),
    onMutate: (vars) => {
      setCelebrate(vars.name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.mineActive });
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.mineFamily });
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.family });
      queryClient.invalidateQueries({ queryKey: queryKeys.creature.me });
    },
  });

  const reward = rewardQuery.data ?? null;
  const pct = reward
    ? Math.min(100, Math.round((reward.progress / Math.max(1, reward.target)) * 100))
    : 0;

  // Secondary list — exclude the active quest to avoid duplicate render.
  const extras = React.useMemo<RewardWithProgress[]>(() => {
    const all = familyQuery.data ?? [];
    return all.filter((r) => !reward || r.id !== reward.id);
  }, [familyQuery.data, reward]);

  const onRefresh = React.useCallback(() => {
    rewardQuery.refetch();
    familyQuery.refetch();
  }, [rewardQuery, familyQuery]);

  return (
    <GradientBackdrop variant="parchment" intensity="subtle">
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <SectionHeader
          eyebrow="Quests"
          title="Your reward quest"
          subtitle="Earn missions to unlock real-world treats."
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={rewardQuery.isRefetching || familyQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.amberDeep}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {rewardQuery.isPending && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.amberDeep} />
          </View>
        )}

        {!rewardQuery.isPending && rewardQuery.error && (
          <View style={styles.errBlock}>
            <Banner tone="error" message={extractApiError(rewardQuery.error)} />
          </View>
        )}

        {!rewardQuery.isPending && !rewardQuery.error && !reward && (
          <EmptyState
            illustration={<Icon name="crown" size={32} color={colors.amberDeep} />}
            title="No active quest"
            body="Your parent will set the next reward soon. Keep your missions strong!"
          />
        )}

        {reward && (
          <View style={styles.rewardBlock}>
            <ScrollCard
              title="Active Quest"
              body={`${reward.name} — ${reward.target} mission${reward.target === 1 ? '' : 's'} to unlock.`}
            />

            <Surface variant="cream" radius="lg" padding="md" shadow="card" style={styles.progressCard as any}>
              <View style={styles.progressHeader}>
                <Typography.Heading level={3} tone="primary">Your progress</Typography.Heading>
                <Caption emphasis tone="secondary">
                  {reward.progress}/{reward.target}
                </Caption>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
              </View>
              {reward.unlocked ? (
                <AnimatedPressable
                  onPress={() => redeem.mutate({ id: reward.id, name: reward.name })}
                  disabled={redeem.isPending}
                  style={styles.redeemBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Redeem reward"
                >
                  {redeem.isPending ? (
                    <ActivityIndicator size="small" color={colors.navyDeep} />
                  ) : (
                    <>
                      <Icon name="sparkle" size={18} color={colors.navyDeep} />
                      <Typography.Heading level={2} tone="primary" style={styles.redeemLabel}>
                        Redeem ✨
                      </Typography.Heading>
                    </>
                  )}
                </AnimatedPressable>
              ) : (
                <Caption tone="secondary" align="center" style={styles.almost}>
                  {reward.target - reward.progress} mission{reward.target - reward.progress === 1 ? '' : 's'} to go.
                </Caption>
              )}
            </Surface>
          </View>
        )}

        {extras.length > 0 && (
          <View style={styles.extrasSection}>
            <View style={styles.extrasHeader}>
              <SectionHeader
                eyebrow="Shelf"
                title="More rewards to chase"
                subtitle="Keep stacking coins and streaks."
              />
            </View>
            <View style={styles.extrasList}>
              {extras.map((r) => {
                const isPending = redeem.isPending && redeem.variables?.id === r.id;
                return (
                  <Surface
                    key={r.id}
                    variant="card"
                    radius="lg"
                    padding="md"
                    shadow="card"
                    style={styles.extraCard as any}
                  >
                    <View style={styles.extraTopRow}>
                      <View style={styles.extraTextCol}>
                        <Typography.Heading level={3} tone="primary">
                          {r.name}
                        </Typography.Heading>
                        {r.description ? (
                          <Caption tone="secondary" style={styles.extraDesc}>
                            {r.description}
                          </Caption>
                        ) : null}
                      </View>
                      <Chip
                        label={conditionLabel(r)}
                        tone={r.unlocked ? 'success' : 'neutral'}
                        size="sm"
                      />
                    </View>

                    {r.unlocked ? (
                      <AnimatedPressable
                        onPress={() => redeem.mutate({ id: r.id, name: r.name })}
                        disabled={redeem.isPending}
                        style={styles.redeemBtnSm}
                        accessibilityRole="button"
                        accessibilityLabel={`Redeem ${r.name}`}
                      >
                        {isPending ? (
                          <ActivityIndicator size="small" color={colors.navyDeep} />
                        ) : (
                          <>
                            <Icon name="sparkle" size={16} color={colors.navyDeep} />
                            <Typography.Heading level={3} tone="primary" style={styles.redeemLabelSm}>
                              Redeem ✨
                            </Typography.Heading>
                          </>
                        )}
                      </AnimatedPressable>
                    ) : (
                      <Caption tone="secondary" style={styles.lockedHint}>
                        {r.progress}/{r.target} so far — keep going!
                      </Caption>
                    )}
                  </Surface>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <RewardCelebration
        visible={!!celebrate}
        rewardName={celebrate ?? ''}
        onDismiss={() => setCelebrate(null)}
      />
    </SafeAreaView>
    </GradientBackdrop>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  scroll: { paddingBottom: FLOATING_TAB_BAR_SCREEN_PADDING, paddingTop: spacing.sm },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center' },
  errBlock: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  rewardBlock: { paddingHorizontal: spacing.lg, gap: spacing.md },
  progressCard: { gap: spacing.sm },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barBg: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.parchmentDark,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.amberDeep,
    borderRadius: 6,
  },
  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.amberDeep,
    borderRadius: borderRadius.pill,
  },
  redeemLabel: { fontSize: 17, color: colors.navyDeep },
  almost: { marginTop: spacing.sm, opacity: 0.85 },

  // Extras / "More rewards to chase"
  extrasSection: { marginTop: spacing.lg },
  extrasHeader: { paddingHorizontal: spacing.lg },
  extrasList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  extraCard: { gap: spacing.sm },
  extraTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  extraTextCol: { flex: 1, gap: spacing.xs },
  extraDesc: { opacity: 0.85 },
  redeemBtnSm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.amberDeep,
    borderRadius: borderRadius.pill,
  },
  redeemLabelSm: { fontSize: 15, color: colors.navyDeep },
  lockedHint: { marginTop: spacing.xs, opacity: 0.8 },
});
