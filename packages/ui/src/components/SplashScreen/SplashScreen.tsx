import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { neutralColors, primaryColors } from '../../theme/colors';
import { typography, spacing } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOGO_SIZE = SCREEN_WIDTH * 0.4;

const ANIMATION_CONFIG = {
  logoFadeInDuration: 800,
  logoScaleStartValue: 0.85,
  logoScaleEndValue: 1,
  textFadeDelay: 600,
  textFadeDuration: 600,
  totalDuration: 2000,
} as const;

export interface SplashScreenProps {
  /** Image source for the logo */
  logoSource: ImageSourcePropType;
  /** Callback fired when animation completes */
  onAnimationComplete?: () => void;
  /** App name displayed below the logo */
  appName?: string;
  /** Footer text displayed at bottom */
  footerText?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * SplashScreen Component
 *
 * Animated splash screen with centered logo and footer text.
 * Logo fades in and scales up, followed by footer text fade in.
 *
 * @example
 * ```tsx
 * <SplashScreen
 *   logoSource={require('@/assets/Logo.png')}
 *   onAnimationComplete={() => navigation.navigate('Onboarding')}
 * />
 * ```
 */
export function SplashScreen({
  logoSource,
  onAnimationComplete,
  appName,
  footerText = 'Product of Embedded Innovation',
  testID,
}: SplashScreenProps) {
  const insets = useSafeAreaInsets();

  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(
    new Animated.Value(ANIMATION_CONFIG.logoScaleStartValue)
  ).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const appNameOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo fade in and scale up animation
    const logoAnimation = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: ANIMATION_CONFIG.logoFadeInDuration,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: ANIMATION_CONFIG.logoScaleEndValue,
        duration: ANIMATION_CONFIG.logoFadeInDuration,
        useNativeDriver: true,
      }),
    ]);

    // App name fade in animation (with delay after logo)
    const appNameAnimation = Animated.timing(appNameOpacity, {
      toValue: 1,
      duration: ANIMATION_CONFIG.textFadeDuration,
      delay: ANIMATION_CONFIG.textFadeDelay,
      useNativeDriver: true,
    });

    // Text fade in animation (with delay)
    const textAnimation = Animated.timing(textOpacity, {
      toValue: 1,
      duration: ANIMATION_CONFIG.textFadeDuration,
      delay: ANIMATION_CONFIG.textFadeDelay + 200,
      useNativeDriver: true,
    });

    // Run animations in sequence for proper timing
    Animated.parallel([logoAnimation, appNameAnimation, textAnimation]).start();

    // Fire completion callback after total duration
    const completionTimer = setTimeout(() => {
      onAnimationComplete?.();
    }, ANIMATION_CONFIG.totalDuration);

    return () => {
      clearTimeout(completionTimer);
    };
  }, [logoOpacity, logoScale, textOpacity, appNameOpacity, onAnimationComplete]);

  return (
    <View style={styles.container} testID={testID}>
      {/* Centered Logo and App Name */}
      <View style={styles.logoContainer}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={logoSource}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="App logo"
          />
        </Animated.View>
        {appName && (
          <Animated.View style={[styles.appNameContainer, { opacity: appNameOpacity }]}>
            <Text style={styles.appNameText} accessibilityRole="text">
              {appName}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Footer Text */}
      <Animated.View
        style={[
          styles.footerContainer,
          {
            opacity: textOpacity,
            paddingBottom: Math.max(insets.bottom, spacing.lg),
          },
        ]}
      >
        <Text style={styles.footerText} accessibilityRole="text">
          {footerText}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appNameContainer: {
    marginTop: spacing.md,
  },
  appNameText: {
    ...typography.h2,
    color: neutralColors[900],
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 1,
  },
  footerContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  footerText: {
    ...typography.body,
    color: '#000000',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
