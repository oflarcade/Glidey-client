/**
 * Client App Services
 *
 * Re-export all service functions for clean imports.
 */

export {
  getAvailableDrivers,
  calculateDistance,
  type GetAvailableDriversRequest,
  type NearbyDriver,
} from './driversService';

export {
  getRouteDirections,
  type GetRouteDirectionsRequest,
  type RouteDirectionsResponse,
  type RouteGeometry,
} from './routeDirectionsService';

export {
  searchLocations,
  suggestLocation,
  retrieveLocation,
  getLocationHistory,
  saveLocationToHistory,
  isValidLocationForHistory,
} from './addressSearchService';

export {
  getRideHistory,
  type GetRideHistoryRequest,
  type GetRideHistoryResponse,
} from './ridesService';
