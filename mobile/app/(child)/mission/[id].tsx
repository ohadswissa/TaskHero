/**
 * Mission Detail — `/(child)/mission/[id]`.
 *
 * Fetches the assignment via `GET /assignments/:id` and renders:
 *  - header (title, trait chip, status pill, back button)
 *  - full mission description
 *  - parchment Hero's Wisdom card (warm cream, italic serif-ish copy)
 *  - status-aware bottom CTA:
 *      PENDING / IN_PROGRESS → big amber "I did it!" opens CompletionSheet
 *      SUBMITTED             → disabled "Waiting for your parent…" + spinner
 *      APPROVED              → green check + "Verified!"
 *
 * Pulls the new central `queryKeys` registry so React-Query invalidation
 * after submission flows in from the sheet.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { assignmentsApi, extractApiError, queryKeys } from '@/api';
import {
  borderRadius,
  colors,
  fonts,
  shadows,
  spacing,
  traitColor,
  traitLabel,
} from '@/theme';
import { CompletionSheet } from '@/components/missions/CompletionSheet';

function statusPillStyle(status: string) {
  switch (status) {
    case 'PENDING':
    case 'IN_PROGRESS':
      return { bg: colors.warningLight, fg: colors.warning, label: 'Active' };
    case 'SUBMITTED':
      return { bg: colors.infoLight, fg: colors.info, label: 'Awaiting verify' };
    case 'APPROVED':
      return { bg: colors.successLight, fg: colors.success, label: 'Verified!' };
    case 'REJECTED':
      return { bg: colors.errorLight, fg: colors.error, label: 'Try again' };
    default:
      return { bg: colors.borderLight, fg: colors.textSecondary, label: status };
  }
}

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    data: assignment,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.assignments.detail(id!),
    queryFn: () => assignmentsApi.getAssignment(id!),
    enabled: !!id,
  });

  if (isPending) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <BackBar />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !assignment) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <BackBar />
        <View style={styles.centerFill}>
          <Text style={styles.errorText}>
            {extractApiError(error, 'Could not load mission')}
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryTxt}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const mission = assignment.mission;
  const trait = mission?.traitCategory ?? null;
  const pill = statusPillStyle(assignment.status);
  const stripeColor = traitColor(trait);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <BackBar />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title block */}
        <View style={[styles.titleBlock, { borderLeftColor: stripeColor }]}>
          <View style={styles.chipsRow}>
            {trait && (
              <View style={[styles.traitChip, { backgroundColor: stripeColor + '20' }]}>
                <View style={[styles.traitDot, { backgroundColor: stripeColor }]} />
                <Text style={[styles.traitChipTxt, { color: stripeColor }]}>
                  {traitLabel(trait)}
                </Text>
              </View>
            )}
            <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
              <Text style={[styles.statusPillTxt, { color: pill.fg }]}>{pill.label}</Text>
            </View>
          </View>
          <Text style={styles.title}>{mission?.title}</Text>
        </View>

        {/* Description */}
        {mission?.description && (
          <View style={styles.descBlock}>
            <Text style={styles.description}>{mission.description}</Text>
          </View>
        )}

        {/* Parchment Hero's Wisdom card */}
        {mission?.heroWisdom && (
          <View style={styles.wisdomCard}>
            <Text style={styles.wisdomEyebrow}>✦  Hero&apos;s Wisdom  ✦</Text>
            <Text style={styles.wisdomBody}>{mission.heroWisdom}</Text>
          </View>
        )}

        {/* Reward chips */}
        {mission && (
          <View style={styles.rewardRow}>
            <RewardChip icon="flash" label={`${mission.xpReward} XP`} tint={colors.xp} />
            <RewardChip
              icon="logo-bitcoin"
              label={`${mission.coinReward} coins`}
              tint={colors.coins}
            />
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.ctaWrap}>
        {(assignment.status === 'PENDING' || assignment.status === 'IN_PROGRESS') && (
          <TouchableOpacity style={styles.ctaPrimary} onPress={() => setSheetOpen(true)}>
            <Text style={styles.ctaPrimaryTxt}>I did it!</Text>
          </TouchableOpacity>
        )}
        {assignment.status === 'SUBMITTED' && (
          <View style={styles.ctaWaiting}>
            <ActivityIndicator size="small" color={colors.info} />
            <Text style={styles.ctaWaitingTxt}>
              Waiting for your parent to verify…
            </Text>
          </View>
        )}
        {assignment.status === 'APPROVED' && (
          <View style={styles.ctaApproved}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={styles.ctaApprovedTxt}>Verified by your parent!</Text>
          </View>
        )}
      </View>

      <CompletionSheet
        visible={sheetOpen}
        assignmentId={assignment.id}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

function BackBar() {
  return (
    <View style={styles.backBar}>
      <TouchableOpacity
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(child)/missions'))}
        style={styles.backBtn}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={26} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

function RewardChip({
  icon,
  label,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tint: string;
}) {
  return (
    <View style={[styles.rewardChip, { backgroundColor: tint + '18' }]}>
      <Ionicons name={icon} size={16} color={tint} />
      <Text style={[styles.rewardChipTxt, { color: tint }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  backBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backBtn: { padding: spacing.xs },
  scroll: { paddingBottom: spacing.xl },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
  },
  retryTxt: { fontFamily: fonts.bold, color: colors.primary },

  titleBlock: {
    marginHorizontal: spacing.lg,
    paddingLeft: spacing.md,
    borderLeftWidth: 4,
    marginTop: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  traitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  traitDot: { width: 8, height: 8, borderRadius: 4 },
  traitChipTxt: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusPillTxt: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.5 },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    color: colors.primary,
    lineHeight: 32,
  },

  descBlock: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },

  // Parchment card
  wisdomCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: '#F4E4C1',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#D8C396',
    ...shadows.sm,
  },
  wisdomEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: '#8A6B2A',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  wisdomBody: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    color: '#5A3F12',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Rewards
  rewardRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  rewardChipTxt: { fontFamily: fonts.bold, fontSize: 13 },

  // CTA
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  ctaPrimary: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  ctaPrimaryTxt: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.primary },
  ctaWaiting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.infoLight,
  },
  ctaWaitingTxt: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.info },
  ctaApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.successLight,
  },
  ctaApprovedTxt: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.success },
});
