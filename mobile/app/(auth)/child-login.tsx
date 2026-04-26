import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { colors, spacing, typography } from '@/theme';

const childLoginSchema = z.object({
  familyCode: z.string().min(6, 'Family code is required').max(12),
  pin: z.string().min(4, 'PIN must be 4 digits').max(6),
});

type ChildLoginForm = z.infer<typeof childLoginSchema>;

export default function ChildLoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginChild } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<ChildLoginForm>({
    resolver: zodResolver(childLoginSchema),
    defaultValues: {
      familyCode: '',
      pin: '',
    },
  });

  const onSubmit = async (data: ChildLoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await loginChild(data.familyCode, data.pin);
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your family code and PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.emoji}>🦸</Text>
            <Text style={styles.title}>Hero Login</Text>
            <Text style={styles.subtitle}>Enter your family code and PIN</Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="familyCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Family Code"
                  placeholder="ABC123XY"
                  autoCapitalize="characters"
                  value={value}
                  onChangeText={(text) => onChange(text.toUpperCase())}
                  onBlur={onBlur}
                  error={errors.familyCode?.message}
                  style={styles.codeInput}
                />
              )}
            />

            <Controller
              control={control}
              name="pin"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Your PIN"
                  placeholder="••••"
                  keyboardType="number-pad"
                  maxLength={6}
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.pin?.message}
                  style={styles.pinInput}
                />
              )}
            />

            <Button
              title="Start Adventure! 🚀"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.button}
              variant="secondary"
            />
          </View>

          <View style={styles.footer}>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>I'm a parent → <Text style={styles.linkBold}>Parent Login</Text></Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>Need help?</Text>
            <Text style={styles.helpText}>
              Ask your parent for the family code and your personal PIN!
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.secondary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    marginBottom: spacing.xl,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    ...typography.bodySmall,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 4,
  },
  pinInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.lg,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    marginTop: spacing.md,
  },
  footer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  link: {
    ...typography.body,
    color: colors.textSecondary,
  },
  linkBold: {
    color: colors.primary,
    fontWeight: '600',
  },
  helpBox: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  helpTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  helpText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
