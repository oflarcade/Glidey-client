/**
 * AssetIcon Component
 * RentAScooter Design System
 *
 * Renders SVG icons from asset files using react-native-svg-transformer.
 * This component uses actual SVG file imports (not hand-drawn paths).
 *
 * SETUP REQUIRED:
 * Apps using this component must configure react-native-svg-transformer in metro.config.js
 * and install the required dependencies:
 *   - react-native-svg
 *   - react-native-svg-transformer
 *
 * @example
 * ```tsx
 * import { AssetIcon } from '@rentascooter/ui';
 *
 * <AssetIcon name="helmet" size={24} color="#000" />
 * <AssetIcon name="scooter" size={32} color="#F5CE2F" />
 * ```
 */

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { SvgProps } from 'react-native-svg';

// =============================================================================
// SVG IMPORTS
// =============================================================================

import BulletIcon from '../assets/icons/bullet.svg';
import CameraIcon from '../assets/icons/camera.svg';
import CardIcon from '../assets/icons/card.svg';
import CloseIcon from '../assets/icons/close.svg';
import DestinationPinIcon from '../assets/icons/destination-pin.svg';
import DriverPinIcon from '../assets/icons/driver-pin.svg';
import EditIcon from '../assets/icons/edit.svg';
import HelmetIcon from '../assets/icons/helmet.svg';
import HomeIcon from '../assets/icons/home.svg';
import IDContactIcon from '../assets/icons/ID-contact.svg';
import LikeIcon from '../assets/icons/like.svg';
import MenuIcon from '../assets/icons/menu.svg';
import MessageIcon from '../assets/icons/message.svg';
import NotificationIcon from '../assets/icons/notification.svg';
import OrderIcon from '../assets/icons/order.svg';
import PhoneIcon from '../assets/icons/phone.svg';
import PlaceIcon from '../assets/icons/place.svg';
import PositionIcon from '../assets/icons/position.svg';
import ReportIcon from '../assets/icons/report.svg';
import ScooterIcon from '../assets/icons/scooter.svg';
import SettingsIcon from '../assets/icons/settings.svg';
import SpeedIcon from '../assets/icons/speed.svg';
import StartFilledIcon from '../assets/icons/start-filled.svg';
import StartPositionAddressIcon from '../assets/icons/start-position-address.svg';
import UserPinIcon from '../assets/icons/user-pin.svg';
import UserSilhouetteIcon from '../assets/icons/user-silhouette.svg';

// =============================================================================
// ICON REGISTRY
// =============================================================================

/**
 * Asset Icon Registry
 * Maps icon names to their SVG components
 */
export const assetIconRegistry = {
  bullet: BulletIcon,
  camera: CameraIcon,
  card: CardIcon,
  close: CloseIcon,
  'destination-pin': DestinationPinIcon,
  'driver-pin': DriverPinIcon,
  edit: EditIcon,
  helmet: HelmetIcon,
  home: HomeIcon,
  'ID-contact': IDContactIcon,
  like: LikeIcon,
  menu: MenuIcon,
  message: MessageIcon,
  notification: NotificationIcon,
  order: OrderIcon,
  phone: PhoneIcon,
  place: PlaceIcon,
  position: PositionIcon,
  report: ReportIcon,
  scooter: ScooterIcon,
  settings: SettingsIcon,
  speed: SpeedIcon,
  'start-filled': StartFilledIcon,
  'start-position-address': StartPositionAddressIcon,
  'user-pin': UserPinIcon,
  'user-silhouette': UserSilhouetteIcon,
} as const;

/**
 * Available asset icon names
 */
export type AssetIconName = keyof typeof assetIconRegistry;

// =============================================================================
// SIZE PRESETS
// =============================================================================

export const assetIconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  '2xl': 48,
} as const;

export type AssetIconSize = keyof typeof assetIconSizes;

// =============================================================================
// COMPONENT TYPES
// =============================================================================

export interface AssetIconProps {
  /** Name of the icon from the registry */
  name: AssetIconName;
  /**
   * Size of the icon
   * Can be a preset ('xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl') or a number in pixels
   * @default 'md' (24px)
   */
  size?: AssetIconSize | number;
  /**
   * Color to fill the icon
   * Accepts any valid color string (hex, rgb, rgba, named colors)
   * Note: Only works if the SVG paths use `fill="currentColor"` or have fill attributes
   */
  color?: string;
  /**
   * Stroke color for the icon
   * Some icons use strokes instead of fills
   */
  strokeColor?: string;
  /**
   * Container style
   */
  style?: ViewStyle;
  /**
   * Test ID for testing
   */
  testID?: string;
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * AssetIcon Component
 *
 * Renders SVG icons from imported asset files.
 * Uses react-native-svg-transformer to convert SVG files to React Native components.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AssetIcon name="helmet" />
 *
 * // With size preset
 * <AssetIcon name="scooter" size="lg" />
 *
 * // With custom size and color
 * <AssetIcon name="phone" size={28} color="#F5CE2F" />
 *
 * // With accessibility
 * <AssetIcon name="user-pin" accessibilityLabel="User location" />
 * ```
 */
export function AssetIcon({
  name,
  size = 'md',
  color,
  strokeColor,
  style,
  testID,
  accessibilityLabel,
}: AssetIconProps) {
  const IconComponent = assetIconRegistry[name];

  if (!IconComponent) {
    if (__DEV__) {
      console.warn(
        `[AssetIcon] Icon "${name}" not found in registry. ` +
        `Available icons: ${getAssetIconNames().join(', ')}`
      );
    }
    return null;
  }

  // Resolve size value
  const sizeValue = typeof size === 'number' ? size : assetIconSizes[size];

  // Build SVG props
  const svgProps: SvgProps = {
    width: sizeValue,
    height: sizeValue,
  };

  // Apply color if provided (both fill and color for currentColor support)
  if (color) {
    svgProps.fill = color;
    svgProps.color = color; // Required for currentColor in SVG paths
  }

  // Apply stroke color if provided
  if (strokeColor) {
    svgProps.stroke = strokeColor;
  }

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <IconComponent {...svgProps} />
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Get all available asset icon names
 */
export const getAssetIconNames = (): AssetIconName[] =>
  Object.keys(assetIconRegistry) as AssetIconName[];

/**
 * Check if an icon exists in the asset registry
 */
export const hasAssetIcon = (name: string): name is AssetIconName =>
  name in assetIconRegistry;

/**
 * Get the size value for a size preset
 */
export const getAssetIconSize = (size: AssetIconSize | number): number =>
  typeof size === 'number' ? size : assetIconSizes[size];
