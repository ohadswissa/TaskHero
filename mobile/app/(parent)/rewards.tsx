/**
 * Parent Rewards — Polish-B4 rebuild.
 *
 * Per-child reward goals composed entirely of design-system primitives:
 *   GradientBackdrop · SectionHeader · ScrollCard · OrbProgress · Surface ·
 *   Chip · AnimatedPressable · Avatar · Icon · Typography · Banner ·
 *   EmptyState · Toast (ToastStack mounted by _layout).
 *
 * Layout:
 *   • One section per child (Avatar header + name).
 *   • Current ACTIVE reward as a parchment ScrollCard with OrbProgress
 *     (coins / goal), title, description.
 *   • "Change reward" button → bottom sheet listing REWARD_TEMPLATES as
 *     Chip-bordered options + a custom-name input fallback. Selecting one
 *     calls rewardsApi.createReward (server-side archives the previous
 *     active for that child).
 *   • Below: unlocked history as muted chips (REDEEMED / ARCHIVED).
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  childrenApi,
  extractApiError,
  queryKeys,
  rewardsApi,
} from '@/api';
import type { ChildProfile, Reward } from '@/api/types';
import { RewardCelebration } from '@/components/rewards/RewardCelebration';
import {
  AnimatedPressable,
  Avatar,
  Banner,
  Chip,
  EmptyState,
  FLOATING_TAB_BAR_SCREEN_PADDING,
  GradientBackdrop,
  Icon,
  OrbProgress,
  ScrollCard,
  SectionHeader,
  Surface,
  Typography,
  useToast,
} from '@/components/ui';
import { borderRadius, colors, spacing, typographyTokens } from '@/theme';

// TODO(monorepo): import REWARD_GOAL_TEMPLATES from packages/shared-types
// when wired. Mirrors backend/src/common/utils/progression.ts.
interface RewardTemplate {
  name: string;
  coinThreshold: number;
  icon: string;
  description: string;
}
const REWARD_TEMPLATES: RewardTemplate[] = [
  {
    name: 'Pizza night',
    coinThreshold: 80,
    icon: '🍕',
    description: 'Parent orders or prepares pizza for dinner.',
  },
  {
    name: 'Extra screen time (30 min)',
    coinThreshold: 40,
    icon: '📱',
    description: '30 extra minutes of screen time.',
  },
  {
    name: 'Trip to the park / playground',
    coinThreshold: 60,
    icon: '🎡',
    description: 'A trip out to the park or playground.',
  },
  {
    name: 'Choose the movie tonight',
    coinThreshold: 30,
    icon: '🎬',
    description: 'Child picks the family movie tonight.',
  },
  {
    name: 'New book (child picks)',
    coinThreshold: 100,
    icon: '📚',
    description: 'A new book the child chooses.',
  },
];

export default function ParentRewardsScreen() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [changeFor, setChangeFor] = useState<ChildProfile | null>(null);
  const [redeemConfirm, setRedeemConfirm] = useState<Reward | null>(null);
  const [celebrateName, setCelebrateName] = useState<string | null>(null);

  const rewardsQ = useQuery({
    queryKey: [...queryKeys.rewards.family],
    queryFn: rewardsApi.listFamilyRewards,
  });
  const childrenQ = useQuery({
    queryKey: [...queryKeys.children.list],
    queryFn: childrenApi.listChildren,
  });

  const children = childrenQ.data ?? [];

  const { activeByChild, historyByChild } = useMemo(() => {
    const active = new Map<string, Reward>();
    const history = new Map<string, Reward[]>();
    for (const r of rewardsQ.data?.active ?? []) {
      if (r.targetChildProfileId) active.set(r.targetChildProfileId, r);
    }
    for (const r of [
      ...(rewardsQ.data?.redeemed ?? []),
      ...(rewardsQ.data?.archived ?? []),
    ]) {
      if (!r.targetChildProfileId) continue;
      const arr = history.get(r.targetChildProfileId) ?? [];
      arr.push(r);
      history.set(r.targetChildProfileId, arr);
    }
    return { activeByChild: active, historyByChild: history };
  }, [rewardsQ.data]);

  const createMut = useMutation({
    mutationFn: (vars: {
      childProfileId: string;
      name: string;
      targetMissions: number;
    }) =>
      rewardsApi.createReward({
        childProfileId: vars.childProfileId,
        name: vars.name,
        targetMissions: vars.targetMissions,
      }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.rewards.family] });
      const childName =
        children.find((c) => c.id === vars.childProfileId)?.displayName ??
        'your Hero';
      toast.show(`Reward set for ${childName}`, { tone: 'success' });
      setChangeFor(null);
    },
    onError: (err) => {
      toast.show(extractApiError(err), { tone: 'error' });
    },
  });

  const redeemMut = useMutation({
    mutationFn: (id: string) => rewardsApi.redeemReward(id),
    onSuccess: (_data, _id) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.rewards.family] });
      if (redeemConfirm) setCelebrateName(redeemConfirm.name);
      setRedeemConfirm(null);
    },
    onError: (err) => {
      toast.show(extractApiError(err), { tone: 'error' });
      setRedeemConfirm(null);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...queryKeys.rewards.family] }),
        queryClient.invalidateQueries({ queryKey: [...queryKeys.children.list] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const initialLoading = rewardsQ.isPending || childrenQ.isPending;
  const hasError = !!rewardsQ.error || !!childrenQ.error;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GradientBackdrop
        variant="parentDashboard"
        intensity="subtle"
        style={StyleSheet.absoluteFill as any}
      />

      {initialLoading ? (
        <View style={styles.loading} accessibilityLabel="Loading rewards">
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
                message="Couldn't load rewards. Pull to refresh."
              />
            </View>
          ) : null}

          <View style={styles.headerRow}>
            <SectionHeader
              eyebrow="REWARDS"
              title="Reward goals"
              subtitle="Coin goals your Heroes work toward."
            />
          </View>

          {children.length === 0 ? (
            <View style={styles.section}>
              <Surface variant="cream" padding="lg" radius="lg">
                <EmptyState
                  title="Add a Hero first"
                  body="Reward goals are linked to a Hero — add one from the Heroes tab."
                />
              </Surface>
            </View>
          ) : (
            <View style={styles.section}>
              {children.map((c) => {
                const reward = activeByChild.get(c.id);
                const history = historyByChild.get(c.id) ?? [];
                return (
                  <View key={c.id} style={styles.childSection}>
                    <View style={styles.childHeader}>
                      <Avatar
                        initials={c.displayName.charAt(0)}
                        size="md"
                        tone="navy"
                      />
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Typography.Heading level={2}>
                          {c.displayName}
                        </Typography.Heading>
                        {c.hero ? (
                          <Typography.Caption tone="secondary">
                            {c.hero.coins} coins available
                          </Typography.Caption>
                        ) : null}
                      </View>
                    </View>

                    {reward ? (
                      <ActiveRewardCard
                        reward={reward}
                        currentCoins={c.hero?.coins ?? 0}
                        onChange={() => setChangeFor(c)}
                        onRedeem={() => setRedeemConfirm(reward)}
                      />
                    ) : (
                      <Surface variant="cream" padding="lg" radius="lg">
                        <EmptyState
                          title="No active reward"
                          body={`Set a goal for ${c.displayName} to work toward.`}
                          cta={{
                            label: 'Set a reward',
                            onPress: () => setChangeFor(c),
                          }}
                        />
                      </Surface>
                    )}

                    {history.length > 0 ? (
                      <View style={styles.historyBlock}>
                        <Typography.Caption tone="secondary" emphasis>
                          PAST GOALS
                        </Typography.Caption>
                        <View style={styles.historyChips}>
                          {history.slice(0, 6).map((r) => (
                            <Chip
                              key={r.id}
                              tone="neutral"
                              label={`${r.name} · ${r.status}`}
                              size="sm"
                              filled={false}
                            />
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Change reward sheet */}
      <ChangeRewardSheet
        child={changeFor}
        currentReward={changeFor ? activeByChild.get(changeFor.id) : undefined}
        onClose={() => setChangeFor(null)}
        onSubmit={(name, targetMissions) =>
          changeFor &&
          createMut.mutate({
            childProfileId: changeFor.id,
            name,
            targetMissions,
          })
        }
        submitting={createMut.isPending}
      />

      {/* Redeem confirmation */}
      <Modal
        visible={!!redeemConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setRedeemConfirm(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setRedeemConfirm(null)}
          />
          <View style={styles.confirmCard}>
            <SectionHeader
              title="Mark as redeemed?"
              subtitle={`Confirm you've delivered "${redeemConfirm?.name}" in real life.`}
            />
            <AnimatedPressable
              onPress={() =>
                redeemConfirm && redeemMut.mutate(redeemConfirm.id)
              }
              disabled={redeemMut.isPending}
              style={styles.primaryBtn}
              accessibilityRole="button"
              accessibilityLabel="Confirm redeem"
            >
              <Typography.Body tone="onNavy" emphasis>
                {redeemMut.isPending ? 'Redeeming…' : 'Mark redeemed'}
              </Typography.Body>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => setRedeemConfirm(null)}
              style={styles.sheetCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Typography.Body tone="secondary" emphasis>
                Cancel
              </Typography.Body>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>

      <RewardCelebration
        visible={!!celebrateName}
        rewardName={celebrateName ?? ''}
        onDismiss={() => setCelebrateName(null)}
      />
    </SafeAreaView>
  );
}

// =========================================================================
// Active reward card (parchment ScrollCard + OrbProgress)
// =========================================================================

interface ActiveRewardCardProps {
  reward: Reward;
  currentCoins: number;
  onChange: () => void;
  onRedeem: () => void;
}

function ActiveRewardCard({
  reward,
  currentCoins,
  onChange,
  onRedeem,
}: ActiveRewardCardProps) {
  const target = Math.max(1, reward.conditionValue);
  const pct = Math.max(0, Math.min(100, Math.round((currentCoins / target) * 100)));
  const unlocked = currentCoins >= target;

  return (
    <View style={styles.activeWrap}>
      <ScrollCard
        title={reward.name}
        align="center"
        body={
          reward.description ||
          `Earn ${target} coins through verified missions to unlock this goal.`
        }
      />
      <Surface variant="card" padding="md" radius="lg" shadow="card">
        <View style={styles.orbRow}>
          <OrbProgress value={pct} size={56} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Typography.Caption tone="secondary" emphasis>
              PROGRESS
            </Typography.Caption>
            <Typography.Heading level={2}>
              {currentCoins} / {target}
            </Typography.Heading>
            <Typography.Caption tone="secondary">
              {unlocked
                ? 'Ready to redeem!'
                : `${target - currentCoins} more coins to go.`}
            </Typography.Caption>
          </View>
        </View>
        <View style={styles.actionsRow}>
          <AnimatedPressable
            onPress={onChange}
            accessibilityRole="button"
            accessibilityLabel="Change reward"
            style={styles.outlineBtn}
          >
            <Icon name="scroll" size={14} color={colors.primary} />
            <Typography.Body emphasis style={{ marginLeft: 6 }}>
              Change reward
            </Typography.Body>
          </AnimatedPressable>
          {unlocked ? (
            <AnimatedPressable
              onPress={onRedeem}
              accessibilityRole="button"
              accessibilityLabel="Mark redeemed"
              style={styles.successBtn}
            >
              <Icon name="checkCircle" size={14} color={colors.cream} />
              <Typography.Body
                tone="onNavy"
                emphasis
                style={{ marginLeft: 6 }}
              >
                Redeem
              </Typography.Body>
            </AnimatedPressable>
          ) : null}
        </View>
      </Surface>
    </View>
  );
}

// =========================================================================
// Change-reward bottom sheet
// =========================================================================

interface ChangeRewardSheetProps {
  child: ChildProfile | null;
  currentReward?: Reward;
  onClose: () => void;
  onSubmit: (name: string, targetCoins: number) => void;
  submitting: boolean;
}

function ChangeRewardSheet({
  child,
  currentReward,
  onClose,
  onSubmit,
  submitting,
}: ChangeRewardSheetProps) {
  const [selected, setSelected] = useState<number | null>(0);
  const [customName, setCustomName] = useState('');
  const [customTarget, setCustomTarget] = useState(50);
  const [useCustom, setUseCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when reopened for a different child
  React.useEffect(() => {
    if (child) {
      setSelected(0);
      setUseCustom(false);
      setCustomName('');
      setCustomTarget(50);
      setError(null);
    }
  }, [child]);

  const submit = () => {
    setError(null);
    if (useCustom) {
      const name = customName.trim();
      if (name.length < 1 || name.length > 80) {
        setError('Reward name must be 1–80 characters.');
        return;
      }
      if (customTarget < 1) {
        setError('Target must be at least 1 coin.');
        return;
      }
      onSubmit(name, customTarget);
      return;
    }
    if (selected === null) {
      setError('Pick a template or build your own.');
      return;
    }
    const tpl = REWARD_TEMPLATES[selected];
    onSubmit(tpl.name, tpl.coinThreshold);
  };

  return (
    <Modal
      visible={!!child}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sheetHandle} />
            <SectionHeader
              title={currentReward ? 'Change reward' : 'Set a reward'}
              subtitle={
                child
                  ? `For ${child.displayName}${
                      currentReward
                        ? ` — replaces "${currentReward.name}"`
                        : ''
                    }`
                  : undefined
              }
            />

            {currentReward ? (
              <View style={{ marginBottom: spacing.md }}>
                <Banner
                  tone="warning"
                  icon="warning"
                  message="Creating a new goal will archive the current one."
                />
              </View>
            ) : null}

            {!useCustom ? (
              <View style={styles.templateGrid}>
                {REWARD_TEMPLATES.map((t, i) => {
                  const active = selected === i;
                  return (
                    <Pressable
                      key={t.name}
                      onPress={() => setSelected(i)}
                      accessibilityRole="button"
                      accessibilityLabel={`Pick ${t.name}`}
                      style={[
                        styles.templateCard,
                        active && styles.templateCardActive,
                      ]}
                    >
                      <Typography.Display
                        align="center"
                        style={styles.templateIcon}
                      >
                        {t.icon}
                      </Typography.Display>
                      <Typography.Body
                        emphasis
                        align="center"
                        tone={active ? 'onNavy' : 'primary'}
                        numberOfLines={2}
                      >
                        {t.name}
                      </Typography.Body>
                      <Typography.Caption
                        align="center"
                        tone={active ? 'onNavy' : 'accent'}
                        style={{ marginTop: 4 }}
                      >
                        🪙 {t.coinThreshold}
                      </Typography.Caption>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View>
                <Typography.Caption tone="secondary" emphasis style={styles.label}>
                  REWARD NAME
                </Typography.Caption>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Family arcade trip"
                    placeholderTextColor={colors.textTertiary}
                    value={customName}
                    onChangeText={setCustomName}
                    maxLength={80}
                  />
                </View>
                <Typography.Caption tone="secondary" emphasis style={styles.label}>
                  TARGET COINS
                </Typography.Caption>
                <View style={styles.stepperRow}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() =>
                      setCustomTarget((v) => Math.max(1, v - 10))
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Decrease target"
                  >
                    <Icon name="chevronLeft" size={16} color={colors.primary} />
                  </Pressable>
                  <Typography.Heading level={2} style={styles.stepperValue}>
                    {customTarget}
                  </Typography.Heading>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setCustomTarget((v) => v + 10)}
                    accessibilityRole="button"
                    accessibilityLabel="Increase target"
                  >
                    <Icon name="chevronRight" size={16} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            )}

            <AnimatedPressable
              onPress={() => setUseCustom((v) => !v)}
              style={styles.toggleCustom}
              accessibilityRole="button"
              accessibilityLabel="Toggle custom"
            >
              <Typography.Body tone="accent" emphasis>
                {useCustom ? '← Back to templates' : 'Or build your own →'}
              </Typography.Body>
            </AnimatedPressable>

            {error ? (
              <View style={{ marginTop: spacing.sm }}>
                <Banner tone="error" icon="warning" message={error} />
              </View>
            ) : null}

            <AnimatedPressable
              onPress={submit}
              disabled={submitting}
              style={
                submitting
                  ? [styles.primaryBtn, styles.primaryBtnDisabled]
                  : styles.primaryBtn
              }
              accessibilityRole="button"
              accessibilityLabel="Save reward"
            >
              <Typography.Body tone="onNavy" emphasis>
                {submitting ? 'Saving…' : 'Save reward'}
              </Typography.Body>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={onClose}
              style={styles.sheetCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Typography.Body tone="secondary" emphasis>
                Cancel
              </Typography.Body>
            </AnimatedPressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// =========================================================================
// Styles
// =========================================================================

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingBottom: FLOATING_TAB_BAR_SCREEN_PADDING },
  bannerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  childSection: { marginBottom: spacing.xl },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  activeWrap: { gap: spacing.sm },
  orbRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.creamSoft,
  },
  successBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.success,
  },
  historyBlock: { marginTop: spacing.md },
  historyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,27,61,0.45)',
  } as ViewStyle,
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetCancel: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  templateCard: {
    width: '47%',
    backgroundColor: colors.creamSoft,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  templateCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.accent,
  },
  templateIcon: { fontSize: 28, lineHeight: 32, marginBottom: 4 },
  toggleCustom: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  label: { marginTop: spacing.sm, marginBottom: 4 },
  inputWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.creamSoft,
    paddingHorizontal: spacing.md,
  },
  input: {
    ...typographyTokens.body,
    color: colors.primary,
    paddingVertical: spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 60,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  confirmCard: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
});
