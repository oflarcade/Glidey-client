import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'secondary';
type BadgeSize = 'small' | 'medium';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colors.success + '20', text: colors.success },
  warning: { bg: colors.warning + '30', text: '#996B00' },
  error: { bg: colors.error + '20', text: colors.error },
  info: { bg: colors.info + '20', text: colors.info },
  neutral: { bg: colors.background.tertiary, text: colors.text.secondary },
  primary: { bg: colors.primary.light + '40', text: colors.primary.dark },
  secondary: { bg: colors.secondary.light + '40', text: colors.secondary.dark },
};

export function Badge({
  label,
  variant = 'neutral',
  size = 'medium',
  style,
}: BadgeProps) {
  const colorScheme = variantColors[variant];

  return (
    <View
      style={[
        styles.container,
        styles[size],
        { backgroundColor: colorScheme.bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          styles[`${size}Text`],
          { color: colorScheme.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  small: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
  medium: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
});
