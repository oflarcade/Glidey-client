# PRD — Booking Bottom Sheet

**Feature:** Reanimated-powered booking bottom sheet on the main map screen  
**Status:** Draft  
**Date:** 2026-04-20  
**Stack:** Expo 54 · React Native 0.81 · Reanimated 4.x · TypeScript strict

---

## 1. Summary

Replace the separate `/(main)/booking.tsx` modal route with an inline Reanimated bottom sheet that appears directly on the main map screen when the rider selects a destination. The sheet exposes vehicle-type selection, fare context, a payment row placeholder, and the BOOK NOW action — keeping the map visible throughout the pre-booking experience. On booking confirmation the sheet content transitions in-place to the existing driver-search (RetryTimeline) state without any route navigation.

---

## 2. Problem: What Pain Are We Solving?

The current booking flow pushes the rider to a full-screen modal (`booking.tsx`), completely hiding the map. This breaks spatial context: the rider cannot verify the route, see nearby drivers, or visually confirm their pickup and destination pins while deciding whether to book. The modal also passes all booking parameters as serialised URL search params, creating a brittle, URL-length-limited coupling between the map screen and the booking UI. Additionally, the current screen offers no vehicle-type selection, meaning `CreateRideV2Request.vehicleType` is never populated and the backend receives under-specified ride requests.

---

## 3. Objective

Deliver a contextual, map-visible booking experience where the rider can see their route on the map, select a vehicle type, and confirm a ride — all without leaving the map screen. The booking sheet must also eliminate the serial navigation dependency (route push → params decode → back navigation) and introduce vehicle-type selection that feeds a correctly-typed `CreateRideV2Request`.

**How we measure success:**

- Booking conversion rate (BOOK NOW taps that reach `rideState === 'searching'`) improves vs. the modal baseline.
- Navigation-related booking abandonment (back-button presses on `booking.tsx` before tapping BOOK NOW) drops to zero — the modal route is retired.
- Zero new TypeScript strict-mode errors introduced; `vehicleType` is present and typed on `CreateRideV2Request`.

---

## 4. Target Users

**Primary:** Glidey riders in Dakar, Senegal — smartphone users booking short urban scooter trips, often in noisy street environments where fast, thumb-friendly interactions matter. They need to see the map to feel confident about pickup/destination before committing.

**Secondary:** The engineering team maintaining the booking and matching pipeline — they need the sheet to compose cleanly with the existing `useBooking`, `useMatching`, `useRideStore` FSM, and `RetryTimeline` without duplicating logic.

---

## 5. User Stories

1. **Destination selected — sheet opens automatically.**  
   As a rider, when I confirm a destination in the LocationModal, I want the booking sheet to slide up automatically so I can review my trip details without being taken away from the map.

2. **Vehicle type selection.**  
   As a rider, I want to tap a vehicle-type card in the horizontal carousel and see it highlighted in gold so I know which ride option I am about to book and what it will cost in XOF.

3. **Sheet drag without accidental dismiss.**  
   As a rider, I want to drag the sheet handle to expand or minimize the sheet without the internal carousel scroll triggering a dismiss, so I can comfortably browse vehicle types on a moving screen.

4. **Booking confirmation and searching state.**  
   As a rider, when I tap BOOK NOW, I want the sheet content to transition to a searching state (showing the RetryTimeline with up to 3 attempts and a cancel affordance) without navigating away, so the map remains visible while a driver is found.

5. **Cancel during search.**  
   As a rider, if no driver is found or I change my mind, I want to tap Cancel in the searching state and have the sheet dismiss cleanly, returning the map to its idle state with no orphaned ride on the backend.

6. **Destination tip overlay.**  
   As a rider, I want to see the destination name and an X button pinned on the map behind the sheet so I can quickly clear my destination if I selected the wrong place before tapping BOOK NOW.

---

## 6. Scope

### In Scope

- **BookingBottomSheet component** — Reanimated 4.x bottom sheet rendered inside `(main)/index.tsx`, replacing the `/(main)/booking.tsx` modal route entirely. The modal route file is deleted.
- **Drag handle** — standard pill handle at the top of the sheet; sheet can be expanded or snapped to a collapsed snap point.
- **Scroll isolation** — horizontal FlatList inside the sheet must not propagate vertical scroll events to the sheet's pan responder (use `simultaneousHandlers` / `NativeViewGestureHandler` pattern).
- **DestinationPinTip overlay** — map-layer overlay showing destination name + X dismiss button, already exists as `components/DestinationPinTip`; wire it to sheet open state.
- **Destination row** — black dot icon, destination `name` (bold), destination `address` (subtitle), sourced from the `Location` object already held in local state on the map screen.
- **Recommended Rides carousel** — horizontal FlatList of `ScooterTypeCard` instances (icon, type name, XOF price). Selected card renders with `#FFC629` background and border. Partial card bleed on right edge to signal scrollability. Cards sourced from a static vehicle-type config (at least two types for launch: Standard, Premium).
- **`vehicleType` field on `CreateRideV2Request`** — add `vehicleType: string` to the type in `packages/shared/src/types/index.ts` and thread the selected value through `useBooking.bookRide()` → `bookingService.createRide()`.
- **Payment row** — tappable row with label "Payment" and a right-pointing chevron. Tapping shows a "Coming soon" toast or no-op. No payment logic implemented.
- **BOOK NOW button** — gold (`#FFC629`) pill button, disabled while fare is loading or `isBusy`. On tap calls `bookRide(vehicleType, pickup, destination, distanceM, durationS)` via `useBooking`.
- **Searching state inside the sheet** — when `rideState === 'searching'`, sheet content swaps to `RetryTimeline` + cancel button, reusing `useMatching` and existing `MatchingModal` internals (extracted or composed as needed). No separate modal.
- **Sheet dismiss on cancel / match** — sheet closes when ride is cancelled (`rideState === 'cancelled'`) or a driver is matched (`rideState === 'matched'`); the existing `DriverReveal` component takes over on match.
- **Route retirement** — `app/(main)/booking.tsx` is deleted; all navigation calls to it are removed from the map screen.

### Explicitly Out of Scope

- **Payment integration** — payment method selection, wallet, mobile money. The Payment row is a placeholder only.
- **Fare breakdown per vehicle type** — a single fare estimate is shown; per-type pricing differentiation is a future feature.
- **Dark mode** — not in scope for this sheet; existing theme tokens are used as-is.
- **Accessibility / a11y audit** — basic labels will be added but a full accessibility pass is deferred.
- **Driver-side changes** — no backend or driver-app changes are part of this feature.
- **Pickup confirmation flow** — the existing `PickupPinSheet` / `usePickup` flow is untouched.
- **Ride rating or post-ride UI** — out of scope.

---

## 7. Success Metrics

1. **Booking conversion rate** — percentage of "destination selected" events that result in a successful `rideState === 'searching'` transition. Target: equal to or above the current modal baseline within two weeks of launch (establish baseline before shipping).

2. **Booking abandonment at sheet stage** — percentage of sheet-open events where the user dismisses without tapping BOOK NOW. Target: measurably lower than current modal abandonment (baseline TBD from analytics). Primary signal that spatial context improves decision confidence.

3. **TypeScript build health** — `yarn lint` and the strict TS compiler report zero errors related to `CreateRideV2Request` or the new sheet component after the change. Tracked as a binary pass/fail gate in the EAS build pipeline.

---

## 8. Open Questions

1. **Vehicle type catalogue source** — should the list of bookable vehicle types (name, icon, price) be fetched from the backend at sheet-open time (allowing dynamic pricing / availability), or hardcoded as a static client-side config for launch? A dynamic approach requires a new API endpoint and changes the loading UX; a static config ships faster but may diverge from backend availability.

2. **Snap-point behaviour on small screens** — the design shows a partially collapsed sheet with the map visible. How many snap points should the sheet support (e.g., collapsed ~40% / expanded ~85%), and what is the correct collapsed height to ensure both the full carousel and the BOOK NOW button are reachable without expanding? Needs validation on the smallest supported device (320pt width / ~667pt height).

3. **Transition to MatchingModal internals** — `MatchingModal` currently wraps `RetryTimeline` inside its own modal overlay. To display the searching state inside the bottom sheet without a second modal layer, should `RetryTimeline` and the cancel affordance be extracted into a shared `SearchingView` component, or should `MatchingModal` gain a prop that suppresses its modal wrapper and renders inline? The chosen approach has implications for component ownership in `packages/ui` vs. the app layer.
