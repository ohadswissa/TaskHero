/**
 * ScrollCard — Polish-B1 "Hero's Wisdom" parchment specialty card.
 *
 * Renders a Surface(parchment) with decorative curled-corner SVG ornaments
 * and ornamental ✦ glyphs framing the lesson copy. Title is small Eyebrow;
 * body is rendered in Fraunces italic via the Scroll variant.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '@/theme';
import { Surface } from './Surface';
import { Eyebrow, Scroll, Caption } from './Typography';

export interface ScrollCardProps {
  title?: string;
  body: string;
  align?: 'left' | 'center';
}

function Corner({ rotation = 0 }: { rotation?: number }) {
  return (
    <Svg
      width={28}
      height={28}
      viewBox="0 0 24 24"
      style={{ transform: [{ rotate: `${rotation}deg` }] }}
    >
      <Path
        d="M2 22c0-10 2-20 20-20"
        stroke={colors.parchmentDark}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M5 22c0-7 1.5-17 17-17"
        stroke={colors.parchmentDark}
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
    </Svg>
  );
}

export function ScrollCard({ title = "Hero's Wisdom", body, align = 'center' }: ScrollCardProps) {
  return (
    <Surface variant="parchment" radius="lg" padding="lg" bordered>
      <View style={styles.cornerTL}>
        <Corner rotation={0} />
      </View>
      <View style={styles.cornerTR}>
        <Corner rotation={90} />
      </View>
      <View style={styles.cornerBL}>
        <Corner rotation={-90} />
      </View>
      <View style={styles.cornerBR}>
        <Corner rotation={180} />
      </View>

      {title ? (
        <Eyebrow align={align} tone="onParchment" style={styles.title}>
          {title}
        </Eyebrow>
      ) : null}

      <Caption align={align} tone="onParchment" style={styles.glyph}>
        ✦
      </Caption>
      <Scroll align={align} tone="onParchment" style={styles.body}>
        {body}
      </Scroll>
      <Caption align={align} tone="onParchment" style={styles.glyph}>
        ✦
      </Caption>
    </Surface>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.sm, opacity: 0.75 },
  body: { paddingHorizontal: spacing.sm },
  glyph: { opacity: 0.55, marginVertical: 4 },
  cornerTL: { position: 'absolute', top: 6, left: 6 },
  cornerTR: { position: 'absolute', top: 6, right: 6 },
  cornerBL: { position: 'absolute', bottom: 6, left: 6 },
  cornerBR: { position: 'absolute', bottom: 6, right: 6 },
});
