import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/common';
import { childrenApi } from '@/api/children.api';
import { familiesApi } from '@/api/families.api';
import { approvalsApi } from '@/api/approvals.api';
import { progressionApi } from '@/api/progression.api';
import { queryKeys } from '@/api/queryKeys';
import type { ChildProfile } from '@/api/types';
import type { TraitSummary } from '@/api/progression.api';
import { colors, spacing, borderRadius, fonts, shadows } from '@/theme';
import { TraitRadar } from '@/components/progression/TraitRadar';

export default function ParentDashboard() {
  const { user } = useAuthStore();
  const displayName = user?.displayName || 'Parent';
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const familyQ = useQuery({ queryKey: ['family', 'me'], queryFn: familiesApi.getMyFamily });
  const childrenQ = useQuery({ queryKey: ['children'], queryFn: childrenApi.listChildren });
  const pendingQ = useQuery({
    queryKey: [...queryKeys.approvals.pending],
    queryFn: approvalsApi.listPending,
  });

  const childIds = (childrenQ.data ?? []).map((c) => c.id);
  const traitQueries = useQueries({
    queries: childIds.map((cid) => ({
      queryKey: queryKeys.progression.summary(cid),
      queryFn: () => progressionApi.traitSummary(cid),
      staleTime: 1000 * 60,
    })),
  });
  const traitByChild: Record<string, TraitSummary | undefined> = {};
  childIds.forEach((cid, i) => {
    traitByChild[cid] = traitQueries[i]?.data;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['family', 'me'] }),
      queryClient.invalidateQueries({ queryKey: ['children'] }),
      queryClient.invalidateQueries({ queryKey: [...queryKeys.approvals.pending] }),
      ...childIds.map((cid) =>
        queryClient.invalidateQueries({ queryKey: queryKeys.progression.summary(cid) }),
      ),
    ]);
    setRefreshing(false);
  };

  const copyCode = async () => {
    const code = familyQ.data?.inviteCode;
    if (!code) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      } else {
        // expo-clipboard not installed; soft fallback — code is already visible.
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const pendingCount = pendingQ.data?.length ?? 0;
  const children: ChildProfile[] = childrenQ.data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Greeting block */}
        <View style={styles.heroBlock}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.displayName}>{displayName} 👋</Text>
          <View style={styles.underline} />

          {/* Family code chip */}
          {familyQ.data && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.familyChip}
              onPress={copyCode}
              accessibilityLabel="Copy family invite code"
            >
              <View style={styles.familyChipLeft}>
                <Text style={styles.familyChipLabel}>Family Code</Text>
                <Text style={styles.familyChipCode}>{familyQ.data.inviteCode}</Text>
                <Text style={styles.familyChipName}>{familyQ.data.name}</Text>
              </View>
              <View style={styles.familyChipIcon}>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Pending verifications */}
        <View style={styles.section}>
          <Card variant="elevated" padding="md">
            <View style={styles.pendingRow}>
              <View style={styles.pendingIcon}>
                <Ionicons name="hourglass-outline" size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingTitle}>Pending verifications</Text>
                <Text style={styles.pendingSub}>
                  {pendingCount === 0
                    ? 'All caught up ✓'
                    : `${pendingCount} mission${pendingCount === 1 ? '' : 's'} awaiting your review.`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(parent)/approvals')}
                style={styles.pendingBtn}
              >
                <Text style={styles.pendingBtnText}>Review</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Heroes */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Your Heroes</Text>
            <TouchableOpacity onPress={() => router.push('/(parent)/children')}>
              <Text style={styles.sectionLink}>Manage →</Text>
            </TouchableOpacity>
          </View>

          {children.length === 0 ? (
            <Card variant="outlined" padding="lg">
              <Text style={styles.emptyTitle}>Add your first Hero</Text>
              <Text style={styles.emptySub}>
                Create a child profile to assign missions and rewards.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => router.push('/(parent)/children')}
              >
                <Text style={styles.emptyCtaText}>Add a Hero</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.surface} />
              </TouchableOpacity>
            </Card>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: spacing.md }}
            >
              {children.map((c) => (
                <View key={c.id} style={styles.heroCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>
                      {c.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.heroName}>{c.displayName}</Text>
                  {c.hero && (
                    <Text style={styles.heroLevel}>
                      Lv {c.hero.level} · {c.hero.coins} 🪙
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.pinChip}
                    onPress={() => router.push('/(parent)/children')}
                    accessibilityLabel="Manage PIN"
                  >
                    <Text style={styles.pinLabel}>PIN</Text>
                    <Text style={styles.pinValue}>••••</Text>
                    <Ionicons name="key-outline" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Trait radars (per child) */}
        {children.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Trait Growth</Text>
              <Text style={styles.sectionSub}>Strength · Wisdom · Heart</Text>
            </View>
            {children.length === 1 ? (
              <Card variant="elevated" padding="md">
                <Text style={styles.radarChildName}>{children[0].displayName}</Text>
                <View style={styles.radarSingleWrap}>
                  <TraitRadar
                    strength={traitByChild[children[0].id]?.strength ?? 0}
                    wisdom={traitByChild[children[0].id]?.wisdom ?? 0}
                    heart={traitByChild[children[0].id]?.heart ?? 0}
                  />
                </View>
              </Card>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: spacing.md }}
              >
                {children.map((c) => {
                  const t = traitByChild[c.id];
                  return (
                    <View key={c.id} style={styles.radarCard}>
                      <Text style={styles.radarChildName}>{c.displayName}</Text>
                      <TraitRadar
                        strength={t?.strength ?? 0}
                        wisdom={t?.wisdom ?? 0}
                        heart={t?.heart ?? 0}
                        size={260}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(parent)/missions')}
            >
              <View style={[styles.quickIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="flag" size={22} color={colors.surface} />
              </View>
              <Text style={styles.quickLabel}>New Mission</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(parent)/rewards')}
            >
              <View style={[styles.quickIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="gift" size={22} color={colors.surface} />
              </View>
              <Text style={styles.quickLabel}>New Reward Goal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(parent)/children')}
            >
              <View style={[styles.quickIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="person-add" size={22} color={colors.surface} />
              </View>
              <Text style={styles.quickLabel}>Add Hero</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroBlock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  greeting: { fontFamily: fonts.regular, fontSize: 16, color: colors.textSecondary },
  displayName: {
    fontFamily: fonts.extraBold,
    fontSize: 30,
    color: colors.primary,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  underline: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 8,
  },
  familyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    ...shadows.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  familyChipLeft: { flex: 1 },
  familyChipLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  familyChipCode: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.primary,
    letterSpacing: 2,
    marginTop: 2,
  },
  familyChipName: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  familyChipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.primary },
  sectionSub: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.textSecondary, letterSpacing: 1 },
  sectionLink: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.accent },

  radarCard: {
    width: 280,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  radarSingleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  radarChildName: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },

  pendingRow: { flexDirection: 'row', alignItems: 'center' },
  pendingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  pendingTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  pendingSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  pendingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  pendingBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },

  heroCard: {
    width: 150,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarInitial: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.accent },
  heroName: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary, textAlign: 'center' },
  heroLevel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  pinLabel: { fontFamily: fonts.semiBold, fontSize: 10, color: colors.textSecondary },
  pinValue: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary, letterSpacing: 2 },
  pinHint: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  emptyTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    gap: 6,
  },
  emptyCtaText: { fontFamily: fonts.bold, fontSize: 14, color: colors.surface },

  quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  quickAction: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primary, textAlign: 'center' },
});
