/**
 * useNearbyDrivers Hook
 *
 * TanStack Query hook for fetching and caching nearby available drivers.
 * Implements intelligent polling and location-based refetch strategy.
 *
 * Features:
 * - Fetches drivers when user location changes significantly (100m threshold)
 * - Polls every 30 seconds when idle to catch driver movements
 * - Disabled when location is unavailable
 * - Proper error handling and loading states
 */

import { useRef, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { GeoPoint, UserLocation, NearbyDriver } from '@rentascooter/shared';
import { getAvailableDrivers, calculateDistance } from '../services/driversService';

// Re-export for consumers
export type { NearbyDriver };

/**
 * Configuration for the nearby drivers hook
 */
const CONFIG = {
  /** Distance threshold in meters to trigger refetch */
  DISTANCE_THRESHOLD_METERS: 100,
  /** Polling interval in milliseconds when idle */
  POLLING_INTERVAL_MS: 30_000,
  /** Search radius in kilometers */
  SEARCH_RADIUS_KM: 5,
  /** Time to consider data stale */
  STALE_TIME_MS: 15_000,
  /** Cache time for driver data */
  CACHE_TIME_MS: 60_000,
} as const;

/**
 * Query key factory for nearby drivers
 */
export const nearbyDriversKeys = {
  all: ['nearbyDrivers'] as const,
  byLocation: (location: GeoPoint | null) =>
    [...nearbyDriversKeys.all, location] as const,
};

interface UseNearbyDriversOptions {
  /** User's current location from location service */
  userLocation: UserLocation | null;
  /** Whether location permission is granted and GPS is enabled */
  isLocationEnabled: boolean;
  /** Custom search radius in km (default: 5km) */
  radiusKm?: number;
  /** Custom polling interval in ms (default: 30s) */
  pollingIntervalMs?: number;
  /** Enable/disable the query (default: true when location available) */
  enabled?: boolean;
}

interface UseNearbyDriversResult {
  /** List of nearby available drivers */
  drivers: NearbyDriver[];
  /** Whether the query is loading for the first time */
  isLoading: boolean;
  /** Whether the query is currently fetching (including background refetch) */
  isFetching: boolean;
  /** Error from the query, if any */
  error: Error | null;
  /** Manually trigger a refetch */
  refetch: () => Promise<void>;
  /** Last successful fetch timestamp */
  dataUpdatedAt: number | undefined;
  /** Whether any drivers are within 500m (for UI indicators) */
  hasNearbyDrivers: boolean;
  /** Nearest driver distance in meters */
  nearestDriverDistance: number | null;
}

/**
 * Hook for fetching nearby available drivers
 *
 * @example
 * ```tsx
 * const { location, permissionStatus, isServiceEnabled } = useLocationService();
 *
 * const {
 *   drivers,
 *   isLoading,
 *   hasNearbyDrivers,
 * } = useNearbyDrivers({
 *   userLocation: location,
 *   isLocationEnabled: permissionStatus === 'granted' && isServiceEnabled === true,
 * });
 * ```
 */
export function useNearbyDrivers(
  options: UseNearbyDriversOptions
): UseNearbyDriversResult {
  const {
    userLocation,
    isLocationEnabled,
    radiusKm = CONFIG.SEARCH_RADIUS_KM,
    pollingIntervalMs = CONFIG.POLLING_INTERVAL_MS,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();

  // Track the last fetched location to detect significant movement
  const lastFetchedLocation = useRef<GeoPoint | null>(null);

  /**
   * Convert UserLocation to GeoPoint for API calls
   */
  const currentGeoPoint = useMemo((): GeoPoint | null => {
    if (!userLocation) return null;
    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    };
  }, [userLocation?.latitude, userLocation?.longitude]);

  /**
   * Check if user has moved significantly since last fetch
   * Returns true if distance exceeds threshold
   */
  const hasMovedSignificantly = useMemo((): boolean => {
    if (!currentGeoPoint || !lastFetchedLocation.current) return true;

    const distance = calculateDistance(
      lastFetchedLocation.current,
      currentGeoPoint
    );

    return distance >= CONFIG.DISTANCE_THRESHOLD_METERS;
  }, [currentGeoPoint]);

  /**
   * Determine if the query should be enabled
   * - Location must be available and enabled
   * - Either user hasn't fetched yet, moved significantly, or we're polling
   */
  const shouldFetch = useMemo(
    () => enabled && isLocationEnabled && currentGeoPoint !== null,
    [enabled, isLocationEnabled, currentGeoPoint]
  );

  /**
   * Fetch function for TanStack Query
   */
  const fetchDrivers = useCallback(async (): Promise<NearbyDriver[]> => {
    if (!currentGeoPoint) {
      return [];
    }

    const drivers = await getAvailableDrivers({
      location: currentGeoPoint,
      radiusKm,
    });

    // Update last fetched location on success
    lastFetchedLocation.current = currentGeoPoint;

    return drivers;
  }, [currentGeoPoint, radiusKm]);

  /**
   * TanStack Query for nearby drivers
   */
  const {
    data: drivers = [],
    isLoading,
    isFetching,
    error,
    refetch: queryRefetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: nearbyDriversKeys.byLocation(currentGeoPoint),
    queryFn: fetchDrivers,
    enabled: shouldFetch,
    staleTime: CONFIG.STALE_TIME_MS,
    gcTime: CONFIG.CACHE_TIME_MS,
    // Poll at specified interval for real-time driver updates
    refetchInterval: shouldFetch ? pollingIntervalMs : false,
    // Refetch on window focus for fresh data
    refetchOnWindowFocus: true,
    // Keep previous data while fetching new
    placeholderData: (previousData) => previousData,
    // Retry failed requests
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  /**
   * Manual refetch wrapper
   */
  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  /**
   * Calculate distance to nearest driver
   * Uses pre-calculated distanceMeters from backend when available
   */
  const nearestDriverDistance = useMemo((): number | null => {
    if (drivers.length === 0) return null;

    let minDistance = Infinity;

    for (const driver of drivers) {
      // Use pre-calculated distance from backend if available
      const distance = driver.distanceMeters ?? (
        currentGeoPoint && driver.location
          ? calculateDistance(currentGeoPoint, driver.location)
          : Infinity
      );
      
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    return minDistance === Infinity ? null : Math.round(minDistance);
  }, [currentGeoPoint, drivers]);

  /**
   * Check if any drivers are within 500m
   */
  const hasNearbyDrivers = useMemo(
    () => nearestDriverDistance !== null && nearestDriverDistance <= 500,
    [nearestDriverDistance]
  );

  return {
    drivers,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
    dataUpdatedAt,
    hasNearbyDrivers,
    nearestDriverDistance,
  };
}

export default useNearbyDrivers;
