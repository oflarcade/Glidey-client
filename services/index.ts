/**
 * Client App Services
 *
 * Re-export all service functions for clean imports.
 */

export {
  getNearby,
  applyCoordFallback,
  calculateDistance,
  type NearbyDriver,
} from './driversService';

export {
  getRoute,
  type RouteDirectionsResponse,
  type RouteOriginDestination,
} from './routeDirectionsService';

export {
  autocomplete,
  placeDetail,
  getHistory,
  saveHistory,
  isDemoModeError,
  type ResolvedLocation,
  type LocationHistoryEntry,
} from './addressSearchService';

export {
  getRideHistory,
  type GetRideHistoryRequest,
  type GetRideHistoryResponse,
} from './ridesService';

export {
  estimateFare,
  createRide,
  cancelRide,
} from './bookingService';
