/**
 * Onboarding · Step 2 · Species selection.
 *
 * Three species cards (Forest Pup / Sky Sprite / Stone Cub). Selecting
 * highlights the card with an amber ring and stores the choice in the
 * onboarding store. "Continue" is disabled until a card is picked.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, fonts, borderRadius, shadows, traitColor, traitLabel } from '@/theme';
import { Button } from '@/components/common';
import { ALL_SPECIES, SPECIES_DEFAULTS } from '@/constants/species';
import { SpeciesBadge } from '@/components/creature/SpeciesBadge';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { CreatureSpecies } from '@/api/creatures.api';

export default function SpeciesScreen() {
  const selectedSpecies = useOnboardingStore((s) => s.selectedSpecies);
  const setSpecies = useOnboardingStore((s) => s.setSpecies);

  const choose = (sp: CreatureSpecies) => setSpecies(sp);
  const handleContinue = () => {
    if (!selectedSpecies) return;
    router.push('/(child)/onboarding/name' as never);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>STEP 2 OF 4</Text>
        <Text style={styles.title}>Choose your companion</Text>
        <Text style={styles.subtitle}>
          Each egg holds a different soul. Listen — which one calls to you?
        </Text>

        {ALL_SPECIES.map((sp) => {
          const meta = SPECIES_DEFAULTS[sp];
          const selected = sp === selectedSpecies;
          return (
            <TouchableOpacity
              key={sp}
              activeOpacity={0.85}
              onPress={() => choose(sp)}
              style={[
                styles.card,
                selected && styles.cardSelected,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <SpeciesBadge species={sp} stage="BABY" size={96} />
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{meta.displayName}</Text>
                <Text style={styles.cardPersonality}>{meta.personality}</Text>
                <View
                  style={[
                    styles.traitTag,
                    { backgroundColor: `${traitColor(meta.trait)}1A`, borderColor: traitColor(meta.trait) },
                  ]}
                >
                  <Text style={[styles.traitTagTxt, { color: traitColor(meta.trait) }]}>
                    the path of {traitLabel(meta.trait)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={selectedSpecies ? `Continue with ${SPECIES_DEFAULTS[selectedSpecies].displayName} →` : 'Pick a companion'}
          onPress={handleContinue}
          disabled={!selectedSpecies}
          variant="primary"
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.lg },
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.accent,
    ...shadows.md,
  },
  cardBody: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardName: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.primary,
  },
  cardPersonality: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  traitTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  traitTagTxt: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
