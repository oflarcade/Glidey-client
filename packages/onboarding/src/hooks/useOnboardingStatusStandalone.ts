import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Standalone hook for checking onboarding status.
 * Use this when you need to check onboarding status OUTSIDE of OnboardingProvider
 * (e.g., in splash screens or root layouts).
 *
 * For use inside OnboardingProvider, use useOnboardingStatus instead.
 */
export function useOnboardingStatusStandalone(storageKey: string) {
  const [hasCompleted, setHasCompleted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if onboarding has been completed
  useEffect(() => {
    async function checkStatus() {
      try {
        const value = await AsyncStorage.getItem(storageKey);
        setHasCompleted(value === 'true');
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        setHasCompleted(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, [storageKey]);

  // Mark onboarding as completed
  const markCompleted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(storageKey, 'true');
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
    setHasCompleted(true);
  }, [storageKey]);

  // Reset onboarding (for testing)
  const reset = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to reset onboarding status:', error);
    }
    setHasCompleted(false);
  }, [storageKey]);

  return {
    hasCompleted,
    isLoading,
    markCompleted,
    reset,
  };
}
