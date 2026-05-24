/**
 * Onboarding · Step 3 · Name your egg — Polish-B2.
 *
 * Parchment GradientBackdrop. Egg CreatureScene glows above a themed
 * TextInput. Trait Chip sits below the input. Amber Hatch CTA bottom.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CreatureScene } from '@/components/creature/CreatureScene';
import {
  CREATURE_NAME_MAX_LENGTH,
  CREATURE_NAME_REGEX,
  SPECIES_DEFAULTS,
} from '@/constants/species';
import { useOnboardingStore } from '@/stores/onboardingStore';
import {
  AnimatedPressable,
  Chip,
  Icon,
  PinDots,
  Typography,
  type IconName,
} from '@/components/ui';
import {
  borderRadius,
  colors,
  spacing,
  traitLabel,
  typographyTokens,
} from '@/theme';
import type { TraitCategory } from '@/api/creatures.api';

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

export default function NameScreen() {
  const selectedSpecies = useOnboardingStore((s) => s.selectedSpecies);
  const storedName = useOnboardingStore((s) => s.selectedName);
  const setName = useOnboardingStore((s) => s.setName);
  const meta = selectedSpecies ? SPECIES_DEFAULTS[selectedSpecies] : null;

  const [value, setValue] = useState<string>(storedName || meta?.defaultName || '');

  useEffect(() => {
    if (!selectedSpecies) {
      router.replace('/(child)/onboarding/species' as never);
    }
  }, [selectedSpecies]);

  const validation = useMemo(() => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return 'Give your egg a name.';
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
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Typography.Eyebrow tone="accent">Step 3 of 4</Typography.Eyebrow>
              <Typography.Display tone="onParchment" style={styles.title}>
                Name your egg
              </Typography.Display>
              <Typography.Body tone="onParchment" align="center" style={styles.subtitle}>
                The default name is a fine start — or pick the name that feels right.
              </Typography.Body>
            </View>

            <View style={styles.eggStage}>
              <CreatureScene
                species={meta.species}
                stage="EGG"
                emotion="HAPPY"
                size={160}
                showHabitat
                habitatVariant="subtle"
              />
            </View>

            <View style={styles.field}>
              <Typography.Caption emphasis tone="onParchment" style={styles.fieldLabel}>
                Egg name
              </Typography.Caption>
              <TextInput
                value={value}
                onChangeText={setValue}
                placeholder={meta.defaultName}
                placeholderTextColor={colors.parchmentDark}
                maxLength={CREATURE_NAME_MAX_LENGTH + 5}
                style={styles.input}
                autoCorrect={false}
                autoCapitalize="words"
                accessibilityLabel="Egg name"
              />
              <View style={styles.helperRow}>
                <Typography.Caption tone={validation ? 'error' : 'onParchment'}>
                  {validation ?? 'Letters, numbers, spaces, or hyphens · 1–24 chars.'}
                </Typography.Caption>
                <Typography.Caption emphasis tone="onParchment">
                  {value.trim().length}/{CREATURE_NAME_MAX_LENGTH}
                </Typography.Caption>
              </View>
            </View>

            <View style={styles.chipRow}>
              <Chip
                label={`Path of ${traitLabel(meta.trait)}`}
                tone={TRAIT_TONE[meta.trait]}
                icon={<Icon name={TRAIT_ICON[meta.trait]} size={12} color={colors.white} />}
              />
            </View>

            <View style={{ height: spacing.xl }} />
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.stepIndicator}>
              <PinDots filled={3} total={4} tone="onLight" size="sm" />
            </View>
            <AnimatedPressable
              onPress={handleContinue}
              disabled={!!validation}
              accessibilityRole="button"
              accessibilityLabel="Continue to hatch"
              style={[
                styles.cta,
                validation ? { opacity: 0.4 } : null,
              ] as any}
            >
              <Typography.Heading level={2} tone="primary" style={styles.ctaLabel}>
                Take me to hatching
              </Typography.Heading>
              <Icon name="chevronRight" size={20} color={colors.navyDeep} />
            </AnimatedPressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  header: { alignItems: 'flex-start', marginBottom: spacing.md },
  title: { marginTop: spacing.xs, fontSize: 28 },
  subtitle: { marginTop: spacing.xs, opacity: 0.85, textAlign: 'left' },

  eggStage: { alignItems: 'center', marginVertical: spacing.md },

  field: { marginTop: spacing.md },
  fieldLabel: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.creamSoft,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.parchmentDark,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: typographyTokens.heading2.fontFamily,
    fontSize: 20,
    color: colors.parchmentInk,
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(92, 64, 35, 0.12)',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 253, 249, 0.7)',
  },
  stepIndicator: { alignItems: 'center' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    backgroundColor: colors.amberDeep,
    borderRadius: borderRadius.pill,
  },
  ctaLabel: { fontSize: 17, color: colors.navyDeep },
});
