/**
 * Onboarding · Step 4 · Egg hatch — Polish-B2 marquee moment.
 *
 *  - Magic GradientBackdrop with 4 floating sparkle particles overlaid.
 *  - Large CreatureScene (EGG → BABY) in habitat that pulses.
 *  - Tap to hatch → shake + onboardCreature API → crossfade reveal +
 *    burst of sparkle icons → parchment welcome overlay with name + Chip.
 *  - Error path uses <Banner tone="error"> + Try again / Skip-to-Hub CTAs.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { CreatureScene } from '@/components/creature/CreatureScene';
import { SPECIES_DEFAULTS } from '@/constants/species';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { creaturesApi, extractApiError } from '@/api';
import {
  AnimatedPressable,
  Banner,
  Chip,
  GradientBackdrop,
  Icon,
  Surface,
  Typography,
  type IconName,
} from '@/components/ui';
import {
  borderRadius,
  colors,
  durations,
  spacing,
  traitLabel,
} from '@/theme';
import type { TraitCategory } from '@/api/creatures.api';

type Phase = 'idle' | 'shaking' | 'hatched' | 'welcome' | 'error';

const TRAIT_ICON: Record<TraitCategory, IconName> = {
  STRENGTH: 'strength',
  WISDOM: 'wisdom',
  HEART: 'heart',
};
const TRAIT_TONE: Record<TraitCategory, 'strength' | 'wisdom' | 'heart'> = {
  STRENGTH: 'strength',
  WISDOM: 'wisdom',
  HEART: 'heart',
};

export default function HatchScreen() {
  const queryClient = useQueryClient();
  const selectedSpecies = useOnboardingStore((s) => s.selectedSpecies);
  const selectedName = useOnboardingStore((s) => s.selectedName);
  const reset = useOnboardingStore((s) => s.reset);
  const meta = selectedSpecies ? SPECIES_DEFAULTS[selectedSpecies] : null;
  const creatureName = selectedName || meta?.defaultName || '';

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const pulse = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const eggOpacity = useRef(new Animated.Value(1)).current;
  const babyScale = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!selectedSpecies) {
      router.replace('/(child)/onboarding/species' as never);
    }
  }, [selectedSpecies]);

  // Idle pulse
  useEffect(() => {
    if (phase !== 'idle') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulse]);

  const runShake = () =>
    new Promise<void>((resolve) => {
      shake.setValue(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 70, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 70, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start(() => resolve());
    });

  const runBurst = () =>
    new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(eggOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(babyScale, {
            toValue: 1.2,
            duration: 450,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
          Animated.timing(babyScale, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(burst, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => resolve());
    });

  const showWelcome = () =>
    new Promise<void>((resolve) => {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: durations.slow,
        useNativeDriver: true,
      }).start(() => resolve());
    });

  const handleHatchPress = async () => {
    if (phase !== 'idle' || !selectedSpecies) return;
    setError(null);
    setPhase('shaking');
    try {
      const apiPromise = creaturesApi.onboardCreature({
        species: selectedSpecies,
        name: creatureName || undefined,
      });
      await runShake();
      await apiPromise;

      setPhase('hatched');
      await runBurst();

      queryClient.invalidateQueries({ queryKey: ['creature', 'me'] });

      await new Promise((r) => setTimeout(r, 1200));
      setPhase('welcome');
      await showWelcome();
    } catch (err) {
      setError(extractApiError(err, 'The egg refused to hatch. Try again?'));
      setPhase('error');
    }
  };

  const finish = () => {
    reset();
    router.replace('/(child)' as never);
  };

  if (!meta) return null;

  const shakeTranslate = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-12, 12],
  });

  return (
    <View style={styles.root}>
      <GradientBackdrop variant="magic" intensity="rich" direction="diagonal">
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.body}>
            <Typography.Eyebrow tone="onNavy" align="center">
              The moment
            </Typography.Eyebrow>
            <Typography.Display tone="onNavy" align="center" style={styles.title}>
              {phase === 'idle' ? 'The egg is waiting…' : phase === 'shaking' ? 'Cracking the shell…' : 'A new bond'}
            </Typography.Display>

            <TouchableWithoutFeedback onPress={handleHatchPress}>
              <View style={styles.stage}>
                {/* Ambient floating sparkles */}
                <FloatingSparkle delay={0} offsetX={-90} offsetY={-100} />
                <FloatingSparkle delay={600} offsetX={100} offsetY={-80} />
                <FloatingSparkle delay={1200} offsetX={-80} offsetY={90} />
                <FloatingSparkle delay={1800} offsetX={110} offsetY={80} />

                {/* Egg (visible until hatched) */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    opacity: eggOpacity,
                    transform: [
                      { scale: pulse },
                      { translateX: shakeTranslate },
                    ],
                  }}
                >
                  <CreatureScene
                    species={meta.species}
                    stage="EGG"
                    emotion="HAPPY"
                    size={220}
                    showHabitat
                    habitatVariant="full"
                  />
                </Animated.View>

                {/* Baby reveal */}
                <Animated.View
                  style={{
                    opacity: babyScale,
                    transform: [{ scale: babyScale }],
                  }}
                >
                  <CreatureScene
                    species={meta.species}
                    stage="BABY"
                    emotion="EXCITED"
                    size={220}
                    showHabitat
                    habitatVariant="full"
                  />
                </Animated.View>

                {/* Burst overlay — 6 sparkles radiating outward */}
                <BurstParticles burst={burst} />
              </View>
            </TouchableWithoutFeedback>

            {phase === 'idle' && (
              <Typography.Body emphasis tone="accent" align="center" style={styles.tapHint}>
                ✨ Tap to hatch ✨
              </Typography.Body>
            )}

            {phase === 'error' && error && (
              <View style={styles.errorBlock}>
                <Banner tone="error" title="Couldn't hatch" message={error} />
                <View style={{ height: spacing.sm }} />
                <AnimatedPressable
                  onPress={() => setPhase('idle')}
                  style={styles.errorBtn}
                  accessibilityLabel="Try again"
                  accessibilityRole="button"
                >
                  <Typography.Heading level={2} tone="primary" style={styles.errorBtnLabel}>
                    Try again
                  </Typography.Heading>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={finish}
                  style={styles.errorBtnGhost}
                  accessibilityLabel="Skip to Hub"
                  accessibilityRole="button"
                >
                  <Typography.Body emphasis tone="onNavy">
                    Skip to Hub
                  </Typography.Body>
                </AnimatedPressable>
              </View>
            )}
          </View>

          {/* Welcome overlay */}
          {(phase === 'welcome' || phase === 'hatched') && (
            <Animated.View
              pointerEvents={phase === 'welcome' ? 'auto' : 'none'}
              style={[styles.welcomeOverlay, { opacity: overlayOpacity }]}
            >
              <Surface variant="parchment" radius="xl" padding="lg" shadow="parchment" bordered>
                <Typography.Eyebrow align="center" tone="accent">
                  A new bond
                </Typography.Eyebrow>
                <Typography.Display align="center" tone="onParchment" style={styles.welcomeName}>
                  Welcome, {creatureName}!
                </Typography.Display>
                <Typography.Scroll align="center" tone="onParchment" style={styles.welcomeBody}>
                  {meta.displayName} has chosen you. Together you&apos;ll walk the path of {traitLabel(meta.trait).toLowerCase()}.
                </Typography.Scroll>
                <View style={styles.welcomeChip}>
                  <Chip
                    label={`Path of ${traitLabel(meta.trait)}`}
                    tone={TRAIT_TONE[meta.trait]}
                    icon={<Icon name={TRAIT_ICON[meta.trait]} size={12} color={colors.white} />}
                  />
                </View>
                {phase === 'welcome' && (
                  <AnimatedPressable
                    onPress={finish}
                    style={styles.welcomeCta}
                    accessibilityRole="button"
                    accessibilityLabel="Begin your journey"
                  >
                    <Typography.Heading level={2} tone="primary" style={styles.welcomeCtaLabel}>
                      Begin your journey
                    </Typography.Heading>
                    <Icon name="chevronRight" size={20} color={colors.navyDeep} />
                  </AnimatedPressable>
                )}
              </Surface>
            </Animated.View>
          )}
        </SafeAreaView>
      </GradientBackdrop>
    </View>
  );
}

// ----- helpers ----------------------------------------------------------

function FloatingSparkle({
  delay,
  offsetX,
  offsetY,
}: {
  delay: number;
  offsetX: number;
  offsetY: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  const style = {
    position: 'absolute' as const,
    left: '50%' as const,
    top: '50%' as const,
    transform: [
      { translateX: offsetX },
      { translateY: offsetY },
      {
        scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.1] }),
      },
    ],
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.85] }),
  };
  return (
    <Animated.View style={style} pointerEvents="none">
      <Icon name="sparkle" size={18} color={colors.amberDeep} />
    </Animated.View>
  );
}

function BurstParticles({ burst }: { burst: Animated.Value }) {
  const dirs = [0, 60, 120, 180, 240, 300];
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {dirs.map((deg, i) => {
        const dx = Math.cos((deg * Math.PI) / 180);
        const dy = Math.sin((deg * Math.PI) / 180);
        const tx = burst.interpolate({ inputRange: [0, 1], outputRange: [0, dx * 130] });
        const ty = burst.interpolate({ inputRange: [0, 1], outputRange: [0, dy * 130] });
        const op = burst.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              opacity: op,
              transform: [{ translateX: tx }, { translateY: ty }],
            }}
          >
            <Icon name="sparkle" size={16} color={colors.amberDeep} />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  title: { marginTop: spacing.xs, fontSize: 26, textAlign: 'center' },

  stage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
    minHeight: 280,
  },
  tapHint: { marginBottom: spacing.lg },

  errorBlock: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  errorBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.amberDeep,
    borderRadius: borderRadius.pill,
  },
  errorBtnLabel: { fontSize: 16, color: colors.navyDeep },
  errorBtnGhost: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },

  welcomeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 27, 61, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  welcomeName: { marginTop: spacing.xs, fontSize: 28 },
  welcomeBody: { marginTop: spacing.sm },
  welcomeChip: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  welcomeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.amberDeep,
    borderRadius: borderRadius.pill,
  },
  welcomeCtaLabel: { fontSize: 17, color: colors.navyDeep },
});
