/**
 * LocationRow Component
 * Client App - Location Selection Modal
 *
 * Reusable row component that adapts to different contexts:
 * - 'previous': Previous destinations (larger, more padding)
 * - 'search': Search results (compact)
 * - 'selected': Selected location in modal header
 *
 * @acceptance AC-LR-001: Row displays location icon, name, and address
 * @acceptance AC-LR-002: Previous variant has larger text and padding
 * @acceptance AC-LR-003: Search variant is compact
 * @acceptance AC-LR-004: Selected variant shows in modal header
 * @acceptance AC-LR-005: Row has press feedback
 */

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Icon } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import type { Location } from '@rentascooter/shared';

export type LocationRowVariant = 'previous' | 'search' | 'selected';

export interface LocationRowProps {
  /** Location data */
  location: Location;
  /** Visual variant */
  variant?: LocationRowVariant;
  /** Press handler */
  onPress?: (location: Location) => void;
  /** Test ID */
  testID?: string;
}

export const LocationRow = memo(function LocationRow({
  location,
  variant = 'search',
  onPress,
  testID = 'location-row',
}: LocationRowProps) {
  const handlePress = () => {
    onPress?.(location);
  };

  // Icon selection based on variant
  const iconName = variant === 'previous' ? 'history' : variant === 'selected' ? 'location-dot' : 'map-pin';
  const iconSize = variant === 'previous' ? 24 : 20;

  // Style variants
  const containerStyle = [
    styles.container,
    variant === 'previous' && styles.containerPrevious,
    variant === 'search' && styles.containerSearch,
    variant === 'selected' && styles.containerSelected,
  ];

  const nameStyle = [
    styles.name,
    variant === 'previous' && styles.namePrevious,
    variant === 'search' && styles.nameSearch,
    variant === 'selected' && styles.nameSelected,
  ];

  const addressStyle = [
    styles.address,
    variant === 'previous' && styles.addressPrevious,
    variant === 'search' && styles.addressSearch,
    variant === 'selected' && styles.addressSelected,
  ];

  const primaryLine = location.name ?? location.address ?? 'Selected location';
  const hasSecondary =
    (location.address != null && location.address !== primaryLine) ||
    ((location.address == null || location.address === '') && location.latitude != null && location.longitude != null);
  const secondaryLine =
    location.address != null && location.address !== primaryLine
      ? location.address
      : location.latitude != null && location.longitude != null
        ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
        : '';

  const content = (
    <>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Icon
          name={iconName}
          size={iconSize}
          color={variant === 'selected' ? colors.icon.default : colors.icon.default}
        />
      </View>

      {/* Text content - safe fallbacks so we never show "undefined" */}
      <View style={styles.textContainer}>
        <Text style={nameStyle} numberOfLines={1}>
          {primaryLine}
        </Text>
        {hasSecondary && secondaryLine ? (
          <Text style={addressStyle} numberOfLines={variant === 'previous' ? 2 : 1}>
            {secondaryLine}
          </Text>
        ) : null}
      </View>
    </>
  );

  // Selected variant is not pressable
  if (variant === 'selected') {
    return (
      <View style={containerStyle} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        ...containerStyle,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
      testID={testID}
    >
      {content}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },

  // Previous variant - larger, more padding
  containerPrevious: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },

  // Search variant - compact
  containerSearch: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },

  // Selected variant - no border
  containerSelected: {
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
  },

  pressed: {
    backgroundColor: colors.background.secondary,
  },

  iconContainer: {
    marginRight: spacing.md,
  },

  textContainer: {
    flex: 1,
  },

  // Name styles
  name: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: 2,
  },

  namePrevious: {
    fontSize: 18,
    fontWeight: '600',
  },

  nameSearch: {
    ...typography.body,
    fontWeight: '500',
  },

  nameSelected: {
    ...typography.bodySmall,
    fontWeight: '500',
  },

  // Address styles
  address: {
    ...typography.caption,
    color: colors.text.secondary,
  },

  addressPrevious: {
    ...typography.body,
  },

  addressSearch: {
    ...typography.caption,
  },

  addressSelected: {
    ...typography.caption,
    fontSize: 11,
  },
});
