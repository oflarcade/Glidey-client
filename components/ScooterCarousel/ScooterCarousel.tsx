/**
 * ScooterCarousel Component
 * Client App - Recommended Rides horizontal carousel
 *
 * Horizontal scroll of ScooterTypeCard options. Uses Icon-based
 * ScooterTypeCard for each ride type (Standard, E-Scooter, etc.).
 *
 * @acceptance AC-SC-001: Horizontal scrollable list of scooter types
 * @acceptance AC-SC-002: One option can be selected
 * @acceptance AC-SC-003: Cards use Icon component
 */

import React, { memo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ScooterTypeCard } from './ScooterTypeCard';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import type { IconName } from '@rentascooter/ui';

export interface ScooterTypeOption {
  id: string;
  label: string;
  price: string;
  iconName: IconName;
}

export interface ScooterCarouselProps {
  /** Available scooter types */
  options: ScooterTypeOption[];
  /** Selected option id */
  selectedId: string | null;
  /** Selection handler */
  onSelect: (id: string) => void;
  /** Section title (e.g. "Recommended Rides") */
  title?: string;
  /** Test ID */
  testID?: string;
}

const DEFAULT_OPTIONS: ScooterTypeOption[] = [
  { id: 'standard', label: 'Standard', price: '$23', iconName: 'vehicle' },
  { id: 'e-scooter', label: 'E-Scooter', price: '$22.00', iconName: 'scooter' },
  { id: 'e-scooter-2', label: 'E-Scooter', price: '$22.00', iconName: 'scooter' },
];

export const ScooterCarousel = memo(function ScooterCarousel({
  options = DEFAULT_OPTIONS,
  selectedId,
  onSelect,
  title = 'Recommended Rides',
  testID = 'scooter-carousel',
}: ScooterCarouselProps) {
  const handleSelect = useCallback(
    (id: string) => () => {
      onSelect(id);
    },
    [onSelect]
  );

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        {options.map((option) => (
          <ScooterTypeCard
            key={option.id}
            label={option.label}
            price={option.price}
            iconName={option.iconName}
            selected={selectedId === option.id}
            onPress={handleSelect(option.id)}
            testID={`${testID}-card-${option.id}`}
          />
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  scroll: {
    marginHorizontal: -spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
});
