# PRD — Driver En Route: Live Route Map + Mini Sheet
**Feature ID:** driver-en-route-ui
**State:** `pickup_en_route`
**Date:** 2026-04-22
**Status:** Draft

---

## 1. Summary

When a matched driver starts driving toward the user's pickup point, the app transitions into `pickup_en_route` state and must visually confirm that the ride is in motion. This feature draws the live route polyline on the Mapbox map from the driver's current position to the user's pickup/destination, and surfaces a persistent mini bottom sheet containing a driver info card, a map-pin–anchored progress bar, and a live ETA countdown to the destination. It closes the gap between "driver accepted" (`matched`) and "ride complete" (`completed`) — a window where the user currently sees nothing change on screen.

---

## 2. Problem

**Current experience:** Once the driver accepts (state: `matched`), the BookingSheet shows driver info and an ETA countdown to pickup. When the driver starts driving and the state transitions to `pickup_en_route`, nothing new happens visually — no route is drawn, the map stays static, and the sheet content does not reflect that the trip has begun. Users have no spatial or temporal feedback that their ride is actively in progress.

**Workaround today:** Users rely on memory of the matched screen or check externally (calling the driver, checking the time). There is no in-app signal that the trip leg has started.

**Risk:** Perceived app failure. Users in Dakar often have unreliable network; without visual confirmation of ride progress, they may cancel prematurely or lose trust in the app.

---

## 3. Objective

Deliver unambiguous, real-time feedback that the driver is en route — via a map route line and a live ETA strip — so that users feel informed and confident from the moment the driver starts driving until arrival.

**Desired outcome:** Users do not cancel rides during the `pickup_en_route` leg due to confusion or perceived inactivity.

**Measurement:** Cancellation rate during `pickup_en_route` state drops compared to baseline. Target: less than 8% cancellations initiated after `pickup_en_route` begins (versus measuring current baseline first).

---

## 4. Target Users

**Primary:** Riders in Dakar, Senegal, who have completed the booking flow and are waiting for their scooter/moto/jakarta. They are typically on a city street, phone in hand, watching the screen to know when to walk to the pickup spot. They may have intermittent data connectivity (3G/edge) and low patience for ambiguity.

**Secondary:** Riders who minimized the app and return to it mid-trip — they need to instantly re-orient on where the driver is and how long until arrival.

---

## 5. User Stories

1. **As a rider who just saw the driver accept,** I want to see the driver's route drawn on the map when they start driving, so that I know the trip has begun and can visually track progress.

2. **As a rider waiting at my pickup point,** I want a live ETA countdown in the bottom sheet that ticks down toward arrival at my destination, so that I can plan whether to wait where I am or start walking.

3. **As a rider who glanced away,** I want the mini bottom sheet to persist at the mini snap level with the driver's name and remaining time visible, so that I can see ride status at a glance without expanding the sheet.

4. **As a rider,** I want a map-pin icon anchoring the far end of a progress bar in the mini modal, so that I can intuitively understand how far along the route the driver is without reading text.

5. **As a rider who wants to cancel mid-route,** I want a clearly reachable cancel button in the peek/full snap of the en-route sheet (with fee warning), so that I can cancel if needed without confusion about whether cancellation is still possible.

6. **As a rider on a slow connection,** I want the polyline to render from locally decoded coordinates (already fetched via `routeDirectionsService` at booking time) rather than a new network call, so that the map route appears immediately when the state changes even offline.

---

## 6. Scope

### In Scope

- **Route polyline:** Draw `MapboxGL.ShapeLayer` from driver's last-known location to user's pickup/destination using the `RouteDirectionsResponse.polyline` already fetched during booking. Camera pans to fit both endpoints via `cameraRef`.
- **State branch in `BookingSheet`:** Add `isEnRoute` branch (alongside existing `isSearching` / `isMatched`) rendering new en-route content at mini and peek snap levels. Sheet locked to mini/peek (no dismiss) — same gesture behavior as `matched`.
- **Mini snap content:** Driver avatar (initials), name, live ETA countdown (seconds), map-pin icon as visual end-anchor of a horizontal progress bar. Progress bar value derived from elapsed time vs. initial `durationS`.
- **Peek snap content:** Full driver info card (name, vehicle type, plate, rating) + ETA block (large countdown) + cancel button with fee warning dialog (reuse existing `cancelFeeWarningOpen` / `confirmCancelOpen` dialogs).
- **ETA countdown:** Seeded from `matchedDriver.etaSeconds` at state-entry. Ticks down via 1 s interval. Same pattern as existing `matched` ETA countdown in `BookingSheet`.
- **State transition:** `rideStore` already defines `matched → pickup_en_route` as a valid transition. No store changes required.
- **i18n:** All new strings added to `fr` and `en` translation files under `@rentascooter/i18n`.

### Explicitly Out of Scope

- **Real-time driver location streaming:** No WebSocket or polling for live driver GPS updates. Driver position on map is static (position at time of state transition). Live tracking is a separate feature.
- **Arrival detection:** The `hasArrived` latch (ETA reaches 0) is inherited from matched state behavior. No new geofence or backend event is introduced.
- **Trip-in-progress view (post-pickup):** Once the user is picked up, the UI for the ride itself (e.g., turn-by-turn, speedometer) is out of scope.
- **Backend changes:** No new API endpoints, Cloud Function calls, or Firebase schema changes.
- **Push notifications:** Disabled in the current build (`withoutPushEntitlement` plugin). No notification on state change.
- **Android-specific tuning:** Primary target is iOS simulator/device. Android parity is a follow-up.

---

## 7. Success Metrics

1. **En-route cancellation rate:** Percentage of rides cancelled after entering `pickup_en_route` state. Baseline to be measured over 2 weeks pre-launch; target post-launch is under 8%.

2. **Polyline render latency:** Time from `pickup_en_route` state entry to `ShapeLayer` visible on screen, measured via Expo performance mark. Target: under 300 ms on a cold polyline decode (no network call, local data).

3. **ETA accuracy perception (qualitative):** In next user test session (n ≥ 5 Dakar riders), at least 4 of 5 can correctly answer "how long until your driver arrives?" by reading the mini sheet alone, without expanding it.

---

## 8. Open Questions

1. **Driver position at state entry:** `matchedDriver` in `rideStore` does not currently carry a `currentLat`/`currentLng` field. Should the polyline origin be the driver's matched position (if stored), the user's current location, or a hardcoded approximation? This determines whether the route drawn is realistic or decorative. Decision needed before implementation scoping.

2. **Progress bar logic:** The progress bar is seeded by elapsed time vs. initial `durationS`. If the driver is delayed (traffic), the bar will over-count. Should progress bar be capped at 95% until an explicit arrival event, or is a simple linear decay acceptable for v1?

3. **Sheet mode value for `pickup_en_route`:** The existing `sheetMode` in `useUIStore` accepts `'idle' | 'search' | 'booking' | 'matching'`. Does `pickup_en_route` reuse `'matching'` (which locks the gesture to mini/peek correctly) or does it need a new `'en_route'` mode value? Reusing `'matching'` avoids a store change but conflates two distinct UX states.
