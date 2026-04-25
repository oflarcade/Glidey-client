/**
 * Route Directions Service
 *
 * REST client for route directions. This endpoint does NOT require auth —
 * apiFetch (not authedFetch) is used intentionally.
 * Implements cavekit-route-directions.md R1.
 */

import { apiFetch, isApiError, DEMO_MODE_ERROR, type ApiError } from '@rentascooter/api';
import type { RouteDirectionsResponse } from '@rentascooter/shared';

export type { RouteDirectionsResponse };

export interface RouteOriginDestination {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}

/**
 * In demo mode the backend is unavailable, so we call Mapbox Directions API
 * directly using the app's existing token. Falls back to a 2-point straight
 * line only if the token is missing or the request fails.
 */
async function fetchMapboxRoute(params: RouteOriginDestination): Promise<RouteDirectionsResponse> {
  const token = process.env['EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN'];
  if (!token) {
    return {
      distanceM: 2580,
      durationS: 300,
      polyline: 'sztxAr`niBwnCnrC',
    };
  }

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${params.originLng},${params.originLat};${params.destLng},${params.destLat}` +
    `?geometries=polyline&overview=full&access_token=${token}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Mapbox ${response.status}`);
    const data = (await response.json()) as {
      routes?: Array<{ geometry: string; distance: number; duration: number }>;
    };
    const route = data.routes?.[0];
    if (!route?.geometry) throw new Error('No route');
    return {
      polyline: route.geometry,
      distanceM: Math.round(route.distance),
      durationS: Math.round(route.duration),
    };
  } catch {
    return {
      distanceM: 2580,
      durationS: 300,
      polyline: 'sztxAr`niBwnCnrC',
    };
  }
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
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) {
      return fetchMapboxRoute(params);
    }
    throw e;
  }
  const result = data as RouteDirectionsResponse;
  if (!result.polyline) {
    const err: ApiError = { code: 'HTTP_ERROR', message: 'Route response missing polyline.' };
    throw err;
  }
  return result;
}
