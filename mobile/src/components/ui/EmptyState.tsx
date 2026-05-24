/**
 * EmptyState — Polish-B1 standardized empty-list visual.
 *
 * Centered illustration + title + body + optional CTA. Used by missions,
 * rewards, approvals when no items exist. Wrap in <Surface variant="cream">
 * for a tinted background.
 */
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, spacing, borderRadius, typographyTokens } from '@/theme';
import { Body, Heading } from './Typography';
import { AnimatedPressable } from './AnimatedPressable';

export interface EmptyStateProps {
  illustration?: React.ReactNode;
  title: string;
  body?: string;
  cta?: { label: string; onPress: () => void };
}

export function EmptyState({ illustration, title, body, cta }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <View style={styles.illustration}>
        {illustration ?? <Text style={styles.seed}>🌱</Text>}
      </View>
      <Heading level={3} align="center" tone="primary" style={styles.title}>
        {title}
      </Heading>
      {body ? (
        <Body align="center" tone="secondary" style={styles.body}>
          {body}
        </Body>
      ) : null}
      {cta ? (
        <AnimatedPressable
          onPress={cta.onPress}
          style={styles.cta}
          accessibilityRole="button"
          accessibilityLabel={cta.label}
        >
          <Text style={styles.ctaLabel}>{cta.label}</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  illustration: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  seed: { fontSize: 34 },
  title: { marginBottom: 4 },
  body: { maxWidth: 320 },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.pill,
  },
  ctaLabel: {
    ...typographyTokens.button,
    color: colors.white,
  },
});
