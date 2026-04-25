---
created: "2026-04-19"
last_edited: "2026-04-20T00:00:00Z"
---

# Cavekit: Ride Booking

## Scope
The full ride creation flow that begins once the user has picked a destination and a route has been drawn, and ends once the backend confirms that a ride has been created. Covers the pre-booking fare estimate, the vehicle-type catalog and per-type fare estimates consumed by the booking surface, the ride creation request (including the chosen vehicle type), the user-initiated cancel affordance while matching is in progress, demo-mode behavior, and the thin-screen architecture split between layout, hook, and service. This kit is the entry point into the Phase 2 ride lifecycle and produces the ride identifier consumed by the driver-matching, pickup-selection, and ride-tracking kits.

## Requirements

### R1: Fare estimate before booking
**Description:** Before the user can tap "Book Now", the client must display a fare estimate for the planned trip. The estimate is requested from the backend using the route's distance (in meters) and duration (in seconds) as inputs, and the response carries per-vehicle-type fare amounts in XOF (see R6). The "Book Now" control is disabled (non-interactive) until the estimate for the currently selected vehicle type resolves successfully. A failure to resolve the estimate must be surfaced to the user as a dedicated error state rather than a silent disabled control.

**Acceptance Criteria:**
- [ ] Before the fare estimate resolves for the current destination, the "Book Now" control is rendered in a disabled (non-interactive) state.
- [ ] Once the estimate resolves, a fare amount in XOF is displayed in the booking UI with whole-number formatting (no fractional XOF).
- [ ] The estimate request carries a `distanceM` input in meters and a `durationS` input in seconds sourced from the already-resolved route directions.
- [ ] The estimate response exposes a typed per-vehicle-type list of fare estimates (see R6).
- [ ] When the estimate request fails (network, timeout, non-2xx), the UI shows a dedicated error state with a user-visible message, and the "Book Now" control remains disabled.
- [ ] When the destination changes, any previously displayed fare estimate is cleared before a new estimate is requested.

**Dependencies:** `cavekit-api-client.md` R1, R3; `cavekit-route-directions.md` R1, R2; `cavekit-fare-estimation-api.md` R1.

---

### R2: Ride creation request
**Description:** When the user taps "Book Now", the client submits a ride creation request carrying the confirmed destination (coordinates and address), the user's current pickup coordinates, the route's distance in meters, the route's duration in seconds, and the identifier of the selected vehicle type (see R8). The response carries a ride identifier that downstream domains consume to drive the matching and tracking flows. The request is authenticated.

**Acceptance Criteria:**
- [ ] Tapping "Book Now" (only possible once R1 has resolved for the selected vehicle type) dispatches exactly one ride creation request.
- [ ] The request body includes the pickup `latitude` and `longitude` (current user location), the destination `latitude`, `longitude`, and `address`, the `distanceM`, the `durationS`, and the selected vehicle type identifier (see R8).
- [ ] The response exposes a typed ride object containing at minimum a ride `id` usable by the driver-matching kit.
- [ ] The call is authenticated via the shared API client (see `cavekit-api-client.md` R1).
- [ ] A backend failure is surfaced as a typed `ApiError`; the UI returns to the pre-booking state and does not report a false-positive ride creation.
- [ ] Concurrent taps on "Book Now" do not produce more than one in-flight ride creation request.

**Dependencies:** R1, R8, `cavekit-api-client.md` R1, R3, `cavekit-ride-vehicle-type.md` R1.

---

### R3: Cancel during search
**Description:** While the ride is in the pending/searching phase (after R2 but before a driver has been matched), the user can cancel the booking. Cancellation sends an appropriate request to the backend, tears down any matching-phase UI, and returns the app to the pre-booking state so the user can pick a new destination or retry.

**Acceptance Criteria:**
- [ ] While the ride is in a pending/searching state, a user-facing cancel control is visible and interactive.
- [ ] Tapping cancel dispatches a cancellation request referencing the ride `id` returned by R2.
- [ ] After a successful cancellation, the booking UI returns to the pre-booking state (no fare estimate, no matching timeline, no ride identifier retained in the booking store).
- [ ] The call is authenticated via the shared API client.
- [ ] A cancellation failure is surfaced as a typed `ApiError`; the ride identifier is not silently discarded on failure.
- [ ] Cancellation is not available once a driver has been matched (state transitions past `searching` are handled by `cavekit-driver-matching.md`, not this kit).

**Dependencies:** R2, `cavekit-api-client.md` R1, R3.

---

### R4: Demo mode
**Description:** When the app runs in demo mode, neither the vehicle-type catalog, the fare estimate, nor the ride creation request touches the network. All return deterministic mock values whose shapes fully satisfy the real types, so that downstream domains observe the same contract they would in production.

**Acceptance Criteria:**
- [ ] In demo mode, the vehicle-type catalog resolves to a mock non-empty list whose entries satisfy the shared vehicle-type type (see R6) without dispatching an HTTP request.
- [ ] In demo mode, the fare estimate resolves to a mock list of per-vehicle-type estimates (one per entry from the mock catalog) with positive numeric fare amounts in XOF without dispatching an HTTP request.
- [ ] In demo mode, ride creation resolves to a mock ride object with a non-empty ride `id` without dispatching an HTTP request, and accepts the selected vehicle type identifier (see R8) as input.
- [ ] In demo mode, cancellation resolves without dispatching an HTTP request and returns the UI to the pre-booking state exactly as in R3.
- [ ] The demo-mode return values satisfy the same TypeScript types as the real responses so downstream consumers need no branch on demo mode.

**Dependencies:** R1, R2, R3, R6, R8, `cavekit-api-client.md` R4.

---

### R5: Thin screen architecture
**Description:** The booking UI is a composition-only surface. All vehicle-catalog, fare-estimate, ride-creation, and cancellation logic lives in a dedicated hook and service layer, not inline in the screen. The types shared with downstream domains (vehicle-type shape, fare estimate response shape, ride FSM states) are defined in the shared types package so that the matching, pickup, and tracking kits can import them without reaching into this domain's internals.

**Acceptance Criteria:**
- [ ] The booking screen/component contains layout and composition only; it does not define network calls, response parsing, or store mutation logic.
- [ ] A dedicated booking hook exposes the vehicle catalog state, the fare estimate state (loading / ready / error), the currently selected vehicle type, the ride creation action, and the cancel action.
- [ ] A dedicated booking service exposes the vehicle catalog fetch, the fare estimate fetch, ride creation, and cancellation operations.
- [ ] A shared `VehicleType` type and a shared `FareEstimateResponse` type (carrying per-vehicle-type fare entries) are defined in the shared types package.
- [ ] Ride FSM state identifiers used by downstream kits are defined in the shared types package (not locally in the booking screen).
- [ ] No part of the booking flow references raw platform response objects or raw thrown exceptions; all failures surface through the shared `ApiError` shape.

**Dependencies:** R1, R2, R3, R6, R8, `cavekit-api-client.md` R3.

---

### R6: Vehicle-type catalog consumption
**Description:** The booking domain exposes the list of active vehicle types to the booking surface. The list is fetched from the backend vehicle-catalog endpoint and populates the booking sheet's vehicle-type carousel. No vehicle-type entries are declared or hardcoded in client code; the set of selectable vehicle types is exactly the set returned by the backend.

**Acceptance Criteria:**
- [ ] The booking domain exposes, via its hook, a typed list of active vehicle types sourced from the backend catalog response.
- [ ] Each vehicle-type entry exposes at minimum an identifier, a display name, and an icon key usable by the booking sheet.
- [ ] The domain does not declare any client-side hardcoded vehicle-type entries as a fallback when the backend returns an empty or failing response; an empty list or an error is surfaced to the UI as-is.
- [ ] A failure to fetch the vehicle-type catalog surfaces through the shared `ApiError` shape and leaves the booking surface in an error state rather than a silent empty carousel.

**Dependencies:** `cavekit-vehicle-catalog.md` R1, `cavekit-api-client.md` R3.

---

### R7: Fare pre-fetch at destination confirmation
**Description:** The per-vehicle-type fare estimate for the current trip is requested at the moment the destination is confirmed (when the route has just been resolved), not at the moment the booking sheet opens. As a result, when the booking sheet appears it already has fare values to render on each vehicle-type card, with no loading placeholder visible on the cards at sheet-open time for the common (non-error) path.

**Acceptance Criteria:**
- [ ] The fare-estimate request is dispatched within the same user-visible step as destination confirmation (the step that also resolves the route directions), not on booking-sheet mount.
- [ ] When the booking sheet mounts on the destination-confirmation path, the hook's fare-estimate state is already in a resolved state (or resolving-in-background with previously cached values) under the non-error path.
- [ ] Changing the destination cancels or supersedes any still-in-flight fare-estimate request for the previous destination before rendering new cards.
- [ ] The fare-estimate fetch failure path still leaves the booking surface in the error state described in R1, regardless of when the fetch was initiated.

**Dependencies:** R1, R6, `cavekit-route-directions.md` R1, `cavekit-fare-estimation-api.md` R1.

---

### R8: Vehicle-type selection on ride creation
**Description:** The booking domain tracks exactly one currently selected vehicle type at a time. Its identifier is included on every ride creation request. The default selection on a fresh booking flow is the first entry in the vehicle-type catalog as returned by the backend; the user can change the selection from the booking surface before tapping "Book Now".

**Acceptance Criteria:**
- [ ] The booking hook exposes a currently selected vehicle type identifier that is always a member of the catalog returned by R6.
- [ ] The default selected vehicle type identifier equals the identifier of the first entry in the catalog returned by R6.
- [ ] Every ride creation request dispatched by R2 carries a non-null vehicle type identifier equal to the current selection at the time of dispatch.
- [ ] The selection can be changed from the booking surface before ride creation, and a subsequent ride creation dispatches the new selection.
- [ ] The shared `CreateRideRequest` type declares the vehicle type identifier field in alignment with `cavekit-ride-vehicle-type.md` R1.

**Dependencies:** R2, R6, `cavekit-ride-vehicle-type.md` R1.

---

## Out of Scope
- Payment collection, payment method selection, or wallet top-up.
- Post-ride rating, tipping, or feedback capture.
- The driver-matching UI (searching timeline, no-driver fallback, driver card) — see `cavekit-driver-matching.md`.
- The pickup pin selection flow that runs after a driver accepts — see `cavekit-pickup-selection.md`.
- Live driver position tracking — see `cavekit-ride-tracking.md`.
- Push notifications on ride state changes (deferred beyond Phase 2).
- Scheduled / future-dated bookings.
- Multi-stop rides or round trips.
- Fare breakdown (surge, base, per-km) — only the per-vehicle-type total estimate is in scope.
- The visual and gesture behavior of the in-map booking sheet — see `cavekit-booking-sheet-ux.md`.

## Cross-References
- See also: `cavekit-api-client.md` — every catalog, fare estimate, ride creation, and cancellation call is routed through the shared client for auth, error normalization, and demo-mode bypass.
- See also: `cavekit-route-directions.md` — the `distanceM` and `durationS` values required by the fare estimate are sourced from the resolved route.
- See also: `cavekit-location-search.md` — the destination (coordinates, address) passed into ride creation comes from place-detail resolution.
- See also: `cavekit-vehicle-catalog.md` — backend source of the vehicle-type list consumed in R6.
- See also: `cavekit-fare-estimation-api.md` — backend source of the per-vehicle-type fare estimates consumed in R1 and R7.
- See also: `cavekit-ride-vehicle-type.md` — backend contract for accepting the vehicle type identifier on ride creation (R2, R8).
- See also: `cavekit-booking-sheet-ux.md` — the in-map booking sheet is the UI surface over the hook and service defined here.
- See also: `cavekit-driver-matching.md` — consumes the ride `id` returned by R2 to drive the matching state machine.
- See also: `cavekit-pickup-selection.md` — consumes the ride `id` returned by R2 to attach the confirmed pickup pin.
- See also: `cavekit-ride-tracking.md` — consumes the ride identifier to subscribe to live driver position updates.

## Changelog
- 2026-04-20: Added R6 (vehicle-type catalog consumption), R7 (fare pre-fetch at destination confirmation), and R8 (vehicle-type selection on ride creation). R1, R2, R4, R5 amended to reference the new per-vehicle-type fare response shape and the `VehicleType`/selection additions. Added cross-references to the new frontend `booking-sheet-ux` domain and to the backend `vehicle-catalog`, `fare-estimation-api`, and `ride-vehicle-type` domains.
