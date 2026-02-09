/**
 * DestinationPin Component
 * RentAScooter Design System
 *
 * Custom map marker for destination location.
 * Design: Round primary color base (yellow), white circle on top, arrow pointing down.
 * Features drop-in animation using React Native Animated API.
 *
 * @acceptance AC-DPN-001: Pin displays yellow base circle (40px)
 * @acceptance AC-DPN-002: Pin displays white circle on top (20px)
 * @acceptance AC-DPN-003: Pin has arrow pointing down
 * @acceptance AC-DPN-004: Pin animates with spring effect on mount
 * @acceptance AC-DPN-005: Pin has shadow/elevation for depth
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, AccessibilityInfo } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { lightColors } from '../../theme/colors';
import type { DestinationPinProps } from './types';

export function DestinationPin({
  size = 40,
  style,
  testID = 'destination-pin',
  animated = true,
  label,
}: DestinationPinProps) {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const shouldAnimate = animated && !reduceMotionEnabled;
  
  const dropAnim = useRef(new Animated.Value(shouldAnimate ? -50 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(shouldAnimate ? 0.5 : 1)).current;

  // Check for reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotionEnabled(enabled);
    });
  }, []);

  useEffect(() => {
    if (shouldAnimate) {
      // Spring animation for drop-in effect
      // Uses native driver for 60fps performance
      Animated.parallel([
        Animated.spring(dropAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldAnimate, dropAnim, scaleAnim]);

  const animatedStyle = shouldAnimate
    ? {
        transform: [
          { translateY: dropAnim },
          { scale: scaleAnim },
        ],
      }
    : {};

  const whiteCircleSize = size * 0.5;
  const arrowHeight = size * 0.25;

  return (
    <Animated.View
      style={[styles.container, animatedStyle, style]}
      testID={testID}
      accessible={true}
      accessibilityLabel="Destination marker"
      accessibilityRole="image"
    >
      {/* Shadow layer */}
      <View style={[styles.shadow, { width: size, height: size + arrowHeight }]} />

      {/* Pin SVG */}
      <Svg
        width={size}
        height={size + arrowHeight}
        viewBox={`0 0 ${size} ${size + arrowHeight}`}
        style={styles.svg}
      >
        {/* Yellow base circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2}
          fill={lightColors.primary[400]}
        />

        {/* White circle on top */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={whiteCircleSize / 2}
          fill="white"
        />

        {/* Arrow pointing down */}
        <Path
          d={`M ${size / 2 - 6} ${size} L ${size / 2} ${size + arrowHeight} L ${size / 2 + 6} ${size} Z`}
          fill={lightColors.primary[400]}
        />
      </Svg>
      {label ? (
        <View style={styles.labelContainer}>
          <Text style={[styles.labelText, { maxWidth: size * 3 }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  shadow: {
    position: 'absolute',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },

  svg: {
    overflow: 'visible',
  },

  labelContainer: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    maxWidth: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  labelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
