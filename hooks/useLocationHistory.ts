import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Location } from '@rentascooter/shared';
import { getHistory, saveHistory } from '@/services/addressSearchService';

const HISTORY_QUERY_KEY = ['locationHistory'] as const;

export interface UseLocationHistoryParams {
  /** When true, fetch history (e.g. modal is open). Skip when false. */
  enabled?: boolean;
}

export interface UseLocationHistoryResult {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * React Query hook for user's confirmed destination history.
 * Maps LocationHistoryEntry to Location for component compatibility.
 * Implements cavekit-location-search.md R3, R4.
 */
export function useLocationHistory({
  enabled = true,
}: UseLocationHistoryParams = {}): UseLocationHistoryResult {
  const queryClient = useQueryClient();

  const { data = [], isLoading, error, refetch: queryRefetch } = useQuery({
    queryKey: HISTORY_QUERY_KEY,
    queryFn: getHistory,
    enabled,
    staleTime: 60_000,
    gcTime: 120_000,
  });

  useMutation({
    mutationFn: saveHistory,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY }),
  });

  const locations: Location[] = data.map((entry) => ({
    latitude: entry.latitude,
    longitude: entry.longitude,
    address: entry.address,
    name: entry.name,
  }));

  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  return {
    locations,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
