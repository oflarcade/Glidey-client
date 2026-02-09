import { useEffect, useCallback, useMemo } from 'react';
import { useAppStore, selectHasSeenOnboarding, selectFontsLoaded, selectSplashAnimationComplete } from '../stores/appStore';

/**
 * App Initialization Hook
 * 
 * Combines all initialization states to determine app readiness:
 * - Fonts loaded (external dependency)
 * - Splash animation complete
 * - Auth initialized (external dependency)
 * 
 * Flow logic:
 * 1. Show splash while fonts load + splash animation plays
 * 2. Once ready, route based on:
 *    - !hasSeenOnboarding → Onboarding screens
 *    - !isAuthenticated → Auth screens
 *    - else → Main app
 */

interface UseAppInitializationOptions {
  /** Whether fonts have finished loading (from useFonts) */
  fontsLoaded?: boolean;
  /** Whether auth store has been initialized */
  authInitialized?: boolean;
  /** Whether user is authenticated */
  isAuthenticated?: boolean;
}

interface AppInitializationResult {
  /** All initialization complete, app ready to show content */
  isReady: boolean;
  /** User has completed onboarding before */
  hasSeenOnboarding: boolean;
  /** Mark onboarding as complete */
  markOnboardingComplete: () => void;
  /** Reset onboarding (for testing/development) */
  resetOnboarding: () => void;
  /** Mark splash animation as complete */
  completeSplashAnimation: () => void;
  /** Determine which route to show */
  initialRoute: 'splash' | 'onboarding' | 'auth' | 'main';
}

export function useAppInitialization(
  options: UseAppInitializationOptions = {}
): AppInitializationResult {
  const {
    fontsLoaded: externalFontsLoaded = false,
    authInitialized = false,
    isAuthenticated = false,
  } = options;

  // Store state
  const hasSeenOnboarding = useAppStore(selectHasSeenOnboarding);
  const splashAnimationComplete = useAppStore(selectSplashAnimationComplete);
  const storeFontsLoaded = useAppStore(selectFontsLoaded);
  
  // Store actions
  const {
    markOnboardingComplete,
    resetOnboarding,
    setSplashAnimationComplete,
    setFontsLoaded,
    setAppReady,
  } = useAppStore();

  // Sync external fonts loaded state to store
  useEffect(() => {
    if (externalFontsLoaded && !storeFontsLoaded) {
      setFontsLoaded(true);
    }
  }, [externalFontsLoaded, storeFontsLoaded, setFontsLoaded]);

  // Calculate readiness
  const isReady = useMemo(() => {
    return externalFontsLoaded && splashAnimationComplete && authInitialized;
  }, [externalFontsLoaded, splashAnimationComplete, authInitialized]);

  // Update app ready state
  useEffect(() => {
    setAppReady(isReady);
  }, [isReady, setAppReady]);

  // Determine initial route based on state
  const initialRoute = useMemo((): 'splash' | 'onboarding' | 'auth' | 'main' => {
    // Still loading
    if (!isReady) {
      return 'splash';
    }
    
    // First-time user
    if (!hasSeenOnboarding) {
      return 'onboarding';
    }
    
    // Not logged in
    if (!isAuthenticated) {
      return 'auth';
    }
    
    // Ready for main app
    return 'main';
  }, [isReady, hasSeenOnboarding, isAuthenticated]);

  const completeSplashAnimation = useCallback(() => {
    setSplashAnimationComplete(true);
  }, [setSplashAnimationComplete]);

  return {
    isReady,
    hasSeenOnboarding,
    markOnboardingComplete,
    resetOnboarding,
    completeSplashAnimation,
    initialRoute,
  };
}
