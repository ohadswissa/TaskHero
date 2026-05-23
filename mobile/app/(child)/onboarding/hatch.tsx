/**
 * Onboarding · Step 4 · Egg hatch.
 *
 * - Pulsing egg + "Tap to hatch" hint.
 * - Tap → shake animation + POST /creatures/me/onboard.
 * - On success: burst (scale + opacity) → reveal baby sprite → "Welcome,
 *   {name}!" overlay → "Begin your journey →" replaces the route to
 *   /(child), which triggers the routing gate to land on the Hub.
 * - On error (e.g. creature already exists): show the error inline and
 *   offer "Continue to Hub" which navigates without re-onboarding (the
 *   routing gate will let the child through because the creature row
 *   does exist).
 *
 * Uses react-native's core Animated API — no reanimated dependency
 * required for these short transitions.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Gradient as LinearGradient } from '@/components/common/Gradient';
import { useQueryClient } from '@tanstack/react-query';
import { colors, spacing, fonts, borderRadius, shadows } from '@/theme';
import { Button } from '@/components/common';
import { SpeciesBadge } from '@/components/creature/SpeciesBadge';
import { SPECIES_DEFAULTS } from '@/constants/species';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { creaturesApi, extractApiError } from '@/api';

type Phase = 'idle' | 'shaking' | 'hatched' | 'welcome' | 'error';

export default function HatchScreen() {
  const queryClient = useQueryClient();
  const selectedSpecies = useOnboardingStore((s) => s.selectedSpecies);
  const selectedName = useOnboardingStore((s) => s.selectedName);
  const reset = useOnboardingStore((s) => s.reset);
  const meta = selectedSpecies ? SPECIES_DEFAULTS[selectedSpecies] : null;
  const creatureName = selectedName || meta?.defaultName || '';

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const pulse = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const eggOpacity = useRef(new Animated.Value(1)).current;
  const babyScale = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Bounce back to species if state was lost.
  useEffect(() => {
    if (!selectedSpecies) {
      router.replace('/(child)/onboarding/species' as never);
    }
  }, [selectedSpecies]);

  // Idle pulse loop
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
        Animated.timing(shake, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0.5, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start(() => resolve());
    });

  const runBurst = () =>
    new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(eggOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(babyScale, { toValue: 1.2, duration: 450, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
          Animated.timing(babyScale, { toValue: 1, duration: 180, useNativeDriver: true }),
        ]),
      ]).start(() => resolve());
    });

  const showWelcome = () =>
    new Promise<void>((resolve) => {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => resolve());
    });

  const handleHatchPress = async () => {
    if (phase !== 'idle' || !selectedSpecies) return;
    setError(null);
    setPhase('shaking');

    try {
      // Kick off the shake and the API call in parallel.
      const apiPromise = creaturesApi.onboardCreature({
        species: selectedSpecies,
        name: creatureName || undefined,
      });
      await runShake();
      // Make sure the API actually returns before revealing the baby.
      await apiPromise;

      setPhase('hatched');
      await runBurst();

      // Invalidate creature cache so the (child) layout gate picks up the
      // new state on the next render.
      queryClient.invalidateQueries({ queryKey: ['creature', 'me'] });

      await new Promise((r) => setTimeout(r, 1500));
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

  const skipToHub = () => {
    // Even on error, if the creature already exists, the gate will let us in.
    reset();
    router.replace('/(child)' as never);
  };

  if (!meta) return null;

  const shakeTranslate = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-12, 12],
  });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#0F1B3D', '#1B2A4E', '#3A4D7A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={styles.body}>
        <Text style={styles.eyebrow}>STEP 4 OF 4</Text>
        <Text style={styles.title}>The egg is waiting…</Text>
        <Text style={styles.subtitle}>Tap to hatch and meet your companion.</Text>

        <TouchableWithoutFeedback onPress={handleHatchPress}>
          <View style={styles.stage}>
            {/* Egg */}
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
              <SpeciesBadge species={meta.species} stage="EGG" size={220} />
            </Animated.View>

            {/* Baby */}
            <Animated.View
              style={{
                opacity: babyScale,
                transform: [{ scale: babyScale }],
              }}
            >
              <SpeciesBadge species={meta.species} stage="BABY" size={220} />
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>

        {phase === 'idle' && (
          <Text style={styles.tapHint}>✨ Tap to hatch ✨</Text>
        )}
        {phase === 'shaking' && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingTxt}>Cracking the shell…</Text>
          </View>
        )}

        {phase === 'error' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Hmm…</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <View style={{ height: spacing.sm }} />
            <Button title="Try again" onPress={() => setPhase('idle')} variant="primary" />
            <View style={{ height: spacing.xs }} />
            <Button title="Skip to Hub" onPress={skipToHub} variant="ghost" />
          </View>
        )}
      </View>

      {/* Welcome overlay */}
      {(phase === 'welcome' || phase === 'hatched') && (
        <Animated.View
          pointerEvents={phase === 'welcome' ? 'auto' : 'none'}
          style={[styles.welcomeOverlay, { opacity: overlayOpacity }]}
        >
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeEyebrow}>A NEW BOND</Text>
            <Text style={styles.welcomeName}>Welcome, {creatureName}!</Text>
            <Text style={styles.welcomeBody}>
              {meta.displayName} has chosen you. Together, you'll walk{' '}
              <Text style={styles.welcomeBodyEm}>the path of {meta.trait.toLowerCase()}</Text>.
            </Text>
            {phase === 'welcome' && (
              <Button
                title="Begin your journey →"
                onPress={finish}
                variant="primary"
                size="lg"
                style={{ marginTop: spacing.md }}
              />
            )}
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  stage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
    minHeight: 260,
  },
  tapHint: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.accent,
    marginBottom: spacing.xl,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  loadingTxt: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: spacing.sm,
  },
  errorBox: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    width: '100%',
    ...shadows.lg,
  },
  errorTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  errorMsg: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  welcomeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 27, 61, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  welcomeCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    ...shadows.lg,
  },
  welcomeEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.accent,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeName: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  welcomeBody: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  welcomeBodyEm: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
});
