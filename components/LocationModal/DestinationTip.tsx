/**
 * DestinationTip Component
 * Client App - Location Selection Modal
 *
 * Floating component above map showing selected destination.
 * Displays silhouette icon, destination name, address, and right arrow.
 *
 * @acceptance AC-DT-001: Tip floats above map, below modal
 * @acceptance AC-DT-002: Shows silhouette icon on left
 * @acceptance AC-DT-003: Shows destination name and address
 * @acceptance AC-DT-004: Shows right arrow icon
 * @acceptance AC-DT-005: Has shadow/elevation for depth
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Icon } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import type { Location } from '@rentascooter/shared';

export interface DestinationTipProps {
  /** Destination location */
  destination: Location;
  /** Top offset from screen top */
  topOffset?: number;
  /** Close handler */
  onClose?: () => void;
  /** Test ID */
  testID?: string;
}

const getDisplayName = (destination: Location) =>
  destination.name ?? destination.address ?? 'Selected location';
const getSecondaryLine = (destination: Location) => {
  if (destination.name && destination.address && destination.address !== destination.name) {
    return destination.address;
  }
  if (destination.latitude != null && destination.longitude != null) {
    return `${destination.latitude.toFixed(5)}, ${destination.longitude.toFixed(5)}`;
  }
  return '';
};

export const DestinationTip = memo(function DestinationTip({
  destination,
  topOffset = 0,
  onClose,
  testID = 'destination-tip',
}: DestinationTipProps) {
  const displayName = getDisplayName(destination);
  const secondaryLine = getSecondaryLine(destination);

  return (
    <View
      style={[styles.container, { top: topOffset }]}
      testID={testID}
    >
      {/* Silhouette icon */}
      <View style={styles.iconContainer}>
        <Icon
          name="user-silhouette"
          size={16}
          color={colors.text.primary}
        />
      </View>

      {/* Destination info */}
      <View style={styles.textContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        {secondaryLine ? (
          <Text style={styles.address} numberOfLines={1}>
            {secondaryLine}
          </Text>
        ) : null}
      </View>

      {/* Close button (if onClose provided) */}
      {onClose && (
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.closeButtonPressed,
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID={`${testID}-close`}
        >
          <Icon
            name="close"
            size={20}
            color={colors.text.tertiary}
          />
        </Pressable>
      )}

      {/* Right arrow (only show if no close button) */}
      {!onClose && (
        <View style={styles.arrowContainer}>
          <Icon
            name="chevron-right"
            size={20}
            color={colors.text.tertiary}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  textContainer: {
    flex: 1,
  },

  name: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },

  address: {
    ...typography.caption,
    color: colors.text.secondary,
  },

  arrowContainer: {
    marginLeft: spacing.sm,
  },

  closeButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
    borderRadius: 16,
  },

  closeButtonPressed: {
    backgroundColor: colors.background.secondary,
  },
});
