// User Types
export type UserRole = 'client' | 'driver';

export interface BaseUser {
  id: string;
  email: string;
  phone?: string;
  phoneVerified: boolean;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client extends BaseUser {
  role: 'client';
  // Client rating (from drivers)
  rating?: {
    average: number;
    count: number;
  };
}

export interface Driver extends BaseUser {
  role: 'driver';
  isOnline: boolean;
  isAvailable: boolean;
  currentLocation?: GeoPoint;
  vehicleInfo: VehicleInfo;
  rating: DriverRating;
  documentsVerified: boolean;
}

export interface VehicleInfo {
  type: 'scooter';
  licensePlate: string;
  model?: string;
  color?: string;
}

export interface DriverRating {
  average: number;
  count: number;
}

// Location Types
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Location extends GeoPoint {
  address: string;
  name?: string;
}

// Ride Types
export type RideStatus =
  | 'pending'      // Client requested, waiting for driver
  | 'accepted'     // Driver accepted
  | 'arriving'     // Driver on way to pickup
  | 'arrived'      // Driver at pickup location
  | 'in_progress'  // Ride started
  | 'completed'    // Ride finished
  | 'cancelled';   // Cancelled by client or driver

// Denormalized client info embedded on ride for driver display
export interface RideClientInfo {
  firstName: string;
  lastName: string;
  profilePicture: string | null;
  rating: number | null;
}

// Denormalized driver info embedded on ride for client display
export interface RideDriverInfo {
  firstName: string;
  lastName: string;
  profilePicture: string | null;
  rating: number;
  vehicleInfo: {
    licensePlate: string;
    model?: string | null;
    color?: string | null;
  };
}

export interface Ride {
  id: string;
  clientId: string;
  driverId?: string;
  // Denormalized user info for display (avoids extra fetches)
  clientInfo?: RideClientInfo;
  driverInfo?: RideDriverInfo;
  pickup: Location;
  destination: Location;
  status: RideStatus;
  fare: RideFare;
  route?: RouteInfo;
  timestamps: RideTimestamps;
  rating?: RideRating;
  ignoredBy?: string[]; // Array of driver IDs who ignored this ride
  createdAt: Date;
  updatedAt: Date;
}

export interface RideFare {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  total: number;
  currency: 'XOF'; // West African CFA franc
}

export interface RouteDirectionsResponse {
  distanceM: number;
  durationS: number;
  polyline: string;
}

// Backwards-compat alias — T-061 migrates all consumers to RouteDirectionsResponse
export type RouteInfo = RouteDirectionsResponse;

export interface RideTimestamps {
  requestedAt: Date;
  acceptedAt?: Date;
  arrivedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

export interface RideRating {
  clientToDriver: number; // 1-5
  driverToClient?: number; // 1-5
  comment?: string;
}

// Location Search Types
export interface LocationHistory {
  id: string;
  location: Location;
  timestamp: Date;
  frequency: number;
}

export interface SearchLocationsRequest {
  query: string;
  proximity?: GeoPoint;
  limit?: number;
}

export interface SearchLocationsResponse {
  results: Location[];
}

// Google Places autocomplete types (replaces Mapbox Search Box)
export interface Suggestion {
  placeId: string;
  name: string;
  formattedAddress: string;
}

export interface SuggestLocationRequest {
  query: string;
  proximity?: GeoPoint;
  limit?: number;
}

export interface SuggestLocationResponse {
  suggestions: Suggestion[];
}

export interface RetrieveLocationRequest {
  placeId: string;
}

export interface RetrieveLocationResponse {
  location: Location;
}

// Request/Response Types
export interface CreateRideRequest {
  pickup: Location;
  destination: Location;
}

export interface AcceptRideRequest {
  rideId: string;
}

export interface UpdateRideStatusRequest {
  rideId: string;
  status: RideStatus;
}

export interface UpdateDriverLocationRequest {
  location: GeoPoint;
}

export interface RateRideRequest {
  rideId: string;
  rating: number;
  comment?: string;
}

// Nearby Drivers Types (optimized for map display)
export interface NearbyDriver {
  id: string;
  name: string;
  vehicleType: 'scooter';
  vehiclePlate: string;
  rating: number;
  distanceM: number;
  latitude: number;
  longitude: number;
}

export interface GetNearbyDriversRequest {
  latitude: number;
  longitude: number;
  radiusM?: number;
}

export interface NearbyDriversResponse {
  drivers: NearbyDriver[];
  searchRadiusKm: number;
  searchCenter: GeoPoint;
  timestamp: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
}

// Phone/Country Types
export interface CountryCode {
  /** ISO 3166-1 alpha-2 code (e.g., 'SN', 'VN', 'US') */
  code: string;
  /** Dial code with + prefix (e.g., '+221', '+84') */
  dialCode: string;
  /** Country name for display */
  name: string;
  /** Flag emoji */
  flag: string;
}

/** Senegal country code - the only supported country */
export const SENEGAL_COUNTRY: CountryCode = {
  code: 'SN',
  dialCode: '+221',
  name: 'Senegal',
  flag: '🇸🇳',
};

/** Supported country codes for the app (Senegal only) */
export const SUPPORTED_COUNTRY_CODES: CountryCode[] = [SENEGAL_COUNTRY];

/** Default country (Senegal) */
export const DEFAULT_COUNTRY: CountryCode = SENEGAL_COUNTRY;

// Notification Types
export type NotificationType =
  | 'ride_request'
  | 'ride_accepted'
  | 'driver_arriving'
  | 'driver_arrived'
  | 'ride_started'
  | 'ride_completed'
  | 'ride_cancelled'
  | 'verify_phone';

export interface PushNotification {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Location Types (re-export from location.ts)
export type {
  LocationPermissionStatus,
  LocationServiceStatus,
  Coordinates,
  UserLocation,
  LocationErrorType,
  LocationError,
  LocationState,
  LocationActions,
  LocationStore,
} from './location';

export { DAKAR_CENTER, LOCATION_CONFIG } from './location';

// ─── Phase 2: Ride FSM ────────────────────────────────────────────────────────

export type RideState =
  | 'idle'
  | 'searching'
  | 'matched'
  | 'pickup_en_route'
  | 'completed'
  | 'cancelled'
  | 'failed';

// ─── Phase 2: Fare estimation ─────────────────────────────────────────────────

export interface FareEstimateRequest {
  distanceM: number;
  durationS: number;
}

export interface FareEstimateResponse {
  fareEstimate: number; // XOF whole number
}

// ─── Phase 2: Ride creation ───────────────────────────────────────────────────

export interface CreateRideV2Request {
  pickup: GeoPoint;
  destination: Location;
  distanceM: number;
  durationS: number;
}

export interface CreateRideV2Response {
  id: string;
  state: RideState;
}

// ─── Phase 2: Matched driver ──────────────────────────────────────────────────

export interface MatchedDriver {
  id: string;
  name: string;
  vehiclePlate: string;
  vehicleType: string; // free-text e.g. "scooter"
  rating: number;
  completedRides: number;
  profilePhoto?: string; // URL; undefined → deterministic fallback avatar
  location: GeoPoint;
}

// ─── Phase 2: Cancel ride ─────────────────────────────────────────────────────

export interface CancelRideRequest {
  rideId: string;
}

export interface CancelRideResponse {
  success: boolean;
}

// ─── Phase 2: Confirm pickup (data protection — only after explicit user action)

export interface ConfirmPickupRequest {
  rideId: string;
  pickup: GeoPoint;
}

export interface ConfirmPickupResponse {
  state: RideState; // expected: 'pickup_en_route'
}
