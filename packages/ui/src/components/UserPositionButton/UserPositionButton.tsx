/**
 * UserPositionButton Component
 * RentAScooter Design System
 *
 * A floating action button that centers the map on the user's current location.
 * Displays a crosshair/target icon in a white circular container with shadow.
 *
 * @acceptance AC-UPB-001: Container is 44x44 (2.75rem) circular
 * @acceptance AC-UPB-002: White background with medium shadow
 * @acceptance AC-UPB-003: Position icon centered at 24px (1.5rem)
 * @acceptance AC-UPB-004: Opacity reduces to 0.7 on press
 * @acceptance AC-UPB-005: Disabled state shows 50% opacity
 * @acceptance AC-UPB-006: Loading state shows ActivityIndicator
 *
 * @example
 * ```tsx
 * import { UserPositionButton } from '@rentascooter/ui';
 *
 * <UserPositionButton
 *   onPress={() => mapRef.current?.centerOnUser()}
 *   accessibilityLabel="Center map on my location"
 * />
 * ```
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Icon } from '../Icon';
import { shadows, lightColors } from '../../theme';

// Icon color - pure black as per design spec
const ICON_COLOR = '#000000';
import type { UserPositionButtonProps } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Size constants in rem-equivalent values (base: 16px)
 * Container: 44px = 2.75rem
 * Icon: 24px = 1.5rem
 */
const CONTAINER_SIZE = 44; // 2.75rem * 16
const ICON_SIZE = 24; // 1.5rem * 16
const PRESSED_OPACITY = 0.7;
const DISABLED_OPACITY = 0.5;

// =============================================================================
// COMPONENT
// =============================================================================

export function UserPositionButton({
  onPress,
  disabled = false,
  loading = false,
  isGpsEnabled = false,
  style,
  testID = 'user-position-button',
  accessibilityLabel = 'Center on my location',
}: UserPositionButtonProps) {
  /**
   * Memoized press handler to prevent unnecessary re-renders
   */
  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      onPress();
    }
  }, [disabled, loading, onPress]);

  /**
   * Dynamic style based on pressed state
   */
  const getPressedStyle = useCallback(
    ({ pressed }: { pressed: boolean }): StyleProp<ViewStyle> => [
      styles.container,
      pressed && !disabled && !loading && styles.pressed,
      disabled && styles.disabled,
      style,
    ],
    [disabled, loading, style]
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={getPressedStyle}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      accessibilityHint="Double tap to center the map on your current location"
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={ICON_COLOR}
          testID={`${testID}-loading`}
        />
      ) : (
        <Icon
          name={isGpsEnabled ? 'position' : 'help-circle'}
          size={ICON_SIZE}
          color={ICON_COLOR}
          testID={`${testID}-icon`}
        />
      )}
    </Pressable>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    borderRadius: CONTAINER_SIZE / 2, // Perfectly circular
    backgroundColor: lightColors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  pressed: {
    opacity: PRESSED_OPACITY,
  },
  disabled: {
    opacity: DISABLED_OPACITY,
  },
});

// =============================================================================
// DISPLAY NAME
// =============================================================================

UserPositionButton.displayName = 'UserPositionButton';
