import type MapboxGL from '@rnmapbox/maps';
import type { Location } from '@rentascooter/shared';
import { Dimensions } from 'react-native';

interface RouteBounds {
  ne: [number, number];
  sw: [number, number];
}

/**
 * Calculate bounds that include both origin and destination
 */
export function calculateRouteBounds(
  origin: Location,
  destination: Location
): RouteBounds {
  const lngs = [origin.longitude, destination.longitude];
  const lats = [origin.latitude, destination.latitude];

  return {
    ne: [Math.max(...lngs), Math.max(...lats)],
    sw: [Math.min(...lngs), Math.min(...lats)],
  };
}

/**
 * Padding configuration for camera bounds
 */
export interface CameraPadding {
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
}

/**
 * Default padding for route camera animation
 * Accounts for bottom modal (60% of screen height)
 */
export function getDefaultRoutePadding(): CameraPadding {
  const { height } = Dimensions.get('window');
  const bottomModalHeight = height * 0.6;

  return {
    paddingTop: 100,
    paddingBottom: bottomModalHeight + 50, // Modal height + margin
    paddingLeft: 50,
    paddingRight: 50,
  };
}

/**
 * Animate camera to show full route
 *
 * @param cameraRef - Mapbox camera ref
 * @param origin - Starting location
 * @param destination - Destination location
 * @param padding - Optional custom padding
 * @param duration - Animation duration in milliseconds (default: 1000)
 */
export function animateToRoute(
  cameraRef: React.RefObject<MapboxGL.Camera | null>,
  origin: Location,
  destination: Location,
  padding?: CameraPadding,
  duration: number = 1000
): void {
  if (!cameraRef.current) {
    console.warn('[mapCamera] Camera ref not available');
    return;
  }

  const bounds = calculateRouteBounds(origin, destination);
  const cameraPadding = padding ?? getDefaultRoutePadding();

  console.log('[mapCamera] Animating to route bounds:', {
    ne: bounds.ne,
    sw: bounds.sw,
    padding: cameraPadding,
  });

  // Mapbox fitBounds expects padding as [top, right, bottom, left] or a single number
  const paddingArray = [
    cameraPadding.paddingTop ?? 0,
    cameraPadding.paddingRight ?? 0,
    cameraPadding.paddingBottom ?? 0,
    cameraPadding.paddingLeft ?? 0,
  ];

  cameraRef.current.fitBounds(
    bounds.ne,
    bounds.sw,
    paddingArray,
    duration
  );
}

/**
 * Animate camera to a single location
 *
 * @param cameraRef - Mapbox camera ref
 * @param location - Location to center on
 * @param zoom - Zoom level (default: 16)
 * @param duration - Animation duration in milliseconds (default: 1000)
 */
export function animateToLocation(
  cameraRef: React.RefObject<MapboxGL.Camera | null>,
  location: Location,
  zoom: number = 16,
  duration: number = 1000
): void {
  if (!cameraRef.current) {
    console.warn('[mapCamera] Camera ref not available');
    return;
  }

  console.log('[mapCamera] Animating to location:', {
    lat: location.latitude,
    lng: location.longitude,
    zoom,
  });

  cameraRef.current.setCamera({
    centerCoordinate: [location.longitude, location.latitude],
    zoomLevel: zoom,
    animationDuration: duration,
  });
}

/**
 * Get current camera state
 *
 * @param cameraRef - Mapbox camera ref
 * @returns Promise with current camera state
 */
export async function getCameraState(
  cameraRef: React.RefObject<MapboxGL.Camera | null>
): Promise<{
  center: [number, number];
  zoom: number;
  heading: number;
  pitch: number;
} | null> {
  if (!cameraRef.current) {
    console.warn('[mapCamera] Camera ref not available');
    return null;
  }

  try {
    // Note: This is a placeholder - actual implementation depends on Mapbox API
    // You may need to track camera state manually via onRegionChange
    return null;
  } catch (error) {
    console.error('[mapCamera] Error getting camera state:', error);
    return null;
  }
}

/**
 * Calculate appropriate zoom level for a given distance
 *
 * @param distanceMeters - Distance in meters
 * @returns Appropriate zoom level
 */
export function calculateZoomForDistance(distanceMeters: number): number {
  // Mapbox zoom levels:
  // 20 = ~50m
  // 18 = ~200m
  // 16 = ~800m
  // 14 = ~3km
  // 12 = ~12km
  // 10 = ~50km

  if (distanceMeters < 200) return 18;
  if (distanceMeters < 800) return 16;
  if (distanceMeters < 3000) return 14;
  if (distanceMeters < 12000) return 12;
  return 10;
}
