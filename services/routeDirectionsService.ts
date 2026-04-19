/**
 * Route Directions Service
 *
 * REST client for route directions. This endpoint does NOT require auth —
 * apiFetch (not authedFetch) is used intentionally.
 * Implements cavekit-route-directions.md R1.
 */

import { apiFetch, isApiError, DEMO_MODE_ERROR, type ApiError } from '@rentascooter/api';
import type { RouteDirectionsResponse } from '@rentascooter/shared';

// Demo route: Dakar Plateau → Fann area (~2.6 km, ~8 min) — T-065
const DEMO_ROUTE: RouteDirectionsResponse = {
  distanceM: 2580,
  durationS: 480,
  polyline: 'sztxAr`niBwnCnrC',
};

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
  let data: unknown;
  try {
    data = await apiFetch('GET', `/directions?${qs}`);
  } catch (e) {
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) return DEMO_ROUTE;
    throw e;
  }
  const result = data as RouteDirectionsResponse;
  if (!result.polyline) {
    const err: ApiError = { code: 'HTTP_ERROR', message: 'Route response missing polyline.' };
    throw err;
  }
  return result;
}
