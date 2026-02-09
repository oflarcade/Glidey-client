/**
 * Location Types
 *
 * Type definitions for location services, permissions, and state management.
 */

/**
 * Location permission status from the OS
 */
export type LocationPermissionStatus =
  | 'undetermined' // Never asked
  | 'denied' // User denied permission
  | 'granted' // Permission granted
  | 'restricted'; // System-level restriction (parental controls, etc.)

/**
 * Device location services status
 */
export type LocationServiceStatus = 'enabled' | 'disabled' | 'unknown';

/**
 * Coordinates for a geographic point
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Full location with optional metadata
 */
export interface UserLocation extends Coordinates {
  /** Accuracy in meters */
  accuracy?: number;
  /** Heading in degrees (0-360) */
  heading?: number;
  /** Speed in meters per second */
  speed?: number;
  /** Timestamp of the location fix */
  timestamp?: number;
}

/**
 * Location error types
 */
export type LocationErrorType =
  | 'permission_denied'
  | 'service_disabled'
  | 'timeout'
  | 'position_unavailable'
  | 'unknown';

/**
 * Location error object
 */
export interface LocationError {
  type: LocationErrorType;
  message: string;
}

/**
 * Location store state
 */
export interface LocationState {
  /** Whether device location services are enabled (GPS) */
  isServiceEnabled: boolean | null;
  /** Current permission status from the OS */
  permissionStatus: LocationPermissionStatus;
  /** Current user location */
  currentLocation: UserLocation | null;
  /** Last known location (persisted for fast startup) */
  lastKnownLocation: UserLocation | null;
  /** Whether location system is ready (checked services + permission + got location) */
  isReady: boolean;
  /** Whether location is currently being fetched */
  isLoading: boolean;
  /** Current error, if any */
  error: LocationError | null;
}

/**
 * Location store actions
 */
export interface LocationActions {
  /** Set whether device location services are enabled */
  setServiceEnabled: (enabled: boolean) => void;
  /** Set the permission status */
  setPermissionStatus: (status: LocationPermissionStatus) => void;
  /** Set the current location */
  setLocation: (location: UserLocation | null) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set ready state */
  setReady: (ready: boolean) => void;
  /** Set error */
  setError: (error: LocationError | null) => void;
  /** Clear error */
  clearError: () => void;
  /** Reset store to initial state */
  reset: () => void;
}

/**
 * Combined location store type
 */
export type LocationStore = LocationState & LocationActions;

/**
 * Default location for the app (Dakar, Senegal)
 */
export const DAKAR_CENTER: Coordinates = {
  latitude: 14.6937,
  longitude: -17.4441,
};

/**
 * Location configuration
 */
export const LOCATION_CONFIG = {
  /** Default zoom level for map */
  DEFAULT_ZOOM: 14,
  /** Zoom level when centered on user */
  USER_ZOOM: 16,
  /** Timeout for getting location (ms) */
  TIMEOUT_MS: 15000,
  /** Accuracy level for location requests */
  ACCURACY: 'balanced' as const,
  /** Distance interval for location updates (meters) */
  DISTANCE_INTERVAL: 10,
  /** Time interval for location updates (ms) */
  TIME_INTERVAL: 5000,
} as const;
