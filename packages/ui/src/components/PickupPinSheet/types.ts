/**
 * PickupPinSheet Types
 * RentAScooter Design System
 *
 * Pure presentation component for the pickup pin draggable surface.
 * Consumers drive all state (pin position, label, loading) via props.
 * Pickup coordinates conform to the shared GeoPoint shape — no parallel lat/lng shape.
 *
 * Acceptance Criteria covered:
 * - AC-PPS-001 (R5.AC1): PickupPinSheet exported from shared UI layer
 * - AC-PPS-002 (R5.AC2): Component exposes pin position + drag-end event
 * - AC-PPS-003 (R1.AC3): Pin draggable anywhere on visible map surface
 * - AC-PPS-004 (R1.AC4): Pin visually follows gesture without lag
 * - AC-PPS-005 (R2.AC3): Loading state during in-flight geocode lookup
 * - AC-PPS-006 (R2.AC4): Fallback label on failed geocode
 */

import type { ViewStyle } from 'react-native';

/**
 * A geographic coordinate conforming to the shared GeoPoint shape.
 * Alias re-exported here so consumers do not need to import from @rentascooter/shared
 * directly — but the shape is identical (latitude / longitude, no lat/lng).
 */
export interface PickupGeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Props for the PickupPinSheet component.
 *
 * The component is pure-presentation: it renders the pin, optional address label,
 * and a Confirm button slot. All pickup logic (reverse geocoding, confirmation
 * dispatch, onboarding-tooltip persistence) belongs in the consuming hook / screen.
 *
 * @example
 * ```tsx
 * <PickupPinSheet
 *   position={{ latitude: 14.693, longitude: -17.447 }}
 *   onDragEnd={handleDragEnd}
 *   onConfirm={handleConfirm}
 *   addressLabel={geocodedAddress}
 *   isGeocoding={isLoading}
 *   showTooltip={showOnboardingTooltip}
 *   onTooltipDismiss={dismissTooltip}
 * />
 * ```
 */
export interface PickupPinSheetProps {
  /**
   * Current pin position. On initial render this should be the user's GPS location.
   * Updated externally as the user drags the pin (controlled pattern).
   */
  position: PickupGeoPoint;

  /**
   * Called when the user completes a drag gesture (finger up / pointer released).
   * Receives the new GeoPoint. Consumers should trigger reverse geocoding here.
   */
  onDragEnd: (point: PickupGeoPoint) => void;

  /**
   * Called when the user taps the Confirm button.
   * The parent is responsible for transmitting coordinates to the backend.
   */
  onConfirm: (point: PickupGeoPoint) => void;

  /**
   * Called on every intermediate position update during an active drag gesture.
   * Used to move the pin marker in real time without triggering geocoding.
   */
  onDrag?: (point: PickupGeoPoint) => void;

  /**
   * Human-readable street address resolved by reverse geocoding.
   * When undefined and not geocoding, no label is rendered.
   */
  addressLabel?: string;

  /**
   * When true, the address label area shows a loading indicator instead of
   * stale address text. Consumers set this while a geocoding request is in flight.
   * @default false
   */
  isGeocoding?: boolean;

  /**
   * When true, the onboarding tooltip "Drag the pin to your exact pickup spot"
   * is shown overlaid on the map. The first user interaction should dismiss it.
   * @default false
   */
  showTooltip?: boolean;

  /**
   * Called when the tooltip should be dismissed (first drag or tap on map/pin).
   */
  onTooltipDismiss?: () => void;

  /**
   * When true, the Confirm button is shown in a loading/disabled state.
   * Set during an in-flight confirmation request to prevent duplicate taps.
   * @default false
   */
  isConfirming?: boolean;

  /**
   * Optional error message to display beneath the Confirm button.
   * Used to surface ApiError failures so the user can retry.
   */
  confirmError?: string;

  /**
   * Additional styles applied to the outermost container.
   */
  style?: ViewStyle;

  /**
   * Test ID for testing.
   */
  testID?: string;
}
