/**
 * Onboarding · Step 3 · Name your creature.
 *
 * Pre-fills the species default name (Mossy / Lumi / Rocky). Validated
 * to 1–24 chars, letters / numbers / space / hyphen only. "Hatch your
 * creature →" advances to the hatch screen.
 */
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, fonts, borderRadius, shadows } from '@/theme';
import { Button } from '@/components/common';
import { SpeciesBadge } from '@/components/creature/SpeciesBadge';
import {
  CREATURE_NAME_MAX_LENGTH,
  CREATURE_NAME_REGEX,
  SPECIES_DEFAULTS,
} from '@/constants/species';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function NameScreen() {
  const selectedSpecies = useOnboardingStore((s) => s.selectedSpecies);
  const storedName = useOnboardingStore((s) => s.selectedName);
  const setName = useOnboardingStore((s) => s.setName);
  const meta = selectedSpecies ? SPECIES_DEFAULTS[selectedSpecies] : null;

  const [value, setValue] = useState<string>(storedName || meta?.defaultName || '');

  // If the user navigated here without picking a species, bounce them back.
  useEffect(() => {
    if (!selectedSpecies) {
      router.replace('/(child)/onboarding/species' as never);
    }
  }, [selectedSpecies]);

  const validation = useMemo(() => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return 'Give your creature a name.';
    if (trimmed.length > CREATURE_NAME_MAX_LENGTH) return 'Name is too long.';
    if (!CREATURE_NAME_REGEX.test(trimmed)) {
      return 'Letters, numbers, spaces, or hyphens only.';
    }
    return null;
  }, [value]);

  const handleContinue = () => {
    if (validation) return;
    setName(value.trim());
    router.push('/(child)/onboarding/hatch' as never);
  };

  if (!meta) return null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.eyebrow}>STEP 3 OF 4</Text>
          <Text style={styles.title}>Name your companion</Text>
          <Text style={styles.subtitle}>
            We've suggested a name — but the bond is yours, so the name is too.
          </Text>

          <View style={styles.badgeWrap}>
            <SpeciesBadge species={meta.species} stage="EGG" size={140} />
            <Text style={styles.speciesLabel}>{meta.displayName}</Text>
          </View>

          <Text style={styles.inputLabel}>Creature name</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={meta.defaultName}
            placeholderTextColor={colors.textTertiary}
            maxLength={CREATURE_NAME_MAX_LENGTH + 5}
            style={styles.input}
            autoCorrect={false}
            autoCapitalize="words"
            accessibilityLabel="Creature name"
          />
          <View style={styles.helperRow}>
            <Text style={[styles.helper, validation && styles.helperError]}>
              {validation ?? 'Letters, numbers, spaces, or hyphens · 1–24 chars.'}
            </Text>
            <Text style={styles.counter}>
              {value.trim().length}/{CREATURE_NAME_MAX_LENGTH}
            </Text>
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Hatch your creature →"
            onPress={handleContinue}
            disabled={!!validation}
            variant="primary"
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  badgeWrap: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  speciesLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  inputLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  helper: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  helperError: { color: colors.error },
  counter: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
