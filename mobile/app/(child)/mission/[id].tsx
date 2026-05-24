/**
 * Mission Detail — Polish-B2 rebuild.
 *
 * Layout:
 *  - Inherits cream gradient from (child)/_layout.tsx.
 *  - Back chevron + status Chip in the top bar.
 *  - SectionHeader(title=mission.title, subtitle=category).
 *  - Body paragraph in Typography.Body.
 *  - Hero's Wisdom rendered through <ScrollCard/>.
 *  - Reward chips (XP, coins).
 *  - Bottom CTA varies by status:
 *      PENDING/IN_PROGRESS → amber "I did it! ✨" pill
 *      SUBMITTED           → <Banner tone="info" /> + spinner
 *      APPROVED            → success checkmark + amount
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { assignmentsApi, extractApiError, queryKeys } from '@/api';
import type { TraitCategory } from '@/api';
import { CompletionSheet } from '@/components/missions/CompletionSheet';
import {
  AnimatedPressable,
  Banner,
  Body,
  Caption,
  Chip,
  Icon,
  ScrollCard,
  SectionHeader,
  Surface,
  Typography,
  type ChipTone,
  type IconName,
} from '@/components/ui';
import {
  borderRadius,
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
const TRAIT_CHIP: Record<TraitCategory, ChipTone> = {
  STRENGTH: 'strength',
  WISDOM: 'wisdom',
  HEART: 'heart',
};

function statusChip(status: string): { tone: ChipTone; label: string } | null {
  switch (status) {
    case 'PENDING':
    case 'IN_PROGRESS':
      return { tone: 'warning', label: 'Active' };
    case 'SUBMITTED':
      return { tone: 'wisdom', label: 'Awaiting verify' };
    case 'APPROVED':
      return { tone: 'success', label: 'Verified ✓' };
    case 'REJECTED':
      return { tone: 'error', label: 'Try again' };
    default:
      return null;
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
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BackBar />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.amberDeep} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !assignment) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BackBar />
        <View style={styles.centerFill}>
          <Banner tone="error" message={extractApiError(error, 'Could not load mission')} />
          <AnimatedPressable
            onPress={() => refetch()}
            style={styles.retryBtn}
            accessibilityRole="button"
          >
            <Typography.Heading level={3} tone="primary">Try again</Typography.Heading>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    );
  }

  const mission = assignment.mission;
  const trait = mission?.traitCategory ?? null;
  const sChip = statusChip(assignment.status);
  const stripeColor = traitColor(trait);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <AnimatedPressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(child)/missions'))}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backBtn}
          haptic={null}
        >
          <Icon name="chevronLeft" size={22} color={colors.primary} />
          <Caption tone="primary" emphasis style={{ letterSpacing: 0.5 }}>Back</Caption>
        </AnimatedPressable>
        {sChip && <Chip label={sChip.label} tone={sChip.tone} size="sm" />}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          {trait && (
            <View style={styles.traitRow}>
              <Chip
                label={traitLabel(trait)}
                tone={TRAIT_CHIP[trait]}
                size="sm"
                icon={<Icon name={TRAIT_ICON[trait]} size={12} color={colors.white} />}
              />
            </View>
          )}
          <SectionHeader
            title={mission?.title ?? 'Mission'}
            subtitle={trait ? `Path of ${traitLabel(trait)}` : undefined}
          />
        </View>

        {mission?.description && (
          <View style={styles.descBlock}>
            <Body tone="primary" style={styles.description}>
              {mission.description}
            </Body>
          </View>
        )}

        {mission?.heroWisdom && (
          <View style={styles.wisdomWrap}>
            <ScrollCard title="Hero's Wisdom" body={mission.heroWisdom} />
          </View>
        )}

        {mission && (
          <View style={styles.rewardRow}>
            <Surface variant="cream" radius="md" padding="sm" style={styles.rewardChip as any}>
              <Icon name="sparkle" size={16} color={colors.magicViolet} />
              <Caption emphasis tone="primary">{mission.xpReward} XP</Caption>
            </Surface>
            <Surface variant="cream" radius="md" padding="sm" style={styles.rewardChip as any}>
              <Icon name="crown" size={16} color={colors.amberDeep} />
              <Caption emphasis tone="primary">{mission.coinReward} coins</Caption>
            </Surface>
            {trait && (
              <Surface variant="cream" radius="md" padding="sm" style={styles.rewardChip as any}>
                <Icon name={TRAIT_ICON[trait]} size={16} color={stripeColor} />
                <Caption emphasis tone="primary">+1 {traitLabel(trait)}</Caption>
              </Surface>
            )}
          </View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      <View style={styles.ctaWrap}>
        {(assignment.status === 'PENDING' || assignment.status === 'IN_PROGRESS') && (
          <AnimatedPressable
            onPress={() => setSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="I did it"
            style={styles.ctaPrimary}
          >
            <Icon name="sparkle" size={18} color={colors.navyDeep} />
            <Typography.Heading level={2} tone="primary" style={styles.ctaPrimaryLabel}>
              I did it!
            </Typography.Heading>
          </AnimatedPressable>
        )}
        {assignment.status === 'SUBMITTED' && (
          <Banner tone="info" message="Waiting for your parent to verify…" />
        )}
        {assignment.status === 'APPROVED' && (
          <Surface variant="card" radius="lg" padding="md" style={styles.approved as any}>
            <Icon name="checkCircle" size={22} color={colors.success} />
            <Body emphasis tone="success">
              Verified! {mission ? `+${mission.xpReward} XP` : ''}
            </Body>
          </Surface>
        )}
        {assignment.status === 'REJECTED' && (
          <Banner tone="warning" title="Your hero wants to see again" message="Tap 'I did it!' to resubmit." />
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
    <View style={styles.topBar}>
      <AnimatedPressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(child)/missions'))}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={styles.backBtn}
        haptic={null}
      >
        <Icon name="chevronLeft" size={22} color={colors.primary} />
        <Caption tone="primary" emphasis style={{ letterSpacing: 0.5 }}>Back</Caption>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
  },

  scroll: { paddingBottom: spacing.xl },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },
  retryBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.amberDeep,
    borderRadius: borderRadius.pill,
  },

  titleBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  traitRow: { flexDirection: 'row', marginBottom: spacing.sm },

  descBlock: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  description: { lineHeight: 24 },

  wisdomWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },

  rewardRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    backgroundColor: 'rgba(255, 253, 249, 0.93)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(27, 42, 78, 0.06)',
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    backgroundColor: colors.amberDeep,
    borderRadius: borderRadius.pill,
  },
  ctaPrimaryLabel: { fontSize: 18, color: colors.navyDeep },

  approved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
  },
});
