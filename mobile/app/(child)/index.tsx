/**
 * Creature Hub (Home) — M5a.
 *
 * Polished hub view:
 *  - top bar with hero name + logout
 *  - centerpiece SpeciesBadge with gentle bob (translateY loop 4px) and a
 *    playful jiggle on tap
 *  - happiness bar with client-side -1/10s tick (visual only — server is
 *    authoritative on read)
 *  - three trait icons with counts (tap → tooltip with trait name + count)
 *  - active reward goal progress band (single active reward via
 *    `rewardsApi.getMyActiveReward`); shimmer + redeem button when unlocked
 *  - care item shelf (static cards — tap-to-feed lands in M5b)
 *  - pull-to-refresh refetches creature + reward
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  creaturesApi,
  extractApiError,
  queryKeys,
  rewardsApi,
} from '@/api';
import type { CareItem, Creature, EvolutionStage, TraitCategory } from '@/api';
import { useAuthStore } from '@/stores/authStore';
import { SpeciesBadge } from '@/components/creature/SpeciesBadge';
import { EvolutionOverlay } from '@/components/creature/EvolutionOverlay';
import { RewardCelebration } from '@/components/rewards/RewardCelebration';
import { SPECIES_DEFAULTS } from '@/constants/species';
import {
  borderRadius,
  colors,
  fonts,
  shadows,
  spacing,
  traitColor,
  traitLabel,
} from '@/theme';

const TRAITS: TraitCategory[] = ['STRENGTH', 'WISDOM', 'HEART'];

export default function ChildHub() {
  const { user, logout } = useAuthStore();
  const heroName = user?.displayName || 'Hero';
  const queryClient = useQueryClient();

  const creatureQuery = useQuery({
    queryKey: queryKeys.creature.me,
    queryFn: creaturesApi.getMyCreature,
    staleTime: 1000 * 30,
  });

  const rewardQuery = useQuery({
    queryKey: queryKeys.rewards.mineActive,
    queryFn: rewardsApi.getMyActiveReward,
    staleTime: 1000 * 30,
  });

  // Client-side happiness tick: -1/10s, clamped at 0, resets when server
  // happiness changes (i.e. after refetch).
  const serverHappiness = creatureQuery.data?.happiness ?? 0;
  const [happinessDisplay, setHappinessDisplay] = useState<number>(serverHappiness);
  useEffect(() => {
    setHappinessDisplay(serverHappiness);
  }, [serverHappiness]);
  useEffect(() => {
    const id = setInterval(() => {
      setHappinessDisplay((h) => Math.max(0, h - 1));
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  // Sprite bob animation
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -4, duration: 1200, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);
  const jiggle = useRef(new Animated.Value(0)).current;
  function handleSpriteTap() {
    jiggle.setValue(0);
    Animated.sequence([
      Animated.timing(jiggle, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(jiggle, { toValue: -1, duration: 80, useNativeDriver: true }),
      Animated.timing(jiggle, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  }
  const jiggleRotate = jiggle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-4deg', '0deg', '4deg'],
  });

  // Particles (one slow blob + one faster) — soft cream backdrop accent
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(particle1, { toValue: 1, duration: 6000, useNativeDriver: true }),
        Animated.timing(particle1, { toValue: 0, duration: 6000, useNativeDriver: true }),
      ]),
    );
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(particle2, { toValue: 1, duration: 4500, useNativeDriver: true }),
        Animated.timing(particle2, { toValue: 0, duration: 4500, useNativeDriver: true }),
      ]),
    );
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [particle1, particle2]);

  // Tooltip for trait icons
  const [activeTrait, setActiveTrait] = useState<TraitCategory | null>(null);
  // Pulse animation for the trait icon that just grew (driven by feed mutation)
  const traitPulseRef = useRef<Record<TraitCategory, Animated.Value>>({
    STRENGTH: new Animated.Value(1),
    WISDOM: new Animated.Value(1),
    HEART: new Animated.Value(1),
  });
  function pulseTrait(t: TraitCategory) {
    const v = traitPulseRef.current[t];
    v.setValue(1);
    Animated.sequence([
      Animated.timing(v, { toValue: 1.3, duration: 175, useNativeDriver: true }),
      Animated.timing(v, { toValue: 1, duration: 175, useNativeDriver: true }),
    ]).start();
  }

  // Toast for feed errors
  const [feedError, setFeedError] = useState<string | null>(null);
  useEffect(() => {
    if (!feedError) return;
    const id = setTimeout(() => setFeedError(null), 2500);
    return () => clearTimeout(id);
  }, [feedError]);

  // Feed mutation — optimistic happiness bump + remove from shelf, rollback on error,
  // reconcile on success.
  const HAPPINESS_PER_CARE_ITEM = 10;
  const feedM = useMutation({
    mutationFn: (careItemId: string) => creaturesApi.feedCreature(careItemId),
    onMutate: async (careItemId: string): Promise<{ prev: Creature | null | undefined }> => {
      await queryClient.cancelQueries({ queryKey: queryKeys.creature.me });
      const prev = queryClient.getQueryData<Creature | null>(queryKeys.creature.me);
      if (prev) {
        const target = prev.pendingCareItems?.find((c) => c.id === careItemId);
        const traitBump: TraitCategory | null = target?.traitCategory ?? null;
        const next: Creature = {
          ...prev,
          happiness: Math.min(100, prev.happiness + HAPPINESS_PER_CARE_ITEM),
          strengthPoints:
            prev.strengthPoints + (traitBump === 'STRENGTH' ? 1 : 0),
          wisdomPoints: prev.wisdomPoints + (traitBump === 'WISDOM' ? 1 : 0),
          heartPoints: prev.heartPoints + (traitBump === 'HEART' ? 1 : 0),
          pendingCareItems: (prev.pendingCareItems ?? []).filter(
            (c) => c.id !== careItemId,
          ),
        };
        queryClient.setQueryData(queryKeys.creature.me, next);
        // Drive display happiness immediately so the bar tweens
        setHappinessDisplay(next.happiness);
        if (traitBump) pulseTrait(traitBump);
      }
      return { prev };
    },
    onError: (err, _careItemId, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(queryKeys.creature.me, ctx.prev);
        setHappinessDisplay(ctx.prev?.happiness ?? 0);
      }
      setFeedError(extractApiError(err, "Couldn't feed right now — try again."));
    },
    onSuccess: () => {
      // Reconcile any drift (trait counters, exact happiness post-tick)
      queryClient.invalidateQueries({ queryKey: queryKeys.creature.me });
    },
  });

  // ------------------------------------------------------------------
  // Evolution: detect stage change between renders & play overlay.
  // ------------------------------------------------------------------
  const prevStageRef = useRef<EvolutionStage | null>(null);
  const [evolutionEvent, setEvolutionEvent] = useState<{
    from: EvolutionStage;
    to: EvolutionStage;
  } | null>(null);
  const currentStage = creatureQuery.data?.stage ?? null;
  useEffect(() => {
    if (!currentStage) return;
    const prev = prevStageRef.current;
    if (prev && prev !== currentStage) {
      setEvolutionEvent({ from: prev, to: currentStage });
    }
    prevStageRef.current = currentStage;
  }, [currentStage]);

  // ------------------------------------------------------------------
  // Reward: detect unlock false→true flip; redeem → celebration.
  // ------------------------------------------------------------------
  const rewardUnlocked = rewardQuery.data?.unlocked ?? false;
  const prevUnlockedRef = useRef<boolean>(false);
  const [showUnlockToast, setShowUnlockToast] = useState(false);
  const unlockPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const prev = prevUnlockedRef.current;
    if (!prev && rewardUnlocked) {
      // Just unlocked — fire pulse + toast
      setShowUnlockToast(true);
      Animated.sequence([
        Animated.timing(unlockPulse, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false, // we drive backgroundColor interp
        }),
        Animated.delay(900),
        Animated.timing(unlockPulse, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
      ]).start();
      const id = setTimeout(() => setShowUnlockToast(false), 1500);
      return () => clearTimeout(id);
    }
    prevUnlockedRef.current = rewardUnlocked;
    return undefined;
  }, [rewardUnlocked, unlockPulse]);
  useEffect(() => {
    // Keep ref in sync after each render
    prevUnlockedRef.current = rewardUnlocked;
  }, [rewardUnlocked]);

  // Reward redeem
  const [celebrateName, setCelebrateName] = useState<string | null>(null);
  const redeem = useMutation({
    mutationFn: (id: string) => rewardsApi.redeemReward(id),
    onMutate: () => {
      // Trigger celebration optimistically — the server call is non-failing
      // for our demo (the active reward is already unlocked at this point).
      const name = rewardQuery.data?.name;
      if (name) setCelebrateName(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.mineActive });
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.family });
      queryClient.invalidateQueries({ queryKey: queryKeys.creature.me });
    },
  });

  function refreshAll() {
    creatureQuery.refetch();
    rewardQuery.refetch();
  }

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/child-login' as never);
  }

  if (creatureQuery.isPending) {
    return (
      <View style={styles.fullLoading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const creature = creatureQuery.data;
  if (!creature) {
    return (
      <View style={styles.fullLoading}>
        <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular }}>
          Preparing your bond…
        </Text>
      </View>
    );
  }

  const meta = SPECIES_DEFAULTS[creature.species];
  const happinessPct = Math.max(0, Math.min(100, happinessDisplay));
  const care = (creature.pendingCareItems ?? []) as CareItem[];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Particle accents */}
      <Animated.View
        style={[
          styles.particle,
          styles.particleA,
          {
            opacity: particle1.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] }),
            transform: [
              { translateY: particle1.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
            ],
          },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.particle,
          styles.particleB,
          {
            opacity: particle2.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.45] }),
            transform: [
              { translateY: particle2.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) },
            ],
          },
        ]}
        pointerEvents="none"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={creatureQuery.isRefetching || rewardQuery.isRefetching}
            onRefresh={refreshAll}
          />
        }
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topEyebrow}>HERO</Text>
            <Text style={styles.topName}>{heroName}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn} hitSlop={10}>
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Sprite + creature name */}
        <TouchableOpacity activeOpacity={0.9} onPress={handleSpriteTap} style={styles.spriteWrap}>
          <Animated.View
            style={{ transform: [{ translateY: bob }, { rotate: jiggleRotate }] }}
          >
            <SpeciesBadge species={creature.species} stage={creature.stage} size={180} />
          </Animated.View>
        </TouchableOpacity>
        <Text style={styles.creatureName}>{creature.name}</Text>
        <Text style={styles.creatureSub}>
          {meta.displayName} · {creature.stage}
        </Text>

        {/* Happiness bar */}
        <View style={styles.happinessBlock}>
          <View style={styles.happinessRow}>
            <Text style={styles.happinessLabel}>Happiness</Text>
            <Text style={styles.happinessValue}>{happinessPct}/100</Text>
          </View>
          <View style={styles.happinessBg}>
            <View
              style={[
                styles.happinessFill,
                { width: `${happinessPct}%`, backgroundColor: colors.accent },
              ]}
            />
          </View>
        </View>

        {/* Trait icons row */}
        <View style={styles.traitsRow}>
          {TRAITS.map((t) => {
            const count =
              t === 'STRENGTH'
                ? creature.strengthPoints
                : t === 'WISDOM'
                  ? creature.wisdomPoints
                  : creature.heartPoints;
            const tColor = traitColor(t);
            const lit = count > 0;
            const pulse = traitPulseRef.current[t];
            return (
              <TouchableOpacity
                key={t}
                style={styles.traitItem}
                onPress={() => setActiveTrait(activeTrait === t ? null : t)}
              >
                <Animated.View
                  style={[
                    styles.traitCircle,
                    {
                      backgroundColor: lit ? tColor : colors.borderLight,
                      borderColor: lit ? tColor : colors.border,
                      transform: [{ scale: pulse }],
                    },
                  ]}
                >
                  <Text style={[styles.traitCount, { color: lit ? colors.white : colors.textSecondary }]}>
                    {count}
                  </Text>
                </Animated.View>
                <Text style={styles.traitName}>{traitLabel(t)}</Text>
                {activeTrait === t && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipTxt}>
                      {traitLabel(t)} · Lessons learned: {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active reward goal */}
        <RewardGoal
          reward={rewardQuery.data}
          isPending={rewardQuery.isPending}
          onRedeem={(id) => redeem.mutate(id)}
          redeeming={redeem.isPending}
          error={extractApiError(redeem.error, '')}
        />

        {/* Care item shelf */}
        <View style={styles.shelfBlock}>
          <Text style={styles.sectionLabel}>Care items</Text>
          {care.length === 0 ? (
            <View style={styles.shelfEmpty}>
              <Text style={styles.shelfEmptyTxt}>
                No treats yet — finish a mission to earn one!
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shelfScroll}
            >
              {care.map((c) => (
                <CareCard
                  key={c.id}
                  item={c}
                  disabled={feedM.isPending}
                  onFeed={() => feedM.mutate(c.id)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Feed error toast */}
      {feedError && (
        <View style={styles.feedToast} pointerEvents="none">
          <Text style={styles.feedToastTxt}>{feedError}</Text>
        </View>
      )}

      {/* Reward unlock toast (false→true flip) */}
      {showUnlockToast && (
        <View style={styles.unlockToast} pointerEvents="none">
          <Text style={styles.unlockToastTxt}>🎉 Reward unlocked!</Text>
        </View>
      )}

      {/* Reward redeem celebration */}
      <RewardCelebration
        visible={!!celebrateName}
        rewardName={celebrateName ?? ''}
        onDismiss={() => setCelebrateName(null)}
      />

      {/* Evolution overlay (plays once on stage change) */}
      {evolutionEvent && creature && (
        <EvolutionOverlay
          species={creature.species}
          fromStage={evolutionEvent.from}
          toStage={evolutionEvent.to}
          creatureName={creature.name}
          onComplete={() => setEvolutionEvent(null)}
        />
      )}
    </SafeAreaView>
  );
}

function RewardGoal({
  reward,
  isPending,
  onRedeem,
  redeeming,
  error,
}: {
  reward: ReturnType<typeof Object> & { id: string; name: string; progress: number; target: number; unlocked: boolean } | null | undefined;
  isPending: boolean;
  onRedeem: (id: string) => void;
  redeeming: boolean;
  error?: string;
}) {
  if (isPending) {
    return (
      <View style={styles.rewardBand}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }
  if (!reward) {
    return null;
  }
  const pct = Math.min(100, Math.round((reward.progress / Math.max(1, reward.target)) * 100));
  return (
    <View style={styles.rewardBand}>
      <View style={styles.rewardHeader}>
        <Ionicons name="gift" size={20} color={colors.accent} />
        <Text style={styles.rewardName} numberOfLines={1}>
          {reward.name}
        </Text>
        <Text style={styles.rewardProgress}>
          {reward.progress}/{reward.target}
        </Text>
      </View>
      <View style={styles.rewardBarBg}>
        <View style={[styles.rewardBarFill, { width: `${pct}%` }]} />
      </View>
      {reward.unlocked && (
        <TouchableOpacity
          style={styles.rewardRedeem}
          onPress={() => onRedeem(reward.id)}
          disabled={redeeming}
        >
          {redeeming ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={styles.rewardRedeemTxt}>Tap to redeem</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      {!!error && <Text style={styles.rewardError}>{error}</Text>}
    </View>
  );
}

function CareCard({
  item,
  onFeed,
  disabled,
}: {
  item: CareItem;
  onFeed: () => void;
  disabled: boolean;
}) {
  const tColor = traitColor(item.traitCategory);
  // Bounce + fade-out animation on tap. We keep a local "spent" flag so
  // the card visually leaves the shelf the moment the user taps, even
  // before the optimistic cache update has propagated (feels snappier).
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [spent, setSpent] = useState(false);

  function handlePress() {
    if (disabled || spent) return;
    setSpent(true);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.15, duration: 160, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(scale, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]),
    ]).start(() => {
      onFeed();
    });
  }

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        opacity,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        disabled={disabled || spent}
        style={[styles.careCard, { borderColor: tColor + '55' }]}
      >
        <View style={[styles.careIcon, { backgroundColor: tColor + '20' }]}>
          <Ionicons name="nutrition-outline" size={22} color={tColor} />
        </View>
        <Text style={styles.careName} numberOfLines={1}>
          {item.itemSlug.replace(/_/g, ' ')}
        </Text>
        <Text style={[styles.careTrait, { color: tColor }]}>
          +{item.happinessDelta} happy
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fullLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  particleA: { top: '18%', left: '12%' },
  particleB: { top: '32%', right: '18%' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  topEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textSecondary,
  },
  topName: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.primary },
  iconBtn: { padding: spacing.sm },

  spriteWrap: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  creatureName: {
    textAlign: 'center',
    fontFamily: fonts.extraBold,
    fontSize: 26,
    color: colors.primary,
    marginTop: spacing.md,
  },
  creatureSub: {
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  happinessBlock: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  happinessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  happinessLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.textSecondary,
  },
  happinessValue: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  happinessBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
  },
  happinessFill: { height: '100%', borderRadius: 5 },

  traitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  traitItem: { alignItems: 'center', position: 'relative' },
  traitCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  traitCount: { fontFamily: fonts.extraBold, fontSize: 16 },
  traitName: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.textSecondary },
  tooltip: {
    position: 'absolute',
    top: -34,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  tooltipTxt: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.white },

  // Reward goal band
  rewardBand: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  rewardName: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
  rewardProgress: { fontFamily: fonts.bold, fontSize: 12, color: colors.textSecondary },
  rewardBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
  },
  rewardBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  rewardRedeem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
  },
  rewardRedeemTxt: { fontFamily: fonts.extraBold, color: colors.primary, fontSize: 14 },
  rewardError: { fontFamily: fonts.semiBold, color: colors.error, marginTop: 6, fontSize: 12 },

  // Shelf
  shelfBlock: { marginTop: spacing.lg },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  shelfScroll: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  shelfEmpty: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
  },
  shelfEmptyTxt: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  careCard: {
    width: 110,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  careIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  careName: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  careTrait: { fontFamily: fonts.semiBold, fontSize: 10, marginTop: 2 },

  // Feed error toast
  feedToast: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
  },
  feedToastTxt: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.error,
  },

  // Reward unlock toast
  unlockToast: {
    position: 'absolute',
    top: spacing.xl + spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    ...shadows.md,
  },
  unlockToastTxt: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.primary,
    letterSpacing: 0.5,
  },
});
