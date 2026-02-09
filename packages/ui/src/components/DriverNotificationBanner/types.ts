import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

/**
 * Banner variant types for DriverNotificationBanner
 *
 * - offline: Shows when driver is offline
 * - license: Shows when license verification is required
 * - phone: Shows when phone verification is required
 * - navigation: Shows turn-by-turn navigation instructions
 */
export type BannerVariant = 'offline' | 'license' | 'phone' | 'navigation';

/**
 * Turn direction types for navigation variant
 */
export type TurnDirection = 'left' | 'right' | 'straight' | 'u-turn';

/**
 * @description Props for the DriverNotificationBanner component
 *
 * @acceptance AC-DNB-001: Banner displays with orange background (#FF8A00)
 * @acceptance AC-DNB-002: Banner height is 64px
 * @acceptance AC-DNB-003: Status variants show icon in dashed circular border
 * @acceptance AC-DNB-004: Status variants display title (bold) and subtitle (regular)
 * @acceptance AC-DNB-005: Navigation variant shows turn arrow with distance badge
 * @acceptance AC-DNB-006: Navigation variant displays instruction text
 * @acceptance AC-DNB-007: Text color is dark navy (#1A1A2E)
 * @acceptance AC-DNB-008: Border radius matches theme.borderRadius.lg (16px)
 * @acceptance AC-DNB-009: Component is pressable when onPress is provided
 * @acceptance AC-DNB-010: Component is accessible with proper labels
 */
export interface DriverNotificationBannerProps {
  /** Banner variant type */
  variant: BannerVariant;

  // Status variants props (offline, license, phone)
  /** Title text for status variants */
  title?: string;
  /** Subtitle text for status variants */
  subtitle?: string;
  /** Custom icon for status variants (renders in dashed circle) */
  icon?: ReactNode;

  // Navigation variant props
  /** Distance to next maneuver (e.g., "250m") */
  distance?: string;
  /** Turn direction for navigation arrow */
  turnDirection?: TurnDirection;
  /** Navigation instruction text */
  instruction?: string;

  // Common props
  /** Press handler */
  onPress?: () => void;
  /** Custom container styles */
  style?: ViewStyle;
  /** Accessibility label override */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
}
