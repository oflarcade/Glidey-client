import { useState, useEffect } from 'react';
import type { Suggestion } from '@rentascooter/shared';
import { autocomplete } from '@/services/addressSearchService';

export interface UseAddressSearchParams {
  query: string;
}

export interface UseAddressSearchResult {
  suggestions: Suggestion[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to search locations via REST backend autocomplete.
 * Skips request when query has fewer than 2 characters.
 * Implements cavekit-location-search.md R1, R6.
 */
export function useAddressSearch({
  query,
}: UseAddressSearchParams): UseAddressSearchResult {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    autocomplete(trimmed)
      .then((data) => {
        if (!cancelled) setSuggestions(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSuggestions([]);
          setError((err as { message?: string })?.message ?? 'Failed to search locations');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return { suggestions, isLoading, error };
}
