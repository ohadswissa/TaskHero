import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Gradient as LinearGradient } from '@/components/common/Gradient';
import { colors, spacing, typography, borderRadius, gradients, fonts } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sizeStyle = sizeStyles[size];
  const textSizeStyle = textSizeStyles[size];

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white}
          size="small"
        />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.text, variantTextStyles[variant], textSizeStyle, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[{ borderRadius: borderRadius.xl, overflow: 'hidden' }, isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, sizeStyle] as any}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[{ borderRadius: borderRadius.xl, overflow: 'hidden' }, isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={gradients.secondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, sizeStyle] as any}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyle,
        flatVariantStyles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
}

const sizeStyles: Record<string, ViewStyle> = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  md: { paddingVertical: 14, paddingHorizontal: spacing.xl },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl },
};

const textSizeStyles: Record<string, TextStyle> = {
  sm: { fontSize: 13, fontFamily: fonts.semiBold },
  md: { fontSize: 16, fontFamily: fonts.bold },
  lg: { fontSize: 18, fontFamily: fonts.bold },
};

const variantTextStyles: Record<string, TextStyle> = {
  primary: { color: colors.white },
  secondary: { color: colors.white },
  outline: { color: colors.primary },
  ghost: { color: colors.primary },
  danger: { color: colors.error },
};

const flatVariantStyles: Record<string, ViewStyle> = {
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.xl,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.xl,
  },
  danger: {
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.xl,
  },
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: spacing.sm,
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    fontFamily: fonts.bold,
  },
});

