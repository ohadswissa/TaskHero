/**
 * ApprovalCardFrame — Polish-B3 parent approvals row.
 *
 * Parchment surface with a trait-colored top stripe, photo thumbnail (or
 * placeholder), mission title, child name, relative submission time,
 * and an optional notes excerpt. Tappable to open the verify flow.
 */
import React from 'react';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import { borderRadius, colors, spacing, traitColor, traitLabel } from '@/theme';
import { Surface } from './Surface';
import { Body, Caption, Eyebrow, Heading } from './Typography';
import { Icon } from './Icon';
import { AnimatedPressable } from './AnimatedPressable';
import type { TraitCategory } from '@/api/types';

export type ApprovalCardSize = 'compact' | 'standard';

export interface ApprovalCardFrameProps {
  childName: string;
  missionTitle: string;
  trait: TraitCategory;
  submittedAt: string;
  photoUri?: string;
  notesExcerpt?: string;
  onPress: () => void;
  size?: ApprovalCardSize;
  style?: ViewStyle | ViewStyle[];
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return 'just now';
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(iso).toLocaleDateString();
}

function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return input.slice(0, max - 1).trimEnd() + '…';
}

export function ApprovalCardFrame({
  childName,
  missionTitle,
  trait,
  submittedAt,
  photoUri,
  notesExcerpt,
  onPress,
  size = 'standard',
  style,
}: ApprovalCardFrameProps) {
  const thumb = size === 'compact' ? 60 : 88;
  const padding = size === 'compact' ? 'sm' : 'md';
  const showNotes = size !== 'compact' && !!notesExcerpt;

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${childName} submitted ${missionTitle}, tap to verify`}
    >
      <Surface
        variant="parchment"
        padding={padding}
        radius="lg"
        shadow="parchment"
        style={style}
      >
        <View
          style={[
            styles.stripe,
            { backgroundColor: traitColor(trait) },
          ]}
          pointerEvents="none"
        />
        <View style={styles.row}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={{
                width: thumb,
                height: thumb,
                borderRadius: borderRadius.md,
                borderWidth: 2,
                borderColor: colors.parchmentDark,
              }}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View
              style={{
                width: thumb,
                height: thumb,
                borderRadius: borderRadius.md,
                backgroundColor: colors.creamSoft,
                borderWidth: 2,
                borderColor: colors.parchmentDark,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="image" size={24} color={colors.parchmentDark} />
            </View>
          )}
          <View style={styles.copy}>
            <Eyebrow tone="accent">{traitLabel(trait)}</Eyebrow>
            <Heading
              level={3}
              numberOfLines={1}
              tone="onParchment"
              style={styles.title}
            >
              {missionTitle}
            </Heading>
            <Body tone="onParchment" numberOfLines={1}>
              {childName}
            </Body>
            <Caption tone="secondary">{relativeTime(submittedAt)}</Caption>
            {showNotes && notesExcerpt ? (
              <Caption tone="onParchment" style={styles.notes}>
                “{truncate(notesExcerpt, 60)}”
              </Caption>
            ) : null}
          </View>
        </View>
      </Surface>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  stripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  copy: { flex: 1, minWidth: 0 },
  title: { marginTop: 2, marginBottom: 2 },
  notes: { marginTop: spacing.xs, fontStyle: 'italic' },
});
