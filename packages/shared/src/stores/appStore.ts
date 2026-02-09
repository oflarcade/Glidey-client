import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * App State Store
 * 
 * Unified state management for app initialization flow:
 * Splash → Onboarding (first-time) → Auth → Main
 * 
 * Storage key: @rentascooter/app-state
 */

interface AppState {
  // Persisted state
  hasSeenOnboarding: boolean;
  
  // Runtime state (not persisted)
  isAppReady: boolean;
  splashAnimationComplete: boolean;
  fontsLoaded: boolean;
}

interface AppActions {
  // Onboarding
  markOnboardingComplete: () => void;
  resetOnboarding: () => void;
  
  // Initialization
  setAppReady: (ready: boolean) => void;
  setSplashAnimationComplete: (complete: boolean) => void;
  setFontsLoaded: (loaded: boolean) => void;
  
  // Reset
  reset: () => void;
}

type AppStore = AppState & AppActions;

const initialState: AppState = {
  hasSeenOnboarding: false,
  isAppReady: false,
  splashAnimationComplete: false,
  fontsLoaded: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,

      markOnboardingComplete: () =>
        set({ hasSeenOnboarding: true }),

      resetOnboarding: () =>
        set({ hasSeenOnboarding: false }),

      setAppReady: (ready) =>
        set({ isAppReady: ready }),

      setSplashAnimationComplete: (complete) =>
        set({ splashAnimationComplete: complete }),

      setFontsLoaded: (loaded) =>
        set({ fontsLoaded: loaded }),

      reset: () => set(initialState),
    }),
    {
      name: '@rentascooter/app-state',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist onboarding status - runtime state should reset on app launch
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    }
  )
);

// Selectors for performance optimization
export const selectHasSeenOnboarding = (state: AppStore) => state.hasSeenOnboarding;
export const selectIsAppReady = (state: AppStore) => state.isAppReady;
export const selectSplashAnimationComplete = (state: AppStore) => state.splashAnimationComplete;
export const selectFontsLoaded = (state: AppStore) => state.fontsLoaded;
