/**
 * RosterRow — Polish-B3 parent-side child + creature roster row.
 *
 * Surface(card) horizontal row with Avatar, name/sub line, OrbProgress
 * happiness, and an optional trailing slot (defaults to chevron).
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, spacing } from '@/theme';
import { Surface } from './Surface';
import { Caption, Heading } from './Typography';
import { Avatar } from './Avatar';
import { OrbProgress } from './OrbProgress';
import { Icon } from './Icon';
import { AnimatedPressable } from './AnimatedPressable';
import type { CreatureSpecies, EvolutionStage } from '@/api/types';

export interface RosterRowChild {
  displayName: string;
  age?: number;
  avatarUrl?: string;
}

export interface RosterRowCreature {
  species: CreatureSpecies;
  stage: EvolutionStage;
  happiness: number;
  name?: string;
}

export interface RosterRowProps {
  child: RosterRowChild;
  creature?: RosterRowCreature;
  onPress?: () => void;
  trailing?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Maps backend EvolutionStage → display level (1–4).
 * Spec keys (HATCHLING/JUVENILE/ADULT/MYTHIC) are aliased onto the
 * actual enum members (EGG/BABY/ADOLESCENT/ADULT).
 */
export function stageLevel(stage: EvolutionStage | string | undefined): number {
  switch (stage) {
    case 'EGG':
    case 'HATCHLING':
      return 1;
    case 'BABY':
    case 'JUVENILE':
      return 2;
    case 'ADOLESCENT':
      return 3;
    case 'ADULT':
      return 3;
    case 'MYTHIC':
      return 4;
    default:
      return 1;
  }
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] ?? '') + (parts[1][0] ?? '');
}

export function RosterRow({
  child,
  creature,
  onPress,
  trailing,
  style,
}: RosterRowProps) {
  const subline = creature?.name
    ? `${creature.name} · Lv ${stageLevel(creature.stage)}`
    : `Age ${child.age ?? '—'}`;

  const a11y = `${child.displayName}${creature ? `, ${subline}, happiness ${Math.round(creature.happiness)}%` : ''}`;

  const row = (
    <Surface variant="card" padding="md" radius="lg" shadow="card" style={style}>
      <View style={styles.row}>
        <Avatar
          uri={child.avatarUrl}
          initials={initialsFor(child.displayName)}
          size="md"
        />
        <View style={styles.middle}>
          <Heading level={3} numberOfLines={1}>
            {child.displayName}
          </Heading>
          <Caption tone="secondary" numberOfLines={1}>
            {subline}
          </Caption>
        </View>
        <View style={styles.right}>
          {creature ? (
            <View style={styles.happyBlock}>
              <OrbProgress
                size={32}
                value={creature.happiness}
                showPercent={false}
                label={null}
              />
              <View style={styles.happyText}>
                <Heading level={3} style={styles.happyValue}>
                  {Math.round(creature.happiness)}%
                </Heading>
                <Caption tone="secondary" style={styles.happyLabel}>
                  happy
                </Caption>
              </View>
            </View>
          ) : null}
          {trailing !== undefined ? (
            trailing
          ) : (
            <Icon name="chevronRight" size={18} color={colors.textSecondary} />
          )}
        </View>
      </View>
    </Surface>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11y}
      >
        {row}
      </AnimatedPressable>
    );
  }
  return row;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  middle: { flex: 1, minWidth: 0 },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  happyBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  happyText: {
    alignItems: 'flex-start',
  },
  happyValue: {
    fontSize: 15,
    lineHeight: 16,
  },
  happyLabel: {
    fontSize: 10,
    lineHeight: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
