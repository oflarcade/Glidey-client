/**
 * Route Directions Service
 *
 * Firebase callable wrapper for getRouteDirections.
 * Backend calls Mapbox Directions API with full geometry and returns
 * distance, duration, and GeoJSON LineString for drawing the route on the map.
 */

import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '@rentascooter/auth';
import type { ApiResponse, Location } from '@rentascooter/shared';

/** GeoJSON LineString as returned by Mapbox Directions (geometries=geojson). */
export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

/** Response from getRouteDirections callable. Replaced by REST in T-062. */
export interface RouteDirectionsResponse {
  distanceM: number;
  durationS: number;
  geometry: RouteGeometry;
  polyline: string;
}

/** Request payload for getRouteDirections (same shape as createRide pickup/destination). */
export interface GetRouteDirectionsRequest {
  pickup: Location;
  destination: Location;
}

/**
 * Fetch route directions (pickup → destination) with full geometry.
 *
 * Backend calls Mapbox Directions v5 with geometries=geojson and overview=full.
 * Use response.geometry.coordinates for the route line on the map; use
 * distanceM and durationS for fare/ETA.
 *
 * @param pickup - Pickup location (e.g. user location)
 * @param destination - Destination location
 * @returns Route with geometry, distance, and duration
 *
 * @example
 * ```ts
 * const route = await getRouteDirections({ pickup, destination });
 * // route.geometry.coordinates → for ShapeSource + LineLayer
 * // route.distanceM, route.durationS → for fare/ETA
 * ```
 */
export async function getRouteDirections(
  request: GetRouteDirectionsRequest
): Promise<RouteDirectionsResponse> {
  const functions = getFirebaseFunctions();
  const callable = httpsCallable<
    GetRouteDirectionsRequest,
    ApiResponse<RouteDirectionsResponse>
  >(functions, 'getRouteDirections');

  const result = await callable(request);

  if (!result.data.success || !result.data.data) {
    throw new Error(result.data.error?.message ?? 'Failed to get route directions');
  }

  return result.data.data;
}
