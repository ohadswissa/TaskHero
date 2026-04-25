import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, Image } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Gradient } from '@/components/common/Gradient';
import { colors, spacing, gradients, borderRadius, fonts } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, delay: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, delay: 400, useNativeDriver: true }),
    ]).start();
  }, []);

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
        {/* Gradient hero with floating particles effect */}
        <View style={styles.heroWrapper}>
          <Gradient
            colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
            style={styles.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Perspective patterns */}
            <View style={styles.heroBgPatterns}>
              <View style={[styles.heroFloatingShape, { top: -20, left: -20, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)' }]} />
              <View style={[styles.heroFloatingShape, { bottom: 40, right: -40, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.05)' }]} />
              <View style={[styles.heroFloatingShape, { top: 100, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)' }]} />
            </View>

            <View style={styles.heroMainContent}>
              <Animated.View style={[styles.logoStage, { transform: [{ scale: logoScale }] }]}>
                {/* Large transparent logo with subtle glow behind it for depth */}
                <View style={styles.logoGlowBehind} />
                <Image
                  source={require('../../assets/taskhero.png')}
                  style={styles.logoFull}
                  resizeMode="contain"
                />
              </Animated.View>

            </View>
          </Gradient>
          {/* Professional transition curve */}
          <View style={styles.heroCurveMask} />
        </View>

        {/* White card form */}
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <Text style={styles.cardTitle}>Welcome Back 👋</Text>
          <Text style={styles.cardSubtitle}>Sign in to manage your family's adventures</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
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

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Link href="/(auth)/child-login" asChild>
            <TouchableOpacity style={styles.childLoginButton}>
              <Gradient colors={['#F59E0B', '#EF4444']} style={styles.childLoginGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.childLoginEmoji}>🦸</Text>
                <Text style={styles.childLoginText} numberOfLines={1}>I'm a Hero (Kid Login)</Text>
                <View style={styles.childLoginIconBox}>
                  <Ionicons name="arrow-forward" size={14} color={colors.white} />
                </View>
              </Gradient>
            </TouchableOpacity>
          </Link>

          <View style={styles.footer}>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Create Family</Text></Text>
              </TouchableOpacity>
            </Link>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
  },
  heroWrapper: {
    height: 480,
    position: 'relative',
  },
  hero: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroBgPatterns: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  heroFloatingShape: {
    position: 'absolute',
  },
  heroMainContent: {
    alignItems: 'center',
    zIndex: 10,
    width: '100%',
  },
  logoStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFull: {
    width: 380,
    height: 380,
    zIndex: 2,
  },
  logoGlowBehind: {
    position: 'absolute',
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
    filter: 'blur(40px)', // Note: standard RN doesn't support 'filter', but we can use shadow hacks if needed
    opacity: 0.3,
    zIndex: 1,
  },
  textStage: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  brandName: {
    fontSize: 48,
    fontFamily: fonts.extraBold,
    color: '#FFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  taglineText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: fonts.regular,
  },
  featurePills: {
    flexDirection: 'row',
    marginTop: 25,
    gap: 10,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureEmoji: {
    fontSize: 14,
  },
  featureText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  heroCurveMask: {
    position: 'absolute',
    bottom: -1,
    width: '100%',
    height: 60,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  cardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontFamily: fonts.regular,
    fontSize: 14,
    flex: 1,
  },
  button: {
    marginTop: spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textTertiary,
    marginHorizontal: spacing.md,
  },
  childLoginButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  childLoginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  childLoginIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childLoginEmoji: {
    fontSize: 20,
  },
  childLoginText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
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
});
