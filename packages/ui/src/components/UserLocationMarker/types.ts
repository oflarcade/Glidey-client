import type { ViewStyle } from 'react-native';

/**
 * Size variants for the user location marker
 */
export type UserLocationMarkerSize = 'sm' | 'md' | 'lg';

/**
 * UserLocationMarker component props
 */
export interface UserLocationMarkerProps {
  /** Size of the marker */
  size?: UserLocationMarkerSize;
  /** Heading/direction in degrees (0-360, 0 = North) */
  heading?: number;
  /** Location accuracy in meters (optional, for accuracy circle) */
  accuracy?: number;
  /** Show accuracy circle */
  showAccuracyCircle?: boolean;
  /** Show heading indicator arrow */
  showHeadingIndicator?: boolean;
  /** Pulsing animation enabled */
  animated?: boolean;
  /** Custom color for the marker */
  color?: string;
  /** Additional styles for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Size configuration for marker variants
 */
export interface SizeConfig {
  /** Container size in pixels */
  container: number;
  /** Outer circle radius */
  outerRadius: number;
  /** Inner circle radius */
  innerRadius: number;
  /** Border width */
  borderWidth: number;
  /** Arrow/heading indicator size */
  arrowSize: number;
}
