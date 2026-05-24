/**
 * PinKeypad — Polish-B2 numeric pad for child PIN login.
 *
 * 3×4 grid: 1–9, then backspace/0/empty (or 0 spanning bottom row).
 * Each key is an AnimatedPressable rendering the digit in Heading 1.
 * Light haptic on each press; backspace gets medium.
 *
 * The keypad does NOT own the PIN value — the parent controls it via
 * `onDigit(digit)` and `onBackspace()`. This keeps it reusable for any
 * 4-6 digit flow.
 *
 * Props:
 *   - disabled: blocks interaction (used while a submission is pending)
 *   - tone: 'onNavy' (default) uses cream-glass keys; 'onLight' uses
 *     navy-on-cream for light backdrops.
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from 'react-native';
import { colors, spacing, borderRadius, typographyTokens } from '@/theme';
import { AnimatedPressable } from './AnimatedPressable';
import { Icon } from './Icon';

export type PinKeypadTone = 'onNavy' | 'onLight';

export interface PinKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
  tone?: PinKeypadTone;
  style?: ViewStyle | ViewStyle[];
}

const ROWS: Array<Array<'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'0'|'⌫'|''>> = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

export function PinKeypad({
  onDigit,
  onBackspace,
  disabled = false,
  tone = 'onNavy',
  style,
}: PinKeypadProps) {
  return (
    <View style={[styles.pad, style as any]}>
      {ROWS.map((row, ri) => (
        <View key={`r-${ri}`} style={styles.row}>
          {row.map((key, ci) => {
            if (key === '') {
              return <View key={`k-${ri}-${ci}`} style={styles.key} />;
            }
            const isBack = key === '⌫';
            return (
              <Key
                key={`k-${ri}-${ci}`}
                label={key}
                tone={tone}
                disabled={disabled}
                isBack={isBack}
                onPress={() => {
                  if (disabled) return;
                  if (isBack) onBackspace();
                  else onDigit(key);
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Key({
  label,
  tone,
  disabled,
  isBack,
  onPress,
}: {
  label: string;
  tone: PinKeypadTone;
  disabled: boolean;
  isBack: boolean;
  onPress: () => void;
}) {
  const onNavy = tone === 'onNavy';
  const bg = onNavy ? 'rgba(255,255,255,0.10)' : colors.creamSoft;
  const fg = onNavy ? colors.cream : colors.primary;
  const border = onNavy ? 'rgba(255,255,255,0.20)' : colors.border;

  return (
    <AnimatedPressable
      haptic={isBack ? 'medium' : 'light'}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={isBack ? 'Delete' : `Digit ${label}`}
      style={[
        styles.key,
        styles.keyActive,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {isBack ? (
        <Icon name="chevronLeft" size={24} color={fg} />
      ) : (
        <Text
          style={{
            ...typographyTokens.heading1,
            fontSize: 26,
            lineHeight: 30,
            color: fg,
          }}
        >
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pad: {
    width: '100%',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  key: {
    flex: 1,
    aspectRatio: 1.2,
    maxHeight: 68,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyActive: {
    borderWidth: 1,
  },
});
