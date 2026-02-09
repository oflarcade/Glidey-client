/**
 * Drivers Service
 *
 * Firebase callable function wrappers for driver-related operations.
 * Used by the client app to fetch nearby available drivers for map display.
 */

import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '@rentascooter/auth';
import type {
  GeoPoint,
  ApiResponse,
  NearbyDriver,
  NearbyDriversResponse,
  GetNearbyDriversRequest,
} from '@rentascooter/shared';

// Re-export NearbyDriver type for consumers
export type { NearbyDriver, GetNearbyDriversRequest };

/**
 * Fetch nearby drivers optimized for map display
 *
 * Uses the optimized getNearbyDriversForMap endpoint which:
 * - Returns minimal driver data (no PII)
 * - Supports rate limiting for frequent polling (~5s intervals)
 * - Limits results to max 20 drivers
 * - Includes pre-calculated distances
 *
 * @param location - User's current location
 * @param radiusKm - Search radius in kilometers (default: 3km, max: 10km)
 * @param limit - Maximum drivers to return (default: 20)
 * @returns Array of nearby available drivers for map markers
 *
 * @example
 * ```ts
 * const { drivers, timestamp } = await getNearbyDriversForMap({
 *   location: { latitude: 14.6937, longitude: -17.4441 },
 *   radiusKm: 3,
 *   limit: 15,
 * });
 * ```
 */
export async function getNearbyDriversForMap(
  request: GetNearbyDriversRequest
): Promise<NearbyDriversResponse> {
  const functions = getFirebaseFunctions();
  const callable = httpsCallable<GetNearbyDriversRequest, ApiResponse<NearbyDriversResponse>>(
    functions,
    'getNearbyDriversForMap'
  );

  const result = await callable(request);

  if (!result.data.success || !result.data.data) {
    throw new Error(result.data.error?.message ?? 'Failed to fetch nearby drivers');
  }

  return result.data.data;
}

/**
 * Convenience function to get just the drivers array
 *
 * @param location - User's current location
 * @param radiusKm - Search radius in kilometers (default: 3km)
 * @returns Array of nearby available drivers
 */
export async function getAvailableDrivers(
  request: Pick<GetNearbyDriversRequest, 'location' | 'radiusKm'>
): Promise<NearbyDriver[]> {
  const response = await getNearbyDriversForMap(request);
  return response.drivers;
}

/**
 * Calculate distance between two GeoPoints using Haversine formula
 * Used for client-side distance threshold checks
 *
 * @param point1 - First location
 * @param point2 - Second location
 * @returns Distance in meters
 */
export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
