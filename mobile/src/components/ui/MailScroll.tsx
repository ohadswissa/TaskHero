/**
 * MailScroll — Polish-B3 Hero Mail-style parchment scroll.
 *
 * Structure: amber top ribbon ("✉ HERO MAIL"), parchment body with
 * optional header slot, centered title, ornamental divider, body
 * content, and footer slot. Bottom edge is a torn paper SVG zigzag.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { borderRadius, colors, spacing } from '@/theme';
import { Surface } from './Surface';
import { Caption, Eyebrow, Heading, Scroll } from './Typography';

export interface MailScrollProps {
  title?: string;
  body?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

const TEAR_HEIGHT = 12;
const TEAR_TOOTH_WIDTH = 16;

function PaperTearEdge() {
  // Build a horizontal zigzag path that "tears" the bottom of the
  // parchment. Filled with the parchment color so it visually crops the
  // surface. Width is 100% via preserveAspectRatio="none".
  const teeth = 32;
  const path: string[] = [`M 0 0`];
  for (let i = 0; i < teeth; i++) {
    const x = ((i + 1) / teeth) * (teeth * TEAR_TOOTH_WIDTH);
    const y = i % 2 === 0 ? TEAR_HEIGHT * 0.5 : 0;
    path.push(`L ${x} ${y}`);
  }
  path.push(`L ${teeth * TEAR_TOOTH_WIDTH} ${TEAR_HEIGHT}`);
  path.push(`L 0 ${TEAR_HEIGHT}`);
  path.push('Z');
  return (
    <View style={styles.tear} pointerEvents="none">
      <Svg
        width="100%"
        height={TEAR_HEIGHT}
        viewBox={`0 0 ${teeth * TEAR_TOOTH_WIDTH} ${TEAR_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <Path d={path.join(' ')} fill={colors.parchment} />
      </Svg>
    </View>
  );
}

export function MailScroll({
  title,
  body,
  header,
  footer,
  children,
}: MailScrollProps) {
  const content = children ?? body;
  return (
    <View style={styles.root}>
      {/* Top ribbon */}
      <View style={styles.ribbonWrap} pointerEvents="none">
        <View style={styles.ribbon}>
          <Eyebrow tone="onNavy" align="center">
            ✉ HERO MAIL
          </Eyebrow>
        </View>
      </View>

      {/* Parchment body */}
      <Surface
        variant="parchment"
        padding="lg"
        radius="lg"
        shadow="parchment"
        bordered
        style={styles.body}
      >
        {header ? <View style={styles.headerSlot}>{header}</View> : null}
        {title ? (
          <Heading level={2} align="center" tone="onParchment" style={styles.title}>
            {title}
          </Heading>
        ) : null}
        <Caption align="center" tone="secondary" style={styles.divider}>
          ✦ ✦ ✦
        </Caption>
        {typeof content === 'string' ? (
          <Scroll align="center" tone="onParchment">
            {content}
          </Scroll>
        ) : (
          content
        )}
        {footer ? <View style={styles.footerSlot}>{footer}</View> : null}
        <PaperTearEdge />
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%' },
  ribbonWrap: {
    alignItems: 'center',
    zIndex: 2,
  },
  ribbon: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    height: 28,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    marginBottom: -8,
  },
  body: {
    paddingBottom: spacing.lg + TEAR_HEIGHT,
  },
  headerSlot: { marginBottom: spacing.sm },
  title: { marginTop: spacing.xs },
  divider: { opacity: 0.55, marginVertical: spacing.sm },
  footerSlot: { marginTop: spacing.md },
  tear: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: TEAR_HEIGHT,
  },
});
