import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as ExpoSplash from 'expo-splash-screen';

import { SplashScreen } from '@rentascooter/ui';
import { useAuth } from '@rentascooter/auth';
import { useOnboardingStatusStandalone } from '@rentascooter/onboarding';

/**
 * Client App Splash Screen
 *
 * Displays the custom animated splash screen and handles navigation
 * based on authentication and onboarding state.
 *
 * Navigation flow:
 * 1. First time user → /(onboarding)
 * 2. Not authenticated → /(auth)/login
 * 3. Authenticated → /(main)
 */
export default function Splash() {
  const [animationComplete, setAnimationComplete] = useState(false);
  const { isAuthenticated, isInitialized } = useAuth();
  const { hasCompleted: hasCompletedOnboarding, isLoading: isLoadingOnboarding } =
    useOnboardingStatusStandalone('@rentascooter/client-onboarding');

  // Hide expo splash screen immediately when this screen mounts
  useEffect(() => {
    ExpoSplash.hideAsync();
  }, []);

  // Handle navigation after animation and initialization are complete
  useEffect(() => {
    if (!animationComplete || !isInitialized || isLoadingOnboarding) {
      return;
    }

    // Determine the correct route based on state
    if (!hasCompletedOnboarding) {
      router.replace('/(onboarding)');
    } else if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(main)');
    }
  }, [
    animationComplete,
    isInitialized,
    isLoadingOnboarding,
    hasCompletedOnboarding,
    isAuthenticated,
  ]);

  return (
    <SplashScreen
      logoSource={require('@/assets/Logo.png')}
      appName="GLIDEY"
      onAnimationComplete={() => setAnimationComplete(true)}
    />
  );
}
