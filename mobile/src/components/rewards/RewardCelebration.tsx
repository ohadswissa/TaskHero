/**
 * RewardCelebration — M7a shared celebration overlay.
 *
 * Plays a full-screen animation when a reward is redeemed. Reused by:
 *   - Child Hub (mobile/app/(child)/index.tsx)         → after `Tap to redeem`
 *   - Parent rewards (mobile/app/(parent)/rewards.tsx) → after `Mark redeemed`
 *
 * Sequence (~2.5s):
 *   0-300ms     Amber gradient backdrop fades in
 *   200-1100ms  Reward emoji scales 0 → 1.3 → 1.0 with full 360° spin
 *   400-2500ms  10–12 confetti emoji rain down with staggered start +
 *               random X positions
 *   600-1200ms  Parchment text card scales 0 → 1 (spring)
 *   2500ms      "Tap to dismiss" hint appears; tap anywhere closes.
 *
 * Tap anywhere skips remaining intro animation and unlocks dismiss.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { borderRadius, colors, fonts, shadows, spacing } from '@/theme';

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

const CONFETTI_GLYPHS = ['🎉', '✨', '💫', '🎊', '⭐'];
const CONFETTI_COUNT = 12;

interface ConfettiSpec {
  glyph: string;
  startX: number; // 0..1
  delay: number;
  duration: number;
  size: number;
  rotateDirection: 1 | -1;
}

function generateConfetti(): ConfettiSpec[] {
  return Array.from({ length: CONFETTI_COUNT }).map((_, i) => ({
    glyph: CONFETTI_GLYPHS[i % CONFETTI_GLYPHS.length],
    startX: Math.random(),
    delay: 200 + Math.random() * 1200,
    duration: 1600 + Math.random() * 900,
    size: 22 + Math.floor(Math.random() * 14),
    rotateDirection: Math.random() > 0.5 ? 1 : -1,
  }));
}

export function RewardCelebration({
  visible,
  rewardName,
  emoji,
  onDismiss,
}: RewardCelebrationProps) {
  const backdrop = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconSpin = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;

  // Re-seed confetti once per visible cycle so each celebration looks fresh.
  const confettiKey = useMemo(() => (visible ? Date.now() : 0), [visible]);
  const confetti = useMemo<ConfettiSpec[]>(
    () => (visible ? generateConfetti() : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [confettiKey],
  );

  const [canDismiss, setCanDismiss] = useState(false);
  const closingRef = useRef(false);

  const glyph = emoji ?? rewardEmoji(rewardName);

  useEffect(() => {
    if (!visible) {
      backdrop.setValue(0);
      iconScale.setValue(0);
      iconSpin.setValue(0);
      cardScale.setValue(0);
      hintOpacity.setValue(0);
      setCanDismiss(false);
      closingRef.current = false;
      return;
    }

    Animated.timing(backdrop, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(iconScale, {
            toValue: 1.3,
            duration: 500,
            easing: Easing.out(Easing.back(1.8)),
            useNativeDriver: true,
          }),
          Animated.timing(iconScale, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(iconSpin, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(hintOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCanDismiss(true);
    });

    // Allow dismiss after a minimum hold so the user has time to enjoy it.
    const earlyDismissTimer = setTimeout(() => setCanDismiss(true), 1800);
    return () => clearTimeout(earlyDismissTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handlePress = () => {
    if (!canDismiss || closingRef.current) {
      // Still allow tap to fast-forward to dismissable state
      setCanDismiss(true);
      return;
    }
    closingRef.current = true;
    Animated.timing(backdrop, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  if (!visible) return null;

  const spin = iconSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible transparent animationType="none" onRequestClose={handlePress}>
      <Pressable style={styles.fill} onPress={handlePress}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />

        {/* Soft gold radial-ish overlay (just a centered amber blob) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.goldGlow,
            {
              opacity: backdrop.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.4],
              }),
            },
          ]}
        />

        {/* Confetti rain */}
        {confetti.map((c, i) => (
          <ConfettiPiece key={`${confettiKey}-${i}`} spec={c} active={visible} />
        ))}

        {/* Reward icon */}
        <Animated.Text
          style={[
            styles.icon,
            {
              transform: [{ scale: iconScale }, { rotate: spin }],
            },
          ]}
        >
          {glyph}
        </Animated.Text>

        {/* Parchment card */}
        <Animated.View
          style={[styles.card, { transform: [{ scale: cardScale }] }]}
        >
          <Text style={styles.cardEyebrow}>REWARD REDEEMED</Text>
          <Text style={styles.cardTitle} numberOfLines={3}>
            Enjoy your {rewardName}!
          </Text>
        </Animated.View>

        <Animated.Text style={[styles.tapHint, { opacity: hintOpacity }]}>
          tap to dismiss
        </Animated.Text>
      </Pressable>
    </Modal>
  );
}

function ConfettiPiece({ spec, active }: { spec: ConfettiSpec; active: boolean }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      t.setValue(0);
      return;
    }
    Animated.sequence([
      Animated.delay(spec.delay),
      Animated.timing(t, {
        toValue: 1,
        duration: spec.duration,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, spec.delay, spec.duration, t]);

  const translateY = t.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, SCREEN_H + 60],
  });
  const rotate = t.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${spec.rotateDirection * 540}deg`],
  });
  const opacity = t.interpolate({
    inputRange: [0, 0.1, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.Text
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: spec.startX * (SCREEN_W - 32),
        top: 0,
        fontSize: spec.size,
        transform: [{ translateY }, { rotate }],
        opacity,
      }}
    >
      {spec.glyph}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 27, 61, 0.72)',
  },
  goldGlow: {
    position: 'absolute',
    top: SCREEN_H / 2 - 220,
    left: SCREEN_W / 2 - 220,
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: colors.accent,
  },
  icon: {
    position: 'absolute',
    top: SCREEN_H / 2 - 140,
    alignSelf: 'center',
    fontSize: 120,
  },
  card: {
    position: 'absolute',
    top: SCREEN_H / 2 + 40,
    alignSelf: 'center',
    backgroundColor: '#F4E4C1',
    borderWidth: 2,
    borderColor: '#D8C396',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: SCREEN_W - spacing.xl * 2,
    alignItems: 'center',
    ...shadows.lg,
  },
  cardEyebrow: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    letterSpacing: 3,
    color: '#9C7A2F',
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    color: '#5A3F12',
    textAlign: 'center',
    lineHeight: 26,
  },
  tapHint: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.white,
    letterSpacing: 1.5,
  },
});
