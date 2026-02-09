import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Defs, G, Filter, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeBlend } from 'react-native-svg';
import { colors, primaryColors, secondaryColors, semanticColors } from '../theme';

/**
 * MapPin Variants
 * - pickup: Green pin for pickup location
 * - destination: Orange/red pin for drop-off destination
 * - default: Yellow pin for user's current location
 */
export type MapPinVariant = 'pickup' | 'destination' | 'default';

/**
 * MapPin Sizes
 * - sm: Small (20px) - for dense map views
 * - md: Medium (28px) - default
 * - lg: Large (36px) - for emphasis
 */
export type MapPinSize = 'sm' | 'md' | 'lg';

export interface MapPinProps {
  /** Visual variant determining the pin color */
  variant?: MapPinVariant;
  /** Size of the pin */
  size?: MapPinSize;
  /** Additional styles for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

const SIZE_CONFIG: Record<MapPinSize, { container: number; circle: number; innerCircle: number; offset: number }> = {
  sm: { container: 20, circle: 8, innerCircle: 3, offset: 2 },
  md: { container: 28, circle: 12, innerCircle: 4, offset: 3 },
  lg: { container: 36, circle: 16, innerCircle: 5, offset: 4 },
};

const VARIANT_COLORS: Record<MapPinVariant, string> = {
  pickup: semanticColors.success, // Green
  destination: secondaryColors[500], // Orange
  default: primaryColors[400], // Yellow
};

/**
 * MapPin Component
 * 
 * Displays location pins on map interfaces for pickup/destination points.
 * 
 * @example
 * ```tsx
 * <MapPin variant="pickup" size="md" />
 * <MapPin variant="destination" />
 * <MapPin variant="default" size="lg" />
 * ```
 * 
 * Acceptance Criteria:
 * - AC-MPN-001: Pickup variant displays green color
 * - AC-MPN-002: Destination variant displays orange color
 * - AC-MPN-003: Default variant displays yellow color (user location)
 * - AC-MPN-004: Small size renders at 20px
 * - AC-MPN-005: Medium size renders at 28px (default)
 * - AC-MPN-006: Large size renders at 36px
 * - AC-MPN-007: Pin has white border and inner white dot
 * - AC-MPN-008: Pin has subtle drop shadow for depth
 */
export function MapPin({
  variant = 'default',
  size = 'md',
  style,
  testID,
}: MapPinProps) {
  const config = SIZE_CONFIG[size];
  const fillColor = VARIANT_COLORS[variant];
  
  // SVG dimensions include shadow padding
  const svgSize = config.container + 8;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2 - 2; // Offset for shadow

  return (
    <View
      style={[
        styles.container,
        { width: config.container, height: config.container },
        style,
      ]}
      testID={testID}
    >
      <Svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        style={styles.svg}
      >
        {/* Shadow layer - simulated with semi-transparent circle */}
        <Circle
          cx={centerX}
          cy={centerY + 2}
          r={config.circle}
          fill="rgba(0, 0, 0, 0.15)"
        />
        
        {/* Main colored circle with white border */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={config.circle}
          fill={fillColor}
          stroke="white"
          strokeWidth={2}
        />
        
        {/* Inner white dot */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={config.innerCircle}
          fill="white"
        />
      </Svg>
    </View>
  );
}

/**
 * UserLocationPin Component
 * 
 * Special variant for displaying the user's current location with a navigation arrow.
 * Uses the default yellow color with an arrow icon inside.
 */
export interface UserLocationPinProps {
  /** Size of the pin */
  size?: MapPinSize;
  /** Rotation angle in degrees for the direction indicator */
  rotation?: number;
  /** Additional styles for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

const USER_SIZE_CONFIG: Record<MapPinSize, { container: number; circle: number; arrowScale: number }> = {
  sm: { container: 20, circle: 8, arrowScale: 0.5 },
  md: { container: 28, circle: 12, arrowScale: 0.7 },
  lg: { container: 36, circle: 16, arrowScale: 1 },
};

/**
 * UserLocationPin Component
 * 
 * Displays the user's current location with a navigation arrow icon.
 * 
 * @example
 * ```tsx
 * <UserLocationPin size="md" rotation={45} />
 * ```
 * 
 * Acceptance Criteria:
 * - AC-MPN-009: User location pin shows navigation arrow
 * - AC-MPN-010: User location pin uses yellow color
 * - AC-MPN-011: Arrow rotates based on rotation prop
 */
export function UserLocationPin({
  size = 'md',
  rotation = 0,
  style,
  testID,
}: UserLocationPinProps) {
  const config = USER_SIZE_CONFIG[size];
  const fillColor = primaryColors[400]; // Yellow
  
  const svgSize = config.container + 8;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2 - 2;
  
  // Navigation arrow path - scaled and centered
  const arrowSize = 12 * config.arrowScale;
  const arrowOffset = arrowSize / 2;

  return (
    <View
      style={[
        styles.container,
        { width: config.container, height: config.container },
        style,
      ]}
      testID={testID}
    >
      <Svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        style={styles.svg}
      >
        {/* Shadow layer */}
        <Circle
          cx={centerX}
          cy={centerY + 2}
          r={config.circle}
          fill="rgba(0, 0, 0, 0.15)"
        />
        
        {/* Main yellow circle with white border */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={config.circle}
          fill={fillColor}
          stroke="white"
          strokeWidth={2}
        />
        
        {/* Navigation arrow icon */}
        <G
          transform={`translate(${centerX - arrowOffset}, ${centerY - arrowOffset}) rotate(${rotation}, ${arrowOffset}, ${arrowOffset})`}
        >
          <Path
            d={`M${arrowSize / 2} 0 L${arrowSize} ${arrowSize * 0.8} L${arrowSize / 2} ${arrowSize * 0.6} L0 ${arrowSize * 0.8} Z`}
            fill={colors.text.primary}
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
});
