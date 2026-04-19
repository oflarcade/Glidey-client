/**
 * Client App Hooks
 *
 * Re-export all custom hooks for clean imports.
 */

export { useNearbyDrivers, nearbyDriversKeys } from './useNearbyDrivers';
export type { default as UseNearbyDriversResult } from './useNearbyDrivers';

export { useRouteDirections } from './useRouteDirections';
export type {
  UseRouteDirectionsParams,
  UseRouteDirectionsResult,
} from './useRouteDirections';

export { useAddressSearch } from './useAddressSearch';
export type {
  UseAddressSearchParams,
  UseAddressSearchResult,
} from './useAddressSearch';

export { useAutocompleteLocation } from './useAutocompleteLocation';
export type {
  UseAutocompleteLocationParams,
  UseAutocompleteLocationResult,
} from './useAutocompleteLocation';

export { useLocationHistory } from './useLocationHistory';
export type {
  UseLocationHistoryParams,
  UseLocationHistoryResult,
} from './useLocationHistory';

export { useRideHistory, rideHistoryKeys } from './useRideHistory';
export type {
  UseRideHistoryParams,
  UseRideHistoryResult,
} from './useRideHistory';

export { useBooking } from './useBooking';
export type { UseBookingParams, UseBookingResult } from './useBooking';
