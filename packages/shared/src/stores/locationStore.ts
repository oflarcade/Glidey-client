import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  LocationStore,
  LocationState,
  LocationPermissionStatus,
  UserLocation,
  LocationError,
} from '../types/location';

/**
 * Location Store
 *
 * Centralized state management for location services:
 * - Device location services status (GPS enabled/disabled)
 * - App permission status (granted/denied/undetermined)
 * - Current user location
 * - Last known location (persisted for fast startup)
 *
 * Storage key: @rentascooter/location-state
 */

const initialState: LocationState = {
  isServiceEnabled: null,
  permissionStatus: 'undetermined',
  currentLocation: null,
  lastKnownLocation: null,
  isReady: false,
  isLoading: false,
  error: null,
};

export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setServiceEnabled: (enabled: boolean) =>
        set({ isServiceEnabled: enabled }),

      setPermissionStatus: (status: LocationPermissionStatus) =>
        set({ permissionStatus: status }),

      setLocation: (location: UserLocation | null) =>
        set({
          currentLocation: location,
          // Also update lastKnownLocation if we have a valid location
          ...(location ? { lastKnownLocation: location } : {}),
        }),

      setLoading: (loading: boolean) =>
        set({ isLoading: loading }),

      setReady: (ready: boolean) =>
        set({ isReady: ready }),

      setError: (error: LocationError | null) =>
        set({ error }),

      clearError: () =>
        set({ error: null }),

      reset: () =>
        set({
          ...initialState,
          // Preserve lastKnownLocation across resets for fast startup
          lastKnownLocation: get().lastKnownLocation,
        }),
    }),
    {
      name: '@rentascooter/location-state',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist lastKnownLocation - runtime state should reset on app launch
      partialize: (state) => ({
        lastKnownLocation: state.lastKnownLocation,
      }),
    }
  )
);

// Selectors for performance optimization
export const selectIsServiceEnabled = (state: LocationStore) =>
  state.isServiceEnabled;
export const selectPermissionStatus = (state: LocationStore) =>
  state.permissionStatus;
export const selectCurrentLocation = (state: LocationStore) =>
  state.currentLocation;
export const selectLastKnownLocation = (state: LocationStore) =>
  state.lastKnownLocation;
export const selectIsReady = (state: LocationStore) =>
  state.isReady;
export const selectIsLoading = (state: LocationStore) =>
  state.isLoading;
export const selectLocationError = (state: LocationStore) =>
  state.error;

// Derived selectors
export const selectHasLocation = (state: LocationStore) =>
  state.currentLocation !== null || state.lastKnownLocation !== null;
export const selectBestLocation = (state: LocationStore) =>
  state.currentLocation ?? state.lastKnownLocation;
export const selectIsPermissionGranted = (state: LocationStore) =>
  state.permissionStatus === 'granted';
export const selectIsPermissionDenied = (state: LocationStore) =>
  state.permissionStatus === 'denied';
export const selectNeedsPermission = (state: LocationStore) =>
  state.permissionStatus === 'undetermined';
