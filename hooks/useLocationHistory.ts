import { useState, useEffect, useCallback } from 'react';
import type { Location } from '@rentascooter/shared';
import { getLocationHistory } from '@/services';

const HISTORY_LIMIT_DEFAULT = 10;

export interface UseLocationHistoryParams {
  /** When true, fetch history (e.g. modal is open). Skip when false. */
  enabled?: boolean;
  /** Max items 1–20, default 10 */
  limit?: number;
}

export interface UseLocationHistoryResult {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to load and refetch user's location history (previous destinations).
 * Call refetch after saving a selection so the list stays in sync.
 */
export function useLocationHistory({
  enabled = true,
  limit = HISTORY_LIMIT_DEFAULT,
}: UseLocationHistoryParams = {}): UseLocationHistoryResult {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await getLocationHistory(limit);
      setLocations(data);
    } catch (err) {
      setLocations([]);
      setError(
        err instanceof Error ? err.message : 'Failed to load location history'
      );
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (!enabled) {
      setLocations([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    fetchHistory();
  }, [enabled, fetchHistory]);

  return {
    locations,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}
