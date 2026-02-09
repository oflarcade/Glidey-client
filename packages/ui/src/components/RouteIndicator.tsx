/**
 * RouteIndicator Component
 * RentAScooter Design System
 *
 * A visual component showing a route from start to destination
 * with a dashed line connecting two location dots.
 *
 * Based on the Figma destination-pin.svg design.
 */

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { lightColors } from '../theme/colors';

// =============================================================================
// TYPES
// =============================================================================

export interface RouteIndicatorProps {
  /** Height of the component (width is auto-calculated) */
  height?: number;
  /** Color for the start dot (default: golden/primary) */
  startColor?: string;
  /** Color for the end dot (default: dark) */
  endColor?: string;
  /** Color for the dashed line (default: gray) */
  lineColor?: string;
  /** Container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * RouteIndicator Component
 *
 * Displays a visual route indicator with start and end points
 * connected by a dashed line. Used in ride booking flows.
 *
 * @example
 * // Default usage
 * <RouteIndicator />
 *
 * // Custom height
 * <RouteIndicator height={120} />
 *
 * // Custom colors
 * <RouteIndicator
 *   startColor="#00A651"
 *   endColor="#E31B23"
 *   lineColor="#CCCCCC"
 * />
 */
export function RouteIndicator({
  height = 98,
  startColor = lightColors.primary[400], // Golden yellow
  endColor = '#33322E', // Dark
  lineColor = '#979797', // Gray
  style,
  testID,
}: RouteIndicatorProps) {
  // Calculate proportional dimensions based on original 18x98 viewBox
  const width = Math.round((18 / 98) * height);
  
  // Circle radius and stroke width (proportional)
  const circleRadius = 5.5;
  const strokeWidth = 6;
  
  // Calculate Y positions for circles (proportional to height)
  const startY = 9; // Original Y position for start circle
  const endY = 89; // Original Y position for end circle

  return (
    <View style={style} testID={testID}>
      <Svg width={width} height={height} viewBox="0 0 18 98" fill="none">
        {/* Dashed line connecting the two points */}
        <Path
          d="M8.74356 9V92"
          stroke={lineColor}
          strokeDasharray="3"
        />
        
        {/* End/Destination dot (dark) */}
        <Circle
          cx={8.74316}
          cy={endY}
          r={circleRadius}
          fill="white"
          stroke={endColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Start dot (golden) */}
        <Circle
          cx={8.74316}
          cy={startY}
          r={circleRadius}
          fill="white"
          stroke={startColor}
          strokeWidth={strokeWidth}
        />
      </Svg>
    </View>
  );
}

// =============================================================================
// VARIANTS - Horizontal Route Indicator
// =============================================================================

export interface HorizontalRouteIndicatorProps {
  /** Width of the component */
  width?: number;
  /** Color for the start dot (default: golden/primary) */
  startColor?: string;
  /** Color for the end dot (default: dark) */
  endColor?: string;
  /** Color for the dashed line (default: gray) */
  lineColor?: string;
  /** Container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * HorizontalRouteIndicator Component
 *
 * Horizontal variant of the route indicator for compact layouts.
 *
 * @example
 * <HorizontalRouteIndicator width={200} />
 */
export function HorizontalRouteIndicator({
  width = 200,
  startColor = lightColors.primary[400],
  endColor = '#33322E',
  lineColor = '#979797',
  style,
  testID,
}: HorizontalRouteIndicatorProps) {
  const height = 18;
  const circleRadius = 5.5;
  const strokeWidth = 6;
  
  return (
    <View style={style} testID={testID}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} 18`} fill="none">
        {/* Dashed line connecting the two points */}
        <Line
          x1={9}
          y1={9}
          x2={width - 9}
          y2={9}
          stroke={lineColor}
          strokeDasharray="3"
        />
        
        {/* Start dot (golden) */}
        <Circle
          cx={9}
          cy={9}
          r={circleRadius}
          fill="white"
          stroke={startColor}
          strokeWidth={strokeWidth}
        />
        
        {/* End/Destination dot (dark) */}
        <Circle
          cx={width - 9}
          cy={9}
          r={circleRadius}
          fill="white"
          stroke={endColor}
          strokeWidth={strokeWidth}
        />
      </Svg>
    </View>
  );
}

// =============================================================================
// COMPACT VARIANT - Just the dots for inline use
// =============================================================================

export interface RouteDotsProps {
  /** Type of dot */
  type: 'start' | 'end';
  /** Size of the dot */
  size?: number;
  /** Custom color (overrides type default) */
  color?: string;
  /** Container style */
  style?: ViewStyle;
}

/**
 * RouteDot Component
 *
 * Individual route dot for custom layouts.
 *
 * @example
 * <RouteDot type="start" />
 * <RouteDot type="end" size={24} />
 */
export function RouteDot({
  type,
  size = 18,
  color,
  style,
}: RouteDotsProps) {
  const defaultColor = type === 'start' 
    ? lightColors.primary[400] 
    : '#33322E';
  const strokeColor = color || defaultColor;
  
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
        <Circle
          cx={9}
          cy={9}
          r={5.5}
          fill="white"
          stroke={strokeColor}
          strokeWidth={6}
        />
      </Svg>
    </View>
  );
}

export default RouteIndicator;
