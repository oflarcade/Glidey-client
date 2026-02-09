import type { ViewStyle } from 'react-native';
import type { RefObject, ReactNode, ComponentType } from 'react';
import type MapboxGL from '@rnmapbox/maps';

/**
 * Coordinates type for map locations
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Props passed to custom user location marker components
 */
export interface CustomUserLocationMarkerProps {
  /** Current latitude */
  latitude: number;
  /** Current longitude */
  longitude: number;
  /** Device heading in degrees (0-360, where 0 = North) */
  heading?: number;
  /** Current zoom level of the map */
  zoomLevel: number;
  /** Location accuracy in meters */
  accuracy?: number;
}

/**
 * Location update event data
 */
export interface LocationUpdateEvent {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

/**
 * Camera state for map view
 */
export interface CameraState {
  center: Coordinates;
  zoom: number;
  heading?: number;
  pitch?: number;
}

/**
 * Map style options
 */
export type MapStyle = 'streets' | 'outdoors' | 'light' | 'dark' | 'satellite';

/**
 * User marker size for custom position pin
 */
export type UserMarkerSize = 'small' | 'large';

/**
 * FullScreenMap component props
 */
export interface FullScreenMapProps {
  /** Show user's current location on the map */
  showUserLocation?: boolean;
  /** Use custom UserPositionPin instead of native LocationPuck */
  useCustomUserMarker?: boolean;
  /** Size of the custom user marker ('large' = 57px, 'small' = 25px) */
  userMarkerSize?: UserMarkerSize;
  /** Auto-adjust marker size based on zoom level (large when zoomed in, small when zoomed out) */
  autoSizeUserMarker?: boolean;
  /** Zoom level threshold for auto-sizing (default: 14) - below this uses small, above uses large */
  userMarkerZoomThreshold?: number;
  /** Callback when user location updates */
  onUserLocationUpdate?: (location: LocationUpdateEvent) => void;
  /** Initial center coordinates for the map */
  initialCenter?: Coordinates;
  /** Initial zoom level (0-22) */
  initialZoom?: number;
  /** Enable camera follow mode for user location */
  followUserLocation?: boolean;
  /** Map style variant */
  mapStyle?: MapStyle;
  /** Children to render as map overlays (markers, routes, etc.) */
  children?: ReactNode;
  /** Additional styles for the container */
  style?: ViewStyle;
  /** Reference to the MapView instance */
  mapRef?: RefObject<MapboxGL.MapView | null>;
  /** Reference to the Camera instance */
  cameraRef?: RefObject<MapboxGL.Camera | null>;
  /** Callback when map is ready */
  onMapReady?: () => void;
  /** Callback when map region changes */
  onRegionChange?: (region: CameraState) => void;
  /** Test ID for testing */
  testID?: string;
  /** Enable/disable map gestures */
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Attribution position */
  attributionPosition?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  /** Show compass */
  compassEnabled?: boolean;
  /** Show scale bar */
  scaleBarEnabled?: boolean;
  /**
   * Custom component to render user location instead of default LocationPuck
   * Receives location coordinates, heading, and zoom level
   * Useful for custom branded location markers
   */
  CustomUserLocationMarker?: ComponentType<CustomUserLocationMarkerProps>;
  /**
   * External heading value to use for the custom user location marker
   * If provided, overrides the heading from Mapbox's location tracking
   * Useful when you have your own heading source (e.g., compass sensor)
   */
  userHeading?: number;
  /**
   * External user location to use for the custom marker
   * If provided, the marker will render immediately using this location
   * without waiting for Mapbox.UserLocation to fire updates.
   * Useful when you have your own location source (e.g., expo-location)
   */
  externalUserLocation?: LocationUpdateEvent | null;
}

/**
 * Location permission status
 */
export type LocationPermissionStatus =
  | 'undetermined'
  | 'denied'
  | 'granted'
  | 'restricted';
