/**
 * Onboarding · Step 1 · Origin Story.
 *
 * 5 swipeable narrative frames. "Skip" jumps straight to species
 * selection. The last frame's CTA also advances to species.
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gradient as LinearGradient } from '@/components/common/Gradient';
import { router } from 'expo-router';
import { colors, spacing, fonts, borderRadius } from '@/theme';
import { Button } from '@/components/common';

const { width: SCREEN_W } = Dimensions.get('window');

interface Frame {
  title: string;
  caption: string;
  gradient: readonly [string, string, string];
}

const FRAMES: Frame[] = [
  {
    title: 'Long ago…',
    caption: 'Every Hero forged a bond with a small creature companion — one heart, one journey.',
    gradient: ['#1B2A4E', '#3A4D7A', '#F4B860'] as const,
  },
  {
    title: 'A bond is born',
    caption: 'When a Hero began their first quest, an egg appeared — quiet, glowing, waiting.',
    gradient: ['#0F1B3D', '#2C3E6B', '#9FB8E4'] as const,
  },
  {
    title: 'Three paths',
    caption: 'Some companions grew wise from learning. Some grew kind from caring. Some grew strong from doing.',
    gradient: ['#1B2A4E', '#6B8E4E', '#A8C97F'] as const,
  },
  {
    title: 'Your turn, Hero',
    caption: 'Today an egg has chosen you. The path it walks is the path you choose.',
    gradient: ['#0F1B3D', '#8C6BBF', '#F4B860'] as const,
  },
  {
    title: 'Are you ready?',
    caption: 'Step forward. The egg is waiting.',
    gradient: ['#1B2A4E', '#D89B3F', '#F4B860'] as const,
  },
];

export default function OriginScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Frame>>(null);
  const isLast = index === FRAMES.length - 1;

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
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.skipBtn} onPress={skip} accessibilityRole="button">
        <Text style={styles.skipTxt}>Skip ›</Text>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={FRAMES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        keyExtractor={(_, i) => `frame-${i}`}
        renderItem={({ item }) => (
          <LinearGradient
            colors={item.gradient}
            style={styles.frame}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.frameInner}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.caption}>{item.caption}</Text>
            </View>
          </LinearGradient>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {FRAMES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Button
          title={isLast ? 'Begin →' : 'Next →'}
          onPress={advance}
          variant="primary"
          size="lg"
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  skipBtn: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    zIndex: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipTxt: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 14,
    opacity: 0.85,
  },
  frame: {
    width: SCREEN_W,
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
    justifyContent: 'center',
  },
  frameInner: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 32,
    color: colors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 22,
  },
  cta: { width: '100%' },
});
