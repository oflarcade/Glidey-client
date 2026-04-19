/**
 * Route Directions Service
 *
 * REST client for route directions. This endpoint does NOT require auth —
 * apiFetch (not authedFetch) is used intentionally.
 * Implements cavekit-route-directions.md R1.
 */

import { apiFetch, type ApiError } from '@rentascooter/api';
import type { RouteDirectionsResponse } from '@rentascooter/shared';

export type { RouteDirectionsResponse };

export interface RouteOriginDestination {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}

/**
 * Fetch a route between origin and destination.
 * Does not require the user to be signed in.
 * Throws ApiError on invalid coords, empty polyline, or network failure.
 */
export async function getRoute(
  params: RouteOriginDestination
): Promise<RouteDirectionsResponse> {
  const qs =
    `originLat=${params.originLat}` +
    `&originLng=${params.originLng}` +
    `&destLat=${params.destLat}` +
    `&destLng=${params.destLng}`;
  const data = await apiFetch('GET', `/directions?${qs}`);
  const result = data as RouteDirectionsResponse;
  if (!result.polyline) {
    const err: ApiError = { code: 'HTTP_ERROR', message: 'Route response missing polyline.' };
    throw err;
  }
  return result;
}
