/**
 * Child login — Polish-B2 rebuild.
 *
 * Visual:
 *  - Inherits navy GradientBackdrop from (auth)/_layout.tsx.
 *  - Top: peek of a Forest Pup BABY behind a soft halo.
 *  - Family invite code text input (uppercase, monospace, 6–12 chars).
 *  - 4-dot <PinDots/> indicator + 3×4 <PinKeypad/> grid.
 *  - PIN auto-submits at 4 digits. On error → shake keypad + Banner.
 *
 * Functional behavior preserved — loginChild() → router.replace('/').
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuthStore } from '@/stores/authStore';
import { Creature } from '@/components/creature/Creature';
import {
  AnimatedPressable,
  Banner,
  Caption,
  Icon,
  PinDots,
  PinKeypad,
  Typography,
} from '@/components/ui';
import {
  borderRadius,
  colors,
  durations,
  spacing,
  typographyTokens,
} from '@/theme';

const MIN_CODE_LEN = 6;
const MAX_CODE_LEN = 12;
const PIN_LEN = 4;

export default function ChildLoginScreen() {
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginChild } = useAuthStore();

  // Keypad shake animation
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));
  const runShake = () => {
    shake.value = withSequence(
      withTiming(-10, { duration: 60, easing: Easing.linear }),
      withTiming(10, { duration: 60, easing: Easing.linear }),
      withTiming(-7, { duration: 50, easing: Easing.linear }),
      withTiming(7, { duration: 50, easing: Easing.linear }),
      withTiming(0, { duration: 50, easing: Easing.linear }),
    );
  };

  // Creature peek pulse
  const peekScale = useSharedValue(0.92);
  useEffect(() => {
    peekScale.value = withTiming(1, { duration: durations.slow, easing: Easing.out(Easing.cubic) });
  }, [peekScale]);
  const peekStyle = useAnimatedStyle(() => ({ transform: [{ scale: peekScale.value }] }));

  // Auto-submit when PIN reaches 4 digits
  const submittingRef = useRef(false);
  useEffect(() => {
    if (pin.length !== PIN_LEN || submittingRef.current) return;
    if (code.trim().length < MIN_CODE_LEN) {
      setError('Enter your family code first.');
      runShake();
      setPin('');
      return;
    }
    submittingRef.current = true;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        await loginChild(code.trim().toUpperCase(), pin);
        router.replace('/');
      } catch (err: any) {
        setError(err?.message || 'Family code or PIN is wrong. Try again.');
        runShake();
        setPin('');
      } finally {
        submittingRef.current = false;
        setIsLoading(false);
      }
    })();
  }, [pin, code, loginChild]);

  const handleDigit = (d: string) => {
    setError(null);
    setPin((p) => (p.length < PIN_LEN ? p + d : p));
  };
  const handleBackspace = () => {
    setError(null);
    setPin((p) => p.slice(0, -1));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Link href="/(auth)/login" asChild>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel="Back to parent login"
              style={styles.backBtn}
            >
              <Icon name="chevronLeft" size={22} color={colors.cream} />
              <Caption tone="onNavy" emphasis style={styles.backTxt}>Parent login</Caption>
            </AnimatedPressable>
          </Link>

          {/* TaskHero logo */}
          <LogoMark />

          {/* Creature peek */}
          <Animated.View style={[styles.peek, peekStyle]}>
            <View style={styles.peekHalo} />
            <Creature species="FOREST_PUP" stage="BABY" emotion="HAPPY" size={96} />
          </Animated.View>

          <Typography.Display align="center" tone="onNavy" style={styles.title}>
            Enter your code
          </Typography.Display>
          <Typography.Body align="center" tone="onNavy" style={styles.subtitle}>
            Your hero is waiting on the other side.
          </Typography.Body>

          {/* Family code */}
          <View style={styles.codeWrap}>
            <Caption tone="onNavy" emphasis style={styles.codeLabel}>FAMILY CODE</Caption>
            <TextInput
              value={code}
              onChangeText={(t) => {
                setError(null);
                setCode(t.toUpperCase());
              }}
              placeholder="ABC123XY"
              placeholderTextColor="rgba(251, 247, 240, 0.4)"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={MAX_CODE_LEN}
              accessibilityLabel="Family code"
              style={styles.codeInput}
            />
          </View>

          {/* PIN dots */}
          <View style={styles.dotsWrap}>
            <PinDots filled={pin.length} total={PIN_LEN} tone="onNavy" />
          </View>

          {error ? (
            <View style={styles.bannerWrap}>
              <Banner tone="error" message={error} />
            </View>
          ) : null}

          {/* Keypad */}
          <Animated.View style={[styles.keypadWrap, shakeStyle]}>
            <PinKeypad
              tone="onNavy"
              disabled={isLoading || pin.length >= PIN_LEN}
              onDigit={handleDigit}
              onBackspace={handleBackspace}
            />
          </Animated.View>

          <Caption tone="onNavy" align="center" style={styles.hint}>
            Need help? Ask your parent for your family code and PIN.
          </Caption>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LogoMark() {
  const opacity = useRef(new RNAnimated.Value(0)).current;
  const scale = useRef(new RNAnimated.Value(0.94)).current;
  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      RNAnimated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);
  return (
    <RNAnimated.Image
      source={require('../../assets/taskhero.png')}
      resizeMode="contain"
      style={[styles.logoImage, { opacity, transform: [{ scale }] }]}
      accessibilityLabel="TaskHero logo"
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },

  logoImage: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    marginTop: -spacing.sm,
    marginBottom: -spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  backTxt: { letterSpacing: 0.5 },

  peek: {
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peekHalo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(244, 184, 96, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(244, 184, 96, 0.35)',
  },

  title: { marginTop: spacing.sm, fontSize: 28 },
  subtitle: { opacity: 0.85, marginTop: 4, marginBottom: spacing.lg },

  codeWrap: { marginBottom: spacing.lg },
  codeLabel: {
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 6,
  },
  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    color: colors.cream,
    textAlign: 'center',
    letterSpacing: 6,
    fontFamily: typographyTokens.heading2.fontFamily,
    fontSize: 18,
  },

  dotsWrap: { marginBottom: spacing.md },

  bannerWrap: { marginBottom: spacing.sm },

  keypadWrap: { marginTop: spacing.sm, marginBottom: spacing.md },

  hint: {
    opacity: 0.6,
    marginTop: spacing.sm,
  },
});
