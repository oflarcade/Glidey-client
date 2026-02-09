/**
 * Address Search Service
 *
 * Firebase callable wrappers for location search and history.
 * Backend uses Mapbox Geocoding (country=SN, French); tokens stay server-side.
 */

import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '@rentascooter/auth';
import type {
  ApiResponse,
  Location,
  RetrieveLocationRequest,
  RetrieveLocationResponse,
  SearchLocationsRequest,
  SearchLocationsResponse,
  Suggestion,
  SuggestLocationRequest,
  SuggestLocationResponse,
} from '@rentascooter/shared';
import { mapLocationSearchError } from '@/utils/locationSearchErrors';

const SEARCH_QUERY_MIN_LENGTH = 3;
const SEARCH_LIMIT_MIN = 1;
const SEARCH_LIMIT_MAX = 10;
const SEARCH_LIMIT_DEFAULT = 5;
const HISTORY_LIMIT_MIN = 1;
const HISTORY_LIMIT_MAX = 20;
const HISTORY_LIMIT_DEFAULT = 10;

function clampLimit(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Normalize search request: enforce BE rules (query min 3 chars, limit 1–10).
 */
function normalizeSearchRequest(
  request: SearchLocationsRequest
): SearchLocationsRequest {
  const query = (request.query ?? '').trim();
  const limit = request.limit ?? SEARCH_LIMIT_DEFAULT;
  return {
    query,
    proximity: request.proximity,
    limit: clampLimit(limit, SEARCH_LIMIT_MIN, SEARCH_LIMIT_MAX),
  };
}

/**
 * Search locations via backend callable (Mapbox Geocoding, Senegal, French).
 * Skips request when query has fewer than 3 characters.
 *
 * @param request - query (min 3 chars), optional proximity, optional limit (1–10)
 * @returns List of locations matching the query
 */
export async function searchLocations(
  request: SearchLocationsRequest
): Promise<Location[]> {
  const normalized = normalizeSearchRequest(request);
  if (normalized.query.length < SEARCH_QUERY_MIN_LENGTH) {
    return [];
  }

  const functions = getFirebaseFunctions();
  const callable = httpsCallable<
    SearchLocationsRequest,
    ApiResponse<SearchLocationsResponse>
  >(functions, 'searchLocations');

  const result = await callable(normalized);

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[addressSearch] request:', normalized, '| response success:', result.data.success, '| results count:', result.data.data?.results?.length ?? 0);
  }

  if (!result.data.success || !result.data.data) {
    throw new Error(
      result.data.error?.message ?? 'Failed to search locations'
    );
  }

  return result.data.data.results ?? [];
}

const SUGGEST_QUERY_MIN_LENGTH = 2;

function normalizeSuggestRequest(
  request: SuggestLocationRequest
): SuggestLocationRequest {
  const query = (request.query ?? '').trim();
  const limit = request.limit ?? SEARCH_LIMIT_DEFAULT;
  return {
    query,
    sessionToken: request.sessionToken,
    proximity: request.proximity,
    limit: clampLimit(limit, SEARCH_LIMIT_MIN, SEARCH_LIMIT_MAX),
  };
}

/**
 * Suggest locations via backend Mapbox Search Box API (autocomplete).
 * Min 2 chars (backend rule); caller typically enforces 3 in the hook.
 * Uses session token for the same session as retrieveLocation.
 *
 * @param request - query, sessionToken, optional proximity, optional limit (1–10)
 * @returns Suggestions (no coordinates until user selects and retrieve is called)
 */
export async function suggestLocation(
  request: SuggestLocationRequest
): Promise<Suggestion[]> {
  const normalized = normalizeSuggestRequest(request);
  if (normalized.query.length < SUGGEST_QUERY_MIN_LENGTH || !normalized.sessionToken) {
    return [];
  }

  const functions = getFirebaseFunctions();
  const callable = httpsCallable<
    SuggestLocationRequest,
    ApiResponse<SuggestLocationResponse>
  >(functions, 'suggestLocation');

  try {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[addressSearch] suggestLocation request:', {
        query: normalized.query,
        sessionToken: normalized.sessionToken?.slice(0, 8) + '…',
        proximity: normalized.proximity,
        limit: normalized.limit,
      });
    }
    const result = await callable(normalized);
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[addressSearch] suggestLocation response:', {
        success: result.data.success,
        suggestionsCount: result.data.data?.suggestions?.length ?? 0,
        suggestions: result.data.data?.suggestions ?? [],
        error: result.data.error,
      });
    }
    if (!result.data.success || !result.data.data) {
      throw new Error(
        result.data.error?.message ?? 'Failed to get suggestions'
      );
    }
    return result.data.data.suggestions ?? [];
  } catch (err) {
    throw new Error(mapLocationSearchError(err));
  }
}

/**
 * Retrieve full location for a suggestion (coordinates + address) by mapboxId.
 * Must use the same sessionToken as the suggestLocation calls in this session.
 *
 * @param request - mapboxId, sessionToken
 * @returns Location with coordinates and address
 */
export async function retrieveLocation(
  request: RetrieveLocationRequest
): Promise<Location> {
  if (!request.mapboxId?.trim() || !request.sessionToken?.trim()) {
    throw new Error(mapLocationSearchError({ code: 'invalid-argument' }));
  }

  const functions = getFirebaseFunctions();
  const callable = httpsCallable<
    RetrieveLocationRequest,
    ApiResponse<RetrieveLocationResponse>
  >(functions, 'retrieveLocation');

  try {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[addressSearch] retrieveLocation request:', {
        mapboxId: request.mapboxId,
        sessionToken: request.sessionToken?.slice(0, 8) + '…',
      });
    }
    const result = await callable(request);
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[addressSearch] retrieveLocation response:', {
        success: result.data.success,
        location: result.data.data?.location,
        error: result.data.error,
      });
    }
    if (!result.data.success || !result.data.data?.location) {
      throw new Error(
        result.data.error?.message ?? 'Failed to retrieve location'
      );
    }
    return result.data.data.location;
  } catch (err) {
    throw new Error(mapLocationSearchError(err));
  }
}

/**
 * Get user's recent location history (previous destinations).
 *
 * @param limit - Optional limit 1–20, default 10
 * @returns Recent locations from clients/{userId}/locationHistory
 */
export async function getLocationHistory(
  limit: number = HISTORY_LIMIT_DEFAULT
): Promise<Location[]> {
  const safeLimit = clampLimit(limit, HISTORY_LIMIT_MIN, HISTORY_LIMIT_MAX);
  const functions = getFirebaseFunctions();
  const callable = httpsCallable<
    { limit?: number },
    ApiResponse<{ results: Location[] }>
  >(functions, 'getLocationHistory');

  const result = await callable({ limit: safeLimit });

  if (!result.data.success || !result.data.data) {
    throw new Error(
      result.data.error?.message ?? 'Failed to get location history'
    );
  }

  return result.data.data.results ?? [];
}

/**
 * Lightweight client-side validation before calling saveLocationToHistory.
 * Ensures coordinates are finite numbers and address is non-empty.
 */
export function isValidLocationForHistory(location: Location): boolean {
  return (
    typeof location.latitude === 'number' &&
    Number.isFinite(location.latitude) &&
    typeof location.longitude === 'number' &&
    Number.isFinite(location.longitude) &&
    typeof location.address === 'string' &&
    location.address.trim().length > 0
  );
}

/**
 * Save a selected location to user's history (dedup by address, last 10).
 * Call after user selects a search result.
 * Validates coordinates (finite numbers) and non-empty address before calling the callable.
 *
 * @param location - Selected location to save
 */
export async function saveLocationToHistory(
  location: Location
): Promise<void> {
  if (!isValidLocationForHistory(location)) {
    throw new Error(
      'Invalid location: latitude and longitude must be finite numbers and address must be non-empty'
    );
  }

  const functions = getFirebaseFunctions();
  const callable = httpsCallable<Location, ApiResponse<void>>(
    functions,
    'saveLocationToHistory'
  );

  const result = await callable(location);

  if (!result.data.success) {
    throw new Error(
      result.data.error?.message ?? 'Failed to save location to history'
    );
  }
}
