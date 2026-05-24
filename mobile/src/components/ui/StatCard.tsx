/**
 * StatCard — Polish-B3 dashboard tile.
 *
 * A Surface-based primitive that displays a single key metric: an
 * optional eyebrow label, a large numeric/short value, a caption label,
 * and an optional trend chip + corner icon. Pressable when `onPress`
 * is provided.
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { spacing } from '@/theme';
import { Surface } from './Surface';
import { Caption, Display, Eyebrow, Heading } from './Typography';
import { Chip, type ChipTone } from './Chip';
import { Icon, type IconName } from './Icon';
import { AnimatedPressable } from './AnimatedPressable';

export type StatCardTrendTone = 'success' | 'error' | 'neutral';

export interface StatCardProps {
  eyebrow?: string;
  value: string | number;
  label: string;
  trend?: { label: string; tone: StatCardTrendTone };
  icon?: IconName;
  surface?: 'cream' | 'card' | 'glass';
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
}

const TREND_TONE_MAP: Record<StatCardTrendTone, ChipTone> = {
  success: 'success',
  error: 'error',
  neutral: 'navy',
};

export function StatCard({
  eyebrow,
  value,
  label,
  trend,
  icon,
  surface = 'card',
  onPress,
  style,
}: StatCardProps) {
  const valueStr = String(value);
  const showCompactValue = valueStr.length > 6;
  const a11y =
    `${label}: ${valueStr}` + (trend ? `, ${trend.label}` : '');

  const inner = (
    <Surface variant={surface} padding="md" radius="lg" style={style}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          {eyebrow ? <Eyebrow tone="accent">{eyebrow}</Eyebrow> : null}
        </View>
        {icon ? (
          <View style={styles.icon}>
            <Icon name={icon} size={20} />
          </View>
        ) : null}
      </View>
      <View style={styles.valueRow}>
        {showCompactValue ? (
          <Heading level={1} numberOfLines={1} adjustsFontSizeToFit>
            {valueStr}
          </Heading>
        ) : (
          <Display numberOfLines={1} adjustsFontSizeToFit>
            {valueStr}
          </Display>
        )}
      </View>
      <Caption tone="secondary">{label}</Caption>
      {trend ? (
        <View style={styles.trendRow}>
          <Chip
            label={trend.label}
            tone={TREND_TONE_MAP[trend.tone]}
            size="sm"
            filled
          />
        </View>
      ) : null}
    </Surface>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11y}
      >
        {inner}
      </AnimatedPressable>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 14,
  },
  headerCopy: { flex: 1 },
  icon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  trendRow: {
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
  },
});
