/**
 * Resolve route line coordinates for the map: prefer backend road geometry,
 * fallback to decoded polyline, then straight line.
 * All coordinates are returned in GeoJSON order [lng, lat] for Mapbox.
 */

import type { RouteDirectionsResponse } from '@/services/routeDirectionsService';
import { decodePolylineToLngLat } from './decodePolyline';

/**
 * Get route line as [lng, lat][] for ShapeSource + LineLayer.
 * Uses routeDirections.geometry.coordinates when present, else decoded
 * routeDirections.polyline, else straight line between location and destination.
 */
export function getRouteLineCoordinates(
  routeDirections: RouteDirectionsResponse | null,
  location: { latitude: number; longitude: number } | null,
  destination: { latitude: number; longitude: number } | null
): [number, number][] {
  if (!location || !destination) return [];

  // Prefer full geometry from backend (Mapbox Directions API returns [lng, lat])
  const geomCoords = routeDirections?.geometry?.coordinates;
  if (geomCoords && geomCoords.length > 0) return geomCoords;

  // Fallback: decode encoded polyline from backend (output [lng, lat])
  if (routeDirections?.polyline && typeof routeDirections.polyline === 'string') {
    const decoded = decodePolylineToLngLat(routeDirections.polyline);
    if (decoded.length > 0) return decoded;
  }

  // Last resort: straight line
  return [
    [location.longitude, location.latitude],
    [destination.longitude, destination.latitude],
  ];
}
