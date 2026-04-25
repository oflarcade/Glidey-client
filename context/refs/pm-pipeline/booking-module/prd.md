# PRD — Booking Module: Backend Integration
**Product**: Glidey Client App (Rider)
**Date**: 2026-04-21
**Status**: Draft

---

## 1. Summary

The BookingSheet UI already exists and covers the full ride-request lifecycle (idle → search → booking → matching → matched), but it is wired to a phantom backend: it calls a `/fare/estimate` and `/vehicle-types` endpoint that do not exist on the real API, and it drives `createRide` through a legacy Firebase callable rather than the live REST backend. This PRD defines the work to replace those stubs with real API calls, adapt the UX to match the actual data model, and give riders a fully functional end-to-end booking flow.

---

## 2. Problem

### Current State
- `bookingService.ts` calls `apiFetch('GET', '/fare/estimate?...')` and `apiFetch('GET', '/vehicle-types')` — neither endpoint exists on the live backend (`http://34.140.138.4`).
- When demo mode is off, both calls fail silently or surface generic errors; the booking button never becomes active for real users.
- The BookingSheet's vehicle-type carousel (`ScooterCarousel`) and per-type fare display depend entirely on that pre-booking estimate payload.
- `createRide` posts to `/rides/create` rather than `POST /rides`; the request shape and response shape differ from the real contract.
- `matchingService` polls `/rides/{id}/status` which does not exist; the real status check path is `GET /rides/history`.
- The cancel flow posts to `/rides/{id}/cancel` instead of `PATCH /rides/{id}/status` with `{ status: "cancelled" }`.

### Desired State
- Tapping "Reserve" calls `POST /rides` with the correct body derived from already-resolved route data (pickup/dest coords, `distanceM`, `durationS` from the existing directions hook).
- Fare is shown **after** booking confirmation, sourced from the `fareBase`, `farePerKm`, `farePerMin` fields in the `POST /rides` response.
- Vehicle-type selection is removed from the pre-booking flow; the backend assigns vehicle type at matching time.
- Driver matching status is polled via `GET /rides/history` (the only available mechanism) until status transitions from `pending` to `accepted`, or until a WebSocket/SSE push is received.
- Cancellation calls `PATCH /rides/{id}/status` with `{ status: "cancelled" }`.
- Demo mode retains its existing mock behaviour so offline development is unaffected.

---

## 3. Objective + Success Measure

**Objective**: Ship a fully wired, production-ready booking flow that creates real rides on the backend, surfaces accurate fare data, and progresses through matching to driver confirmation without any dead-end states caused by missing endpoints.

**Success Measure**: A rider on a physical device (demo mode off, connected to `http://34.140.138.4`) can complete the full flow — enter destination → confirm booking → see fare summary → reach matched state with driver info — in a single session with zero API 404/500 errors attributable to incorrect endpoint calls.

---

## 4. Target Users

**Primary**: Riders in Dakar, Senegal using Glidey on Android or iOS. Non-technical, French-speaking, accustomed to informal moto-taxi pricing; expect to see a price before or immediately after confirming a ride.

**Secondary**: Internal QA and operations staff verifying live ride creation through the admin dashboard; they depend on correct ride records appearing in the backend with accurate distance, duration, and fare fields.

---

## 5. User Stories

1. **As a rider**, I want to tap "Reserve" after choosing a destination and immediately receive a confirmed booking with a fare displayed, so I know what I will pay before a driver arrives.

2. **As a rider**, I want to see a "Searching for a driver…" state after booking, with visible progress feedback, so I know the app is working even if matching takes 30–90 seconds.

3. **As a rider**, I want to cancel my ride at any point before a driver is matched, so I am not charged or committed if my plans change.

4. **As a rider**, I want to see the matched driver's name, vehicle plate, and rating when a driver accepts my ride, so I know who is coming and can verify their identity.

5. **As a rider**, I want the app to recover gracefully if the backend is slow or temporarily unreachable during the booking or matching step, with a clear retry option, so I am not left on a broken screen.

6. **As a rider in demo mode**, I want the full flow to work with mock data exactly as before, so testers and reviewers can validate the UX without a live backend connection.

---

## 6. Scope

### In Scope
- Rewrite `bookingService.createRide` to call `POST /rides` with the real request body: `{ pickupAddress, destAddress, pickupLat, pickupLng, destLat, destLng, distanceM, durationS }`.
- Remove `estimateFare` and `getVehicleTypes` calls from the booking flow; delete or stub those service functions.
- Remove the vehicle-type carousel (`ScooterCarousel`) and per-type fare rows from `BookingModeContent`; replace with a single fare summary row populated from the `POST /rides` response (`fareBase`, `farePerKm`, `farePerMin`, `distanceM`, `durationS`).
- Rewrite `matchingService` polling to use `GET /rides/history` and inspect the most-recent ride's `status` field; keep WebSocket upgrade path as-is for when it becomes available.
- Rewrite `cancelRide` to call `PATCH /rides/{id}/status` with `{ status: "cancelled" }`.
- Update shared types in `@rentascooter/shared` (`CreateRideV2Request`, `CreateRideV2Response`, `CancelRideRequest`, `CancelRideResponse`) to match actual API contracts.
- Update `BookingSheetProps` interface to remove `fareEstimates`, `selectedVehicleTypeId`, `onSelectVehicleType`, `isFareLoading`, `fareError`; add `ridefare: RideFare | null`.
- Preserve all existing Reanimated animations, snap levels, and mode transitions.
- Preserve demo mode fixtures (update shapes to match new types).

### Explicitly Out of Scope
- Any new fare-estimate endpoint — the backend does not have one; fare is post-booking only.
- Vehicle type selection UI — the backend does not expose a catalog; out until a future backend feature adds it.
- In-ride tracking (active ride screen, driver live location map updates) — separate feature.
- Payment method selection beyond "Espèces" — no payment API exists yet.
- Push notification integration for driver acceptance — `expo-notifications` is currently disabled in `app.config.js`.
- Rating/feedback flow post-ride.
- Any backend changes — this PRD covers client-only work.

---

## 7. Success Metrics

1. **Booking completion rate**: Percentage of sessions where the user reaches matched state after tapping "Reserve" (target: ≥ 80% of real-device sessions with network connectivity, baseline currently 0% due to broken endpoints).

2. **API error rate on booking path**: Rate of 4xx/5xx responses on `POST /rides` and `PATCH /rides/{id}/status` attributable to incorrect request shape (target: 0% after release; current: ~100% because endpoints do not exist or receive wrong payloads).

3. **Matching wait time to user-visible feedback**: Time from `POST /rides` response to the first "Searching…" UI state appearing (target: < 300 ms; measured via in-app performance monitor already scaffolded in `utils/performanceMonitor.ts`).

---

## 8. Open Questions

1. **Fare display before booking**: The real API only returns fare data after `POST /rides` succeeds. The current UX shows estimated fares in the carousel before the user commits. Should we show a "Prix approximatif" disclaimer with a locally-computed estimate (using the fare formula seen in `demoFare` in `bookingService.ts`), or remove pre-booking fare entirely and show the real fare only on a post-booking confirmation step?

2. **Matching status source of truth**: The real API has no dedicated `GET /rides/{id}/status` endpoint — status must be inferred from `GET /rides/history`. Does the backend team plan to add a dedicated status endpoint or SSE push event before the client ships, or should the polling-history approach be treated as the permanent solution?

3. **Graceful handling of `pending` → no driver found**: The current `matchingService` defines a `failed` terminal state, but the real backend only has `pending`, `accepted`, `active`, `completed`, `cancelled`. How should the client behave if a ride stays in `pending` for an extended period with no driver accepting — auto-cancel after a timeout, or surface a manual retry?
