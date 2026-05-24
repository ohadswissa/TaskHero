/**
 * SectionHeader — Polish-B1 three-part section heading.
 *
 * Eyebrow (uppercase tracked label) + title + subtitle + optional
 * right-aligned action slot. Tone presets adjust text colors for
 * light/navy/parchment backgrounds.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { Body, Eyebrow, Heading, type Tone } from './Typography';

export type SectionHeaderTone = 'onLight' | 'onNavy' | 'onParchment';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  align?: 'left' | 'center';
  tone?: SectionHeaderTone;
}

function tonesFor(tone: SectionHeaderTone): { title: Tone; subtitle: Tone; eyebrow: Tone } {
  switch (tone) {
    case 'onNavy':
      return { title: 'onNavy', subtitle: 'onNavy', eyebrow: 'accent' };
    case 'onParchment':
      return { title: 'onParchment', subtitle: 'onParchment', eyebrow: 'accent' };
    case 'onLight':
    default:
      return { title: 'primary', subtitle: 'secondary', eyebrow: 'accent' };
  }
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  align = 'left',
  tone = 'onLight',
}: SectionHeaderProps) {
  const t = tonesFor(tone);
  return (
    <View style={[styles.root, align === 'center' && styles.center]}>
      <View style={styles.copy}>
        {eyebrow ? (
          <Eyebrow tone={t.eyebrow} align={align} style={styles.eyebrow}>
            {eyebrow}
          </Eyebrow>
        ) : null}
        <Heading level={2} tone={t.title} align={align}>
          {title}
        </Heading>
        {subtitle ? (
          <Body tone={t.subtitle} align={align} style={styles.subtitle}>
            {subtitle}
          </Body>
        ) : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  center: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  copy: { flexShrink: 1 },
  eyebrow: { marginBottom: 4 },
  subtitle: { marginTop: 2 },
  action: { marginLeft: spacing.md },
});
