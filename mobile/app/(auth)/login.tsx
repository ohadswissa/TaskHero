import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ScrollView } from 'react-native';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Gradient } from '@/components/common/Gradient';
import { colors, spacing, typography, gradients, borderRadius, fonts } from '@/theme';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.email, data.password);
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Gradient hero */}
        <Gradient colors={gradients.hero} style={styles.hero}>
          <Image
            source={require('../../assets/taskhero.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>TaskHero</Text>
          <Text style={styles.tagline}>Where chores become adventures</Text>
        </Gradient>

        {/* White card form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parent Sign In</Text>
          <Text style={styles.cardSubtitle}>Sign in to manage your family</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                <Input
                  label="Password"
                  placeholder="Your password"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.button}
            />

          <View style={styles.footer}>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>No account? <Text style={styles.linkBold}>Create one</Text></Text>
              </TouchableOpacity>
            </Link>

            <Link href="/(auth)/child-login" asChild>
              <TouchableOpacity style={styles.childLoginButton}>
                <Text style={styles.childLoginText}>I'm a child →</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  appName: {
    fontFamily: fonts.extraBold,
    fontSize: 38,
    color: colors.white,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  cardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  button: {
    marginTop: spacing.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  link: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  linkBold: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  childLoginButton: {
    paddingVertical: spacing.sm,
  },
  childLoginText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.secondary,
  },
});
