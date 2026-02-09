/**
 * useRideHistory Hook
 *
 * TanStack Query hook for fetching and caching the current user's ride history.
 * Shared cache key so rides screen and sidebar (or other consumers) reuse the same data.
 */

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Ride } from '@rentascooter/shared';
import { getRideHistory } from '../services/ridesService';

export const rideHistoryKeys = {
  all: ['rideHistory'] as const,
  list: (limit: number) => [...rideHistoryKeys.all, limit] as const,
};

export interface UseRideHistoryParams {
  /** Max number of rides to fetch (default 20) */
  limit?: number;
  /** Enable/disable the query (default true) */
  enabled?: boolean;
}

export interface UseRideHistoryResult {
  rides: Ride[];
  isLoading: boolean;
  isFetching: boolean;
  isRefetching: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const DEFAULT_LIMIT = 20;

/**
 * Hook for fetching the current user's ride history.
 *
 * @example
 * ```tsx
 * const { rides, isLoading, error, refetch, isRefetching } = useRideHistory({ limit: 20 });
 * // Use rides in list; use refetch for pull-to-refresh; isRefetching for RefreshControl
 * ```
 */
export function useRideHistory(
  params: UseRideHistoryParams = {}
): UseRideHistoryResult {
  const { limit = DEFAULT_LIMIT, enabled = true } = params;

  const {
    data: rides = [],
    isLoading,
    isFetching,
    isRefetching,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: rideHistoryKeys.list(limit),
    queryFn: () => getRideHistory(limit),
    enabled,
    staleTime: 60_000, // 1 min
    gcTime: 5 * 60_000, // 5 min
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  return {
    rides,
    isLoading,
    isFetching,
    isRefetching,
    error: error as Error | null,
    refetch,
  };
}

export default useRideHistory;
