import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { AppLogo } from './AppLogo';
import { Text } from './Text';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Splash background - dark navy matching logo background */
const SPLASH_BACKGROUND = '#242a37';

/** Logo fade-in animation duration */
const FADE_IN_DURATION = 400;

/** Logo scale animation values */
const SCALE_START = 0.8;
const SCALE_END = 1;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

/**
 * SplashScreen Props
 *
 * @acceptance AC-SPL-001: Displays full-screen splash with app logo
 * @acceptance AC-SPL-002: Supports client and driver variants
 * @acceptance AC-SPL-003: Includes fade-in animation for branding
 */
export interface SplashScreenProps {
  /** App variant determines logo and text */
  variant?: 'client' | 'driver';
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * SplashScreen Component
 *
 * Full-screen branded splash screen displayed during app initialization.
 * Shows the app logo with a smooth fade-in animation.
 *
 * @example
 * // Client app splash
 * <SplashScreen variant="client" />
 *
 * @example
 * // Driver app splash
 * <SplashScreen variant="driver" />
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({
  variant = 'client',
  testID = 'splash-screen',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(SCALE_START)).current;

  useEffect(() => {
    // Animate logo on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: FADE_IN_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: SCALE_END,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const appName = variant === 'driver' ? 'Glidey Driver' : 'Glidey';

  return (
    <View style={styles.container} testID={testID}>
      <StatusBar barStyle="light-content" backgroundColor={SPLASH_BACKGROUND} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <AppLogo variant={variant} size="xl" style={styles.logo} />
        <Text style={styles.appName}>{appName}</Text>
        <Text style={styles.tagline}>
          {variant === 'driver' ? 'Drive & Earn' : 'Ride with ease'}
        </Text>
      </Animated.View>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
      },
    }),
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    marginBottom: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
});

export default SplashScreen;
