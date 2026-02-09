import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingConfig } from '../context/OnboardingContext';

export function useOnboardingStatus() {
  const { config } = useOnboardingConfig();
  const [hasCompleted, setHasCompleted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = config.persistence?.storageKey || '@rentascooter/onboarding-completed';
  const persistenceEnabled = config.persistence?.enabled ?? true;

  // Check if onboarding has been completed
  useEffect(() => {
    async function checkStatus() {
      if (!persistenceEnabled) {
        setHasCompleted(false);
        setIsLoading(false);
        return;
      }

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
  }, [storageKey, persistenceEnabled]);

  // Mark onboarding as completed
  const markCompleted = useCallback(async () => {
    if (persistenceEnabled) {
      try {
        await AsyncStorage.setItem(storageKey, 'true');
      } catch (error) {
        console.error('Failed to save onboarding status:', error);
      }
    }
    setHasCompleted(true);
  }, [storageKey, persistenceEnabled]);

  // Reset onboarding (for testing)
  const reset = useCallback(async () => {
    if (persistenceEnabled) {
      try {
        await AsyncStorage.removeItem(storageKey);
      } catch (error) {
        console.error('Failed to reset onboarding status:', error);
      }
    }
    setHasCompleted(false);
  }, [storageKey, persistenceEnabled]);

  return {
    hasCompleted,
    isLoading,
    markCompleted,
    reset,
  };
}
