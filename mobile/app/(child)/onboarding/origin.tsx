/**
 * Onboarding · Step 1 · Origin Story — Polish-B2.
 *
 * Five swipeable narrative frames. Each frame:
 *  - Full-bleed GradientBackdrop (navy/magic → parchment depending on mood)
 *  - Hero illustration (sparkle icon or egg CreatureScene)
 *  - Display title + Body caption
 *  - PinDots step indicator at bottom + amber Next CTA
 *
 * "Skip" jumps straight to species selection.
 */
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CreatureScene } from '@/components/creature/CreatureScene';
import {
  AnimatedPressable,
  GradientBackdrop,
  Icon,
  PinDots,
  Typography,
  type GradientVariant,
  type IconName,
} from '@/components/ui';
import { borderRadius, colors, spacing } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');

type Visual =
  | { kind: 'icon'; name: IconName; tint: string }
  | { kind: 'egg' };

interface Frame {
  title: string;
  caption: string;
  variant: GradientVariant;
  intensity: 'subtle' | 'normal' | 'rich';
  tone: 'onNavy' | 'onParchment';
  visual: Visual;
}

const FRAMES: Frame[] = [
  {
    title: 'Long ago…',
    caption: 'Every Hero forged a bond with a small creature companion — one heart, one journey.',
    variant: 'navy',
    intensity: 'rich',
    tone: 'onNavy',
    visual: { kind: 'icon', name: 'crown', tint: colors.amberDeep },
  },
  {
    title: 'A bond is born',
    caption: 'When a Hero began their first quest, an egg appeared — quiet, glowing, waiting.',
    variant: 'magic',
    intensity: 'normal',
    tone: 'onNavy',
    visual: { kind: 'icon', name: 'sparkle', tint: '#FFF8EC' },
  },
  {
    title: 'Three paths',
    caption: 'Some grew wise from learning. Some grew kind from caring. Some grew strong from doing.',
    variant: 'magic',
    intensity: 'subtle',
    tone: 'onNavy',
    visual: { kind: 'icon', name: 'scroll', tint: '#FFF8EC' },
  },
  {
    title: 'Your turn, Hero',
    caption: 'Today an egg has chosen you. What lives inside depends on the heart you bring.',
    variant: 'parchment',
    intensity: 'normal',
    tone: 'onParchment',
    visual: { kind: 'egg' },
  },
  {
    title: 'Are you ready?',
    caption: 'Step forward. The egg is waiting.',
    variant: 'parchment',
    intensity: 'rich',
    tone: 'onParchment',
    visual: { kind: 'egg' },
  },
];

export default function OriginScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Frame>>(null);
  const isLast = index === FRAMES.length - 1;
  const current = FRAMES[index];

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (next !== index) setIndex(next);
  };

  const advance = () => {
    if (isLast) {
      router.push('/(child)/onboarding/species' as never);
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    setIndex(index + 1);
  };

  const skip = () => router.push('/(child)/onboarding/species' as never);

  return (
    <View style={styles.root}>
      <GradientBackdrop
        variant={current.variant}
        intensity={current.intensity}
        direction="diagonal"
      >
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <AnimatedPressable
            onPress={skip}
            style={styles.skipBtn}
            accessibilityRole="button"
            accessibilityLabel="Skip the origin story"
          >
            <Typography.Caption emphasis tone={current.tone} style={styles.skipTxt}>
              Skip ›
            </Typography.Caption>
          </AnimatedPressable>

          <FlatList
            ref={listRef}
            data={FRAMES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            keyExtractor={(_, i) => `frame-${i}`}
            renderItem={({ item }) => (
              <View style={styles.frame}>
                <View style={styles.visualStage}>
                  {item.visual.kind === 'egg' ? (
                    <CreatureScene
                      species="FOREST_PUP"
                      stage="EGG"
                      emotion="HAPPY"
                      size={160}
                      showHabitat
                      habitatVariant="subtle"
                    />
                  ) : (
                    <View style={[styles.iconHalo, { backgroundColor: 'rgba(244, 184, 96, 0.18)' }]}>
                      <Icon name={item.visual.name} size={56} color={item.visual.tint} />
                    </View>
                  )}
                </View>

                <View style={styles.copy}>
                  <Typography.Display
                    tone={item.tone}
                    align="center"
                    style={styles.title}
                  >
                    {item.title}
                  </Typography.Display>
                  <Typography.Body
                    tone={item.tone}
                    align="center"
                    style={styles.caption}
                  >
                    {item.caption}
                  </Typography.Body>
                </View>
              </View>
            )}
          />

          <View style={styles.footer}>
            <View style={styles.dotsRow}>
              <PinDots
                filled={index + 1}
                total={FRAMES.length}
                tone={current.tone === 'onNavy' ? 'onNavy' : 'onLight'}
                size="sm"
              />
            </View>
            <AnimatedPressable
              onPress={advance}
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'Begin your journey' : 'Next'}
              style={styles.cta}
            >
              <Typography.Heading level={2} tone="primary" style={styles.ctaLabel}>
                {isLast ? 'Begin' : 'Next'}
              </Typography.Heading>
              <Icon name="chevronRight" size={20} color={colors.navyDeep} />
            </AnimatedPressable>
          </View>
        </SafeAreaView>
      </GradientBackdrop>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  skipBtn: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  skipTxt: { letterSpacing: 1.4 },

  frame: {
    width: SCREEN_W,
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconHalo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { width: '100%' },
  title: { marginBottom: spacing.md },
  caption: {
    opacity: 0.9,
    paddingHorizontal: spacing.sm,
    lineHeight: 24,
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.lg,
  },
  dotsRow: {},
  cta: {
    width: '100%',
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
