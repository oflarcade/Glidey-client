import { useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { Linking, Platform, AppState, AppStateStatus } from 'react-native';
import type MapboxGL from '@rnmapbox/maps';
import {
  useLocationStore,
  selectPermissionStatus,
  selectCurrentLocation,
  selectIsServiceEnabled,
  selectIsReady,
  selectIsLoading,
  selectLocationError,
  selectBestLocation,
} from '@rentascooter/shared/stores';
import type {
  UserLocation,
  LocationPermissionStatus,
  Coordinates,
} from '@rentascooter/shared/types';
import { LOCATION_CONFIG, DAKAR_CENTER } from '@rentascooter/shared/types';

interface UseLocationServiceOptions {
  /** Camera ref for programmatic map control */
  cameraRef?: React.RefObject<MapboxGL.Camera | null>;
  /** Auto-center map on user location when first obtained */
  autoCenter?: boolean;
  /** Enable continuous location tracking */
  enableTracking?: boolean;
}

interface UseLocationServiceResult {
  /** Current user location (or last known if current unavailable) */
  location: UserLocation | null;
  /** Best available location (current or last known) */
  bestLocation: UserLocation | null;
  /** Whether location system is fully ready */
  isReady: boolean;
  /** Whether location is currently being fetched */
  isLoading: boolean;
  /** Whether device location services are enabled */
  isServiceEnabled: boolean | null;
  /** Current permission status */
  permissionStatus: LocationPermissionStatus;
  /** Current error, if any */
  error: ReturnType<typeof selectLocationError>;
  /** Center map on user location */
  centerOnUser: (customCameraRef?: React.RefObject<MapboxGL.Camera | null>) => void;
  /** Request location permission from user */
  requestPermission: () => Promise<boolean>;
  /** Open device settings to enable location */
  openSettings: () => Promise<void>;
  /** Refresh location state (check services + permission + get location) */
  refresh: () => Promise<void>;
}

/**
 * useLocationService Hook
 *
 * Comprehensive location service management that:
 * 1. Checks if device location services are enabled (GPS)
 * 2. Checks app permission status
 * 3. Gets user location when permission granted
 * 4. Provides methods to request permission, open settings, center map
 *
 * @example
 * ```tsx
 * const cameraRef = useRef<MapboxGL.Camera>(null);
 * const {
 *   location,
 *   isReady,
 *   isServiceEnabled,
 *   permissionStatus,
 *   centerOnUser,
 *   requestPermission,
 * } = useLocationService({ cameraRef, autoCenter: true });
 * ```
 */
export function useLocationService(
  options: UseLocationServiceOptions = {}
): UseLocationServiceResult {
  const { cameraRef, autoCenter = false, enableTracking = false } = options;

  // Store state
  const permissionStatus = useLocationStore(selectPermissionStatus);
  const currentLocation = useLocationStore(selectCurrentLocation);
  const bestLocation = useLocationStore(selectBestLocation);
  const isServiceEnabled = useLocationStore(selectIsServiceEnabled);
  const isReady = useLocationStore(selectIsReady);
  const isLoading = useLocationStore(selectIsLoading);
  const error = useLocationStore(selectLocationError);

  // Store actions
  const setServiceEnabled = useLocationStore((s) => s.setServiceEnabled);
  const setPermissionStatus = useLocationStore((s) => s.setPermissionStatus);
  const setLocation = useLocationStore((s) => s.setLocation);
  const setLoading = useLocationStore((s) => s.setLoading);
  const setReady = useLocationStore((s) => s.setReady);
  const setError = useLocationStore((s) => s.setError);
  const clearError = useLocationStore((s) => s.clearError);

  // Track if we've auto-centered
  const hasAutoCentered = useRef(false);
  // Track location subscription
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  /**
   * Check if device location services are enabled
   */
  const checkServiceEnabled = useCallback(async (): Promise<boolean> => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      setServiceEnabled(enabled);
      return enabled;
    } catch (err) {
      setServiceEnabled(false);
      return false;
    }
  }, [setServiceEnabled]);

  /**
   * Check current permission status
   */
  const checkPermission = useCallback(async (): Promise<LocationPermissionStatus> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      let mappedStatus: LocationPermissionStatus;

      switch (status) {
        case Location.PermissionStatus.GRANTED:
          mappedStatus = 'granted';
          break;
        case Location.PermissionStatus.DENIED:
          mappedStatus = 'denied';
          break;
        case Location.PermissionStatus.UNDETERMINED:
          mappedStatus = 'undetermined';
          break;
        default:
          mappedStatus = 'restricted';
      }

      setPermissionStatus(mappedStatus);
      return mappedStatus;
    } catch (err) {
      setPermissionStatus('undetermined');
      return 'undetermined';
    }
  }, [setPermissionStatus]);

  /**
   * Request location permission from user
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    clearError();

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === Location.PermissionStatus.GRANTED) {
        setPermissionStatus('granted');
        // After getting permission, try to get location
        await getCurrentLocation();
        return true;
      } else {
        setPermissionStatus(status === Location.PermissionStatus.DENIED ? 'denied' : 'restricted');
        setError({
          type: 'permission_denied',
          message: 'Location permission was denied',
        });
        return false;
      }
    } catch (err) {
      setError({
        type: 'unknown',
        message: 'Failed to request location permission',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError, setPermissionStatus, setError]);

  /**
   * Get current location once
   */
  const getCurrentLocation = useCallback(async (): Promise<UserLocation | null> => {
    setLoading(true);
    clearError();

    try {
      // Check permission first
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setError({
          type: 'permission_denied',
          message: 'Location permission not granted',
        });
        return null;
      }

      // Get location with timeout
      const locationResult = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), LOCATION_CONFIG.TIMEOUT_MS)
        ),
      ]);

      if (!locationResult) {
        throw new Error('timeout');
      }

      const { coords, timestamp } = locationResult;
      const userLocation: UserLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy ?? undefined,
        heading: coords.heading ?? undefined,
        speed: coords.speed ?? undefined,
        timestamp,
      };

      setLocation(userLocation);
      return userLocation;
    } catch (err: any) {
      const errorType = err?.message === 'timeout' ? 'timeout' : 'position_unavailable';
      setError({
        type: errorType,
        message: err?.message === 'timeout'
          ? 'Location request timed out'
          : 'Failed to get current location',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError, setLocation, setError]);

  /**
   * Start continuous location tracking
   */
  const startTracking = useCallback(async () => {
    if (locationSubscription.current) return;

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) return;

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: LOCATION_CONFIG.DISTANCE_INTERVAL,
          timeInterval: LOCATION_CONFIG.TIME_INTERVAL,
        },
        (locationResult) => {
          const { coords, timestamp } = locationResult;
          setLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy ?? undefined,
            heading: coords.heading ?? undefined,
            speed: coords.speed ?? undefined,
            timestamp,
          });
        }
      );
    } catch (err) {
      // Silent fail for tracking - we still have current location
    }
  }, [setLocation]);

  /**
   * Stop location tracking
   */
  const stopTracking = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  }, []);

  /**
   * Center map on user location
   */
  const centerOnUser = useCallback(
    (customCameraRef?: React.RefObject<MapboxGL.Camera | null>) => {
      const ref = customCameraRef ?? cameraRef;
      const location = currentLocation ?? bestLocation;

      if (!ref?.current || !location) return;

      ref.current.setCamera({
        centerCoordinate: [location.longitude, location.latitude],
        zoomLevel: LOCATION_CONFIG.USER_ZOOM,
        animationDuration: 1000,
        animationMode: 'flyTo',
      });
    },
    [cameraRef, currentLocation, bestLocation]
  );

  /**
   * Open device settings
   */
  const openSettings = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (err) {
      // Fallback to general settings
      await Linking.openSettings();
    }
  }, []);

  /**
   * Full refresh of location state
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    clearError();

    try {
      // Step 1: Check if device location services are enabled
      const servicesEnabled = await checkServiceEnabled();
      if (!servicesEnabled) {
        setError({
          type: 'service_disabled',
          message: 'Location services are disabled on device',
        });
        setReady(true);
        return;
      }

      // Step 2: Check permission status
      const status = await checkPermission();
      if (status === 'denied' || status === 'restricted') {
        setError({
          type: 'permission_denied',
          message: 'Location permission is denied',
        });
        setReady(true);
        return;
      }

      // Step 3: If permission granted, get location
      if (status === 'granted') {
        await getCurrentLocation();
      }

      setReady(true);
    } finally {
      setLoading(false);
    }
  }, [
    checkServiceEnabled,
    checkPermission,
    getCurrentLocation,
    setLoading,
    setReady,
    setError,
    clearError,
  ]);

  // Initialize on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-center when location first becomes available
  useEffect(() => {
    if (autoCenter && currentLocation && !hasAutoCentered.current && cameraRef?.current) {
      hasAutoCentered.current = true;
      centerOnUser();
    }
  }, [autoCenter, currentLocation, centerOnUser, cameraRef]);

  // Handle app state changes (re-check when coming from background/settings)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Re-check services and permissions when app comes to foreground
        // This handles the case where user enabled location in settings
        refresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refresh]);

  // Handle tracking
  useEffect(() => {
    if (enableTracking && permissionStatus === 'granted') {
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [enableTracking, permissionStatus, startTracking, stopTracking]);

  return {
    location: currentLocation,
    bestLocation,
    isReady,
    isLoading,
    isServiceEnabled,
    permissionStatus,
    error,
    centerOnUser,
    requestPermission,
    openSettings,
    refresh,
  };
}

export default useLocationService;
