/**
 * Parent login — Polish-B2 rebuild.
 *
 * Visual:
 *  - Inherits navy GradientBackdrop from (auth)/_layout.tsx.
 *  - Animated logo crest (crown icon + Fraunces wordmark) gently floats in.
 *  - Glass parchment card (Surface variant="glass") with Display heading,
 *    Inter inputs, amber pill CTA, and inline error Banner.
 *  - Secondary CTAs: "I'm a Hero (child)" + "Create an account".
 *
 * Functional behavior preserved — login() → router.replace('/').
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuthStore } from '@/stores/authStore';
import {
  AnimatedPressable,
  Banner,
  Body,
  Caption,
  Display,
  Icon,
  Surface,
  Typography,
} from '@/components/ui';
import {
  borderRadius,
  colors,
  durations,
  spacing,
  typographyTokens,
} from '@/theme';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  // Logo float-in animation
  const logoOpacity = useSharedValue(0);
  const logoTranslate = useSharedValue(-12);
  const cardOpacity = useSharedValue(0);
  const cardTranslate = useSharedValue(24);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: durations.slow });
    logoTranslate.value = withTiming(0, { duration: durations.slow, easing: Easing.out(Easing.cubic) });
    // gentle continuous bob after the entry
    setTimeout(() => {
      logoTranslate.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }, durations.slow);
    cardOpacity.value = withDelay(durations.base, withTiming(1, { duration: durations.slow }));
    cardTranslate.value = withDelay(durations.base, withTiming(0, { duration: durations.slow, easing: Easing.out(Easing.cubic) }));
  }, [logoOpacity, logoTranslate, cardOpacity, cardTranslate]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslate.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslate.value }],
  }));

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
      router.replace('/');
    } catch (err: unknown) {
      const { extractApiError } = await import('@/api/client');
      setError(extractApiError(err, 'Login failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo crest */}
          <Animated.View style={[styles.crest, logoStyle]}>
            <LogoMark />
          </Animated.View>

          {/* Glass card */}
          <Animated.View style={[styles.cardWrap, cardStyle]}>
            <Surface variant="glass" radius="xl" padding="lg" shadow="navyGlow">
              <Display tone="primary" align="center" style={styles.title}>
                Welcome back
              </Display>
              <Body tone="secondary" align="center" style={styles.tagline}>
                Continue your hero&apos;s journey.
              </Body>

              {error ? (
                <View style={styles.bannerWrap}>
                  <Banner tone="error" message={error} />
                </View>
              ) : null}

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    label="Email"
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    label="Password"
                    placeholder="••••••••"
                    secureTextEntry
                    autoComplete="password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                  />
                )}
              />

              <AnimatedPressable
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                style={[styles.cta, isLoading ? { opacity: 0.6 } : null] as any}
              >
                <Typography.Heading level={2} tone="primary" style={styles.ctaLabel}>
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </Typography.Heading>
                {!isLoading && <Icon name="chevronRight" size={20} color={colors.navyDeep} />}
              </AnimatedPressable>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Caption tone="secondary" style={styles.dividerLabel}>or</Caption>
                <View style={styles.dividerLine} />
              </View>

              <Link href="/(auth)/child-login" asChild>
                <AnimatedPressable
                  accessibilityRole="button"
                  accessibilityLabel="Child login"
                  style={styles.secondaryCta}
                >
                  <Icon name="sparkle" size={18} color={colors.amberDeep} />
                  <Typography.Body emphasis tone="primary" style={styles.secondaryLabel}>
                    I&apos;m a Hero (child)
                  </Typography.Body>
                  <Icon name="chevronRight" size={18} color={colors.primary} />
                </AnimatedPressable>
              </Link>
            </Surface>

            <Link href="/(auth)/register" asChild>
              <AnimatedPressable
                style={styles.footerLink}
                accessibilityRole="button"
                accessibilityLabel="Create a family account"
              >
                <Typography.Body tone="onNavy" align="center">
                  New family?{' '}
                  <Typography.Body emphasis tone="accent">Create an account →</Typography.Body>
                </Typography.Body>
              </AnimatedPressable>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ----------------------------------------------------------------------
// LogoMark — TaskHero brand image with a gentle fade-in via RN Animated.
// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------
// ThemedInput — local input bound to typographyTokens. Lives here for
// now; if a third screen needs it we'll promote to components/ui/Input.
// ----------------------------------------------------------------------
function ThemedInput({
  label,
  error,
  ...rest
}: React.ComponentProps<typeof TextInput> & { label: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Caption tone="secondary" emphasis style={styles.fieldLabel}>{label}</Caption>
      <TextInput
        {...rest}
        placeholderTextColor={colors.textTokens.tertiary}
        style={[
          styles.input,
          error ? styles.inputError : null,
        ]}
      />
      {error ? (
        <Caption tone="error" style={styles.fieldError}>{error}</Caption>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.md,
  },

  crest: {
    alignItems: 'center',
    marginBottom: -spacing.lg,
    marginTop: -spacing.md,
  },
  crestIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(244, 184, 96, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 184, 96, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoImage: {
    width: 300,
    height: 300,
  },
  wordmark: {
    fontSize: 36,
    letterSpacing: -0.5,
  },
  wordmarkSub: { opacity: 0.75, marginTop: 2 },

  cardWrap: { width: '100%' },
  title: { marginTop: spacing.xs },
  tagline: { marginTop: 4, marginBottom: spacing.md },

  bannerWrap: { marginBottom: spacing.md },

  field: { marginBottom: spacing.md },
  fieldLabel: {
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typographyTokens.body,
    fontSize: 15,
    color: colors.primary,
    borderWidth: 1,
    borderColor: 'rgba(27, 42, 78, 0.12)',
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: '#FDEFEE',
  },
  fieldError: { marginTop: 4 },

  cta: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.amberDeep,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
  },
  ctaLabel: {
    fontSize: 17,
    color: colors.navyDeep,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(27, 42, 78, 0.12)',
  },
  dividerLabel: {
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.creamSoft,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.amberSoft,
  },
  secondaryLabel: { flex: 0 },

  footerLink: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
