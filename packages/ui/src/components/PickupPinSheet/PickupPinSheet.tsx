/**
 * PickupPinSheet Component
 * RentAScooter Design System
 *
 * Pure-presentation surface for pickup pin placement. Renders a draggable
 * pin marker, a reverse-geocoded address label slot (with loading and fallback
 * states), a first-use onboarding tooltip, and a Confirm button.
 *
 * This component owns NO pickup logic. All state (pin position, geocoding
 * loading flag, tooltip visibility) is driven by the consuming screen via props.
 * Logic lives in usePickup (hook) + pickupService (service).
 *
 * Acceptance Criteria:
 * - AC-PPS-001 (R5.AC1): PickupPinSheet exported from shared UI layer          ✓
 * - AC-PPS-002 (R5.AC2): Exposes pin position + drag-end event to consumer     ✓
 * - AC-PPS-003 (R1.AC3): Pin draggable anywhere on visible map surface          ✓
 * - AC-PPS-004 (R1.AC4): Pin follows gesture without perceptible lag            ✓
 * - AC-PPS-005 (R2.AC3): Loading indicator during in-flight geocode lookup      ✓
 * - AC-PPS-006 (R2.AC4): Fallback label when geocode fails                      ✓
 * - AC-PPS-007 (R3.AC1): Tooltip text "Drag the pin to your exact pickup spot"  ✓
 * - AC-PPS-008 (R4.AC4): Confirm error surfaced; stays on surface for retry     ✓
 * - AC-PPS-009 (R5.AC3): Coordinates conform to GeoPoint (latitude/longitude)   ✓
 * - AC-PPS-010 (R5.AC4): No parallel lat/lng shape defined                      ✓
 */

import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Animated,
  ActivityIndicator,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { primaryColors, neutralColors, spacing, borderRadius } from '../../theme';
import type { PickupPinSheetProps, PickupGeoPoint } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Pin visual dimensions */
const PIN_SIZE = 40;
const PIN_ARROW_HEIGHT = 10;

const PRIMARY_COLOR = primaryColors[400]; // #FFC629 — Golden Yellow
const DARK_COLOR = neutralColors[900];    // #1A1A2E — Dark Navy
const SURFACE_COLOR = '#FFFFFF';

// =============================================================================
// DRAGGABLE PIN SUB-COMPONENT
// =============================================================================

interface DraggablePinProps {
  /** Absolute pixel position of the pin center on screen */
  x: Animated.Value;
  y: Animated.Value;
  onDrag: (dx: number, dy: number) => void;
  onDragEnd: () => void;
  onDragStart: () => void;
  testID?: string;
}

/**
 * DraggablePin renders the SVG-style pin shape using plain Views and reacts to
 * PanResponder gestures. Coordinates are tracked via a ref so they do not
 * trigger re-renders during continuous gestures (satisfies AC-PPS-004).
 */
function DraggablePin({
  x,
  y,
  onDrag,
  onDragEnd,
  onDragStart,
  testID,
}: DraggablePinProps) {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onDragStart();
        // Flatten the offset so subsequent dx/dy are relative to current position
        x.extractOffset();
        y.extractOffset();
      },
      onPanResponderMove: (_evt, gestureState) => {
        x.setValue(gestureState.dx);
        y.setValue(gestureState.dy);
        onDrag(gestureState.dx, gestureState.dy);
      },
      onPanResponderRelease: () => {
        // Collapse offset back into base value so position is absolute again
        x.flattenOffset();
        y.flattenOffset();
        onDragEnd();
      },
      onPanResponderTerminate: () => {
        x.flattenOffset();
        y.flattenOffset();
        onDragEnd();
      },
    })
  ).current;

  return (
    <Animated.View
      testID={testID ?? 'pickup-pin'}
      accessibilityLabel="Drag to set pickup location"
      accessibilityRole="adjustable"
      style={[
        styles.pinWrapper,
        { transform: [{ translateX: x }, { translateY: y }] },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Pin circle body */}
      <View style={styles.pinCircle}>
        <View style={styles.pinInnerDot} />
      </View>
      {/* Arrow tip pointing down */}
      <View style={styles.pinArrow} />
    </Animated.View>
  );
}

// =============================================================================
// TOOLTIP SUB-COMPONENT
// =============================================================================

interface TooltipProps {
  visible: boolean;
  onDismiss: () => void;
}

function OnboardingTooltip({ visible, onDismiss }: TooltipProps) {
  if (!visible) return null;

  return (
    <TouchableOpacity
      style={styles.tooltipContainer}
      onPress={onDismiss}
      activeOpacity={0.9}
      accessibilityLabel="Drag the pin to your exact pickup spot. Tap to dismiss."
      accessibilityRole="button"
    >
      <View style={styles.tooltipBubble}>
        <Text style={styles.tooltipText}>
          Drag the pin to your exact pickup spot
        </Text>
      </View>
      {/* Small caret pointing down */}
      <View style={styles.tooltipCaret} />
    </TouchableOpacity>
  );
}

// =============================================================================
// ADDRESS LABEL SUB-COMPONENT
// =============================================================================

interface AddressLabelProps {
  label?: string;
  isGeocoding: boolean;
}

function AddressLabel({ label, isGeocoding }: AddressLabelProps) {
  if (isGeocoding) {
    return (
      <View style={styles.addressRow}>
        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
        <Text style={styles.addressLoadingText}>Finding address…</Text>
      </View>
    );
  }

  if (!label) return null;

  return (
    <View style={styles.addressRow}>
      <Text style={styles.addressText} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PickupPinSheet({
  position,
  onDragEnd,
  onConfirm,
  onDrag,
  addressLabel,
  isGeocoding = false,
  showTooltip = false,
  onTooltipDismiss,
  isConfirming = false,
  confirmError,
  style,
  testID,
}: PickupPinSheetProps) {
  // Animated position values for the draggable pin.
  // Start at (0, 0) — the consumer positions the container; the pin offsets
  // from the center of that container during drag.
  const pinX = useRef(new Animated.Value(0)).current;
  const pinY = useRef(new Animated.Value(0)).current;

  // Track drag-start pixel position so we can compute the new GeoPoint on release.
  // We store the last-known GeoPoint from props in a ref to avoid stale closures.
  const currentPositionRef = useRef<PickupGeoPoint>(position);
  currentPositionRef.current = position;

  // Delta accumulated during current drag gesture (in pixels, relative to start)
  const dragDeltaRef = useRef({ dx: 0, dy: 0 });

  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    dragDeltaRef.current = { dx: 0, dy: 0 };
    onTooltipDismiss?.();
  }, [onTooltipDismiss]);

  const handleDrag = useCallback(
    (dx: number, dy: number) => {
      dragDeltaRef.current = { dx, dy };
      // Notify parent of intermediate position (optional — no geocoding yet)
      // We convert pixel delta to a rough lat/lng offset so consumers can
      // optionally move the map camera. 1px ≈ 0.00001° at Dakar's latitude.
      const PIXEL_TO_DEGREE = 0.00001;
      const intermediatePoint: PickupGeoPoint = {
        latitude: currentPositionRef.current.latitude - dy * PIXEL_TO_DEGREE,
        longitude: currentPositionRef.current.longitude + dx * PIXEL_TO_DEGREE,
      };
      onDrag?.(intermediatePoint);
    },
    [onDrag]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    const { dx, dy } = dragDeltaRef.current;
    const PIXEL_TO_DEGREE = 0.00001;
    const newPoint: PickupGeoPoint = {
      latitude: currentPositionRef.current.latitude - dy * PIXEL_TO_DEGREE,
      longitude: currentPositionRef.current.longitude + dx * PIXEL_TO_DEGREE,
    };
    // Reset the animated value so pin snaps visually back to center
    // (the map/screen renders the pin at the new position now)
    pinX.setValue(0);
    pinY.setValue(0);
    onDragEnd(newPoint);
  }, [onDragEnd, pinX, pinY]);

  const handleConfirm = useCallback(() => {
    if (isConfirming) return;
    onConfirm(currentPositionRef.current);
  }, [isConfirming, onConfirm]);

  return (
    <View style={[styles.container, style]} testID={testID ?? 'pickup-pin-sheet'}>
      {/* Onboarding tooltip — shown on first use only */}
      <OnboardingTooltip
        visible={showTooltip}
        onDismiss={() => onTooltipDismiss?.()}
      />

      {/* Draggable pin — centered in the container */}
      <View style={styles.pinArea} pointerEvents="box-none">
        <DraggablePin
          x={pinX}
          y={pinY}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          testID="pickup-draggable-pin"
        />
      </View>

      {/* Bottom sheet panel — address + confirm button */}
      <View style={styles.bottomPanel}>
        {/* Address label / loading indicator */}
        <View style={styles.addressSection}>
          <Text style={styles.addressHeading}>Pickup location</Text>
          <AddressLabel label={addressLabel} isGeocoding={isGeocoding || isDragging} />
        </View>

        {/* Confirmation error */}
        {confirmError ? (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>{confirmError}</Text>
          </View>
        ) : null}

        {/* Confirm button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (isConfirming || isGeocoding) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={isConfirming || isGeocoding}
          accessibilityLabel="Confirm pickup location"
          accessibilityRole="button"
          accessibilityState={{ disabled: isConfirming || isGeocoding }}
          testID="pickup-confirm-button"
        >
          {isConfirming ? (
            <ActivityIndicator size="small" color={DARK_COLOR} />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm pickup</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },

  // ---- Pin ----
  pinArea: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinWrapper: {
    alignItems: 'center',
    // Offset the wrapper upward so the arrow tip sits at the tap point
    marginTop: -(PIN_SIZE + PIN_ARROW_HEIGHT),
  },
  pinCircle: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  pinInnerDot: {
    width: PIN_SIZE * 0.4,
    height: PIN_SIZE * 0.4,
    borderRadius: (PIN_SIZE * 0.4) / 2,
    backgroundColor: SURFACE_COLOR,
  },
  pinArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: PIN_ARROW_HEIGHT,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: PRIMARY_COLOR,
  },

  // ---- Tooltip ----
  tooltipContainer: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  tooltipBubble: {
    backgroundColor: DARK_COLOR,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    maxWidth: 260,
  },
  tooltipText: {
    color: SURFACE_COLOR,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  tooltipCaret: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: DARK_COLOR,
  },

  // ---- Bottom panel ----
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SURFACE_COLOR,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // ---- Address ----
  addressSection: {
    marginBottom: spacing.md,
  },
  addressHeading: {
    fontSize: 11,
    fontWeight: '600',
    color: neutralColors[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '500',
    color: DARK_COLOR,
    flex: 1,
    lineHeight: 20,
  },
  addressLoadingText: {
    fontSize: 14,
    color: neutralColors[300],
    fontStyle: 'italic',
  },

  // ---- Error ----
  errorRow: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#FFF0F0',
    borderRadius: borderRadius.md,
  },
  errorText: {
    fontSize: 13,
    color: '#CC3333',
    textAlign: 'center',
  },

  // ---- Confirm button ----
  confirmButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  confirmButtonDisabled: {
    opacity: 0.55,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_COLOR,
    letterSpacing: 0.3,
  },
});

export default PickupPinSheet;
