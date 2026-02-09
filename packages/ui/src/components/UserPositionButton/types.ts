/**
 * UserPositionButton Types
 * RentAScooter Design System
 *
 * Type definitions for the user position/center map button component.
 */

import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Props for the UserPositionButton component
 */
export interface UserPositionButtonProps {
  /**
   * Callback fired when the button is pressed
   * Typically used to center the map on user's location
   */
  onPress: () => void;

  /**
   * Disabled state - prevents interaction
   * @default false
   */
  disabled?: boolean;

  /**
   * Loading state - shows activity indicator
   * Useful when centering animation is in progress
   * @default false
   */
  loading?: boolean;

  /**
   * GPS/Location service enabled state
   * When false, shows a question mark icon instead of position icon
   * @default false
   */
  isGpsEnabled?: boolean;

  /**
   * Custom container styles
   * Applied to the outer Pressable container
   * Supports style arrays for combining multiple styles
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Test ID for testing frameworks
   */
  testID?: string;

  /**
   * Accessibility label for screen readers
   * @default "Center on my location"
   */
  accessibilityLabel?: string;
}
