import React from 'react';
import { Text as RNText, StyleSheet, TextStyle, TextProps as RNTextProps } from 'react-native';
import { colors, typography } from '../theme';
import type { TypographyVariant } from '../theme/types';

/**
 * Text color options mapped to theme text colors
 */
type TextColor = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'error' | 'success' | 'warning';

/**
 * Text alignment options
 */
type TextAlign = 'left' | 'center' | 'right';

export interface TextProps extends Omit<RNTextProps, 'style'> {
  /** Typography variant - determines font size, weight, and line height */
  variant?: TypographyVariant;
  /** Text color from theme */
  color?: TextColor;
  /** Text alignment */
  align?: TextAlign;
  /** Additional custom styles */
  style?: TextStyle;
  /** Content to render */
  children: React.ReactNode;
}

/**
 * Text Component
 *
 * Semantic text component that applies consistent typography from the design system.
 *
 * @example
 * ```tsx
 * <Text variant="h1">Large Title</Text>
 * <Text variant="body" color="secondary">Body text</Text>
 * <Text variant="caption" align="center">Centered caption</Text>
 * ```
 */
export function Text({
  variant = 'body',
  color = 'primary',
  align = 'left',
  style,
  children,
  ...rest
}: TextProps) {
  const textStyles: TextStyle[] = [
    styles.base,
    typographyStyles[variant],
    colorStyles[color],
    { textAlign: align },
    style,
  ].filter(Boolean) as TextStyle[];

  return (
    <RNText style={textStyles} {...rest}>
      {children}
    </RNText>
  );
}

/**
 * Typography variant styles mapped from theme tokens
 */
const typographyStyles = StyleSheet.create({
  h1: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    lineHeight: typography.h1.lineHeight,
    fontFamily: typography.h1.fontFamily,
  },
  h2: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    lineHeight: typography.h2.lineHeight,
    fontFamily: typography.h2.fontFamily,
  },
  h3: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    lineHeight: typography.h3.lineHeight,
    fontFamily: typography.h3.fontFamily,
  },
  h4: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    lineHeight: typography.h4.lineHeight,
    fontFamily: typography.h4.fontFamily,
  },
  body: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
  },
  bodySmall: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: typography.bodySmall.fontWeight,
    lineHeight: typography.bodySmall.lineHeight,
    fontFamily: typography.bodySmall.fontFamily,
  },
  caption: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
    fontFamily: typography.caption.fontFamily,
  },
});

/**
 * Color styles mapped from theme
 */
const colorStyles = StyleSheet.create({
  primary: {
    color: colors.text.primary,
  },
  secondary: {
    color: colors.text.secondary,
  },
  tertiary: {
    color: colors.text.tertiary,
  },
  inverse: {
    color: colors.text.inverse,
  },
  error: {
    color: colors.semantic.error,
  },
  success: {
    color: colors.semantic.success,
  },
  warning: {
    color: colors.semantic.warning,
  },
});

const styles = StyleSheet.create({
  base: {
    // Base text style - can be extended for font family when custom fonts are added
  },
});
