/**
 * Parent register — Polish-B2 rebuild.
 *
 * Visual: identical language to login.tsx (glass card, Display heading,
 * amber CTA, navy backdrop) — just more fields.
 *
 * Functional behavior preserved: timezone auto-detect, register() →
 * router.replace('/'). Returns to login on back.
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
  spacing,
  typographyTokens,
} from '@/theme';

const registerSchema = z
  .object({
    displayName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Add an uppercase letter')
      .regex(/[a-z]/, 'Add a lowercase letter')
      .regex(/[0-9]/, 'Add a number')
      .regex(/[^A-Za-z0-9]/, 'Add a special character'),
    confirmPassword: z.string(),
    familyName: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      familyName: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await register({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        familyName: data.familyName,
        timezone,
      });
      router.replace('/');
    } catch (err: unknown) {
      const { extractApiError } = await import('@/api/client');
      setError(extractApiError(err, 'Registration failed. Please try again.'));
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
          <Link href="/(auth)/login" asChild>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel="Back to login"
              style={styles.backBtn}
            >
              <Icon name="chevronLeft" size={22} color={colors.cream} />
              <Caption tone="onNavy" emphasis style={styles.backTxt}>Sign in</Caption>
            </AnimatedPressable>
          </Link>

          <LogoMark />

          <View style={styles.heroCopy}>
            <Display tone="onNavy" align="center">Begin your family&apos;s saga</Display>
            <Body tone="onNavy" align="center" style={styles.heroSub}>
              Create the account that holds every Hero in your home.
            </Body>
          </View>

          <Surface variant="glass" radius="xl" padding="lg" shadow="navyGlow">
            {error ? (
              <View style={styles.bannerWrap}>
                <Banner tone="error" message={error} />
              </View>
            ) : null}

            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, onBlur, value } }) => (
                <ThemedInput
                  label="Your name"
                  placeholder="Alex"
                  autoComplete="name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.displayName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <ThemedInput
                  label="Email"
                  placeholder="you@email.com"
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
              name="familyName"
              render={({ field: { onChange, onBlur, value } }) => (
                <ThemedInput
                  label="Family name (optional)"
                  placeholder="The Riveras"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.familyName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <ThemedInput
                  label="Password"
                  placeholder="Strong + memorable"
                  secureTextEntry
                  autoComplete="password-new"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <ThemedInput
                  label="Confirm password"
                  placeholder="Type it again"
                  secureTextEntry
                  autoComplete="password-new"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <AnimatedPressable
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Create account"
              style={[styles.cta, isLoading ? { opacity: 0.6 } : null] as any}
            >
              <Typography.Heading level={2} tone="primary" style={styles.ctaLabel}>
                {isLoading ? 'Creating…' : 'Create account'}
              </Typography.Heading>
              {!isLoading && <Icon name="chevronRight" size={20} color={colors.navyDeep} />}
            </AnimatedPressable>
          </Surface>

          <Link href="/(auth)/login" asChild>
            <AnimatedPressable
              style={styles.footerLink}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Typography.Body tone="onNavy" align="center">
                Already have an account?{' '}
                <Typography.Body emphasis tone="accent">Sign in →</Typography.Body>
              </Typography.Body>
            </AnimatedPressable>
          </Link>
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
        style={[styles.input, error ? styles.inputError : null]}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
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

  logoImage: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    marginTop: -spacing.sm,
    marginBottom: -spacing.md,
  },
  heroCopy: { marginTop: spacing.sm, marginBottom: spacing.lg },
  heroSub: { opacity: 0.85, marginTop: 4 },

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
  ctaLabel: { fontSize: 17, color: colors.navyDeep },

  footerLink: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
