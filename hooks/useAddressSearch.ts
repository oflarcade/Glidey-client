import { useState, useEffect } from 'react';
import type { Location } from '@rentascooter/shared';
import { searchLocations } from '@/services';

const SEARCH_QUERY_MIN_LENGTH = 3;

export interface UseAddressSearchParams {
  /** Search query (caller should debounce, e.g. SearchInput 300ms) */
  query: string;
  /** Optional user location for proximity bias */
  proximity?: { latitude: number; longitude: number } | null;
  /** Max results 1–10, default 5 */
  limit?: number;
}

export interface UseAddressSearchResult {
  results: Location[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to search locations via backend callable.
 * Skips request when query has fewer than 3 characters.
 * Cancels in-flight request on unmount or when query/proximity changes.
 */
export function useAddressSearch({
  query,
  proximity = null,
  limit = 5,
}: UseAddressSearchParams): UseAddressSearchResult {
  const [results, setResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < SEARCH_QUERY_MIN_LENGTH) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setResults([]);

    searchLocations({
      query: trimmed,
      proximity: proximity ?? undefined,
      limit,
    })
      .then((data) => {
        if (!cancelled) {
          setResults(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setResults([]);
          setError(
            err instanceof Error ? err.message : 'Failed to search locations'
          );
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
  }, [query, proximity?.latitude, proximity?.longitude, limit]);

  return {
    results,
    isLoading,
    error,
  };
}
