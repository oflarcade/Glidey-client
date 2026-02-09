import { useState, useEffect } from 'react';
import type { Suggestion } from '@rentascooter/shared';
import { suggestLocation } from '@/services';
import { mapLocationSearchError } from '@/utils/locationSearchErrors';

const DEFAULT_MIN_QUERY_LENGTH = 3;

export interface UseAutocompleteLocationParams {
  /** Search query (caller should debounce, e.g. SearchInput 300ms) */
  query: string;
  /** Session token; null = disabled (e.g. no focus yet). Same token used for retrieve. */
  sessionToken: string | null;
  /** Optional proximity for ranking (e.g. Dakar center) */
  proximity?: { latitude: number; longitude: number } | null;
  /** Max suggestions 1–10, default 5 */
  limit?: number;
  /** Min query length to trigger request, default 3 */
  minQueryLength?: number;
}

export interface UseAutocompleteLocationResult {
  suggestions: Suggestion[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for Mapbox Search Box autocomplete (suggest only).
 * Only fetches when sessionToken != null and query.trim().length >= minQueryLength.
 * Cancels in-flight request on unmount or when query/sessionToken/proximity/limit change.
 */
export function useAutocompleteLocation({
  query,
  sessionToken,
  proximity = null,
  limit = 5,
  minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
}: UseAutocompleteLocationParams): UseAutocompleteLocationResult {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    const shouldFetch =
      sessionToken != null && trimmed.length >= minQueryLength;

    if (!shouldFetch) {
      setSuggestions([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    suggestLocation({
      query: trimmed,
      sessionToken,
      proximity: proximity ?? undefined,
      limit,
    })
      .then((data) => {
        if (!cancelled) {
          setSuggestions(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSuggestions([]);
          setError(mapLocationSearchError(err));
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
    query,
    sessionToken,
    proximity?.latitude,
    proximity?.longitude,
    limit,
    minQueryLength,
  ]);

  return {
    suggestions,
    isLoading,
    error,
  };
}
