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
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { assignmentsApi, extractApiError, queryKeys } from '@/api';
import { useMissionTimerStore } from '@/stores/missionTimerStore';
import type { TraitCategory } from '@/api';
import { CompletionSheet } from '@/components/missions/CompletionSheet';
import {
  AnimatedPressable,
  Banner,
  Body,
  Caption,
  Chip,
  FLOATING_TAB_BAR_HEIGHT,
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
  const insets = useSafeAreaInsets();
  const ctaBottom = insets.bottom + FLOATING_TAB_BAR_HEIGHT + spacing.sm;

  // Mission timer — persisted in a global zustand store so it keeps
  // running across screen navigations and only one mission can be active
  // at a time. Starting a new mission auto-stops any previous one.
  const activeAssignmentId = useMissionTimerStore((s) => s.activeAssignmentId);
  const startedAt = useMissionTimerStore((s) => s.startedAt);
  const startTimer = useMissionTimerStore((s) => s.start);
  const stopTimer = useMissionTimerStore((s) => s.stop);
  const isRunning = activeAssignmentId === id && startedAt != null;
  const [elapsed, setElapsed] = useState(() =>
    isRunning && startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0,
  );
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isRunning || startedAt == null) {
      setElapsed(0);
      return;
    }
    // Hydrate immediately on mount/resume so the timer shows the correct
    // elapsed value the instant the user comes back to this screen.
    setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    const tickId = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(tickId);
  }, [isRunning, startedAt]);

  useEffect(() => {
    if (!isRunning) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isRunning, pulse]);

  function fmtElapsed(s: number) {
    const safe = Math.max(0, Math.floor(s));
    const m = Math.floor(safe / 60);
    const sec = safe % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  // Estimate mission duration from title ("Spend 15 min reading") or xpReward.
  function getDurationMinutes(m: { title?: string | null; xpReward?: number | null } | null | undefined): number {
    if (!m) return 10;
    const match = m.title?.match(/(\d+)\s*min/i);
    if (match) return parseInt(match[1], 10);
    return Math.max(3, Math.min(30, m.xpReward ?? 10));
  }

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

  function handleStart() {
    if (!assignment?.id) return;
    startTimer(assignment.id);
    setElapsed(0);
  }

  // When the user successfully submits a mission, stop the timer.
  useEffect(() => {
    if (!assignment) return;
    if (
      assignment.id === activeAssignmentId &&
      (assignment.status === 'SUBMITTED' ||
        assignment.status === 'APPROVED' ||
        assignment.status === 'REJECTED')
    ) {
      stopTimer();
    }
  }, [assignment, activeAssignmentId, stopTimer]);

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
          onPress={() => router.replace('/(child)/missions')}
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

        <View style={{ height: 140 + FLOATING_TAB_BAR_HEIGHT }} />
      </ScrollView>

      <View style={[styles.ctaWrap, { bottom: ctaBottom }]}>
        {(assignment.status === 'PENDING' || assignment.status === 'IN_PROGRESS') && !isRunning && (
          <AnimatedPressable
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel="Start mission"
            style={styles.ctaPrimary}
          >
            <Icon name="sparkle" size={18} color={colors.navyDeep} />
            <Typography.Heading level={2} tone="primary" style={styles.ctaPrimaryLabel}>
              Start mission ▶
            </Typography.Heading>
          </AnimatedPressable>
        )}
        {(assignment.status === 'PENDING' || assignment.status === 'IN_PROGRESS') && isRunning && (() => {
          const targetSeconds = getDurationMinutes(mission) * 60;
          const remaining = Math.max(0, targetSeconds - elapsed);
          const timesUp = remaining === 0;
          const progressPct = Math.min(100, Math.round((elapsed / targetSeconds) * 100));
          return (
            <>
              <Surface variant="cream" radius="lg" padding="md" shadow="card" style={styles.timerCard as any}>
                <View style={styles.timerHeader}>
                  <Animated.View style={[styles.pulseDot, { opacity: pulse }]} />
                  <Caption tone="secondary" emphasis style={{ letterSpacing: 1 }}>
                    {timesUp ? "TIME'S UP" : 'TIME LEFT'}
                  </Caption>
                </View>
                <Typography.Display tone="primary" align="center" style={styles.timerValue}>
                  {timesUp ? "Time's up! ⏰" : fmtElapsed(remaining)}
                </Typography.Display>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                </View>
              </Surface>
              <AnimatedPressable
                onPress={() => setSheetOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="I did it"
                style={[styles.ctaPrimary, { marginTop: spacing.sm }]}
              >
                <Icon name="sparkle" size={18} color={colors.navyDeep} />
                <Typography.Heading level={2} tone="primary" style={styles.ctaPrimaryLabel}>
                  I did it! ✨
                </Typography.Heading>
              </AnimatedPressable>
            </>
          );
        })()}
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
        onPress={() => router.replace('/(child)/missions')}
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
    left: spacing.lg,
    right: spacing.lg,
    paddingVertical: spacing.sm,
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

  timerCard: {
    alignItems: 'center',
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.amberDeep,
  },
  timerValue: {
    fontSize: 38,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    marginTop: spacing.sm,
    height: 6,
    width: '100%',
    borderRadius: 3,
    backgroundColor: 'rgba(15,27,61,0.10)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.amberDeep,
    borderRadius: 3,
  },
  approved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
  },
});
