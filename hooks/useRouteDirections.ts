import { useState, useEffect } from 'react';
import type { Location } from '@rentascooter/shared';
import { getRouteDirections, type RouteDirectionsResponse } from '@/services';

export interface UseRouteDirectionsParams {
  /** User's current location */
  userLocation: { latitude: number; longitude: number } | null;
  /** Selected destination */
  destination: Location | null;
}

export interface UseRouteDirectionsResult {
  /** Route directions response from the backend */
  directions: RouteDirectionsResponse | null;
  /** Loading state while fetching directions */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
}

/**
 * Hook to fetch route directions from the backend
 *
 * Fetches Mapbox road geometry when both user location and destination are available.
 * Handles loading state, cancellation, and errors.
 *
 * @param params - User location and destination
 * @returns Route directions, loading state, and error
 */
export function useRouteDirections({
  userLocation,
  destination,
}: UseRouteDirectionsParams): UseRouteDirectionsResult {
  const [directions, setDirections] = useState<RouteDirectionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clear directions if either location or destination is missing
    if (!userLocation || !destination) {
      setDirections(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setDirections(null);

    const pickup: Location = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      address: 'Current Location',
      name: undefined,
    };

    getRouteDirections({ pickup, destination })
      .then((data) => {
        if (!cancelled) {
          setDirections(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDirections(null);
          setError(err instanceof Error ? err.message : 'Failed to fetch route');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    userLocation?.latitude,
    userLocation?.longitude,
    destination?.latitude,
    destination?.longitude,
  ]);

  return {
    directions,
    isLoading,
    error,
  };
}
