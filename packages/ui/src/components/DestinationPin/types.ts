/**
 * DestinationPin Types
 * RentAScooter Design System
 *
 * Custom map marker for destination location
 */

import { ViewStyle } from 'react-native';

export interface DestinationPinProps {
  /** Size of the pin in pixels (default: 40) */
  size?: number;
  /** Custom container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
  /** Enable drop-in animation (default: true) */
  animated?: boolean;
  /** Optional label (e.g. place name) shown below the pin */
  label?: string;
}
