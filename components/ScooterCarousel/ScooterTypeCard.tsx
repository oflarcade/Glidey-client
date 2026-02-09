/**
 * ScooterTypeCard Component
 * Client App - Booking modal scooter type option
 *
 * Single card in the "Recommended Rides" carousel. Uses Icon component
 * for scooter/vehicle icon. Supports selected state (yellow highlight).
 *
 * @acceptance AC-STC-001: Card shows icon, label, and price
 * @acceptance AC-STC-002: Selected state uses primary (yellow) styling
 * @acceptance AC-STC-003: Uses Icon component from design system
 */

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Icon } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import type { IconName } from '@rentascooter/ui';

export interface ScooterTypeCardProps {
  /** Display label (e.g. "Standard", "E-Scooter") */
  label: string;
  /** Price string (e.g. "$23", "$22.00") */
  price: string;
  /** Icon name from Icon registry (e.g. "scooter", "vehicle") */
  iconName: IconName;
  /** Whether this option is selected */
  selected?: boolean;
  /** Selection handler */
  onPress?: () => void;
  /** Test ID */
  testID?: string;
}

export const ScooterTypeCard = memo(function ScooterTypeCard({
  label,
  price,
  iconName,
  selected = false,
  onPress,
  testID = 'scooter-type-card',
}: ScooterTypeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
      testID={testID}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Icon
          name={iconName}
          size={32}
          color={selected ? colors.primary.main : colors.text.tertiary}
        />
      </View>
      <Text
        style={[styles.label, selected && styles.labelSelected]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={[styles.price, selected && styles.priceSelected]}
        numberOfLines={1}
      >
        {price}
      </Text>
    </Pressable>
  );
});

const CARD_WIDTH = 120;
const CARD_PADDING = 12;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    padding: CARD_PADDING,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    backgroundColor: colors.primary.light + '80',
    borderColor: colors.primary.main,
  },
  cardPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconWrapSelected: {
    backgroundColor: colors.background.primary,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  labelSelected: {
    color: colors.text.primary,
  },
  price: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  priceSelected: {
    color: colors.text.primary,
    fontWeight: '600',
  },
});
