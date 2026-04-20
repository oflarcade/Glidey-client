/**
 * Address Search Service
 *
 * REST client for location search and history.
 * Backend uses Google Places API; no session tokens on the client side.
 * Implements cavekit-location-search.md R1–R4.
 */

import { authedFetch, isApiError, DEMO_MODE_ERROR } from '@rentascooter/api';
import type { Suggestion } from '@rentascooter/shared';

// ─── Demo fixtures (T-030/T-031) ─────────────────────────────────────────────

const DEMO_SUGGESTIONS: Suggestion[] = [
  { placeId: 'demo-1', name: 'Marché Sandaga', formattedAddress: 'Marché Sandaga, Médina, Dakar' },
  { placeId: 'demo-2', name: "Place de l'Indépendance", formattedAddress: "Place de l'Indépendance, Plateau, Dakar" },
  { placeId: 'demo-3', name: 'Université Cheikh Anta Diop', formattedAddress: 'UCAD, Fann, Dakar' },
  { placeId: 'demo-4', name: 'Corniche Ouest', formattedAddress: 'Corniche Ouest, Fann, Dakar' },
  { placeId: 'demo-5', name: 'Aéroport AIBD', formattedAddress: 'Aéroport Blaise Diagne, Diass' },
];

const DEMO_PLACES: Record<string, ResolvedLocation> = {
  'demo-1': { latitude: 14.6928, longitude: -17.4467, name: 'Marché Sandaga', address: 'Marché Sandaga, Médina, Dakar' },
  'demo-2': { latitude: 14.7167, longitude: -17.4677, name: "Place de l'Indépendance", address: "Place de l'Indépendance, Plateau, Dakar" },
  'demo-3': { latitude: 14.7461, longitude: -17.4894, name: 'UCAD', address: 'Université Cheikh Anta Diop, Fann, Dakar' },
  'demo-4': { latitude: 14.7392, longitude: -17.4922, name: 'Corniche Ouest', address: 'Corniche Ouest, Fann, Dakar' },
  'demo-5': { latitude: 14.7644, longitude: -17.3701, name: 'Aéroport AIBD', address: 'Aéroport Blaise Diagne, Diass' },
};

const DEMO_HISTORY: LocationHistoryEntry[] = [
  { address: '123 Avenue Bourguiba, Dakar', name: 'Home', latitude: 14.6937, longitude: -17.4441, frequency: 12, lastUsedAt: '2026-04-18T08:00:00Z' },
  { address: "Place de l'Indépendance, Plateau, Dakar", name: 'Downtown Office', latitude: 14.7167, longitude: -17.4677, frequency: 8, lastUsedAt: '2026-04-17T17:30:00Z' },
  { address: 'Marché Sandaga, Médina, Dakar', name: 'Sandaga Market', latitude: 14.6928, longitude: -17.4467, frequency: 3, lastUsedAt: '2026-04-15T11:00:00Z' },
];

// ─── Response types (shapes the Fastify backend returns) ─────────────────────

export interface ResolvedLocation {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}

export interface LocationHistoryEntry {
  address: string;
  name: string;
  latitude: number;
  longitude: number;
  frequency: number;
  lastUsedAt: string; // ISO 8601
}

// ─── T-021: Autocomplete ──────────────────────────────────────────────────────

/**
 * Return autocomplete suggestions for a query string.
 * Returns empty list (no backend call) when query length < 2.
 * Throws ApiError on backend/network failure.
 */
export async function autocomplete(query: string): Promise<Suggestion[]> {
  if (query.length < 2) return [];
  try {
    const data = await authedFetch('GET', `/locations/search?q=${encodeURIComponent(query)}`);
    return data as Suggestion[];
  } catch (e) {
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) return DEMO_SUGGESTIONS;
    throw e;
  }
}

// ─── T-022: Place detail resolution ──────────────────────────────────────────

/**
 * Resolve a placeId into full coordinates + address.
 * Throws ApiError (including UNAUTHORIZED) on failure.
 */
export async function placeDetail(placeId: string): Promise<ResolvedLocation> {
  try {
    // Backend returns { lat, lng, name, address } — map to client shape
    const data = await authedFetch('GET', `/locations/details?placeId=${encodeURIComponent(placeId)}`) as { lat: number; lng: number; name: string; address: string };
    return { latitude: data.lat, longitude: data.lng, name: data.name, address: data.address };
  } catch (e) {
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) {
      return DEMO_PLACES[placeId] ?? DEMO_PLACES['demo-1'];
    }
    throw e;
  }
}

// ─── T-023: Location history retrieval ───────────────────────────────────────

/**
 * Fetch the authenticated user's confirmed destination history.
 * Returns empty list (not an error) when no history exists.
 */
export async function getHistory(): Promise<LocationHistoryEntry[]> {
  try {
    // Backend returns { lat, lng, ... } — map to client shape
    const data = await authedFetch('GET', '/locations/history') as Array<{ lat: number; lng: number; address: string; name: string; frequency: number; lastUsedAt: string }>;
    return data.map((r) => ({ latitude: r.lat, longitude: r.lng, address: r.address, name: r.name, frequency: r.frequency, lastUsedAt: r.lastUsedAt }));
  } catch (e) {
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) return DEMO_HISTORY;
    throw e;
  }
}

// ─── T-024: Location history persistence ─────────────────────────────────────

/**
 * Persist a confirmed destination to the user's history.
 * Failure is surfaced as a typed ApiError but must NOT block the trip flow —
 * callers should catch and log, then continue.
 */
export async function saveHistory(entry: {
  address: string;
  name: string;
  latitude: number;
  longitude: number;
}): Promise<void> {
  // Backend expects { lat, lng } — map from client shape
  await authedFetch('POST', '/locations/history', { address: entry.address, name: entry.name, lat: entry.latitude, lng: entry.longitude });
}

// ─── Demo mode helpers (consumed by T-030 / T-031) ───────────────────────────

export function isDemoModeError(e: unknown): boolean {
  return isApiError(e) && e.code === DEMO_MODE_ERROR.code;
}
