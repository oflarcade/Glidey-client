import React, { useRef, useEffect, useCallback, useState, memo } from 'react';
import { View, StyleSheet, Platform, Text as RNText, NativeModules } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { legacyColors as colors } from '../../theme/colors';
import { typography, spacing } from '../../theme/tokens';
import { UserPositionPin } from '../UserPositionPin';
import type { FullScreenMapProps, CameraState, MapStyle, UserMarkerSize } from './types';

// Conditional Mapbox import - will be undefined if not installed
let MapboxGL: typeof import('@rnmapbox/maps').default | undefined;
let MAPBOX_CONFIG: { DEFAULT_CENTER: { latitude: number; longitude: number }; DEFAULT_ZOOM: number; DRIVER_ZOOM: number } | undefined;

try {
  MapboxGL = require('@rnmapbox/maps').default;
  MAPBOX_CONFIG = require('@rentascooter/shared').MAPBOX_CONFIG;
} catch {
  // Mapbox not available, will use placeholder
}

// Map style URLs
const MAP_STYLES: Record<MapStyle, string> = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
};

// Default config for when shared package isn't available
const DEFAULT_CONFIG = {
  DEFAULT_CENTER: { latitude: 14.6937, longitude: -17.4441 },
  DEFAULT_ZOOM: 14,
  DRIVER_ZOOM: 16,
};

/**
 * Detect if running on Android emulator
 * Android emulators have GPU rendering issues with Mapbox's default TextureView.
 * Using surfaceView fixes the black screen issue on emulators.
 */
const isAndroidEmulator = (): boolean => {
  if (Platform.OS !== 'android') return false;
  
  // Check for emulator fingerprints
  const { PlatformConstants } = NativeModules;
  const fingerprint = PlatformConstants?.Fingerprint ?? '';
  const model = PlatformConstants?.Model ?? '';
  const brand = PlatformConstants?.Brand ?? '';
  
  // Common emulator identifiers
  const emulatorIndicators = [
    fingerprint.includes('generic'),
    fingerprint.includes('sdk'),
    fingerprint.includes('google_sdk'),
    fingerprint.includes('vbox'),
    fingerprint.includes('emulator'),
    model.includes('sdk'),
    model.includes('Emulator'),
    model.includes('Android SDK'),
    brand === 'google' && model.includes('sdk'),
    brand === 'generic',
  ];
  
  const isEmulator = emulatorIndicators.some(Boolean);
  
  if (isEmulator && __DEV__) {
    console.log('🤖 [FullScreenMap] Android emulator detected - using surfaceView');
  }
  
  return isEmulator;
};

// Cache the emulator check result
// TEMPORARY FIX: Force surfaceView on all Android devices to fix black/white screen issue
// The emulator detection may not work reliably on all emulator configurations
const USE_SURFACE_VIEW = Platform.OS === 'android'; // isAndroidEmulator();

// Note: USE_SURFACE_VIEW is forced true on Android to fix rendering issues

/**
 * Map Placeholder Component
 * Shown when Mapbox is not configured or not available
 */
const MapPlaceholder = memo(function MapPlaceholder({
  showUserLocation,
}: {
  showUserLocation?: boolean;
}) {
  return (
    <View style={styles.mapPlaceholder}>
      {/* Grid pattern for map effect */}
      <View style={styles.gridContainer}>
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.gridRow}>
            {Array.from({ length: 4 }).map((_, colIndex) => (
              <View key={`cell-${rowIndex}-${colIndex}`} style={styles.gridCell} />
            ))}
          </View>
        ))}
      </View>

      {/* Center content */}
      <View style={styles.centerContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="map-outline" size={48} color={colors.text.tertiary} />
        </View>
        <RNText style={styles.placeholderText}>Map Loading...</RNText>
        {showUserLocation && (
          <View style={styles.locationIndicator}>
            <View style={styles.locationDot} />
            <View style={styles.locationRing} />
          </View>
        )}
      </View>
    </View>
  );
});

/**
 * FullScreenMap Component
 *
 * A full-screen Mapbox map optimized for mobile ride-hailing applications.
 * Falls back to a placeholder when Mapbox is not configured.
 * Supports user location tracking, custom overlays, and various map styles.
 *
 * @example
 * ```tsx
 * <FullScreenMap
 *   showUserLocation
 *   followUserLocation
 *   onUserLocationUpdate={(location) => console.log(location)}
 * >
 *   <MapPin coordinate={[lng, lat]} />
 * </FullScreenMap>
 * ```
 *
 * Acceptance Criteria:
 * - AC-FSM-001: Map renders full-screen
 * - AC-FSM-002: User location dot displays when showUserLocation is true
 * - AC-FSM-003: Camera follows user when followUserLocation is true
 * - AC-FSM-004: Permission denied handled gracefully
 * - AC-FSM-005: Children render as map overlays
 * - AC-FSM-006: Performance optimized (memoized, compass disabled by default)
 * - AC-FSM-007: Graceful fallback when Mapbox not configured
 */
function FullScreenMapComponent({
  showUserLocation = false,
  useCustomUserMarker = false,
  userMarkerSize = 'large',
  autoSizeUserMarker = false,
  userMarkerZoomThreshold = 14,
  onUserLocationUpdate,
  initialCenter,
  initialZoom,
  followUserLocation = false,
  mapStyle = 'streets',
  children,
  style,
  mapRef: externalMapRef,
  cameraRef: externalCameraRef,
  onMapReady,
  onRegionChange,
  testID,
  scrollEnabled = true,
  zoomEnabled = true,
  rotateEnabled = false,
  pitchEnabled = false,
  minZoom = 3,
  maxZoom = 20,
  attributionPosition = 'bottomRight',
  compassEnabled = false,
  scaleBarEnabled = false,
  userHeading,
  externalUserLocation,
}: FullScreenMapProps) {
  // Use config or defaults
  const config = MAPBOX_CONFIG ?? DEFAULT_CONFIG;
  const center = initialCenter ?? config.DEFAULT_CENTER;
  const zoom = initialZoom ?? config.DEFAULT_ZOOM;

  // Show placeholder if Mapbox is not available
  if (!MapboxGL) {
    return (
      <View style={[styles.container, style]} testID={testID}>
        <MapPlaceholder showUserLocation={showUserLocation} />
        {/* Custom children can still be rendered */}
        {children}
      </View>
    );
  }

  // Full Mapbox implementation
  return (
    <FullScreenMapMapbox
      showUserLocation={showUserLocation}
      useCustomUserMarker={useCustomUserMarker}
      userMarkerSize={userMarkerSize}
      autoSizeUserMarker={autoSizeUserMarker}
      userMarkerZoomThreshold={userMarkerZoomThreshold}
      onUserLocationUpdate={onUserLocationUpdate}
      initialCenter={center}
      initialZoom={zoom}
      followUserLocation={followUserLocation}
      mapStyle={mapStyle}
      children={children}
      style={style}
      mapRef={externalMapRef}
      cameraRef={externalCameraRef}
      onMapReady={onMapReady}
      onRegionChange={onRegionChange}
      testID={testID}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      rotateEnabled={rotateEnabled}
      pitchEnabled={pitchEnabled}
      minZoom={minZoom}
      maxZoom={maxZoom}
      attributionPosition={attributionPosition}
      compassEnabled={compassEnabled}
      scaleBarEnabled={scaleBarEnabled}
      config={config}
      userHeading={userHeading}
      externalUserLocation={externalUserLocation}
    />
  );
}

/**
 * Internal Mapbox implementation component
 * Only rendered when Mapbox is available
 */
function FullScreenMapMapbox({
  showUserLocation,
  useCustomUserMarker,
  userMarkerSize,
  autoSizeUserMarker,
  userMarkerZoomThreshold = 14,
  onUserLocationUpdate,
  initialCenter,
  initialZoom,
  followUserLocation,
  mapStyle,
  children,
  style,
  mapRef: externalMapRef,
  cameraRef: externalCameraRef,
  onMapReady,
  onRegionChange,
  testID,
  scrollEnabled,
  zoomEnabled,
  rotateEnabled,
  pitchEnabled,
  minZoom,
  maxZoom,
  attributionPosition,
  compassEnabled,
  scaleBarEnabled,
  config,
  userHeading,
  externalUserLocation,
}: FullScreenMapProps & { config: typeof DEFAULT_CONFIG }) {
  // Type assertion since we only reach here when MapboxGL is available
  const Mapbox = MapboxGL!;

  const internalMapRef = useRef<any>(null);
  const internalCameraRef = useRef<any>(null);
  const mapViewRef = externalMapRef ?? internalMapRef;
  const cameraViewRef = externalCameraRef ?? internalCameraRef;

  const [isMapReady, setIsMapReady] = useState(false);
  
  // Track map ready state
  const isMapReadyRef = useRef(false);
  
  // State for custom user marker (from Mapbox.UserLocation)
  const [internalUserLocation, setInternalUserLocation] = useState<{
    latitude: number;
    longitude: number;
    heading: number;
  } | null>(null);
  const [currentZoom, setCurrentZoom] = useState(initialZoom ?? config.DEFAULT_ZOOM);

  // Persistent location state - keeps last valid location even if external becomes null
  const [persistedLocation, setPersistedLocation] = useState<{
    latitude: number;
    longitude: number;
    heading: number;
  } | null>(null);

  // Use external location if provided, otherwise fall back to internal
  // This allows parent components to provide location from their own tracking (e.g., expo-location)
  const userLocation = externalUserLocation
    ? {
        latitude: externalUserLocation.latitude,
        longitude: externalUserLocation.longitude,
        heading: externalUserLocation.heading ?? 0,
      }
    : internalUserLocation;

  // Ref to track externalUserLocation without causing callback recreation
  // This prevents Mapbox.UserLocation from re-initializing when externalUserLocation changes
  const externalUserLocationRef = useRef(externalUserLocation);
  externalUserLocationRef.current = externalUserLocation;

  // Ref to track previous location values to prevent infinite loops
  const prevLocationRef = useRef<{
    latitude: number;
    longitude: number;
    heading: number;
  } | null>(null);

  // Update persisted location only when values actually change
  useEffect(() => {
    if (userLocation && 
        typeof userLocation.latitude === 'number' && 
        typeof userLocation.longitude === 'number' &&
        !isNaN(userLocation.latitude) && 
        !isNaN(userLocation.longitude)) {
      
      const prev = prevLocationRef.current;
      // Only update if values actually changed
      if (!prev ||
          prev.latitude !== userLocation.latitude ||
          prev.longitude !== userLocation.longitude ||
          prev.heading !== userLocation.heading) {
        setPersistedLocation(userLocation);
        prevLocationRef.current = userLocation;
        
        // Manually follow user location if enabled
        if (followUserLocation && cameraViewRef.current) {
          cameraViewRef.current.setCamera({
            centerCoordinate: [userLocation.longitude, userLocation.latitude],
            animationDuration: 1000,
          });
        }
      }
    }
  }, [userLocation, followUserLocation]);

  // Calculate marker size based on zoom level when auto-sizing is enabled
  // Zoomed IN (high zoom number) = small pin, Zoomed OUT (low zoom) = large pin
  const effectiveMarkerSize: UserMarkerSize = autoSizeUserMarker
    ? currentZoom >= (userMarkerZoomThreshold ?? 14)
      ? 'small'
      : 'large'
    : userMarkerSize ?? 'large';

  // Handle map ready
  const handleMapReady = useCallback(() => {
    if (__DEV__) {
      console.log('🗺️ [FullScreenMap] Map finished loading');
    }
    isMapReadyRef.current = true;
    setIsMapReady(true);
    onMapReady?.();
  }, [onMapReady]);

  // Handle map loading error
  const handleMapLoadingError = useCallback((error: any) => {
    console.error('❌ [FullScreenMap] Map loading error:', JSON.stringify(error));
  }, []);

  // Handle real-time camera changes (fires continuously during zoom/pan gestures)
  // This enables smooth marker size animation while user is zooming
  const handleCameraChanged = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => {
      const zoomLevel = state?.properties?.zoom;
      if (typeof zoomLevel !== 'number') return;
      
      // Update current zoom for auto-sizing marker in real-time
      if (autoSizeUserMarker) {
        setCurrentZoom(zoomLevel);
      }
    },
    [autoSizeUserMarker]
  );

  // Handle region change (fires when map becomes idle after gestures)
  // Used for external onRegionChange callback
  const handleRegionChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => {
      const properties = state?.properties;
      if (!properties) return;

      const { center, zoom: zoomLevel, heading, pitch } = properties;
      const [longitude, latitude] = center ?? [];

      // Also update zoom here for cases where onCameraChanged might not fire
      if (autoSizeUserMarker && typeof zoomLevel === 'number') {
        setCurrentZoom(zoomLevel);
      }

      if (!onRegionChange || typeof latitude !== 'number' || typeof longitude !== 'number') return;

      const cameraState: CameraState = {
        center: { latitude, longitude },
        zoom: zoomLevel ?? initialZoom ?? config.DEFAULT_ZOOM,
        heading: heading ?? 0,
        pitch: pitch ?? 0,
      };

      onRegionChange(cameraState);
    },
    [onRegionChange, autoSizeUserMarker, initialZoom, config.DEFAULT_ZOOM]
  );

  // Handle user location updates for custom marker
  // Uses ref for externalUserLocation to keep callback stable and prevent Mapbox.UserLocation re-initialization
  const handleUserLocationUpdate = useCallback(
    (location: any) => {
      if (!location?.coords) return;

      const { latitude, longitude, heading } = location.coords;

      // Update internal state for custom marker rendering (only if no external location provided)
      // Using ref to avoid callback recreation when externalUserLocation changes
      if (useCustomUserMarker && !externalUserLocationRef.current) {
        setInternalUserLocation({
          latitude,
          longitude,
          heading: heading ?? 0,
        });
      }

      // Call external callback
      onUserLocationUpdate?.({
        latitude,
        longitude,
        heading: heading ?? undefined,
        accuracy: location.coords.accuracy ?? undefined,
        speed: location.coords.speed ?? undefined,
        timestamp: location.timestamp,
      });
    },
    [useCustomUserMarker, onUserLocationUpdate]
  );

  // Attribution position mapping
  const getAttributionPosition = () => {
    const positions: Record<
      string,
      { bottom?: number; top?: number; left?: number; right?: number }
    > = {
      topLeft: { top: 8, left: 8 },
      topRight: { top: 8, right: 8 },
      bottomLeft: { bottom: 8, left: 8 },
      bottomRight: { bottom: 8, right: 8 },
    };
    return positions[attributionPosition ?? 'bottomRight'];
  };


  return (
    <View style={[styles.container, style]} testID={testID}>
      <Mapbox.MapView
        ref={mapViewRef}
        style={styles.map}
        styleURL={MAP_STYLES[mapStyle ?? 'streets']}
        onDidFinishLoadingMap={handleMapReady}
        onMapLoadingError={handleMapLoadingError}
        onCameraChanged={autoSizeUserMarker ? handleCameraChanged : undefined}
        onMapIdle={handleRegionChange}
        scrollEnabled={scrollEnabled}
        zoomEnabled={zoomEnabled}
        rotateEnabled={rotateEnabled}
        pitchEnabled={pitchEnabled}
        compassEnabled={compassEnabled}
        scaleBarEnabled={scaleBarEnabled}
        attributionEnabled
        attributionPosition={getAttributionPosition()}
        logoEnabled={false}
        // CRITICAL: Use surfaceView on Android emulators to fix black screen issue
        // TextureView (default) has GPU rendering issues with Android emulator OpenGL emulation
        surfaceView={USE_SURFACE_VIEW}
      >
        <Mapbox.Camera
          ref={cameraViewRef}
          defaultSettings={{
            centerCoordinate: [
              initialCenter?.longitude ?? config.DEFAULT_CENTER.longitude,
              initialCenter?.latitude ?? config.DEFAULT_CENTER.latitude,
            ],
            zoomLevel: initialZoom ?? config.DEFAULT_ZOOM,
          }}
          minZoomLevel={minZoom}
          maxZoomLevel={maxZoom}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* User location indicator - native or custom */}
        {showUserLocation && !useCustomUserMarker && (
          <Mapbox.LocationPuck
            visible
            puckBearingEnabled
            puckBearing="heading"
            onLocationUpdate={handleUserLocationUpdate}
          />
        )}

        {/* Custom UserPositionPin marker */}
        {showUserLocation && useCustomUserMarker && (
          <Mapbox.UserLocation
            visible={false}
            onUpdate={handleUserLocationUpdate}
          />
        )}
        {(() => {
          const shouldShow = showUserLocation && 
           useCustomUserMarker && 
           persistedLocation &&
           typeof persistedLocation.longitude === 'number' &&
           typeof persistedLocation.latitude === 'number' &&
           !isNaN(persistedLocation.longitude) &&
           !isNaN(persistedLocation.latitude);
          
          return shouldShow ? (
            <Mapbox.MarkerView
              key="user-position-marker"
              id="user-position-marker"
              coordinate={[persistedLocation.longitude, persistedLocation.latitude]}
              anchor={{ x: 0.5, y: 0.5 }}
              allowOverlap
              allowOverlapWithPuck
            >
              <UserPositionPin
                size={effectiveMarkerSize}
                heading={userHeading ?? persistedLocation.heading}
                animated
                testID="user-position-pin"
              />
            </Mapbox.MarkerView>
          ) : null;
        })()}

        {/* Custom children (markers, routes, etc.) */}
        {children}
      </Mapbox.MapView>
    </View>
  );
}

/**
 * Memoized FullScreenMap to prevent unnecessary re-renders
 */
export const FullScreenMap = memo(FullScreenMapComponent);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.background.tertiary,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: colors.text.tertiary,
  },
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  placeholderText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: 12,
  },
  locationIndicator: {
    position: 'absolute',
    bottom: '40%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary.main,
    borderWidth: 3,
    borderColor: colors.background.primary,
    zIndex: 2,
  },
  locationRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.main + '20',
    zIndex: 1,
  },
});

export default FullScreenMap;
