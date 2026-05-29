/**
 * Parent dashboard — Polish-B3 rebuild.
 *
 * Composed entirely of design-system primitives:
 *   SectionHeader · Chip · Surface · TraitRadar · RosterRow ·
 *   StatCard · AnimatedPressable · Icon · Banner · GradientBackdrop.
 *
 * Data flow preserved 1:1 with the prior screen:
 *   familiesApi.getMyFamily · childrenApi.listChildren ·
 *   approvalsApi.listPending · rewardsApi.listFamilyRewards ·
 *   progressionApi.traitSummary per child (useQueries).
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import {
  approvalsApi,
  childrenApi,
  familiesApi,
  progressionApi,
  queryKeys,
  rewardsApi,
} from '@/api';
import type { ChildProfile } from '@/api/types';
import type { TraitSummary } from '@/api/progression.api';
import { TraitRadar } from '@/components/progression/TraitRadar';
import {
  AnimatedPressable,
  Banner,
  Chip,
  GradientBackdrop,
  Icon,
  RosterRow,
  SectionHeader,
  StatCard,
  Surface,
  Typography,
  useToast,
  type IconName,
} from '@/components/ui';
import { FLOATING_TAB_BAR_SCREEN_PADDING } from '@/components/ui';
import { colors, spacing, traitColor } from '@/theme';

const CARD_WIDTH = 280;
const CARD_GAP = spacing.md;

export default function ParentDashboardScreen() {
  const { user } = useAuthStore();
  const displayName = user?.displayName || 'Parent';
  const toast = useToast();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // ---- Queries (data wiring preserved from previous implementation) ----
  const familyQ = useQuery({
    queryKey: ['family', 'me'] as const,
    queryFn: familiesApi.getMyFamily,
  });
  const childrenQ = useQuery({
    queryKey: [...queryKeys.children.list],
    queryFn: childrenApi.listChildren,
  });
  const pendingQ = useQuery({
    queryKey: [...queryKeys.approvals.pending],
    queryFn: approvalsApi.listPending,
  });
  const rewardsQ = useQuery({
    queryKey: [...queryKeys.rewards.family],
    queryFn: rewardsApi.listFamilyRewards,
  });
  const todayStatsQ = useQuery({
    queryKey: [...queryKeys.approvals.todayStats],
    queryFn: approvalsApi.getTodayStats,
    staleTime: 30_000,
  });

  const children: ChildProfile[] = childrenQ.data ?? [];
  const childIds = children.map((c) => c.id);

  const traitQueries = useQueries({
    queries: childIds.map((cid) => ({
      queryKey: queryKeys.progression.summary(cid),
      queryFn: () => progressionApi.traitSummary(cid),
      staleTime: 1000 * 60,
    })),
  });
  const traitByChild = useMemo(() => {
    const map: Record<string, TraitSummary | undefined> = {};
    childIds.forEach((cid, i) => {
      map[cid] = traitQueries[i]?.data;
    });
    return map;
  }, [childIds, traitQueries]);

  // ---- Pull to refresh ----
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['family', 'me'] }),
        queryClient.invalidateQueries({ queryKey: [...queryKeys.children.list] }),
        queryClient.invalidateQueries({ queryKey: [...queryKeys.approvals.pending] }),
        queryClient.invalidateQueries({ queryKey: [...queryKeys.approvals.todayStats] }),
        queryClient.invalidateQueries({ queryKey: [...queryKeys.rewards.family] }),
        ...childIds.map((cid) =>
          queryClient.invalidateQueries({
            queryKey: queryKeys.progression.summary(cid),
          }),
        ),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, childIds]);

  // ---- Copy invite code (Polish-B4: real clipboard write via expo-clipboard) ----
  const copyInviteCode = useCallback(async () => {
    const code = familyQ.data?.inviteCode;
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code);
      toast.show('Invite code copied', { tone: 'success' });
    } catch {
      toast.show(`Code ${code} ready to share`, { tone: 'info' });
    }
  }, [familyQ.data?.inviteCode, toast]);

  // ---- Derived stat counts ----
  const pendingCount = pendingQ.data?.length ?? 0;
  // Polish-B4: live count of approvals decided since 00:00 (family timezone)
  // via GET /approvals/stats/today. Falls back to '—' while loading or on error.
  const approvedTodayCount: number | string =
    todayStatsQ.data?.approvedToday ?? (todayStatsQ.isPending ? '—' : 0);
  const activeRewardsCount = rewardsQ.data?.active?.length ?? 0;

  // ---- Loading state ----
  const isInitialLoading =
    familyQ.isPending || childrenQ.isPending || pendingQ.isPending;
  // Treat queries as errored only when an error surfaces.
  const hasError =
    !!familyQ.error || !!childrenQ.error || !!pendingQ.error || !!rewardsQ.error;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GradientBackdrop
        variant="parentDashboard"
        intensity="subtle"
        style={StyleSheet.absoluteFill as any}
      />

      {isInitialLoading ? (
        <View style={styles.loading} accessibilityLabel="Loading dashboard">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {hasError ? (
            <View style={styles.bannerWrap}>
              <Banner
                tone="error"
                icon="warning"
                message="Couldn't load your family. Pull to refresh."
              />
            </View>
          ) : null}

          {/* 1 — Header row */}
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <SectionHeader
                eyebrow="WELCOME BACK"
                title={`Hello, ${displayName}`}
                subtitle={familyQ.data?.name}
              />
            </View>
            <View style={styles.headerActions}>
              {familyQ.data?.inviteCode ? (
                <Chip
                  tone="navy"
                  icon={<Icon name="crown" size={14} color={colors.cream} />}
                  label={`Code: ${familyQ.data.inviteCode}`}
                  onPress={copyInviteCode}
                />
              ) : null}
              <Chip
                tone="neutral"
                icon={<Icon name="chevronRight" size={14} color={colors.textPrimary} />}
                label="Settings"
                onPress={() => router.push('/(parent)/settings')}
              />
            </View>
          </View>

          {/* 2 — Trait Radar hero */}
          {children.length === 1 ? (
            <View style={styles.heroWrap}>
              <TraitRadarCard
                child={children[0]}
                traits={traitByChild[children[0].id]}
                width="100%"
              />
            </View>
          ) : children.length > 1 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={children}
              keyExtractor={(c) => c.id}
              snapToInterval={CARD_WIDTH + CARD_GAP}
              decelerationRate="fast"
              contentContainerStyle={styles.heroCarousel}
              renderItem={({ item }) => (
                <TraitRadarCard
                  child={item}
                  traits={traitByChild[item.id]}
                  width={CARD_WIDTH}
                  style={{ marginRight: CARD_GAP }}
                />
              )}
            />
          ) : null}

          {/* 3 — Your Heroes roster */}
          <View style={styles.section}>
            <SectionHeader
              eyebrow="HEROES"
              title="Your team"
              action={
                <AnimatedPressable
                  onPress={() => router.push('/(parent)/children')}
                  accessibilityLabel="Manage heroes"
                >
                  <Typography.Body tone="accent">Manage →</Typography.Body>
                </AnimatedPressable>
              }
            />
            {children.length === 0 ? (
              <Surface variant="cream" padding="lg" radius="lg">
                <Typography.Heading level={3}>Add your first Hero</Typography.Heading>
                <Typography.Body tone="secondary" style={{ marginTop: 4 }}>
                  Create a child profile to assign missions and rewards.
                </Typography.Body>
                <View style={{ height: spacing.md }} />
                <AnimatedPressable
                  onPress={() => router.push('/(parent)/children')}
                  accessibilityLabel="Add a hero"
                  style={styles.emptyCta}
                >
                  <Typography.Body tone="onNavy" emphasis>
                    Add a Hero
                  </Typography.Body>
                </AnimatedPressable>
              </Surface>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {children.map((c) => (
                  <RosterRow
                    key={c.id}
                    child={{
                      displayName: c.displayName,
                      avatarUrl: c.avatarUrl ?? undefined,
                    }}
                    creature={
                      c.creature
                        ? {
                            species: c.creature.species,
                            stage: c.creature.stage,
                            happiness: c.creature.happiness,
                            name: c.creature.name,
                          }
                        : undefined
                    }
                    onPress={() => router.push('/(parent)/children')}
                  />
                ))}
              </View>
            )}
          </View>

          {/* 4 — Quick actions */}
          <View style={styles.section}>
            <SectionHeader title="Quick actions" />
            <View style={styles.quickGrid}>
              <QuickActionTile
                icon="scroll"
                label="New Mission"
                onPress={() => router.push('/(parent)/missions')}
              />
              <QuickActionTile
                icon="heart"
                label="New Reward"
                onPress={() => router.push('/(parent)/rewards')}
              />
              <QuickActionTile
                icon="plus"
                label="Add Hero"
                onPress={() => router.push('/(parent)/children')}
              />
            </View>
          </View>

          {/* 5 — Stats strip */}
          <View style={styles.section}>
            <View style={styles.statsRow}>
              <View style={styles.statSlot}>
                <StatCard
                  eyebrow="PENDING"
                  value={pendingCount}
                  label="Verifications"
                  icon="mail"
                  onPress={() => router.push('/(parent)/approvals')}
                />
              </View>
              <View style={styles.statSlot}>
                <StatCard
                  eyebrow="TODAY"
                  value={approvedTodayCount}
                  label="Approved"
                  icon="checkCircle"
                />
              </View>
              <View style={styles.statSlot}>
                <StatCard
                  eyebrow="REWARDS"
                  value={activeRewardsCount}
                  label="Active goals"
                  icon="crown"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

interface TraitRadarCardProps {
  child: ChildProfile;
  traits?: TraitSummary;
  width: number | '100%';
  style?: ViewStyle;
}

function TraitRadarCard({ child, traits, width, style }: TraitRadarCardProps) {
  const strength = traits?.strength ?? 0;
  const wisdom = traits?.wisdom ?? 0;
  const heart = traits?.heart ?? 0;
  // Auto-size the radar to fit the card.
  const screenW = Dimensions.get('window').width;
  const radarSize =
    typeof width === 'number' ? width - spacing.lg * 2 : Math.min(screenW - spacing.lg * 2, 320);

  return (
    <Surface
      variant="card"
      padding="lg"
      radius="xl"
      shadow="card"
      style={[{ width } as ViewStyle, ...(style ? [style] : [])]}
    >
      <Typography.Heading level={2}>{child.displayName}</Typography.Heading>
      <View style={{ alignItems: 'center', marginTop: spacing.sm }}>
        <TraitRadar
          strength={strength}
          wisdom={wisdom}
          heart={heart}
          max={50}
          size={radarSize}
        />
      </View>
      <View style={styles.traitChipRow}>
        <Chip
          tone="strength"
          label={`Strength · ${strength}`}
          filled={false}
        />
        <Chip tone="wisdom" label={`Wisdom · ${wisdom}`} filled={false} />
        <Chip tone="heart" label={`Heart · ${heart}`} filled={false} />
      </View>
    </Surface>
  );
}

interface QuickActionTileProps {
  icon: IconName;
  label: string;
  onPress: () => void;
}

function QuickActionTile({ icon, label, onPress }: QuickActionTileProps) {
  return (
    <View style={styles.quickSlot}>
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Surface variant="cream" padding="md" radius="lg">
          <View style={styles.quickInner}>
            <Icon name={icon} size={28} color={colors.accent} />
            <Typography.Caption
              tone="primary"
              emphasis
              align="center"
              style={{ marginTop: spacing.sm }}
            >
              {label}
            </Typography.Caption>
          </View>
        </Surface>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: FLOATING_TAB_BAR_SCREEN_PADDING,
  },
  bannerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  headerActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  heroWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  heroCarousel: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  emptyCta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: 999,
  },
  traitChipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickSlot: { flex: 1 },
  quickInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statSlot: { flex: 1 },
});
