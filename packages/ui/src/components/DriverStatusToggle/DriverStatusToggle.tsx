import React, { memo, useCallback } from 'react';
import { View, Switch, StyleSheet, Platform } from 'react-native';
import { legacyColors as colors, spacing } from '../../theme';

/**
 * @description Props for the DriverStatusToggle component
 *
 * @acceptance AC-DST-001: Toggle shows online/offline state visually
 * @acceptance AC-DST-002: Track color changes to green when online
 * @acceptance AC-DST-003: Thumb color matches primary brand when online
 * @acceptance AC-DST-004: Fires onToggle callback when state changes
 * @acceptance AC-DST-005: Memoized to prevent unnecessary re-renders
 */
export interface DriverStatusToggleProps {
  /** Current online status */
  isOnline: boolean;
  /** Callback fired when toggle state changes */
  onToggle: () => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * DriverStatusToggle Component
 *
 * A toggle switch for drivers to go online/offline.
 * Uses platform-native Switch with custom brand colors.
 *
 * @example
 * ```tsx
 * <DriverStatusToggle
 *   isOnline={isOnline}
 *   onToggle={() => setIsOnline(!isOnline)}
 * />
 * ```
 */
function DriverStatusToggleComponent({
  isOnline,
  onToggle,
  disabled = false,
  testID,
}: DriverStatusToggleProps) {
  const handleValueChange = useCallback(() => {
    onToggle();
  }, [onToggle]);

  return (
    <View style={styles.container} testID={testID}>
      <Switch
        value={isOnline}
        onValueChange={handleValueChange}
        disabled={disabled}
        trackColor={{
          false: colors.background.tertiary,
          true: colors.success + '60',
        }}
        thumbColor={isOnline ? colors.success : colors.text.tertiary}
        ios_backgroundColor={colors.background.tertiary}
        style={styles.switch}
      />
    </View>
  );
}

/**
 * Memoized DriverStatusToggle to prevent unnecessary re-renders
 */
export const DriverStatusToggle = memo(DriverStatusToggleComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  switch: {
    transform: Platform.select({
      ios: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
      android: [],
    }),
  },
});
