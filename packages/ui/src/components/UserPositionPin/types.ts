/**
 * UserPositionPin Types
 * Defines types for the user position marker shown on maps
 */

import type { ViewStyle } from 'react-native';

/**
 * Size variants for the UserPositionPin
 * - 'small': Used when map is zoomed out (25x25px)
 * - 'large': Used when map is zoomed in (57x57px)
 */
export type UserPositionPinSize = 'small' | 'large';

/**
 * Size configuration for each variant
 */
export interface SizeConfig {
  /** Total container size in pixels */
  container: number;
  /** White border/stroke width */
  borderWidth: number;
  /** Inner colored circle diameter */
  innerDiameter: number;
  /** Navigation icon size */
  iconSize: number;
}

/**
 * Props for the UserPositionPin component
 *
 * @example
 * ```tsx
 * <UserPositionPin
 *   size="large"
 *   heading={45}
 *   animated
 * />
 * ```
 */
export interface UserPositionPinProps {
  /**
   * Size variant based on map zoom level
   * @default 'large'
   */
  size?: UserPositionPinSize;

  /**
   * Heading/direction in degrees (0-360, where 0 = North)
   * Rotates the navigation arrow icon
   * @default 0
   */
  heading?: number;

  /**
   * Animation duration for size transitions in milliseconds
   * @default 200
   */
  animationDuration?: number;

  /**
   * Animation duration for heading rotation in milliseconds
   * Shorter duration = more responsive feel
   * @default 100
   */
  headingAnimationDuration?: number;

  /**
   * Whether to animate size changes with smooth transitions
   * @default true
   */
  animated?: boolean;

  /**
   * Whether to animate heading rotation changes
   * When true, heading changes interpolate smoothly
   * When false, heading snaps instantly (use for debugging or specific UX needs)
   * @default true
   */
  animateHeading?: boolean;

  /**
   * Additional styles applied to the container
   */
  style?: ViewStyle;

  /**
   * Test ID for testing purposes
   */
  testID?: string;
}
