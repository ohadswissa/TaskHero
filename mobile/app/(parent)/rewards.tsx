import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Input, ScreenHeader } from '@/components/common';
import { rewardsApi } from '@/api/rewards.api';
import { childrenApi } from '@/api/children.api';
import { extractApiError } from '@/api/client';
import type { ChildProfile, Reward, RewardStatus } from '@/api/types';
import { colors, spacing, borderRadius, fonts, shadows } from '@/theme';
import { RewardCelebration } from '@/components/rewards/RewardCelebration';

// TODO(monorepo): import this constant from packages/shared-types when the
// workspace package is wired up. Mirrors backend/src/common/utils/progression.ts
// REWARD_GOAL_TEMPLATES.
const REWARD_TEMPLATES: { name: string; coinThreshold: number; icon: string }[] = [
  { name: 'Pizza night', coinThreshold: 80, icon: '🍕' },
  { name: 'Extra screen time (30 min)', coinThreshold: 40, icon: '📱' },
  { name: 'Trip to the park / playground', coinThreshold: 60, icon: '🎡' },
  { name: 'Choose the movie tonight', coinThreshold: 30, icon: '🎬' },
  { name: 'New book (child picks)', coinThreshold: 100, icon: '📚' },
];

export default function ParentRewardsScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(0);
  const [customName, setCustomName] = useState('');
  const [customTarget, setCustomTarget] = useState(50);
  const [useCustom, setUseCustom] = useState(false);
  const [childProfileId, setChildProfileId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const rewardsQ = useQuery({
    queryKey: ['rewards', 'family'],
    queryFn: rewardsApi.listFamilyRewards,
  });
  const childrenQ = useQuery({ queryKey: ['children'], queryFn: childrenApi.listChildren });

  const createMut = useMutation({
    mutationFn: rewardsApi.createReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', 'family'] });
      setShowCreate(false);
      Alert.alert('Reward goal created', 'Your hero can now work toward this goal!');
      resetForm();
    },
    onError: (err) => setFormError(extractApiError(err)),
  });

  const [celebrateName, setCelebrateName] = useState<string | null>(null);

  const redeemMut = useMutation({
    mutationFn: (id: string) => rewardsApi.redeemReward(id),
    onMutate: (id: string) => {
      const all: Reward[] = [
        ...(rewardsQ.data?.active ?? []),
        ...(rewardsQ.data?.draft ?? []),
      ];
      const r = all.find((x) => x.id === id);
      if (r) setCelebrateName(r.name);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rewards', 'family'] }),
    onError: (err) => Alert.alert('Redeem failed', extractApiError(err)),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['rewards', 'family'] }),
      queryClient.invalidateQueries({ queryKey: ['children'] }),
    ]);
    setRefreshing(false);
  };

  const resetForm = () => {
    setSelectedTemplate(0);
    setUseCustom(false);
    setCustomName('');
    setCustomTarget(50);
    setChildProfileId(null);
    setFormError(null);
  };

  // Group rewards by child
  const children = childrenQ.data ?? [];
  const rewardsByChild = useMemo(() => {
    const map = new Map<string | null, Reward[]>();
    const all: Reward[] = [
      ...(rewardsQ.data?.active ?? []),
      ...(rewardsQ.data?.redeemed ?? []),
      ...(rewardsQ.data?.archived ?? []),
      ...(rewardsQ.data?.draft ?? []),
    ];
    for (const r of all) {
      const key = r.targetChildProfileId;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    return map;
  }, [rewardsQ.data]);

  const childHasActive = (cid: string): boolean =>
    (rewardsQ.data?.active ?? []).some((r) => r.targetChildProfileId === cid);

  const submit = () => {
    setFormError(null);
    if (!childProfileId) {
      setFormError('Pick a hero for this reward goal.');
      return;
    }
    let name: string;
    let target: number;
    if (useCustom) {
      name = customName.trim();
      target = customTarget;
      if (name.length < 1 || name.length > 80) {
        setFormError('Reward name must be 1–80 characters.');
        return;
      }
      if (target < 1) {
        setFormError('Target must be at least 1 mission.');
        return;
      }
    } else {
      if (selectedTemplate === null) {
        setFormError('Pick a template or build your own.');
        return;
      }
      const tpl = REWARD_TEMPLATES[selectedTemplate];
      name = tpl.name;
      target = tpl.coinThreshold;
    }

    if (childHasActive(childProfileId)) {
      const childName = children.find((c) => c.id === childProfileId)?.displayName ?? 'This hero';
      Alert.alert(
        'Replace existing reward?',
        `${childName} already has an active goal — creating a new one will archive the previous goal.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () =>
              createMut.mutate({ childProfileId, name, targetMissions: target }),
          },
        ],
      );
      return;
    }

    createMut.mutate({ childProfileId, name, targetMissions: target });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Reward Goals"
        subtitle="Coin thresholds your heroes can work toward."
      />

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 2 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {children.length === 0 && (
          <Card variant="outlined" padding="lg">
            <Text style={styles.empty}>Add a hero first before creating reward goals.</Text>
          </Card>
        )}

        {children.map((c) => (
          <View key={c.id} style={styles.childGroup}>
            <Text style={styles.childGroupTitle}>{c.displayName}</Text>
            {(rewardsByChild.get(c.id) ?? []).length === 0 ? (
              <Card variant="outlined" padding="md">
                <Text style={styles.empty}>No reward goal yet.</Text>
              </Card>
            ) : (
              (rewardsByChild.get(c.id) ?? []).map((r) => (
                <RewardRow
                  key={r.id}
                  reward={r}
                  onRedeem={() => redeemMut.mutate(r.id)}
                  redeeming={redeemMut.isPending && redeemMut.variables === r.id}
                />
              ))
            )}
          </View>
        ))}

        {children.length > 0 && (
          <TouchableOpacity style={styles.addCta} onPress={() => setShowCreate(true)}>
            <Ionicons name="gift" size={20} color={colors.surface} />
            <Text style={styles.addCtaText}>New Reward Goal</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Create modal */}
      <Modal
        visible={showCreate}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreate(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowCreate(false)}
          />
          <ScrollView
            style={styles.sheet}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>New Reward Goal</Text>
            <Text style={styles.sheetSub}>
              Pick a template or build your own goal in coins.
            </Text>

            {/* Templates */}
            {!useCustom && (
              <View style={styles.tplGrid}>
                {REWARD_TEMPLATES.map((t, i) => {
                  const active = selectedTemplate === i;
                  return (
                    <TouchableOpacity
                      key={t.name}
                      style={[styles.tplCard, active && styles.tplCardActive]}
                      onPress={() => setSelectedTemplate(i)}
                    >
                      <Text style={styles.tplIcon}>{t.icon}</Text>
                      <Text style={[styles.tplName, active && { color: colors.surface }]}>
                        {t.name}
                      </Text>
                      <Text style={[styles.tplCoins, active && { color: colors.surface }]}>
                        🪙 {t.coinThreshold}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={styles.toggleCustom}
              onPress={() => setUseCustom((v) => !v)}
            >
              <Ionicons
                name={useCustom ? 'arrow-back' : 'create-outline'}
                size={16}
                color={colors.accent}
              />
              <Text style={styles.toggleCustomText}>
                {useCustom ? 'Back to templates' : 'Or build your own'}
              </Text>
            </TouchableOpacity>

            {useCustom && (
              <View>
                <Input
                  label="Reward name"
                  placeholder="e.g., Family arcade trip"
                  value={customName}
                  onChangeText={setCustomName}
                  maxLength={80}
                />
                <Text style={styles.fieldLabel}>Target (coins)</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setCustomTarget((v) => Math.max(1, v - 10))}
                  >
                    <Ionicons name="remove" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{customTarget}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setCustomTarget((v) => v + 10)}
                  >
                    <Ionicons name="add" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.fieldLabel}>For which hero?</Text>
            <View style={styles.childChips}>
              {children.map((c) => {
                const active = childProfileId === c.id;
                const hasActive = childHasActive(c.id);
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.childChip,
                      active && styles.childChipActive,
                      hasActive && styles.childChipWarn,
                    ]}
                    onPress={() => setChildProfileId(c.id)}
                  >
                    <Text style={[styles.childChipText, active && { color: colors.surface }]}>
                      {c.displayName}
                    </Text>
                    {hasActive && (
                      <View style={styles.warnDot}>
                        <Text style={styles.warnDotText}>!</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {childProfileId && childHasActive(childProfileId) && (
              <View style={styles.warnBanner}>
                <Ionicons name="warning-outline" size={16} color={colors.warning} />
                <Text style={styles.warnText}>
                  {children.find((c) => c.id === childProfileId)?.displayName} already has an
                  active goal — creating a new one will replace it.
                </Text>
              </View>
            )}

            {formError && <Text style={styles.formError}>{formError}</Text>}

            <Button
              title="Create Goal"
              onPress={submit}
              loading={createMut.isPending}
              style={{ marginTop: spacing.md }}
            />
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setShowCreate(false)}
              style={{ marginTop: spacing.xs }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
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
// Reward row
// =========================================================================

function RewardRow({
  reward,
  onRedeem,
  redeeming,
}: {
  reward: Reward;
  onRedeem: () => void;
  redeeming: boolean;
}) {
  const status: RewardStatus = reward.status;
  const statusColor =
    status === 'ACTIVE'
      ? colors.accent
      : status === 'REDEEMED'
        ? colors.success
        : colors.textSecondary;
  return (
    <Card variant="elevated" padding="md" style={{ marginBottom: spacing.sm }}>
      <View style={styles.rewardHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rewardName}>{reward.name}</Text>
          <Text style={styles.rewardTarget}>🪙 {reward.conditionValue} coins</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{status}</Text>
        </View>
      </View>
      {status === 'ACTIVE' && (
        <TouchableOpacity
          style={styles.redeemBtn}
          onPress={onRedeem}
          disabled={redeeming}
        >
          <Text style={styles.redeemBtnText}>
            {redeeming ? 'Redeeming…' : 'Mark redeemed'}
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  childGroup: { marginBottom: spacing.md },
  childGroupTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  empty: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },

  rewardHead: { flexDirection: 'row', alignItems: 'center' },
  rewardName: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  rewardTarget: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: { fontFamily: fonts.bold, fontSize: 10, color: colors.surface, letterSpacing: 0.5 },
  redeemBtn: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  redeemBtnText: { fontFamily: fonts.bold, fontSize: 12, color: colors.surface },

  addCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  addCtaText: { fontFamily: fonts.bold, fontSize: 15, color: colors.surface },

  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,27,61,0.45)' },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetTitle: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.primary },
  sheetSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },

  tplGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  tplCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  tplCardActive: { backgroundColor: colors.primary, borderColor: colors.accent },
  tplIcon: { fontSize: 26, marginBottom: 4 },
  tplName: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary, textAlign: 'center' },
  tplCoins: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.accent, marginTop: 4 },

  toggleCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  toggleCustomText: { fontFamily: fonts.bold, fontSize: 13, color: colors.accent },

  fieldLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.primary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperValue: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.primary,
    minWidth: 50,
    textAlign: 'center',
  },

  childChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  childChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  childChipWarn: { borderColor: colors.warning },
  childChipText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.primary },
  warnDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnDotText: { fontFamily: fonts.bold, fontSize: 10, color: colors.surface },

  warnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  warnText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.primary },

  formError: {
    color: colors.error,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    marginTop: spacing.sm,
  },
});
