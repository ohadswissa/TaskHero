import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fonts } from '@/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

/**
 * Standard parent screen header: navy title + amber underline accent.
 * See plans/demo-flow.md §7 visual system.
 */
export function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.back} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.underline} />
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  underline: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 6,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  right: { marginLeft: spacing.sm },
});
