/**
 * Creature Hub (Home) — Polish-B2 rebuild.
 *
 * Layout:
 *  - Background: species-tinted GradientBackdrop (habitat-forest/sky/stone).
 *  - Top bar: small Avatar (hero initials) + greeting + bell.
 *  - Centerpiece: <CreatureScene/> with habitat backdrop + tap reaction.
 *  - Stats row: OrbProgress (happiness) · creature name · Lvl chip.
 *  - Trait icons row: three glowing circular badges (opacity scales w/ value).
 *  - Reward goal: ScrollCard-style parchment with progress band + Redeem.
 *  - Care item shelf: per-item Surface cards (trait gradient + slug + +happy).
 *  - Pull-to-refresh + Hero-Mail-overlay-friendly (parent layout owns the queue).
 *
 * Backend round-trips preserved (creature/me, feed, rewards/mine/active,
 * rewards/:id/redeem). Evolution overlay + reward celebration kept.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  creaturesApi,
  extractApiError,
  queryKeys,
  rewardsApi,
} from '@/api';
import type {
  CareItem,
  Creature,
  CreatureSpecies,
  EvolutionStage,
  TraitCategory,
} from '@/api';
import { useAuthStore } from '@/stores/authStore';
import { CreatureScene } from '@/components/creature/CreatureScene';
import { EvolutionOverlay } from '@/components/creature/EvolutionOverlay';
import {
  CreatureReaction,
  useHappyHop,
  type CreatureReactionKind,
} from '@/components/creature/CreatureReaction';
import { useCreatureEmotionWithTrigger } from '@/components/creature/useCreatureEmotion';
import { RewardCelebration } from '@/components/rewards/RewardCelebration';
import { SPECIES_DEFAULTS } from '@/constants/species';
import {
  AnimatedPressable,
  Avatar,
  Banner,
  Caption,
  CelebrationBurst,
  Chip,
  EmptyState,
  FLOATING_TAB_BAR_SCREEN_PADDING,
  GradientBackdrop,
  Icon,
  OrbProgress,
  Surface,
  Typography,
  type GradientVariant,
  type IconName,
} from '@/components/ui';
import {
  borderRadius,
  colors,
  durations,
  spacing,
  traitColor,
  traitLabel,
  typographyTokens,
} from '@/theme';

const TRAITS: TraitCategory[] = ['STRENGTH', 'WISDOM', 'HEART'];

const GROOM_ITEMS: Array<{ slug: string; label: string; emoji: string }> = [
  { slug: 'brush', label: 'Brush', emoji: '🪥' },
  { slug: 'bath', label: 'Bath', emoji: '🛁' },
  { slug: 'polish', label: 'Polish', emoji: '✨' },
];
const PLAY_ITEMS: Array<{ slug: string; label: string; emoji: string }> = [
  { slug: 'tickle', label: 'Tickle', emoji: '🤭' },
  { slug: 'tug', label: 'Tug rope', emoji: '🪢' },
  { slug: 'hide', label: 'Hide & seek', emoji: '🙈' },
];
const TRAIT_ICON: Record<TraitCategory, IconName> = {
  STRENGTH: 'strength',
  WISDOM: 'wisdom',
  HEART: 'heart',
};
const HABITAT_VARIANT: Record<CreatureSpecies, GradientVariant> = {
  FOREST_PUP: 'habitat-forest',
  SKY_SPRITE: 'habitat-sky',
  STONE_CUB: 'habitat-stone',
};

export default function ChildHub() {
  const { user, logout } = useAuthStore();
  const heroName = user?.displayName || 'Hero';
  const heroInitials = heroName
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
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

  const { emotion: creatureEmotion, triggerEvent: triggerCreatureEvent } =
    useCreatureEmotionWithTrigger({
      happiness: creatureQuery.data?.happiness ?? 50,
      lastFedAt: null,
      pendingCareItemCount: creatureQuery.data?.pendingCareItems?.length ?? 0,
    });

  // Client-side happiness tick (-1/10s)
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

  // Sprite bob + jiggle on tap
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -4, duration: 1400, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, useNativeDriver: true }),
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
    inputRange: [-1, 0, 1, 2],
    outputRange: ['-3deg', '0deg', '3deg', '360deg'],
  });

  // Trait pulse refs
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

  // Floating "+N happy" delta + sparkle burst on feed
  const [floatingDelta, setFloatingDelta] = useState<number | null>(null);
  const [burstActive, setBurstActive] = useState(false);
  // Client-only "bonus" happiness from grooming/play actions (no backend trip).
  const [bonusHappiness, setBonusHappiness] = useState(0);

  // Creature reaction overlay (emoji burst + happy-hop bounce). Bumping
  // reactionKey re-fires the same kind. Distinct from CelebrationBurst.
  const [reactionKind, setReactionKind] = useState<CreatureReactionKind | null>(null);
  const [reactionKey, setReactionKey] = useState(0);
  const happyHop = useHappyHop();

  // Scroll-to-creature: ScrollView ref + measured Y of the sprite wrapper.
  const scrollRef = useRef<ScrollView>(null);
  const creatureYRef = useRef<number>(0);
  function scrollToCreature() {
    const y = Math.max(0, creatureYRef.current - 40);
    scrollRef.current?.scrollTo({ y, animated: true });
  }

  function triggerCreatureReaction(kind: CreatureReactionKind) {
    setReactionKind(kind);
    setReactionKey((k) => k + 1);
    happyHop.play(kind);
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* haptics may not be available in all runtimes */
    }
  }

  function applyClientCareBoost(delta: number, eventKind: 'GROOM' | 'PLAY') {
    scrollToCreature();
    setBonusHappiness((b) => Math.min(100, b + delta));
    setFloatingDelta(delta);
    setBurstActive(true);
    setTimeout(() => setBurstActive(false), 700);
    triggerCreatureEvent('FED');
    triggerCreatureReaction(eventKind);
    if (eventKind === 'PLAY') {
      // 360° spin reusing jiggle Animated.Value
      jiggle.setValue(0);
      Animated.timing(jiggle, { toValue: 2, duration: 600, useNativeDriver: true })
        .start(() => jiggle.setValue(0));
    }
  }
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (floatingDelta == null) return;
    floatAnim.setValue(0);
    Animated.timing(floatAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => setFloatingDelta(null));
  }, [floatingDelta, floatAnim]);

  // Child bell menu sheet
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  async function handleSignOut() {
    if (signingOut) return;
    console.log('[signout] handleSignOut: start');
    setSigningOut(true);
    // Close modals FIRST so they don't trap the gesture handler / overlay.
    setConfirmLogout(false);
    setMenuOpen(false);
    // Navigate-first pattern: bounce to root WHILE still authenticated so the
    // child group can unmount cleanly without the _layout auth gate racing
    // with our own router.replace. The root index.tsx will then re-route
    // (to /(auth)/login) once isAuthenticated flips.
    console.log('[signout] navigating to /');
    router.replace('/');
    // Defer the actual auth-clear until after the route swap commits, then
    // run it fire-and-forget so a slow/unreachable backend can't strand us
    // on a half-torn-down screen.
    setTimeout(() => {
      console.log('[signout] firing logout() (deferred)');
      logout()
        .then(() => console.log('[signout] logout() resolved'))
        .catch((e) => console.warn('[signout] logout() error', e))
        .finally(() => {
          console.log('[signout] complete');
          setSigningOut(false);
        });
    }, 50);
  }

  // Toast for feed errors
  const [feedError, setFeedError] = useState<string | null>(null);
  useEffect(() => {
    if (!feedError) return;
    const id = setTimeout(() => setFeedError(null), 2500);
    return () => clearTimeout(id);
  }, [feedError]);

  // Feed mutation with optimistic update
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
          strengthPoints: prev.strengthPoints + (traitBump === 'STRENGTH' ? 1 : 0),
          wisdomPoints: prev.wisdomPoints + (traitBump === 'WISDOM' ? 1 : 0),
          heartPoints: prev.heartPoints + (traitBump === 'HEART' ? 1 : 0),
          pendingCareItems: (prev.pendingCareItems ?? []).filter(
            (c) => c.id !== careItemId,
          ),
        };
        queryClient.setQueryData(queryKeys.creature.me, next);
        setHappinessDisplay(next.happiness);
        if (traitBump) pulseTrait(traitBump);
        triggerCreatureEvent('FED');
        scrollToCreature();
        triggerCreatureReaction('TREAT');
        setFloatingDelta(target?.happinessDelta ?? HAPPINESS_PER_CARE_ITEM);
        setBurstActive(true);
        setTimeout(() => setBurstActive(false), 700);
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
      queryClient.invalidateQueries({ queryKey: queryKeys.creature.me });
    },
  });

  // Evolution detection
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

  // Reward state
  const rewardUnlocked = rewardQuery.data?.unlocked ?? false;
  const prevUnlockedRef = useRef<boolean>(false);
  const [showUnlockToast, setShowUnlockToast] = useState(false);
  useEffect(() => {
    const prev = prevUnlockedRef.current;
    if (!prev && rewardUnlocked) {
      setShowUnlockToast(true);
      const id = setTimeout(() => setShowUnlockToast(false), 2000);
      return () => clearTimeout(id);
    }
    prevUnlockedRef.current = rewardUnlocked;
    return undefined;
  }, [rewardUnlocked]);
  useEffect(() => {
    prevUnlockedRef.current = rewardUnlocked;
  }, [rewardUnlocked]);

  const [celebrateName, setCelebrateName] = useState<string | null>(null);
  const [showHappinessInfo, setShowHappinessInfo] = useState(false);
  const redeem = useMutation({
    mutationFn: (id: string) => rewardsApi.redeemReward(id),
    onMutate: () => {
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

  if (creatureQuery.isPending) {
    return (
      <View style={styles.fullLoading}>
        <ActivityIndicator size="large" color={colors.amberDeep} />
      </View>
    );
  }

  const creature = creatureQuery.data;
  if (!creature) {
    return (
      <View style={styles.fullLoading}>
        <Typography.Body tone="secondary">Preparing your bond…</Typography.Body>
      </View>
    );
  }

  const meta = SPECIES_DEFAULTS[creature.species];
  const happinessPct = Math.max(0, Math.min(100, happinessDisplay + bonusHappiness));
  const care = (creature.pendingCareItems ?? []) as CareItem[];

  return (
    <View style={styles.root}>
      <GradientBackdrop
        variant={HABITAT_VARIANT[creature.species]}
        intensity="subtle"
      >
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            refreshControl={
              <RefreshControl
                refreshing={creatureQuery.isRefetching || rewardQuery.isRefetching}
                onRefresh={refreshAll}
                tintColor={colors.amberDeep}
              />
            }
          >
            {/* Top bar */}
            <View style={styles.topBar}>
              <View style={styles.topLeft}>
                <Avatar initials={heroInitials} size="md" tone="navy" />
                <View style={styles.topGreeting}>
                  <Caption tone="secondary" emphasis style={styles.topEyebrow}>
                    Welcome back
                  </Caption>
                  <Typography.Heading level={2} tone="primary">
                    {heroName}
                  </Typography.Heading>
                </View>
              </View>
              <AnimatedPressable
                onPress={() => setMenuOpen(true)}
                style={styles.bellBtn}
                accessibilityRole="button"
                accessibilityLabel="Open menu"
                haptic="light"
              >
                <Icon name="bell" size={22} color={colors.primary} />
              </AnimatedPressable>
            </View>

            {/* Creature centerpiece */}
            <AnimatedPressable
              onPress={handleSpriteTap}
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel={`Tap your ${meta.displayName}`}
              style={styles.spriteWrap}
              onLayout={(e) => {
                creatureYRef.current = e.nativeEvent.layout.y;
              }}
            >
              <Animated.View
                style={{
                  transform: [
                    { translateY: bob },
                    { rotate: jiggleRotate },
                    ...happyHop.transform,
                  ],
                }}
              >
                <CreatureScene
                  species={creature.species}
                  stage={creature.stage}
                  emotion={creatureEmotion}
                  size={220}
                  showHabitat
                  habitatVariant="subtle"
                />
              </Animated.View>
              {/* Sparkle burst when fed */}
              <View style={styles.burstOverlay} pointerEvents="none">
                <CelebrationBurst active={burstActive} intensity="subtle" durationMs={600} spread={120} />
              </View>
              {/* Per-action emoji reaction (treat/groom/play) */}
              <View style={styles.burstOverlay} pointerEvents="none">
                <CreatureReaction
                  kind={reactionKind}
                  triggerKey={reactionKey}
                  width={220}
                />
              </View>
            </AnimatedPressable>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <AnimatedPressable
                onPress={() => setShowHappinessInfo(true)}
                accessibilityRole="button"
                accessibilityLabel="What is Happiness?"
                haptic="light"
                style={styles.happinessWrap}
              >
                <OrbProgress
                  value={happinessPct}
                  size={56}
                  color={colors.amberDeep}
                  label={null}
                />
                <Caption tone="secondary" emphasis align="center" style={styles.happinessCaption}>
                  HAPPINESS
                </Caption>
                <View style={styles.happinessHelpBadge} pointerEvents="none">
                  <Caption tone="onNavy" emphasis style={styles.happinessHelpText}>
                    ?
                  </Caption>
                </View>
                {/* Floating +N happy bubble */}
                {floatingDelta != null && (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.floatingDelta,
                      {
                        opacity: floatAnim.interpolate({
                          inputRange: [0, 0.2, 1],
                          outputRange: [0, 1, 0],
                        }),
                        transform: [
                          {
                            translateY: floatAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -40],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Caption tone="accent" emphasis style={styles.floatingDeltaText}>
                      +{floatingDelta}
                    </Caption>
                  </Animated.View>
                )}
              </AnimatedPressable>
              <View style={styles.statsCenter}>
                <Typography.Display tone="primary" align="center" style={styles.creatureName}>
                  {creature.name}
                </Typography.Display>
                <Caption tone="secondary" align="center" style={styles.speciesLabel}>
                  {meta.displayName}
                </Caption>
                {creature.stage !== 'EGG' ? (
                  <Caption tone="accent" emphasis align="center" style={styles.stageLevelCenter}>
                    {stageLevel(creature.stage)}
                  </Caption>
                ) : null}
                <View style={styles.stageChipWrap}>
                  <Chip
                    label={stageName(creature.stage)}
                    tone="navy"
                    size="sm"
                  />
                </View>
              </View>
              <View style={styles.statsRight} />
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
                const opacity = count <= 0 ? 0.3 : count < 30 ? 0.7 : count < 50 ? 0.9 : 1;
                const glow = count >= 30;
                const pulse = traitPulseRef.current[t];
                return (
                  <Animated.View
                    key={t}
                    style={[styles.traitItem, { transform: [{ scale: pulse }] }]}
                  >
                    <View
                      style={[
                        styles.traitCircle,
                        {
                          borderColor: tColor,
                          backgroundColor: colors.creamSoft,
                          opacity,
                          shadowColor: glow ? tColor : 'transparent',
                          shadowOpacity: glow ? 0.4 : 0,
                          shadowRadius: glow ? 12 : 0,
                          shadowOffset: { width: 0, height: 0 },
                          elevation: glow ? 4 : 0,
                        },
                      ]}
                    >
                      <Icon name={TRAIT_ICON[t]} size={26} color={tColor} />
                    </View>
                    <Caption emphasis tone="primary" align="center" style={styles.traitCount}>
                      {count}
                    </Caption>
                    <Caption tone="secondary" align="center">
                      {traitLabel(t)}
                    </Caption>
                  </Animated.View>
                );
              })}
            </View>

            {/* Reward goal */}
            <RewardGoal
              reward={rewardQuery.data}
              isPending={rewardQuery.isPending}
              onRedeem={(id) => redeem.mutate(id)}
              redeeming={redeem.isPending}
            />

            {/* Shelf 1: Treats — feed Sprout (backend-backed) */}
            <View style={styles.shelfBlock}>
              <Typography.Eyebrow tone="accent" style={styles.sectionEyebrow}>
                🍓 Treats — feed Sprout
              </Typography.Eyebrow>
              {care.length === 0 ? (
                <EmptyState
                  illustration={<Icon name="sparkle" size={32} color={colors.amberDeep} />}
                  title="No treats yet"
                  body="Finish a mission to earn one!"
                />
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

            {/* Shelf 2: Grooming — client-side flourish */}
            <View style={styles.shelfBlock}>
              <Typography.Eyebrow tone="accent" style={styles.sectionEyebrow}>
                🪥 Grooming — keep Sprout fresh
              </Typography.Eyebrow>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelfScroll}
              >
                {GROOM_ITEMS.map((g) => (
                  <CareActionCard
                    key={g.slug}
                    label={g.label}
                    emoji={g.emoji}
                    iconName="heart"
                    accent={traitColor('HEART')}
                    deltaHappy={5}
                    onAction={() => applyClientCareBoost(5, 'GROOM')}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Shelf 3: Play — client-side flourish */}
            <View style={styles.shelfBlock}>
              <Typography.Eyebrow tone="accent" style={styles.sectionEyebrow}>
                🎮 Play — bond with Sprout
              </Typography.Eyebrow>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelfScroll}
              >
                {PLAY_ITEMS.map((p) => (
                  <CareActionCard
                    key={p.slug}
                    label={p.label}
                    emoji={p.emoji}
                    iconName="sparkle"
                    accent={colors.magicViolet}
                    deltaHappy={3}
                    onAction={() => applyClientCareBoost(3, 'PLAY')}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={{ height: spacing.xl }} />
          </ScrollView>

          {/* Feed error banner */}
          {feedError && (
            <View style={styles.toastWrap} pointerEvents="none">
              <Banner tone="error" message={feedError} />
            </View>
          )}

          {/* Reward unlock toast */}
          {showUnlockToast && (
            <View style={styles.toastWrap} pointerEvents="none">
              <Banner tone="success" title="Quest unlocked!" message="Tap Redeem on your reward." />
            </View>
          )}

          <RewardCelebration
            visible={!!celebrateName}
            rewardName={celebrateName ?? ''}
            onDismiss={() => setCelebrateName(null)}
          />

          {evolutionEvent && creature && (
            <EvolutionOverlay
              species={creature.species}
              fromStage={evolutionEvent.from}
              toStage={evolutionEvent.to}
              creatureName={creature.name}
              onComplete={() => setEvolutionEvent(null)}
            />
          )}

          <Modal
            visible={showHappinessInfo}
            transparent
            animationType="fade"
            onRequestClose={() => setShowHappinessInfo(false)}
          >
            <View style={styles.infoModalRoot}>
              <Pressable
                style={styles.infoBackdrop}
                onPress={() => setShowHappinessInfo(false)}
              />
              <Surface
                variant="card"
                radius="lg"
                padding="lg"
                shadow="card"
                style={styles.infoCard as any}
              >
                <Typography.Heading level={2} tone="primary" align="center">
                  Happiness
                </Typography.Heading>
                <Typography.Body
                  tone="secondary"
                  align="center"
                  style={styles.infoBody}
                >
                  This shows how happy {creature.name} is. It slowly drops over
                  time — feed your creature with care items below to keep it
                  high! At 100% your creature is fully content.
                </Typography.Body>
                <AnimatedPressable
                  onPress={() => setShowHappinessInfo(false)}
                  style={styles.infoBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Got it"
                >
                  <Typography.Heading level={3} tone="primary">
                    Got it
                  </Typography.Heading>
                </AnimatedPressable>
              </Surface>
            </View>
          </Modal>

          {/* Child menu sheet (bell button) */}
          <Modal
            visible={menuOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuOpen(false)}
          >
            <View style={styles.sheetRoot}>
              <Pressable style={styles.infoBackdrop} onPress={() => setMenuOpen(false)} />
              <Surface
                variant="card"
                radius="lg"
                padding="lg"
                shadow="card"
                style={styles.sheetCard as any}
              >
                <Typography.Heading level={2} tone="primary" align="center">
                  Hey, {heroName}
                </Typography.Heading>
                <View style={styles.sheetRowDisabled}>
                  <Icon name="bell" size={20} color={colors.textSecondary} />
                  <Typography.Body tone="secondary">Notifications</Typography.Body>
                  <Caption tone="secondary" style={{ marginLeft: 'auto' }}>Soon</Caption>
                </View>
                <View style={styles.sheetSep} />
                <AnimatedPressable
                  onPress={() => setConfirmLogout(true)}
                  style={styles.sheetRow}
                  accessibilityRole="button"
                  accessibilityLabel="Sign out"
                >
                  <Icon name="chevronLeft" size={20} color={colors.error} />
                  <Typography.Body emphasis style={{ color: colors.error }}>Sign out</Typography.Body>
                </AnimatedPressable>
              </Surface>
            </View>
          </Modal>

          {/* Confirm sign-out */}
          <Modal
            visible={confirmLogout}
            transparent
            animationType="fade"
            onRequestClose={() => setConfirmLogout(false)}
          >
            <View style={styles.infoModalRoot}>
              <Pressable style={styles.infoBackdrop} onPress={() => setConfirmLogout(false)} />
              <Surface variant="card" radius="lg" padding="lg" shadow="card" style={styles.infoCard as any}>
                <Typography.Heading level={2} tone="primary" align="center">
                  Sign out?
                </Typography.Heading>
                <Typography.Body tone="secondary" align="center" style={styles.infoBody}>
                  You&apos;ll need your family code + PIN to come back.
                </Typography.Body>
                <View style={styles.confirmRow}>
                  <AnimatedPressable
                    onPress={() => setConfirmLogout(false)}
                    style={[styles.infoBtn, styles.cancelBtn]}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                  >
                    <Typography.Heading level={3} tone="secondary">Stay</Typography.Heading>
                  </AnimatedPressable>
                  <AnimatedPressable
                    onPress={handleSignOut}
                    style={[styles.infoBtn, styles.dangerBtn]}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm sign out"
                  >
                    <Typography.Heading level={3} style={{ color: colors.white }}>Sign out</Typography.Heading>
                  </AnimatedPressable>
                </View>
              </Surface>
            </View>
          </Modal>
        </SafeAreaView>
      </GradientBackdrop>
    </View>
  );
}

function stageLevel(stage: EvolutionStage): string {
  switch (stage) {
    case 'EGG': return '';
    case 'BABY': return 'Level 1';
    case 'ADOLESCENT': return 'Level 2';
    case 'ADULT': return 'Level 3';
  }
}

function stageName(stage: EvolutionStage): string {
  switch (stage) {
    case 'EGG': return 'Egg';
    case 'BABY': return 'Baby';
    case 'ADOLESCENT': return 'Adolescent';
    case 'ADULT': return 'Adult';
  }
}

function RewardGoal({
  reward,
  isPending,
  onRedeem,
  redeeming,
}: {
  reward:
    | { id: string; name: string; progress: number; target: number; unlocked: boolean }
    | null
    | undefined;
  isPending: boolean;
  onRedeem: (id: string) => void;
  redeeming: boolean;
}) {
  if (isPending) {
    return (
      <Surface variant="parchment" radius="lg" padding="md" style={styles.rewardBand}>
        <ActivityIndicator size="small" color={colors.amberDeep} />
      </Surface>
    );
  }
  if (!reward) return null;
  const pct = Math.min(100, Math.round((reward.progress / Math.max(1, reward.target)) * 100));
  return (
    <Surface variant="parchment" radius="lg" padding="md" shadow="parchment" bordered style={styles.rewardBand}>
      <View style={styles.rewardHeader}>
        <Icon name="crown" size={18} color={colors.amberDeep} />
        <Typography.Scroll tone="onParchment" style={styles.rewardName} numberOfLines={1}>
          Your quest: {reward.name}
        </Typography.Scroll>
        <Caption emphasis tone="onParchment">
          {reward.progress}/{reward.target}
        </Caption>
      </View>
      <View style={styles.rewardBarBg}>
        <View style={[styles.rewardBarFill, { width: `${pct}%` }]} />
      </View>
      {reward.unlocked && (
        <AnimatedPressable
          onPress={() => onRedeem(reward.id)}
          disabled={redeeming}
          style={styles.rewardRedeem}
          accessibilityRole="button"
          accessibilityLabel="Redeem reward"
        >
          {redeeming ? (
            <ActivityIndicator size="small" color={colors.navyDeep} />
          ) : (
            <>
              <Icon name="sparkle" size={16} color={colors.navyDeep} />
              <Typography.Heading level={3} tone="primary">
                Redeem ✨
              </Typography.Heading>
            </>
          )}
        </AnimatedPressable>
      )}
    </Surface>
  );
}

function CareActionCard({
  label,
  emoji,
  iconName,
  accent,
  deltaHappy,
  onAction,
}: {
  label: string;
  emoji: string;
  iconName: IconName;
  accent: string;
  deltaHappy: number;
  onAction: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [spent, setSpent] = useState(false);
  useEffect(() => {
    if (!spent) return;
    const id = setTimeout(() => setSpent(false), 900);
    return () => clearTimeout(id);
  }, [spent]);

  function handlePress() {
    if (spent) return;
    setSpent(true);
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.18, duration: 140, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
    onAction();
  }

  return (
    <Animated.View style={{ transform: [{ scale }], marginRight: spacing.sm }}>
      <AnimatedPressable
        onPress={handlePress}
        disabled={spent}
        haptic="light"
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Surface
          variant="card"
          radius="lg"
          padding="sm"
          shadow="card"
          style={{ width: 116, alignItems: 'center', borderColor: accent + '55', borderWidth: 1 } as any}
        >
          <View
            style={[
              styles.careIcon,
              { backgroundColor: accent + '22', borderColor: accent + '55' },
            ]}
          >
            <Typography.Display tone="primary" align="center" style={styles.actionEmoji}>
              {emoji}
            </Typography.Display>
          </View>
          <Caption emphasis tone="primary" align="center" style={styles.careName} numberOfLines={1}>
            {label}
          </Caption>
          <Caption emphasis style={{ color: accent, marginTop: 2 }}>
            +{deltaHappy} happy
          </Caption>
          {/* Keep IconName import live for future glyph swap. */}
          <View style={styles.hiddenIcon} pointerEvents="none">
            <Icon name={iconName} size={1} color="transparent" />
          </View>
        </Surface>
      </AnimatedPressable>
    </Animated.View>
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
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const [spent, setSpent] = useState(false);

  function handlePress() {
    if (disabled || spent) return;
    setSpent(true);
    Animated.sequence([
      // 1. Lift + rotate (180ms)
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.2, duration: 180, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: 180, useNativeDriver: true }),
      ]),
      // 2. Fly toward creature: up + shrink + fade (350ms)
      Animated.parallel([
        Animated.timing(translateY, { toValue: -200, duration: 350, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.4, duration: 350, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start(() => {
      onFeed();
    });
  }

  const rotateStr = rotate.interpolate({
    inputRange: [-1, 0],
    outputRange: ['-6deg', '0deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [{ translateY }, { scale }, { rotate: rotateStr }],
        opacity,
        marginRight: spacing.sm,
      }}
    >
      <AnimatedPressable
        onPress={handlePress}
        disabled={disabled || spent}
        haptic="light"
        accessibilityRole="button"
        accessibilityLabel={`Feed ${item.itemSlug.replace(/_/g, ' ')}`}
      >
        <Surface
          variant="card"
          radius="lg"
          padding="sm"
          shadow="card"
          style={{ width: 116, alignItems: 'center', borderColor: tColor + '55', borderWidth: 1 } as any}
        >
          <View
            style={[
              styles.careIcon,
              { backgroundColor: tColor + '22', borderColor: tColor + '55' },
            ]}
          >
            <Icon name={TRAIT_ICON[item.traitCategory]} size={22} color={tColor} />
          </View>
          <Caption emphasis tone="primary" align="center" style={styles.careName} numberOfLines={1}>
            {item.itemSlug.replace(/_/g, ' ')}
          </Caption>
          <Caption emphasis style={{ color: tColor, marginTop: 2 }}>
            +{item.happinessDelta} happy
          </Caption>
        </Surface>
      </AnimatedPressable>
    </Animated.View>
  );
}

void durations;

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  fullLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scroll: { paddingBottom: FLOATING_TAB_BAR_SCREEN_PADDING },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  topGreeting: { gap: 0 },
  topEyebrow: { letterSpacing: 1, textTransform: 'uppercase' },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sprite
  spriteWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  statsCenter: { flex: 1, alignItems: 'center', gap: 4 },
  statsRight: { width: 56 },
  stageLevel: { letterSpacing: 1 },
  stageLevelCenter: { marginTop: 4, letterSpacing: 0.5 },
  stageChipWrap: { alignSelf: 'center' },
  burstOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingDelta: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    alignItems: 'center',
  },
  floatingDeltaText: { fontSize: 16 },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetCard: {
    margin: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  sheetRowDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    opacity: 0.4,
  },
  sheetSep: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 0,
  },
  dangerBtn: {
    flex: 1,
    backgroundColor: colors.error,
    marginTop: 0,
  },
  happinessWrap: { position: 'relative' },
  happinessHelpBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.navyDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  happinessHelpText: { fontSize: 10, lineHeight: 12 },
  infoModalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  infoBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,27,61,0.45)',
  },
  infoCard: { width: '100%', maxWidth: 360, alignItems: 'stretch' },
  infoBody: { marginTop: spacing.sm, lineHeight: 22 },
  infoBtn: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.amberDeep,
    borderRadius: borderRadius.pill,
  },
  creatureName: {
    fontSize: 26,
  },
  speciesLabel: { marginTop: 2 },

  // Traits
  traitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  traitItem: { alignItems: 'center', width: 88 },
  traitCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  traitCount: {
    marginTop: 6,
    ...typographyTokens.captionEmphasis,
    fontSize: 13,
  },

  // Reward
  rewardBand: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  rewardName: {
    flex: 1,
    fontSize: 15,
  },
  rewardBarBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.parchmentDark,
    overflow: 'hidden',
  },
  rewardBarFill: {
    height: '100%',
    backgroundColor: colors.amberDeep,
    borderRadius: 5,
  },
  rewardRedeem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.amberDeep,
    borderRadius: borderRadius.pill,
  },

  // Shelf
  shelfBlock: { marginTop: spacing.lg },
  sectionEyebrow: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  shelfScroll: { paddingHorizontal: spacing.lg },
  careIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  careName: { textTransform: 'capitalize' },
  actionEmoji: { fontSize: 24, lineHeight: 28 },
  hiddenIcon: { width: 0, height: 0, opacity: 0 },
  happinessCaption: { marginTop: 4, letterSpacing: 1 },

  toastWrap: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
  },
});
