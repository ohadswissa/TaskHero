/**
 * RewardCelebration — M7a shared celebration overlay (Polish-B3 rebuild).
 *
 * Public API (`visible`, `rewardName`, `emoji?`, `onDismiss`) and the dismiss
 * timing window are preserved. The chrome is rebuilt against the Polish-B3
 * design system:
 *
 *   - Outer container: `GradientBackdrop variant="celebration" intensity="rich"`.
 *   - Center icon: large reward emoji (if provided/derived) overlaid with a
 *     fallback `<Icon name="crown" />` glyph at 120px, animated with a
 *     Reanimated v3 scale 0 → 1.3 → 1 + 0deg → 360deg rotate over ~600ms.
 *   - Burst: `<CelebrationBurst active intensity="rich" />` with a
 *     multi-color amber / violet / cyan palette.
 *   - Card: parchment Surface with Display headline + Body subline.
 *   - CTA: amber AnimatedPressable pill that calls `onDismiss`.
 *
 * Reused by Child Hub and Parent Rewards. Tap-to-dismiss flow is unchanged.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { borderRadius, colors, spacing } from '@/theme';
import {
  AnimatedPressable,
  CelebrationBurst,
  GradientBackdrop,
  Icon,
  Surface,
  Typography,
} from '@/components/ui';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface RewardCelebrationProps {
  visible: boolean;
  rewardName: string;
  /** Optional explicit emoji; falls back to deriving from name. */
  emoji?: string;
  onDismiss: () => void;
}

/**
 * Map a reward name to a single representative emoji. Crude but effective —
 * the parent rewards seed templates ("Pizza night", "New book", etc.) cover
 * the common cases; everything else gets the generic gift 🎁.
 */
export function rewardEmoji(name: string): string {
  const n = name.toLowerCase();
  if (/pizza/.test(n)) return '🍕';
  if (/movie|screen|tv/.test(n)) return '🎬';
  if (/book|reading/.test(n)) return '📚';
  if (/park|playground|outside|outdoor/.test(n)) return '🌳';
  if (/ice ?cream|sweet|candy|treat/.test(n)) return '🍦';
  if (/game|arcade/.test(n)) return '🎮';
  if (/cake|birthday/.test(n)) return '🎂';
  return '🎁';
}

export function RewardCelebration({
  visible,
  rewardName,
  emoji,
  onDismiss,
}: RewardCelebrationProps) {
  // Reanimated v3 drives the icon scale + rotation.
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const cardScale = useSharedValue(0);
  const hintOpacity = useSharedValue(0);

  const [canDismiss, setCanDismiss] = useState(false);
  const closingRef = useRef(false);

  const burstPalette = useMemo(
    () => [colors.accent, colors.magicViolet, colors.magicCyan],
    [],
  );

  const glyph = emoji ?? rewardEmoji(rewardName);

  useEffect(() => {
    if (!visible) {
      iconScale.value = 0;
      iconRotate.value = 0;
      cardScale.value = 0;
      hintOpacity.value = 0;
      setCanDismiss(false);
      closingRef.current = false;
      return;
    }

    // Icon: 0 → 1.3 → 1 over ~600ms, with simultaneous 0 → 360deg rotation.
    iconScale.value = withSequence(
      withTiming(1.3, { duration: 400, easing: Easing.out(Easing.back(1.8)) }),
      withTiming(1, { duration: 200 }),
    );
    iconRotate.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    // Card pops in after the icon settles.
    cardScale.value = withSequence(
      withTiming(0, { duration: 300 }),
      withTiming(1, { duration: 280, easing: Easing.out(Easing.back(1.4)) }),
    );

    hintOpacity.value = withTiming(1, { duration: 600 });

    // Allow dismiss after a minimum hold so the user has time to enjoy it.
    const earlyDismissTimer = setTimeout(() => setCanDismiss(true), 1800);
    return () => clearTimeout(earlyDismissTimer);
  }, [visible, iconScale, iconRotate, cardScale, hintOpacity]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotateZ: `${iconRotate.value * 360}deg` },
    ],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));
  const hintStyle = useAnimatedStyle(() => ({ opacity: hintOpacity.value }));

  const handlePress = () => {
    if (!canDismiss || closingRef.current) {
      // Allow tap to fast-forward to dismissable state.
      setCanDismiss(true);
      return;
    }
    closingRef.current = true;
    onDismiss();
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handlePress}>
      <Pressable
        style={styles.fill}
        onPress={handlePress}
        accessibilityLabel="Close reward celebration"
      >
        <GradientBackdrop variant="celebration" intensity="rich" style={styles.fill}>
          {/* Rich multi-color burst */}
          <View
            pointerEvents="none"
            importantForAccessibility="no"
            style={StyleSheet.absoluteFill}
          >
            <CelebrationBurst
              active={visible}
              intensity="rich"
              colors={burstPalette}
              spread={240}
            />
          </View>

          {/* Center icon — emoji on top of a faint crown ring */}
          <Animated.View
            style={[styles.iconWrap, iconStyle]}
            importantForAccessibility="no"
          >
            <Icon name="crown" size={120} color={colors.cream} />
            <Animated.Text style={styles.emoji}>{glyph}</Animated.Text>
          </Animated.View>

          {/* Parchment card */}
          <Animated.View style={[styles.cardWrap, cardStyle]}>
            <Surface
              variant="parchment"
              padding="lg"
              shadow="parchment"
              radius="xl"
            >
              <Typography.Display align="center" tone="onParchment">
                Reward redeemed!
              </Typography.Display>
              <Typography.Body
                align="center"
                tone="secondary"
                style={styles.subline}
              >
                Enjoy your {rewardName}.
              </Typography.Body>

              <AnimatedPressable
                onPress={handlePress}
                accessibilityLabel="Close reward celebration"
                accessibilityRole="button"
                style={styles.cta}
              >
                <Typography.Body tone="onNavy" align="center">
                  Continue
                </Typography.Body>
              </AnimatedPressable>
            </Surface>
          </Animated.View>

          <Animated.View style={[styles.tapHintWrap, hintStyle]}>
            <Typography.Caption tone="onNavy" align="center">
              tap to dismiss
            </Typography.Caption>
          </Animated.View>
        </GradientBackdrop>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  iconWrap: {
    position: 'absolute',
    top: SCREEN_H / 2 - 160,
    alignSelf: 'center',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    position: 'absolute',
    fontSize: 84,
  },
  cardWrap: {
    position: 'absolute',
    top: SCREEN_H / 2 + 30,
    alignSelf: 'center',
    width: SCREEN_W - spacing.xl * 2,
    maxWidth: 420,
  },
  subline: { marginTop: spacing.xs },
  cta: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    minWidth: 160,
  },
  tapHintWrap: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
