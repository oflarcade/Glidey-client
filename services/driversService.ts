/**
 * Drivers Service
 *
 * REST client for nearby driver fetching.
 * Implements cavekit-nearby-drivers.md R1.
 */

import { authedFetch, isApiError, DEMO_MODE_ERROR } from '@rentascooter/api';
import type { GeoPoint, NearbyDriver } from '@rentascooter/shared';

// ─── Demo fixtures (T-048) ────────────────────────────────────────────────────

const DEMO_DRIVERS: NearbyDriver[] = [
  { id: 'demo-d1', name: 'Moussa Diallo', vehicleType: 'scooter', vehiclePlate: 'DK-1234-A', rating: 4.8, distanceM: 320, latitude: 14.6961, longitude: -17.4473 },
  { id: 'demo-d2', name: 'Fatou Ndiaye', vehicleType: 'scooter', vehiclePlate: 'DK-5678-B', rating: 4.6, distanceM: 750, latitude: 14.7012, longitude: -17.4512 },
  { id: 'demo-d3', name: 'Ibrahima Sow', vehicleType: 'scooter', vehiclePlate: 'DK-9012-C', rating: 4.9, distanceM: 1100, latitude: 14.6897, longitude: -17.4398 },
  { id: 'demo-d4', name: 'Aissatou Ba', vehicleType: 'scooter', vehiclePlate: 'DK-3456-D', rating: 4.5, distanceM: 1800, latitude: 14.7097, longitude: -17.4567 },
  { id: 'demo-d5', name: 'Omar Gueye', vehicleType: 'scooter', vehiclePlate: 'DK-7890-E', rating: 4.7, distanceM: 2400, latitude: 14.6843, longitude: -17.4521 },
];

export type { NearbyDriver };

const DEFAULT_RADIUS_M = 3000;

/**
 * Fetch nearby available drivers around a location.
 * Throws ApiError on backend/network failure.
 * Callers are responsible for applying the R4 jitter fallback (T-044/T-045)
 * when the backend does not yet return per-driver coordinates.
 */
export async function getNearby(params: {
  lat: number;
  lng: number;
  radiusM?: number;
}): Promise<NearbyDriver[]> {
  const radius = params.radiusM ?? DEFAULT_RADIUS_M;
  const qs = `lat=${params.lat}&lng=${params.lng}&radius=${radius}`;
  try {
    const data = await authedFetch('GET', `/drivers/nearby?${qs}`);
    return data as NearbyDriver[];
  } catch (e) {
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) return DEMO_DRIVERS;
    throw e;
  }
}

// ─── T-044/T-045: Coordinate fallback (TEMP until R3 backend fix) ────────────

function hasRealCoords(driver: NearbyDriver): boolean {
  return (
    typeof driver.latitude === 'number' &&
    typeof driver.longitude === 'number' &&
    (driver.latitude !== 0 || driver.longitude !== 0) &&
    Math.abs(driver.latitude) <= 90 &&
    Math.abs(driver.longitude) <= 180
  );
}

function driverBearing(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (((hash << 5) - hash) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 360);
}

/**
 * Synthesize lat/lng from search center + distanceM + deterministic bearing.
 * Returns driver unchanged if it already has valid coordinates.
 * TEMP: remove once backend provides per-driver positions (cavekit R3 gap).
 */
export function applyCoordFallback(
  driver: NearbyDriver,
  center: { latitude: number; longitude: number }
): NearbyDriver {
  if (hasRealCoords(driver)) return driver;
  const distanceM = driver.distanceM ?? 500;
  const b = (driverBearing(driver.id) * Math.PI) / 180;
  const R = 6_371_000;
  const lat1 = (center.latitude * Math.PI) / 180;
  const lng1 = (center.longitude * Math.PI) / 180;
  const d = distanceM / R;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );
  return {
    ...driver,
    latitude: (lat2 * 180) / Math.PI,
    longitude: (lng2 * 180) / Math.PI,
  };
}

// ─── Distance helper ─────────────────────────────────────────────────────────

/**
 * Calculate distance between two GeoPoints using Haversine formula.
 * Used for client-side distance threshold checks.
 */
export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const R = 6_371_000; // metres
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
