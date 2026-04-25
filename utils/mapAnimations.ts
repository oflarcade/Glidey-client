/**
 * Map Animation Utilities
 * Client App - Map Camera Animations
 *
 * Utilities for smooth map camera animations when selecting destinations.
 * Handles camera movements, bounds calculation, and coordinate transformations.
 *
 * Performance:
 * - Uses Mapbox native animations (GPU-accelerated)
 * - Maintains 60fps during camera transitions
 * - Optimized padding for modal overlays
 *
 * @acceptance AC-MA-001: Camera animates smoothly to show both user and destination
 * @acceptance AC-MA-002: Animation duration is 1000ms
 * @acceptance AC-MA-003: Proper padding accounts for bottom modal
 * @acceptance AC-MA-004: Both pins are visible after animation
 * @acceptance AC-MA-005: Animation maintains 60fps
 */

import type MapboxGL from '@rnmapbox/maps';
import type { GeoPoint } from '@rentascooter/shared';

/**
 * Animation configuration constants
 */
export const ANIMATION_CONFIG = {
  /** Duration of camera animation in milliseconds */
  DURATION: 1000,
  /** Padding for camera bounds (accounts for UI overlays) */
  PADDING: {
    top: 200, // Top bar + destination tip
    bottom: 400, // Bottom modal
    left: 40, // Side margins
    right: 40, // Side margins
  },
  /** Minimum zoom level for destination view */
  MIN_ZOOM: 12,
  /** Maximum zoom level for destination view */
  MAX_ZOOM: 16,
  /** Navigation guidance camera pitch for accepted rides */
  GUIDANCE_PITCH: 50,
} as const;

/**
 * Calculate bounds that contain both user location and destination
 *
 * @param userLocation - User's current location
 * @param destination - Selected destination location
 * @returns Bounding box coordinates [swLng, swLat, neLng, neLat]
 */
function calculateBounds(
  userLocation: GeoPoint,
  destination: GeoPoint
): [number, number, number, number] {
  // Find min/max coordinates
  const minLng = Math.min(userLocation.longitude, destination.longitude);
  const maxLng = Math.max(userLocation.longitude, destination.longitude);
  const minLat = Math.min(userLocation.latitude, destination.latitude);
  const maxLat = Math.max(userLocation.latitude, destination.latitude);

  // Add 10% padding to bounds for better framing
  const lngPadding = (maxLng - minLng) * 0.1;
  const latPadding = (maxLat - minLat) * 0.1;

  return [
    minLng - lngPadding, // Southwest longitude
    minLat - latPadding, // Southwest latitude
    maxLng + lngPadding, // Northeast longitude
    maxLat + latPadding, // Northeast latitude
  ];
}

/**
 * Calculate distance between two points in meters (Haversine formula)
 *
 * @param point1 - First coordinate
 * @param point2 - Second coordinate
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

/**
 * Animate map camera to show both user location and destination
 *
 * This function calculates the optimal camera bounds to display both the user's
 * current location and the selected destination, then animates the camera smoothly
 * to that view. Padding is applied to account for UI overlays (top bar, modal).
 *
 * Performance considerations:
 * - Uses Mapbox native fitBounds for GPU-accelerated animation
 * - Animation runs on native thread (no JS bridge bottleneck)
 * - Duration optimized for smooth 60fps animation
 *
 * @param cameraRef - React ref to Mapbox Camera component
 * @param destination - Selected destination coordinates
 * @param userLocation - User's current location coordinates
 * @param options - Optional animation configuration
 * @returns Promise that resolves when animation completes
 *
 * @example
 * ```typescript
 * await animateToDestination(
 *   cameraRef,
 *   { latitude: 14.7167, longitude: -17.4677 },
 *   { latitude: 14.6937, longitude: -17.4441 }
 * );
 * ```
 */
export async function animateToDestination(
  cameraRef: React.RefObject<MapboxGL.Camera | null>,
  destination: GeoPoint,
  userLocation: GeoPoint,
  options?: {
    duration?: number;
    padding?: typeof ANIMATION_CONFIG.PADDING;
  }
): Promise<void> {
  if (!cameraRef.current) {
    console.warn('[mapAnimations] Camera ref is null, skipping animation');
    return;
  }

  // Calculate bounds that include both points
  const bounds = calculateBounds(userLocation, destination);

  // Calculate distance to determine if we need animation
  const distance = calculateDistance(userLocation, destination);

  // For very short distances (< 100m), use a fixed zoom instead of bounds
  if (distance < 100) {
    const centerLat = (userLocation.latitude + destination.latitude) / 2;
    const centerLng = (userLocation.longitude + destination.longitude) / 2;

    await cameraRef.current.setCamera({
      centerCoordinate: [centerLng, centerLat],
      zoomLevel: ANIMATION_CONFIG.MAX_ZOOM,
      animationDuration: options?.duration ?? ANIMATION_CONFIG.DURATION,
    });
    return;
  }

  // Animate camera to fit bounds with padding
  await cameraRef.current.fitBounds(
    [bounds[0], bounds[1]], // Southwest
    [bounds[2], bounds[3]], // Northeast
    options?.padding ?? ANIMATION_CONFIG.PADDING,
    options?.duration ?? ANIMATION_CONFIG.DURATION
  );
}

/**
 * Animate camera to center on a single location
 *
 * @param cameraRef - React ref to Mapbox Camera component
 * @param location - Target location coordinates
 * @param zoomLevel - Desired zoom level (default: 16)
 * @param duration - Animation duration in ms (default: 1000)
 * @param padding - Optional insets so the coordinate lands in the visible area above UI overlays
 */
export async function animateToLocation(
  cameraRef: React.RefObject<MapboxGL.Camera | null>,
  location: GeoPoint,
  zoomLevel: number = ANIMATION_CONFIG.MAX_ZOOM,
  duration: number = ANIMATION_CONFIG.DURATION,
  padding?: { paddingTop?: number; paddingBottom?: number; paddingLeft?: number; paddingRight?: number }
): Promise<void> {
  if (!cameraRef.current) {
    console.warn('[mapAnimations] Camera ref is null, skipping animation');
    return;
  }

  await cameraRef.current.setCamera({
    centerCoordinate: [location.longitude, location.latitude],
    zoomLevel,
    animationDuration: duration,
    ...(padding && {
      padding: {
        paddingTop: padding.paddingTop ?? 0,
        paddingBottom: padding.paddingBottom ?? 0,
        paddingLeft: padding.paddingLeft ?? 0,
        paddingRight: padding.paddingRight ?? 0,
      },
    }),
  });
}

/**
 * Reset camera to user location with default zoom
 *
 * @param cameraRef - React ref to Mapbox Camera component
 * @param userLocation - User's current location
 * @param duration - Animation duration in ms (default: 800)
 */
export async function resetCameraToUser(
  cameraRef: React.RefObject<MapboxGL.Camera | null>,
  userLocation: GeoPoint,
  duration: number = 800
): Promise<void> {
  await animateToLocation(cameraRef, userLocation, ANIMATION_CONFIG.MAX_ZOOM, duration);
}

/**
 * Transition camera into a navigation-like guidance perspective.
 *
 * This keeps both pickup and destination visible, then applies a pitched camera
 * centered near pickup so the map resembles turn-by-turn guidance mode.
 */
export async function animateToGuidanceView(
  cameraRef: React.RefObject<MapboxGL.Camera | null>,
  pickup: GeoPoint,
  destination: GeoPoint,
  options?: {
    duration?: number;
    padding?: typeof ANIMATION_CONFIG.PADDING;
    pitch?: number;
  }
): Promise<void> {
  if (!cameraRef.current) {
    console.warn('[mapAnimations] Camera ref is null, skipping guidance animation');
    return;
  }

  const duration = options?.duration ?? ANIMATION_CONFIG.DURATION;
  const pitch = options?.pitch ?? ANIMATION_CONFIG.GUIDANCE_PITCH;

  await animateToDestination(cameraRef, destination, pickup, {
    duration,
    padding: options?.padding,
  });

  await cameraRef.current.setCamera({
    centerCoordinate: [pickup.longitude, pickup.latitude],
    zoomLevel: 15,
    pitch,
    animationDuration: Math.max(300, Math.floor(duration * 0.7)),
  });
}
