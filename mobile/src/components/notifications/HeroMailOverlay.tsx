/**
 * HeroMailOverlay — M5b (Polish-B3 rebuild).
 *
 * Modal-style celebration surfaced when a `hero_mail` notification lands
 * for the calling child. Functional wiring is unchanged:
 *
 *   Props:
 *     notification     — full row from the polling response. `data` is
 *                        read as HeroMailData.
 *     onDismiss        — called on Continue / backdrop tap. The parent
 *                        layout pops the queue and marks the row read.
 *     creatureSpecies  — used for the inline old→new sprite preview.
 *     previousStage    — best-effort prior-stage hint.
 *
 * Polish-B3 swaps the visual chrome:
 *   - Outer backdrop: `<GradientBackdrop variant="navy" intensity="rich">`
 *     with a translucent navy scrim for legibility.
 *   - Container: `<MailScroll>` with title, awards Chip header, italic
 *     Scroll body, conditional Banners (care item / evolution / reward),
 *     sprite preview Surface, and a footer-slot Continue CTA.
 *   - `<CelebrationBurst>` overlays when evolution or reward callouts
 *     are present.
 */
import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { borderRadius, colors, spacing, traitColor, traitLabel } from '@/theme';
import type {
  CreatureSpecies,
  EvolutionStage,
  HeroMailData,
  NotificationRow,
} from '@/api';
import { SpeciesBadge } from '@/components/creature/SpeciesBadge';
import {
  AnimatedPressable,
  Banner,
  CelebrationBurst,
  Chip,
  GradientBackdrop,
  Icon,
  MailScroll,
  Surface,
  Typography,
} from '@/components/ui';

interface HeroMailOverlayProps {
  notification: NotificationRow;
  onDismiss: () => void;
  /** Species of the calling child's creature — needed to render the inline
   *  old→new evolution preview sprites. Optional. */
  creatureSpecies?: CreatureSpecies;
  /** Stage BEFORE this verification, so the preview can show old→new. If
   *  unknown the overlay infers the prior stage from the new one. */
  previousStage?: EvolutionStage;
}

const PRIOR_STAGE: Record<EvolutionStage, EvolutionStage> = {
  EGG: 'EGG',
  BABY: 'EGG',
  ADOLESCENT: 'BABY',
  ADULT: 'ADOLESCENT',
};

function parseHeroMailData(raw: unknown): HeroMailData | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as HeroMailData;
}

function chipToneForTrait(
  t: string | null | undefined,
): 'strength' | 'wisdom' | 'heart' | 'neutral' {
  switch (t) {
    case 'STRENGTH':
      return 'strength';
    case 'WISDOM':
      return 'wisdom';
    case 'HEART':
      return 'heart';
    default:
      return 'neutral';
  }
}

export function HeroMailOverlay({
  notification,
  onDismiss,
  creatureSpecies,
  previousStage,
}: HeroMailOverlayProps) {
  const data = parseHeroMailData(notification.data);

  // Entrance animation (Reanimated v3).
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 260 });
  }, [scale, opacity, notification.id]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  /** Dismiss the overlay, then route to the Hub so the full evolution
   *  animation can play (Hub picks up the stage change via prev-ref). */
  const handleSeeCreature = () => {
    onDismiss();
    setTimeout(() => {
      router.push('/(child)' as never);
    }, 50);
  };

  if (!data) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
        <Pressable
          style={styles.backdrop}
          onPress={onDismiss}
          accessibilityLabel="Dismiss hero mail"
        >
          <View style={styles.fallback}>
            <Surface variant="parchment" padding="lg" radius="lg">
              <Typography.Heading level={2} align="center" tone="onParchment">
                {notification.title}
              </Typography.Heading>
              <Typography.Body align="center" tone="onParchment">
                {notification.body}
              </Typography.Body>
              <AnimatedPressable
                onPress={onDismiss}
                accessibilityLabel="Acknowledge Hero Mail and continue"
                style={styles.fallbackCta}
              >
                <Typography.Body tone="onNavy" align="center">
                  Continue ✨
                </Typography.Body>
              </AnimatedPressable>
            </Surface>
          </View>
        </Pressable>
      </Modal>
    );
  }

  const careItemPresent = !!data.careItemId;
  const evolutionPresent = !!data.evolutionStage;
  const rewardPresent = !!data.rewardUnlockedId;
  const burstActive = evolutionPresent || rewardPresent;

  // ---------------- MailScroll slots ----------------
  const awardsHeader = (
    <View style={styles.awardsRow}>
      <Chip label={`+${data.xpAwarded} XP`} tone="accent" size="md" />
      <Chip label={`+${data.coinsAwarded} coins`} tone="warning" size="md" />
      <Chip
        label={`${traitLabel(data.traitCategory)} +1`}
        tone={chipToneForTrait(data.traitCategory)}
        size="md"
        icon={
          <View
            style={[
              styles.traitDot,
              { backgroundColor: traitColor(data.traitCategory) },
            ]}
          />
        }
      />
    </View>
  );

  const body = (
    <View>
      <Typography.Scroll tone="onParchment" align="center">
        “{data.parentMessage ?? notification.body}”
      </Typography.Scroll>

      {careItemPresent && (
        <View style={styles.bannerSlot}>
          <Banner
            tone="info"
            icon="sparkle"
            message={`You earned ${data.careItemName.replace(/_/g, ' ')} — feed your creature!`}
          />
        </View>
      )}

      {evolutionPresent && (
        <View style={styles.bannerSlot}>
          <Banner
            tone="success"
            icon="sparkle"
            message={`Your creature evolved into ${data.evolutionStage}!`}
          />
        </View>
      )}

      {rewardPresent && (
        <View style={styles.bannerSlot}>
          <Banner
            tone="warning"
            icon="crown"
            message={`🎉 Reward unlocked!`}
          />
        </View>
      )}

      {/* Old → New sprite preview */}
      {evolutionPresent && creatureSpecies && data.evolutionStage && (
        <View style={styles.spritesRow}>
          <Surface variant="card" padding="sm" radius="md" style={styles.spriteCard}>
            <SpeciesBadge
              species={creatureSpecies}
              stage={previousStage ?? PRIOR_STAGE[data.evolutionStage]}
              size={56}
            />
            <Typography.Caption tone="secondary" align="center">
              {previousStage ?? PRIOR_STAGE[data.evolutionStage]}
            </Typography.Caption>
          </Surface>
          <Icon
            name="chevronRight"
            size={20}
            color={colors.accent}
            style={styles.spritesArrow as any}
          />
          <Surface variant="card" padding="sm" radius="md" style={styles.spriteCard}>
            <SpeciesBadge
              species={creatureSpecies}
              stage={data.evolutionStage}
              size={72}
            />
            <Typography.Caption tone="primary" align="center">
              {data.evolutionStage}
            </Typography.Caption>
          </Surface>
        </View>
      )}

      {evolutionPresent && (
        <AnimatedPressable
          onPress={handleSeeCreature}
          accessibilityLabel="See your creature"
          accessibilityRole="button"
          style={styles.seeCreatureCta}
        >
          <Typography.Body tone="onNavy" align="center">
            See your creature →
          </Typography.Body>
        </AnimatedPressable>
      )}
    </View>
  );

  const footer = (
    <AnimatedPressable
      onPress={onDismiss}
      accessibilityLabel="Acknowledge Hero Mail and continue"
      accessibilityRole="button"
      style={styles.cta}
    >
      <Typography.Body tone="onNavy" align="center">
        Continue your journey ✨
      </Typography.Body>
    </AnimatedPressable>
  );

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <GradientBackdrop variant="navy" intensity="rich" style={styles.fill}>
        {/* Navy scrim for parchment legibility */}
        <View style={styles.scrim} pointerEvents="none" />

        {/* Celebration burst — only when evolution/reward present */}
        <View
          pointerEvents="none"
          importantForAccessibility="no"
          style={StyleSheet.absoluteFill}
        >
          <CelebrationBurst active={burstActive} intensity="rich" />
        </View>

        <Pressable
          style={styles.fill}
          onPress={onDismiss}
          accessibilityLabel="Dismiss hero mail"
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Stop-propagation: taps inside the scroll shouldn't dismiss. */}
            <Pressable onPress={() => {}}>
              <Animated.View style={[styles.cardWrap, cardStyle]}>
                <MailScroll
                  title={`After: ${data.missionTitle}`}
                  header={awardsHeader}
                  body={body}
                  footer={footer}
                />
              </Animated.View>
            </Pressable>
          </ScrollView>
        </Pressable>
      </GradientBackdrop>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,26,51,0.65)',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 420,
  },

  awardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  traitDot: { width: 8, height: 8, borderRadius: 4 },

  bannerSlot: { marginTop: spacing.sm },

  spritesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  spriteCard: { alignItems: 'center', gap: 4 },
  spritesArrow: { marginHorizontal: spacing.xs },

  seeCreatureCta: {
    marginTop: spacing.md,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },

  cta: {
    alignSelf: 'stretch',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
  },

  // Fallback (malformed data) styles
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 61, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  fallback: {
    width: '100%',
    maxWidth: 420,
  },
  fallbackCta: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
  },
});
