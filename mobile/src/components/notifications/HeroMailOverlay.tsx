/**
 * HeroMailOverlay — M5b.
 *
 * Modal-style celebration surfaced when a `hero_mail` notification lands
 * for the calling child. Mirrors the parent-side celebration card from
 * (parent)/approvals/[id].tsx, but read FROM the child's perspective:
 * it's the warm letter that closes the verify loop.
 *
 * Props:
 *   notification — full row from the polling response. Its `data` field
 *                  is read as HeroMailData (see notifications.api.ts).
 *   onDismiss    — called on Continue tap OR backdrop tap. The parent
 *                  layout is responsible for popping the queue and
 *                  marking the row read.
 *
 * Visual:
 *   - Backdrop: semi-transparent navy (rgba primary 0.55).
 *   - Card: cream panel, ribbon-style "Hero Mail" header, parchment
 *     parent message, awards chips, optional care/evolution/reward
 *     banners, amber Continue CTA.
 *   - Entrance animation: scale 0.85 → 1.0 + opacity 0 → 1 over 250ms.
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  borderRadius,
  colors,
  fonts,
  shadows,
  spacing,
  traitColor,
  traitLabel,
} from '@/theme';
import type {
  CreatureSpecies,
  EvolutionStage,
  HeroMailData,
  NotificationRow,
} from '@/api';
import { SpeciesBadge } from '@/components/creature/SpeciesBadge';

interface HeroMailOverlayProps {
  notification: NotificationRow;
  onDismiss: () => void;
  /** The species of the calling child's creature — needed to render the inline
   * old→new evolution preview sprites. Optional because the overlay can still
   * render its other banners without it. */
  creatureSpecies?: CreatureSpecies;
  /** The stage BEFORE this verification, so the banner can show old→new. If
   * unknown we infer the prior stage from the new one (best-effort). */
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

export function HeroMailOverlay({
  notification,
  onDismiss,
  creatureSpecies,
  previousStage,
}: HeroMailOverlayProps) {
  const data = parseHeroMailData(notification.data);

  // Entrance animation
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  // Inline evolution preview pulse (loops while overlay is open)
  const evolvePulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    if (data?.evolutionStage) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(evolvePulse, {
            toValue: 1.08,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(evolvePulse, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    return undefined;
  }, [scale, opacity, evolvePulse, notification.id, data?.evolutionStage]);

  /** Dismiss the overlay, then route to the Hub so the full evolution animation
   * can play (Hub picks up the stage change via the previous-value ref). */
  const handleSeeCreature = () => {
    onDismiss();
    // Defer the route push so the modal close animation can run first.
    setTimeout(() => {
      router.push('/(child)' as never);
    }, 50);
  };

  if (!data) {
    // Defensive: if data is malformed, still let the user dismiss.
    return (
      <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
        <Pressable style={styles.backdrop} onPress={onDismiss}>
          <View style={styles.card}>
            <Text style={styles.fallbackTxt}>{notification.title}</Text>
            <Text style={styles.fallbackBody}>{notification.body}</Text>
            <TouchableOpacity style={styles.cta} onPress={onDismiss}>
              <Text style={styles.ctaTxt}>Continue ✨</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    );
  }

  const tColor = traitColor(data.traitCategory);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        {/* Stop-propagation on the card itself so taps inside don't dismiss */}
        <Pressable onPress={() => {}}>
          <Animated.View
            style={[
              styles.card,
              { transform: [{ scale }], opacity },
            ]}
          >
            {/* Ribbon */}
            <View style={styles.ribbon}>
              <Ionicons name="mail" size={16} color={colors.primary} />
              <Text style={styles.ribbonTxt}>Hero Mail</Text>
            </View>

            <Text style={styles.missionEyebrow}>
              After: <Text style={styles.missionEyebrowItalic}>{data.missionTitle}</Text>
            </Text>

            {/* Parent message — parchment style */}
            <View style={styles.parchment}>
              <Text style={styles.parchmentQuote}>
                “{data.parentMessage ?? notification.body}”
              </Text>
            </View>

            {/* Awards row */}
            <View style={styles.awardsRow}>
              <View style={[styles.awardChip, { borderColor: colors.accent }]}>
                <Ionicons name="star" size={14} color={colors.accent} />
                <Text style={styles.awardChipTxt}>+{data.xpAwarded} XP</Text>
              </View>
              <View style={[styles.awardChip, { borderColor: colors.accent }]}>
                <Ionicons name="logo-bitcoin" size={14} color={colors.accent} />
                <Text style={styles.awardChipTxt}>+{data.coinsAwarded}</Text>
              </View>
              <View
                style={[
                  styles.awardChip,
                  { borderColor: tColor, backgroundColor: tColor + '15' },
                ]}
              >
                <View style={[styles.traitDot, { backgroundColor: tColor }]} />
                <Text style={[styles.awardChipTxt, { color: tColor }]}>
                  {traitLabel(data.traitCategory)} +1
                </Text>
              </View>
            </View>

            {/* Care item callout */}
            {data.careItemId && (
              <View style={[styles.banner, styles.bannerCare]}>
                <Ionicons name="sparkles" size={16} color={colors.accent} />
                <Text style={styles.bannerTxt}>
                  You earned{' '}
                  <Text style={styles.bannerStrong}>
                    {data.careItemName.replace(/_/g, ' ')}
                  </Text>
                  {' '}— feed your creature!
                </Text>
              </View>
            )}

            {/* Evolution highlight — inline old→new preview + CTA */}
            {data.evolutionStage && (
              <View style={styles.evolveBlock}>
                <View style={styles.evolveHeaderRow}>
                  <Ionicons name="flash" size={16} color={colors.accent} />
                  <Text style={styles.evolveHeader}>
                    Your creature evolved into{' '}
                    <Text style={styles.bannerStrong}>{data.evolutionStage}!</Text>
                  </Text>
                </View>

                {creatureSpecies && (
                  <Animated.View
                    style={[
                      styles.evolveSpritesRow,
                      { transform: [{ scale: evolvePulse }] },
                    ]}
                  >
                    <View style={styles.evolveSpriteCol}>
                      <SpeciesBadge
                        species={creatureSpecies}
                        stage={previousStage ?? PRIOR_STAGE[data.evolutionStage]}
                        size={64}
                      />
                      <Text style={styles.evolveSpriteLabel}>
                        {previousStage ?? PRIOR_STAGE[data.evolutionStage]}
                      </Text>
                    </View>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={colors.accent}
                      style={{ marginHorizontal: spacing.sm }}
                    />
                    <View style={styles.evolveSpriteCol}>
                      <SpeciesBadge
                        species={creatureSpecies}
                        stage={data.evolutionStage}
                        size={80}
                      />
                      <Text style={[styles.evolveSpriteLabel, styles.evolveSpriteLabelNew]}>
                        {data.evolutionStage}
                      </Text>
                    </View>
                  </Animated.View>
                )}

                <TouchableOpacity
                  onPress={handleSeeCreature}
                  style={styles.evolveCta}
                  activeOpacity={0.85}
                >
                  <Text style={styles.evolveCtaTxt}>See your creature →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Reward unlock */}
            {data.rewardUnlockedId && (
              <View style={[styles.banner, styles.bannerReward]}>
                <Text style={styles.bannerTxt}>
                  🎉 <Text style={styles.bannerStrong}>Reward unlocked!</Text>
                </Text>
              </View>
            )}

            {/* CTA */}
            <TouchableOpacity style={styles.cta} onPress={onDismiss} activeOpacity={0.9}>
              <Text style={styles.ctaTxt}>Continue your journey ✨</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 61, 0.65)', // navyDeep alpha
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.background, // cream
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'stretch',
    ...shadows.lg,
  },

  // Ribbon
  ribbon: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
    marginTop: -spacing.lg - 4,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  ribbonTxt: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    letterSpacing: 1.2,
    color: colors.primary,
  },

  missionEyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  missionEyebrowItalic: {
    fontFamily: fonts.semiBold,
    fontStyle: 'italic',
    color: colors.primary,
  },

  parchment: {
    backgroundColor: '#F4E4C1',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#D8C396',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  parchmentQuote: {
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 26,
    color: '#5A3F12',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  awardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  awardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  awardChipTxt: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  traitDot: { width: 8, height: 8, borderRadius: 4 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  bannerCare: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  bannerEvolve: {
    backgroundColor: colors.warningLight,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  bannerEvolveTxt: { fontFamily: fonts.bold },

  // Evolution block (banner upgraded with inline old→new sprites + CTA)
  evolveBlock: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  evolveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  evolveHeader: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 19,
  },
  evolveSpritesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  evolveSpriteCol: { alignItems: 'center' },
  evolveSpriteLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginTop: 4,
  },
  evolveSpriteLabelNew: { color: colors.primary },
  evolveCta: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  evolveCtaTxt: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.accent,
    letterSpacing: 0.5,
  },
  bannerReward: {
    backgroundColor: '#FFF5DC',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  bannerTxt: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 19,
  },
  bannerStrong: {
    fontFamily: fonts.extraBold,
    color: colors.primary,
    textTransform: 'capitalize',
  },

  cta: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.xs,
    ...shadows.md,
  },
  ctaTxt: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: colors.primary,
  },

  fallbackTxt: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  fallbackBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
