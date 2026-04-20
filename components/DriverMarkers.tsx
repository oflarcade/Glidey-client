/**
 * DriverMarkers Component
 *
 * Displays nearby available drivers on the Mapbox map using custom SVG markers
 * for optimal visual quality with MarkerView, with clustering support for
 * large numbers of drivers.
 *
 * Uses GeoJSON ShapeSource for efficient clustering when 20+ drivers.
 * Individual drivers render with custom driver-pin SVG icon.
 *
 * @acceptance AC-DRM-001: Displays drivers as markers on map
 * @acceptance AC-DRM-002: Uses clustering for performance with 20+ markers
 * @acceptance AC-DRM-003: Markers update smoothly as drivers move
 * @acceptance AC-DRM-004: Shows custom driver-pin SVG icon for individual drivers
 */

import React, { memo, useMemo, useCallback } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import type { NearbyDriver } from '@rentascooter/shared';

// SVG icon import (via react-native-svg-transformer)
// Using local asset instead of @rentascooter/ui path (not exported from package)
import DriverPinIcon from '../assets/Icon/driver-pin.svg';

// Conditional Mapbox import
let MapboxGL: typeof import('@rnmapbox/maps').default | undefined;

try {
  MapboxGL = require('@rnmapbox/maps').default;
} catch {
  // Mapbox not available
}

/**
 * Brand colors from theme
 */
const COLORS = {
  primary: '#00A651', // Senegal green
  secondary: '#FECB00', // Senegal yellow
  accent: '#E31B23', // Senegal red
  white: '#FFFFFF',
  dark: '#1A1A1A',
};

/**
 * Driver pin icon dimensions (matching SVG viewBox)
 */
const DRIVER_PIN_SIZE = 25;

/**
 * Threshold for enabling clustering (20+ drivers)
 */
const CLUSTER_THRESHOLD = 20;

interface DriverMarkersProps {
  /** Array of nearby drivers to display */
  drivers: NearbyDriver[];
  /** Called when a driver marker is pressed */
  onDriverPress?: (driver: NearbyDriver) => void;
  /** Whether markers should be visible */
  visible?: boolean;
}

function hasValidCoords(driver: NearbyDriver): boolean {
  const ok =
    typeof driver.latitude === 'number' &&
    typeof driver.longitude === 'number' &&
    isFinite(driver.latitude) &&
    isFinite(driver.longitude);
  if (!ok && __DEV__) {
    console.warn(`[DriverMarkers] driver ${driver.id} missing valid lat/lng — skipped`);
  }
  return ok;
}

/**
 * Generate GeoJSON FeatureCollection from drivers array
 */
function driversToGeoJSON(drivers: NearbyDriver[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: drivers
      .filter(hasValidCoords)
      .map((driver) => ({
        type: 'Feature',
        id: driver.id,
        geometry: {
          type: 'Point',
          coordinates: [driver.longitude, driver.latitude],
        },
        properties: {
          id: driver.id,
          rating: driver.rating ?? 0,
          vehicleType: driver.vehicleType ?? 'scooter',
          distance: driver.distanceM,
        },
      })),
  };
}

/**
 * Individual driver marker component using custom SVG icon
 * Renders as MarkerView child for crisp SVG rendering.
 * Pins only move when their coordinates from the backend change.
 */
const DriverMarker = memo(function DriverMarker({
  driver,
  onPress,
}: {
  driver: NearbyDriver;
  onPress?: (driver: NearbyDriver) => void;
}) {
  const handlePress = useCallback(() => {
    onPress?.(driver);
  }, [driver, onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={styles.markerTouchable}
      accessibilityLabel={`Driver ${driver.id}, ${driver.rating?.toFixed(1) ?? 'No'} rating`}
      accessibilityRole="button"
    >
      <DriverPinIcon width={DRIVER_PIN_SIZE} height={DRIVER_PIN_SIZE} />
    </TouchableOpacity>
  );
});

/**
 * DriverMarkers Component
 *
 * Renders driver locations on the map with two rendering modes:
 * - Individual mode (≤20 drivers): MarkerView with custom SVG for crisp rendering
 * - Clustered mode (>20 drivers): ShapeSource with CircleLayer for performance
 *
 * @example
 * ```tsx
 * <FullScreenMap>
 *   <DriverMarkers
 *     drivers={nearbyDrivers}
 *     onDriverPress={(driver) => console.log('Selected:', driver.id)}
 *   />
 * </FullScreenMap>
 * ```
 */
function DriverMarkersComponent({
  drivers,
  onDriverPress,
  visible = true,
}: DriverMarkersProps) {
  // Convert drivers to GeoJSON (for clustered mode)
  const geoJSON = useMemo(() => driversToGeoJSON(drivers), [drivers]);

  // Determine rendering mode based on driver count
  const useClusterMode = drivers.length > CLUSTER_THRESHOLD;

  // Filter drivers with valid lat/lng (for MarkerView mode)
  const validDrivers = useMemo(
    () => drivers.filter(hasValidCoords),
    [drivers]
  );

  // If no drivers or not visible, render nothing
  if (!visible || drivers.length === 0) {
    return null;
  }

  // If Mapbox not available, return null (placeholder would be shown by FullScreenMap)
  if (!MapboxGL) {
    return null;
  }

  const Mapbox = MapboxGL;

  // Clustered mode: Use ShapeSource with CircleLayer for 20+ drivers
  if (useClusterMode) {
    return (
      <Mapbox.ShapeSource
        id="driver-markers"
        shape={geoJSON}
        cluster={true}
        clusterRadius={50}
        clusterMaxZoomLevel={14}
        onPress={(event) => {
          if (onDriverPress && event.features?.[0]) {
            const feature = event.features[0];
            const driverId = feature.properties?.id;
            const driver = drivers.find((d) => d.id === driverId);
            if (driver) {
              onDriverPress(driver);
            }
          }
        }}
      >
        {/* Clustered points circle */}
        <Mapbox.CircleLayer
          id="driver-clusters"
          filter={['has', 'point_count']}
          style={{
            circleColor: COLORS.primary,
            circleRadius: [
              'step',
              ['get', 'point_count'],
              20, // Default radius
              5,
              25, // If 5+ drivers
              10,
              30, // If 10+ drivers
            ],
            circleOpacity: 0.9,
            circleStrokeWidth: 3,
            circleStrokeColor: COLORS.white,
          }}
        />

        {/* Cluster count text */}
        <Mapbox.SymbolLayer
          id="driver-cluster-count"
          filter={['has', 'point_count']}
          style={{
            textField: ['get', 'point_count_abbreviated'],
            textSize: 14,
            textColor: COLORS.white,
            textFont: ['DIN Pro Bold', 'Arial Unicode MS Bold'],
            textAllowOverlap: true,
          }}
        />

        {/* Individual driver markers in cluster mode - simple circles */}
        <Mapbox.CircleLayer
          id="driver-markers-circle"
          filter={['!', ['has', 'point_count']]}
          style={{
            circleColor: COLORS.primary,
            circleRadius: 10,
            circleStrokeWidth: 2,
            circleStrokeColor: COLORS.white,
            circlePitchAlignment: 'map',
          }}
        />
      </Mapbox.ShapeSource>
    );
  }

  // Individual mode: Use MarkerView with custom SVG for crisp rendering
  return (
    <>
      {validDrivers.map((driver) => (
        <Mapbox.MarkerView
          key={driver.id}
          id={`driver-marker-${driver.id}`}
          coordinate={[driver.longitude, driver.latitude]}
          anchor={{ x: 0.5, y: 1 }} // Anchor at bottom center of pin
          allowOverlap={true}
        >
          <DriverMarker driver={driver} onPress={onDriverPress} />
        </Mapbox.MarkerView>
      ))}
    </>
  );
}

/**
 * Memoized component to prevent unnecessary re-renders
 */
export const DriverMarkers = memo(DriverMarkersComponent);

const styles = StyleSheet.create({
  markerTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default DriverMarkers;
