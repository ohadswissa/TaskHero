/**
 * Onboarding · Step 2 · Species selection — Polish-B2.
 *
 * Three species cards. Each card is a Surface(card) containing:
 *   - CreatureScene (ADOLESCENT stage in habitat) — previews who this
 *     companion will grow into.
 *   - Heading level 1 species name.
 *   - Body emphasis personality blurb.
 *   - Trait Chip (Path of …) with matching icon.
 *   - Subtle "Choose" footer or amber ring when selected.
 *
 * "Continue" button at bottom — disabled until a card is picked.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { CreatureScene } from '@/components/creature/CreatureScene';
import { ALL_SPECIES, SPECIES_DEFAULTS } from '@/constants/species';
import { useOnboardingStore } from '@/stores/onboardingStore';
import {
  AnimatedPressable,
  Chip,
  Icon,
  PinDots,
  Surface,
  Typography,
  type IconName,
} from '@/components/ui';
import {
  borderRadius,
  colors,
  spacing,
  traitColor,
  traitLabel,
} from '@/theme';
import type { CreatureSpecies, TraitCategory } from '@/api/creatures.api';

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

export default function SpeciesScreen() {
  const selectedSpecies = useOnboardingStore((s) => s.selectedSpecies);
  const setSpecies = useOnboardingStore((s) => s.setSpecies);

  const choose = (sp: CreatureSpecies) => setSpecies(sp);
  const handleContinue = () => {
    if (!selectedSpecies) return;
    router.push('/(child)/onboarding/name' as never);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Typography.Eyebrow tone="accent">Step 2 of 4</Typography.Eyebrow>
            <Typography.Display tone="onParchment" style={styles.title}>
              Choose your companion
            </Typography.Display>
            <Typography.Body tone="onParchment" style={styles.subtitle}>
              Each egg holds a different soul. Listen — which one calls to you?
            </Typography.Body>
          </View>

          {ALL_SPECIES.map((sp) => (
            <SpeciesCard
              key={sp}
              species={sp}
              selected={sp === selectedSpecies}
              onPress={() => choose(sp)}
            />
          ))}

          <View style={{ height: spacing.xl }} />
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.stepIndicator}>
            <PinDots filled={2} total={4} tone="onLight" size="sm" />
          </View>
          <AnimatedPressable
            onPress={handleContinue}
            disabled={!selectedSpecies}
            accessibilityRole="button"
            accessibilityLabel="Continue with selected companion"
            style={[
              styles.cta,
              !selectedSpecies ? { opacity: 0.4 } : null,
            ] as any}
          >
            <Typography.Heading level={2} tone="primary" style={styles.ctaLabel}>
              {selectedSpecies
                ? `Continue with ${SPECIES_DEFAULTS[selectedSpecies].displayName}`
                : 'Pick a companion'}
            </Typography.Heading>
            {selectedSpecies && <Icon name="chevronRight" size={20} color={colors.navyDeep} />}
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function SpeciesCard({
  species,
  selected,
  onPress,
}: {
  species: CreatureSpecies;
  selected: boolean;
  onPress: () => void;
}) {
  const meta = SPECIES_DEFAULTS[species];
  const ring = useSharedValue(selected ? 1 : 0);
  React.useEffect(() => {
    ring.value = withSpring(selected ? 1 : 0, { stiffness: 200, damping: 16 });
  }, [selected, ring]);
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ring.value * 0.02 }],
  }));

  return (
    <Animated.View style={[styles.cardWrap, ringStyle]}>
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Choose ${meta.displayName}`}
        accessibilityState={{ selected }}
        haptic="medium"
      >
        <Surface
          variant="card"
          radius="xl"
          padding="lg"
          shadow={selected ? 'cardHover' : 'card'}
          style={[
            styles.card,
            selected ? { borderColor: colors.amberDeep, borderWidth: 2 } : null,
          ] as any}
        >
          <View style={styles.cardTop}>
            <CreatureScene
              species={species}
              stage="ADOLESCENT"
              emotion="HAPPY"
              size={120}
              showHabitat
              habitatVariant="subtle"
            />
          </View>
          <Typography.Heading level={1} align="center" tone="primary">
            {meta.displayName}
          </Typography.Heading>
          <Typography.Body
            emphasis
            tone="secondary"
            align="center"
            style={styles.personality}
          >
            {meta.personality}
          </Typography.Body>
          <View style={styles.chipRow}>
            <Chip
              label={`Path of ${traitLabel(meta.trait)}`}
              tone={TRAIT_TONE[meta.trait]}
              icon={
                <Icon
                  name={TRAIT_ICON[meta.trait]}
                  size={12}
                  color={colors.white}
                />
              }
            />
          </View>
          <Typography.Caption tone="secondary" align="center" style={styles.tap}>
            {selected ? '✓ Chosen' : 'Tap to choose'}
          </Typography.Caption>
        </Surface>
      </AnimatedPressable>
      {selected && (
        <View pointerEvents="none" style={styles.selectedBadge}>
          <Icon name="checkCircle" size={22} color={colors.amberDeep} />
        </View>
      )}
      {/* trait color marker — quiet visual cue */}
      <View
        pointerEvents="none"
        style={[
          styles.traitStripe,
          { backgroundColor: traitColor(meta.trait) },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  header: { marginBottom: spacing.lg },
  title: { marginTop: spacing.xs, fontSize: 28 },
  subtitle: { marginTop: spacing.xs, opacity: 0.85 },

  cardWrap: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  card: { overflow: 'visible' },
  cardTop: { alignItems: 'center', marginBottom: spacing.sm },
  personality: { marginTop: 2, marginBottom: spacing.sm },
  chipRow: { alignItems: 'center', marginTop: 4 },
  tap: { marginTop: spacing.sm, opacity: 0.7 },

  selectedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  traitStripe: {
    position: 'absolute',
    left: 0,
    top: 24,
    bottom: 24,
    width: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    opacity: 0.6,
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(27, 42, 78, 0.08)',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 253, 249, 0.85)',
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
