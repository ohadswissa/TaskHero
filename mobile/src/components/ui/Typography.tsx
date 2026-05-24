/**
 * Typography — Polish-B1 design-system primitive.
 *
 * Six named variants: Display, Heading, Body, Caption, Scroll (parchment
 * serif italic), Eyebrow (tracked uppercase label). Every variant accepts
 * tone + align + standard Text props. Font families and metrics come from
 * `theme.typographyTokens`.
 */
import React from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typographyTokens } from '@/theme';

export type Tone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'onNavy'
  | 'onParchment'
  | 'accent'
  | 'error'
  | 'success'
  | 'inherit';

export type Align = 'left' | 'center' | 'right';

interface BaseProps extends TextProps {
  tone?: Tone;
  align?: Align;
  children: React.ReactNode;
}

function toneColor(tone: Tone | undefined): string | undefined {
  switch (tone) {
    case 'primary':
      return colors.textTokens.primary;
    case 'secondary':
      return colors.textTokens.secondary;
    case 'tertiary':
      return colors.textTokens.tertiary;
    case 'onNavy':
      return colors.textTokens.onNavy;
    case 'onParchment':
      return colors.textTokens.onParchment;
    case 'accent':
      return colors.textTokens.accent;
    case 'error':
      return colors.textTokens.error;
    case 'success':
      return colors.textTokens.success;
    case 'inherit':
    default:
      return undefined;
  }
}

function buildStyle(variantStyle: TextStyle, tone: Tone | undefined, align: Align | undefined): TextStyle {
  const color = toneColor(tone);
  return {
    ...variantStyle,
    ...(color !== undefined ? { color } : null),
    ...(align ? { textAlign: align } : null),
  };
}

const baseDefaults = { selectable: false } as const;

export function Display({ tone = 'primary', align, style, children, ...rest }: BaseProps) {
  return (
    <Text {...baseDefaults} {...rest} style={[buildStyle(typographyTokens.display, tone, align), style]}>
      {children}
    </Text>
  );
}

interface HeadingProps extends BaseProps {
  level?: 1 | 2 | 3;
}

export function Heading({ level = 1, tone = 'primary', align, style, children, ...rest }: HeadingProps) {
  const variant =
    level === 1 ? typographyTokens.heading1 : level === 2 ? typographyTokens.heading2 : typographyTokens.heading3;
  return (
    <Text
      {...baseDefaults}
      accessibilityRole="header"
      {...rest}
      style={[buildStyle(variant, tone, align), style]}
    >
      {children}
    </Text>
  );
}

interface BodyProps extends BaseProps {
  emphasis?: boolean;
}

export function Body({ emphasis, tone = 'primary', align, style, children, ...rest }: BodyProps) {
  const variant = emphasis ? typographyTokens.bodyEmphasis : typographyTokens.body;
  return (
    <Text {...baseDefaults} {...rest} style={[buildStyle(variant, tone, align), style]}>
      {children}
    </Text>
  );
}

interface CaptionProps extends BaseProps {
  emphasis?: boolean;
}

export function Caption({ emphasis, tone = 'secondary', align, style, children, ...rest }: CaptionProps) {
  const variant = emphasis ? typographyTokens.captionEmphasis : typographyTokens.caption;
  return (
    <Text {...baseDefaults} {...rest} style={[buildStyle(variant, tone, align), style]}>
      {children}
    </Text>
  );
}

export function Scroll({ tone = 'onParchment', align, style, children, ...rest }: BaseProps) {
  return (
    <Text {...baseDefaults} {...rest} style={[buildStyle(typographyTokens.scroll, tone, align), style]}>
      {children}
    </Text>
  );
}

export function Eyebrow({ tone = 'accent', align, style, children, ...rest }: BaseProps) {
  const upper =
    typeof children === 'string' ? children.toUpperCase() : children;
  return (
    <Text {...baseDefaults} {...rest} style={[buildStyle(typographyTokens.eyebrow, tone, align), style]}>
      {upper}
    </Text>
  );
}

/**
 * Aggregated registry — handy for switching variants from data.
 *   <Typography.Display>Hello</Typography.Display>
 */
export const Typography = {
  Display,
  Heading,
  Body,
  Caption,
  Scroll,
  Eyebrow,
};

// Silence unused-import warning when styles are unused
const _styles = StyleSheet.create({});
void _styles;
