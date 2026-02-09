/**
 * UserPositionPin Component
 *
 * Displays the user's current position on the map with a distinctive
 * round marker featuring a navigation arrow that rotates based on heading.
 *
 * Acceptance Criteria:
 * - AC-UPP-001: Pin displays as round shape with white outer border
 * - AC-UPP-002: Inner circle uses primary color (#FFC629)
 * - AC-UPP-003: Large size is 57x57px, small size is 25x25px
 * - AC-UPP-004: Smooth animation between size variants
 * - AC-UPP-005: Navigation icon rotates based on heading prop
 * - AC-UPP-006: Icon maintains proper contrast on primary background
 * - AC-UPP-007: Heading rotation uses native driver for smooth 60fps animation
 * - AC-UPP-008: Shortest-path rotation (350° → 10° goes through 0°, not 350° → 10° via 180°)
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { primaryColors, neutralColors } from '../../theme';
import type { UserPositionPinProps, UserPositionPinSize, SizeConfig } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Size configurations for each variant
 * Proportions:
 * - Border: ~7% of total size
 * - Inner circle: ~86% of total size
 * - Icon: ~45% of inner circle
 */
const SIZE_CONFIGS: Record<UserPositionPinSize, SizeConfig> = {
  small: {
    container: 25,
    borderWidth: 2,
    innerDiameter: 21,
    iconSize: 10,
  },
  large: {
    container: 57,
    borderWidth: 4,
    innerDiameter: 49,
    iconSize: 22,
  },
};

// Theme colors
const FILL_COLOR = primaryColors[400]; // #FFC629 - Golden Yellow
const ICON_COLOR = neutralColors[900]; // #1A1A2E - Dark Navy
const BORDER_COLOR = '#FFFFFF';
const BORDER_SHADOW_COLOR = 'rgba(0, 0, 0, 0.08)';

// Navigation arrow SVG path (viewBox 0 0 30 26)
const ARROW_PATH =
  'M29.8385 1.94043L16.7435 25.2697C16.4964 25.7566 16.0821 26 15.5007 26C15.428 26 15.319 25.9861 15.1736 25.9583C14.8538 25.8887 14.5958 25.7322 14.3995 25.4888C14.2033 25.2454 14.1052 24.9707 14.1052 24.6647L14.3995 12.309L1.39084 8.85281C1.07103 8.85281 0.783935 8.75892 0.529545 8.57114C0.275156 8.38336 0.11162 8.13646 0.0389368 7.83044C-0.0337452 7.52442 -0.00467263 7.23231 0.126156 6.95412C0.256985 6.67592 0.467765 6.46727 0.758497 6.32817L27.9633 0.146054C28.1522 0.0486839 28.363 0 28.5956 0C28.9881 0 29.3152 0.132144 29.5768 0.396431C29.7949 0.591169 29.9293 0.831115 29.9802 1.11627C30.0311 1.40142 29.9838 1.67614 29.8385 1.94043Z';

const ARROW_VIEWBOX_WIDTH = 30;
const ARROW_VIEWBOX_HEIGHT = 26;

// The original arrow points to upper-right (~45°)
// To make 0° = North (up), we need to rotate it -45° as base offset
const ARROW_BASE_ROTATION = -45;

// =============================================================================
// COMPONENT
// =============================================================================

export function UserPositionPin({
  size = 'large',
  heading = 0,
  animationDuration = 200,
  headingAnimationDuration = 100,
  animated = true,
  animateHeading = true,
  style,
  testID,
}: UserPositionPinProps) {
  const config = SIZE_CONFIGS[size];

  // Animated values for size
  const sizeAnim = useRef(new Animated.Value(config.container)).current;
  const borderAnim = useRef(new Animated.Value(config.borderWidth)).current;
  const innerAnim = useRef(new Animated.Value(config.innerDiameter)).current;
  const iconAnim = useRef(new Animated.Value(config.iconSize)).current;

  // Animated value for heading rotation - start with normalized heading + base offset
  const normalizeHeading = useCallback((h: number) => {
    let normalized = h % 360;
    if (normalized < 0) normalized += 360;
    return normalized;
  }, []);

  const initialRotation = ARROW_BASE_ROTATION + normalizeHeading(heading);
  const headingAnim = useRef(new Animated.Value(initialRotation)).current;
  const prevHeadingRef = useRef(heading);

  // Track previous size for animation direction
  const prevSizeRef = useRef(size);

  // Animate size changes
  useEffect(() => {
    const targetConfig = SIZE_CONFIGS[size];

    if (animated && prevSizeRef.current !== size) {
      const animationConfig = {
        duration: animationDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      };

      Animated.parallel([
        Animated.timing(sizeAnim, {
          toValue: targetConfig.container,
          ...animationConfig,
        }),
        Animated.timing(borderAnim, {
          toValue: targetConfig.borderWidth,
          ...animationConfig,
        }),
        Animated.timing(innerAnim, {
          toValue: targetConfig.innerDiameter,
          ...animationConfig,
        }),
        Animated.timing(iconAnim, {
          toValue: targetConfig.iconSize,
          ...animationConfig,
        }),
      ]).start();
    } else {
      // No animation - set values directly
      sizeAnim.setValue(targetConfig.container);
      borderAnim.setValue(targetConfig.borderWidth);
      innerAnim.setValue(targetConfig.innerDiameter);
      iconAnim.setValue(targetConfig.iconSize);
    }

    prevSizeRef.current = size;
  }, [size, animated, animationDuration, sizeAnim, borderAnim, innerAnim, iconAnim]);

  // Animate heading changes with shortest-path rotation
  useEffect(() => {
    const prevHeading = prevHeadingRef.current;
    const newNormalizedHeading = normalizeHeading(heading);
    const prevNormalizedHeading = normalizeHeading(prevHeading);

    // Calculate shortest path rotation delta
    let delta = newNormalizedHeading - prevNormalizedHeading;

    // Take shortest path (e.g., 350° → 10° should go through 0°, not all around)
    if (delta > 180) {
      delta -= 360;
    } else if (delta < -180) {
      delta += 360;
    }

    // Calculate new target rotation (cumulative to avoid jumps)
    const currentValue = ARROW_BASE_ROTATION + prevNormalizedHeading;
    const targetRotation = currentValue + delta;

    if (animateHeading && Math.abs(delta) > 0.1) {
      // Animate to new heading with short duration for responsiveness
      Animated.timing(headingAnim, {
        toValue: targetRotation,
        duration: headingAnimationDuration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true, // Enable native driver for smooth rotation
      }).start();
    } else {
      // No animation - set value directly
      headingAnim.setValue(targetRotation);
    }

    prevHeadingRef.current = heading;
  }, [heading, animateHeading, headingAnimationDuration, headingAnim, normalizeHeading]);

  // Calculate center position for circle rendering
  const center = config.container / 2;
  const innerRadius = config.innerDiameter / 2;

  // Shadow style for iOS
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  });

  // Animated rotation interpolation for the arrow
  const rotateInterpolation = headingAnim.interpolate({
    inputRange: [-720, 720],
    outputRange: ['-720deg', '720deg'],
    extrapolate: 'extend',
  });

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityLabel="User position marker"
      accessibilityRole="image"
    >
      <Animated.View
        style={[
          styles.pinContainer,
          shadowStyle,
          {
            width: sizeAnim,
            height: sizeAnim,
            borderRadius: Animated.divide(sizeAnim, 2),
          },
        ]}
      >
        {/* Background circles (static) */}
        <Svg
          width={config.container}
          height={config.container}
          viewBox={`0 0 ${config.container} ${config.container}`}
          style={StyleSheet.absoluteFill}
        >
          {/* White outer border circle with subtle shadow */}
          <Circle
            cx={center}
            cy={center}
            r={config.container / 2 - 0.5}
            fill={BORDER_COLOR}
            stroke={BORDER_SHADOW_COLOR}
            strokeWidth={1}
          />

          {/* Inner colored circle (primary yellow) */}
          <Circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill={FILL_COLOR}
          />
        </Svg>

        {/* Navigation arrow with animated rotation (separate layer for native driver support) */}
        <Animated.View
          style={[
            styles.arrowContainer,
            {
              width: config.container,
              height: config.container,
              transform: [{ rotate: rotateInterpolation }],
            },
          ]}
        >
          <Svg
            width={config.iconSize}
            height={config.iconSize}
            viewBox={`0 0 ${ARROW_VIEWBOX_WIDTH} ${ARROW_VIEWBOX_HEIGHT}`}
          >
            <Path d={ARROW_PATH} fill={ICON_COLOR} />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  arrowContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserPositionPin;
