import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthState, AuthUser, UserProfile, AppType } from './types';

// Phone auth state for OTP verification flow
interface PhoneAuthState {
  verificationId: string | null;
  pendingPhone: string | null;
  otpSent: boolean;
}

interface AuthStore extends AuthState {
  // Phone auth state
  phoneAuth: PhoneAuthState;

  // Actions
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  setInitialized: (isInitialized: boolean) => void;
  setAppType: (appType: AppType) => void;
  setPhoneAuth: (phoneAuth: Partial<PhoneAuthState>) => void;
  resetPhoneAuth: () => void;
  logout: () => void;
  reset: () => void;
}

const initialPhoneAuthState: PhoneAuthState = {
  verificationId: null,
  pendingPhone: null,
  otpSent: false,
};

const initialState: AuthState & { phoneAuth: PhoneAuthState } = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  appType: 'client',
  phoneAuth: initialPhoneAuthState,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setProfile: (profile) =>
        set({
          profile,
        }),

      setLoading: (isLoading) =>
        set({
          isLoading,
        }),

      setInitialized: (isInitialized) =>
        set({
          isInitialized,
          isLoading: false,
        }),

      setAppType: (appType) =>
        set({
          appType,
        }),

      setPhoneAuth: (phoneAuth) =>
        set((state) => ({
          phoneAuth: {
            ...state.phoneAuth,
            ...phoneAuth,
          },
        })),

      resetPhoneAuth: () =>
        set({
          phoneAuth: initialPhoneAuthState,
        }),

      logout: () =>
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          phoneAuth: initialPhoneAuthState,
        }),

      reset: () => set(initialState),
    }),
    {
      name: '@rentascooter/auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        appType: state.appType,
        // Note: phoneAuth is intentionally NOT persisted to avoid stale OTP state
      }),
    }
  )
);

// Selectors for performance
export const selectUser = (state: AuthStore) => state.user;
export const selectProfile = (state: AuthStore) => state.profile;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectIsInitialized = (state: AuthStore) => state.isInitialized;
export const selectAppType = (state: AuthStore) => state.appType;
export const selectPhoneAuth = (state: AuthStore) => state.phoneAuth;
