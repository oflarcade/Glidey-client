---
created: "2026-04-19"
last_edited: "2026-04-19"
---

# Cavekit: Pickup Selection

## Scope
The post-match pickup refinement flow in which the user places a draggable pin on a map to indicate the exact pickup spot, sees the reverse-geocoded street address for the pin's current position, and explicitly confirms the pickup so the backend can notify the matched driver. Covers the onboarding tooltip shown on first use, the data-protection constraint that pickup coordinates are transmitted only after explicit user confirmation, and the reusable component split. This kit runs after driver-matching and before ride-tracking.

## Requirements

### R1: Pickup pin map
**Description:** Once the ride is in the `matched` state, the pickup-selection surface is presented as a full or near-full-screen map view with a draggable pin. The pin initially sits at the user's current GPS position. The user can drag the pin anywhere on the visible map to adjust the exact pickup spot.

**Acceptance Criteria:**
- [ ] The pickup map is presented only while the ride is in the `matched` state (or an equivalent pre-confirmed pickup sub-state).
- [ ] On first render, the pin is positioned at the user's current GPS `latitude` and `longitude`.
- [ ] The pin is draggable by the user and can be placed anywhere on the visible map surface.
- [ ] While the user is actively dragging the pin, the pin visually follows the user's gesture without lag that would suggest unresponsiveness.
- [ ] The map view occupies the full screen or near-full-screen area dedicated to this flow (no partial-sheet presentation that would obscure a large portion of the map).

**Dependencies:** `cavekit-driver-matching.md` R1.

---

### R2: Reverse geocoding on drag-end
**Description:** As the user releases the pin (drag-end), the client resolves the pin's coordinates to a human-readable street address and displays that address in a label below or near the pin. Reverse geocoding runs on drag-end, not on every intermediate frame, to avoid redundant lookups during continuous gestures.

**Acceptance Criteria:**
- [ ] A reverse-geocoding lookup is dispatched on drag-end, not on every intermediate position update during the drag gesture.
- [ ] The resolved address is displayed in a label associated with the pin.
- [ ] While a reverse-geocoding lookup is in flight, the label indicates a loading state rather than displaying stale address text as if it were current.
- [ ] A failed reverse-geocoding lookup surfaces a fallback label (e.g. a coordinate string or a user-visible "address unavailable" message) rather than a blank display.
- [ ] On initial render (before any drag), the label shows the reverse-geocoded address for the initial GPS position, resolved via the same mechanism.

**Dependencies:** R1.

---

### R3: First-use onboarding tooltip
**Description:** The first time a user reaches the pickup-selection surface, a tooltip or instructional overlay appears with the text "Drag the pin to your exact pickup spot". The tooltip dismisses on the user's first interaction. A dismissal state is persisted so the tooltip is not shown again on subsequent rides.

**Acceptance Criteria:**
- [ ] On the user's first arrival at the pickup-selection surface, the tooltip/overlay is visible with the text "Drag the pin to your exact pickup spot".
- [ ] The tooltip dismisses on the first user interaction with the map or pin (drag, tap, or explicit dismiss control).
- [ ] A dismissal state is persisted across app relaunches so the tooltip is not shown again after first dismissal.
- [ ] On subsequent arrivals at the pickup-selection surface, the tooltip is not presented.
- [ ] Clearing persisted user state (e.g. a fresh install or an explicit reset) restores the first-use behavior.

**Dependencies:** R1.

---

### R4: Confirm and transmit pickup
**Description:** The user taps an explicit Confirm control to submit the chosen pickup coordinates to the backend. Pickup coordinates MUST NOT be transmitted to the backend before this explicit user action (data protection compliance). On confirmation, the backend receives the pickup coordinates so it can notify the matched driver.

**Acceptance Criteria:**
- [ ] Pickup coordinates are NOT transmitted to the backend until the user taps the explicit Confirm control.
- [ ] Tapping Confirm dispatches exactly one request that includes the ride identifier from the booking kit and the pickup `latitude` and `longitude`.
- [ ] The request is authenticated via the shared API client.
- [ ] A backend failure on confirmation is surfaced as a typed `ApiError`; the user remains on the pickup surface and can retry.
- [ ] On successful confirmation, the ride advances to the next lifecycle state (`pickup_en_route`) so downstream tracking can begin.
- [ ] No pickup coordinate value is transmitted to the ride backend in any request or realtime payload prior to the Confirm action. (Reverse-geocoding lookups in R2, which send coordinates to a geocoding service, are permitted as they serve address display only and are not routed to the ride backend.)

**Dependencies:** R1, R2, `cavekit-ride-booking.md` R5, `cavekit-driver-matching.md` R1, `cavekit-api-client.md` R1, R3.

---

### R5: Reusable component and shared coordinate type
**Description:** The pickup surface is a thin composition; its draggable pin UI is extracted as a reusable component (`PickupPinSheet` or equivalent). The pickup coordinate value conforms to the existing `GeoPoint` shape exported from the shared types package — no new coordinate shape is introduced for this flow.

**Acceptance Criteria:**
- [ ] A reusable pickup pin component is exported from the shared UI layer and consumed by the pickup screen.
- [ ] The component exposes the current pin position and a drag-end event that consumers observe to trigger reverse geocoding and confirmation.
- [ ] Pickup coordinates passed between the pin component, reverse geocoding, and the confirmation request conform to the existing `GeoPoint` shape (`latitude: number`, `longitude: number`).
- [ ] No component in this flow defines a parallel `lat`/`lng` or `location.lat`/`location.lng` shape.
- [ ] The screen contains layout and composition only; pickup logic (reverse geocoding, confirmation dispatch, persistence of onboarding state) lives in a hook and service layer.

**Dependencies:** R1, R2, R4.

---

## Out of Scope
- Live driver position tracking on the pickup surface — see `cavekit-ride-tracking.md`.
- Route rendering between the driver's current position and the confirmed pickup pin.
- Turn-by-turn navigation toward the pickup point.
- Push notifications when the driver begins pickup travel (deferred beyond Phase 2).
- In-app call or chat with the matched driver from the pickup surface.
- Landmark or point-of-interest selection in lieu of an arbitrary pin.
- Geofenced validation that the pin falls within a supported service area.
- Automatic pin re-centering on GPS updates after the user has moved the pin.

## Cross-References
- See also: `cavekit-driver-matching.md` — the pickup surface is entered on the `matched` state transition produced by the matching kit.
- See also: `cavekit-ride-booking.md` — the confirmation request carries the ride identifier produced by ride creation; the pickup flow respects the same cancel affordance until confirmation.
- See also: `cavekit-api-client.md` — reverse-geocoding and confirmation calls are routed through the shared client for auth, error normalization, and demo-mode bypass.
- See also: `cavekit-ride-tracking.md` — consumes the `pickup_en_route` transition produced by a successful confirmation.
- See also: `cavekit-location-search.md` — shares the `GeoPoint` coordinate convention used across the app.

## Changelog
