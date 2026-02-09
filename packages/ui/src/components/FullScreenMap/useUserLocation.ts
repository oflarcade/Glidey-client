import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import type { LocationUpdateEvent } from './types';

interface UseUserLocationOptions {
  /** Whether location tracking is enabled */
  enabled?: boolean;
  /** Distance interval in meters for location updates */
  distanceInterval?: number;
  /** Time interval in milliseconds for location updates */
  timeInterval?: number;
  /** Desired accuracy level */
  accuracy?: Location.Accuracy;
}

interface UseUserLocationResult {
  /** Current user location */
  location: LocationUpdateEvent | null;
  /** Whether location is being tracked */
  isTracking: boolean;
  /** Error message if location tracking failed */
  error: string | null;
  /** Start tracking user location */
  startTracking: () => Promise<void>;
  /** Stop tracking user location */
  stopTracking: () => void;
  /** Get current location once */
  getCurrentLocation: () => Promise<LocationUpdateEvent | null>;
}

/**
 * Hook to track user's location
 * Uses expo-location with configurable update intervals
 * Optimized for battery efficiency with reasonable defaults
 */
export function useUserLocation(
  options: UseUserLocationOptions = {}
): UseUserLocationResult {
  const {
    enabled = true,
    distanceInterval = 10, // Update every 10 meters
    timeInterval = 5000, // Or every 5 seconds
    accuracy = Location.Accuracy.Balanced,
  } = options;

  const [location, setLocation] = useState<LocationUpdateEvent | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const startTracking = useCallback(async () => {
    // Don't start if already tracking
    if (subscriptionRef.current) {
      return;
    }

    setError(null);

    try {
      // Check permission first
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setError('Location permission not granted');
        return;
      }

      // Start watching position
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy,
          distanceInterval,
          timeInterval,
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

      setIsTracking(true);
    } catch (err) {
      setError('Failed to start location tracking');
      setIsTracking(false);
    }
  }, [accuracy, distanceInterval, timeInterval]);

  const getCurrentLocation =
    useCallback(async (): Promise<LocationUpdateEvent | null> => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
          setError('Location permission not granted');
          return null;
        }

        const locationResult = await Location.getCurrentPositionAsync({
          accuracy,
        });

        const { coords, timestamp } = locationResult;
        const currentLocation: LocationUpdateEvent = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy ?? undefined,
          heading: coords.heading ?? undefined,
          speed: coords.speed ?? undefined,
          timestamp,
        };

        setLocation(currentLocation);
        return currentLocation;
      } catch (err) {
        setError('Failed to get current location');
        return null;
      }
    }, [accuracy]);

  // Auto-start tracking when enabled
  useEffect(() => {
    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, startTracking, stopTracking]);

  return {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking,
    getCurrentLocation,
  };
}
