import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { semanticColors } from '../../theme';
import type { UserLocationMarkerProps, SizeConfig, UserLocationMarkerSize } from './types';

// Size configurations
const SIZE_CONFIGS: Record<UserLocationMarkerSize, SizeConfig> = {
  sm: {
    container: 32,
    outerRadius: 12,
    innerRadius: 6,
    borderWidth: 2,
    arrowSize: 8,
  },
  md: {
    container: 48,
    outerRadius: 18,
    innerRadius: 9,
    borderWidth: 3,
    arrowSize: 12,
  },
  lg: {
    container: 64,
    outerRadius: 24,
    innerRadius: 12,
    borderWidth: 4,
    arrowSize: 16,
  },
};

// Default user location color (Mapbox-like blue)
const DEFAULT_LOCATION_COLOR = '#007AFF';

/**
 * UserLocationMarker Component
 *
 * A custom user location indicator with pulsing animation,
 * optional accuracy circle, and heading indicator.
 *
 * @example
 * ```tsx
 * <UserLocationMarker
 *   size="md"
 *   heading={45}
 *   animated
 *   showHeadingIndicator
 * />
 * ```
 *
 * Acceptance Criteria:
 * - AC-ULM-001: Displays pulsing blue dot when animated
 * - AC-ULM-002: Shows accuracy circle when showAccuracyCircle is true
 * - AC-ULM-003: Shows heading arrow when showHeadingIndicator is true
 * - AC-ULM-004: Arrow rotates based on heading prop
 * - AC-ULM-005: Supports sm, md, lg size variants
 */
export function UserLocationMarker({
  size = 'md',
  heading = 0,
  accuracy,
  showAccuracyCircle = false,
  showHeadingIndicator = false,
  animated = true,
  color = DEFAULT_LOCATION_COLOR,
  style,
  testID,
}: UserLocationMarkerProps) {
  const config = SIZE_CONFIGS[size];
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  // Pulsing animation
  useEffect(() => {
    if (!animated) {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.4);
      return;
    }

    const pulseAnimation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [animated, pulseAnim, opacityAnim]);

  // Calculate accuracy circle radius (scaled to container)
  const accuracyRadius = accuracy
    ? Math.min(config.container / 2, accuracy / 2)
    : config.outerRadius + 8;

  const svgSize = config.container;
  const center = svgSize / 2;

  return (
    <View
      style={[
        styles.container,
        { width: config.container, height: config.container },
        style,
      ]}
      testID={testID}
    >
      {/* Pulsing ring animation */}
      {animated && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: config.outerRadius * 2 + 8,
              height: config.outerRadius * 2 + 8,
              borderRadius: config.outerRadius + 4,
              backgroundColor: color,
              opacity: opacityAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <Defs>
          <RadialGradient id="accuracyGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </RadialGradient>
        </Defs>

        {/* Accuracy circle */}
        {showAccuracyCircle && (
          <Circle
            cx={center}
            cy={center}
            r={accuracyRadius}
            fill="url(#accuracyGradient)"
            stroke={color}
            strokeWidth={1}
            strokeOpacity={0.3}
          />
        )}

        {/* Outer white border circle */}
        <Circle
          cx={center}
          cy={center}
          r={config.outerRadius}
          fill="white"
          stroke="rgba(0, 0, 0, 0.1)"
          strokeWidth={1}
        />

        {/* Main colored circle */}
        <Circle
          cx={center}
          cy={center}
          r={config.outerRadius - config.borderWidth}
          fill={color}
        />

        {/* Inner white dot */}
        <Circle cx={center} cy={center} r={config.innerRadius / 2} fill="white" />

        {/* Heading indicator arrow */}
        {showHeadingIndicator && (
          <G
            transform={`rotate(${heading}, ${center}, ${center})`}
            origin={`${center}, ${center}`}
          >
            <Path
              d={`
                M ${center} ${center - config.outerRadius - config.arrowSize}
                L ${center - config.arrowSize / 2} ${center - config.outerRadius}
                L ${center + config.arrowSize / 2} ${center - config.outerRadius}
                Z
              `}
              fill={color}
              stroke="white"
              strokeWidth={1}
            />
          </G>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
  },
});

export default UserLocationMarker;
