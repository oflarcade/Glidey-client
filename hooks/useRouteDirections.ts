import { useState, useEffect } from 'react';
import type { RouteDirectionsResponse } from '@rentascooter/shared';
import { getRoute } from '@/services/routeDirectionsService';

export interface UseRouteDirectionsParams {
  userLocation: { latitude: number; longitude: number } | null;
  destination: { latitude: number; longitude: number } | null;
}

export interface UseRouteDirectionsResult {
  directions: RouteDirectionsResponse | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch route directions from the REST backend (unauthenticated path).
 * Fetches when both userLocation and destination are non-null.
 * Cancels in-flight request on unmount or coord change.
 * Implements cavekit-route-directions.md R1, R3.
 */
export function useRouteDirections({
  userLocation,
  destination,
}: UseRouteDirectionsParams): UseRouteDirectionsResult {
  const [directions, setDirections] = useState<RouteDirectionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLocation || !destination) {
      setDirections(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setDirections(null);

    getRoute({
      originLat: userLocation.latitude,
      originLng: userLocation.longitude,
      destLat: destination.latitude,
      destLng: destination.longitude,
    })
      .then((data) => {
        if (!cancelled) setDirections(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setDirections(null);
          setError((err as { message?: string })?.message ?? 'Failed to fetch route');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
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

  return { directions, isLoading, error };
}
