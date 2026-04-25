---
created: "2026-04-19"
last_edited: "2026-04-19"
---

# Cavekit: Driver Matching

## Scope
The ride lifecycle state machine that runs between a successfully created ride and a matched driver, including the three-attempt retry strategy, the wide animated matching timeline UI, the no-driver passive fallback state, and the driver card that reveals the matched driver's profile details. Covers the realtime subscription (WebSocket primary with polling fallback), the reusable components required by the matching modal, and demo-mode behavior. This kit consumes the ride identifier produced by the ride-booking kit and produces the matched state observed by the pickup-selection and ride-tracking kits.

## Requirements

### R1: Ride state machine
**Description:** The client maintains an authoritative ride lifecycle state for the active ride. States progress from `idle` (no active ride) through `searching` (matching in progress), `matched` (driver accepted), `pickup_en_route` (driver heading to pickup), and `completed`, with `cancelled` and `failed` as terminal branches. State is persisted in a dedicated store (not inline in any screen). Updates arrive primarily via a realtime subscription; when the realtime channel is unavailable, the client falls back to polling the backend at a fixed 5-second interval. State must be observable by any consuming screen via the store.

**Acceptance Criteria:**
- [ ] A dedicated ride store exposes the current ride state as one of: `idle`, `searching`, `matched`, `pickup_en_route`, `completed`, `cancelled`, `failed`.
- [ ] State identifier strings are defined in the shared types package (not redeclared locally).
- [ ] When the realtime subscription is connected, ride state transitions are driven by realtime events (no polling is dispatched).
- [ ] When the realtime subscription is disconnected or unavailable, a polling fallback dispatches a state check every 5 seconds until the realtime subscription reconnects.
- [ ] On successful realtime reconnection, polling stops before the next interval fires.
- [ ] An invalid state transition (e.g. `completed` → `searching`) is rejected by the store and logged rather than silently applied.
- [ ] Consumers (driver card, tracking banner, pickup sheet) observe the state exclusively through the store; no screen reads the ride state from a network call directly.

**Dependencies:** `cavekit-ride-booking.md` R2, R5; `cavekit-api-client.md` R1, R3.

---

### R2: Three-attempt retry with animated timeline
**Description:** Matching runs for up to three full attempts before giving up. Each attempt has a defined timeout after which the next attempt begins automatically. The UI renders a wide animated timeline that shows all three attempt stages simultaneously (not a sequential counter that replaces itself) — the timeline animates through each stage in order, so the user can see both the in-progress stage and the upcoming stages at all times.

**Acceptance Criteria:**
- [ ] The matching flow runs at most three attempts end-to-end before transitioning to the no-driver fallback (see R3).
- [ ] Each attempt has a defined timeout (the timeout value is a configuration decision made at the Architect phase; a reasonable range is 30–90 seconds per attempt); when the timeout elapses without a match, the next attempt begins automatically without user action.
- [ ] The matching modal renders all three attempt stages visible on screen at once (wide timeline), not a single counter that advances in place.
- [ ] The active stage in the timeline is visually distinguished from upcoming and completed stages at any point during matching.
- [ ] An accepted driver match (R4) halts the retry loop immediately; no further attempts are dispatched once a match occurs.
- [ ] A user-initiated cancel (see `cavekit-ride-booking.md` R3) halts the retry loop immediately.

**Dependencies:** R1.

---

### R3: No-driver fallback
**Description:** After all three matching attempts elapse without a match, the UI transitions to a passive "still looking" state. The message "No drivers nearby — we're working hard to find you a match" is displayed alongside a passive animated indicator. The user is not required to take any action. If a driver subsequently accepts the ride (via realtime or polling), the state machine advances automatically and the driver card (R4) appears.

**Acceptance Criteria:**
- [ ] When the third matching attempt elapses without a match, the UI renders the message "No drivers nearby — we're working hard to find you a match".
- [ ] A passive animated indicator is shown alongside the fallback message (no spinner that implies user action).
- [ ] No user action is required to keep the ride alive in the fallback state; the ride store remains in `searching` (no new sub-state is introduced — the fallback is a UI-layer concern only, not a new FSM state) until cancelled or matched.
- [ ] If a driver acceptance event arrives while the fallback is displayed, the state machine advances to `matched` and the driver card (R4) is presented automatically.
- [ ] The user retains access to the cancel affordance defined in `cavekit-ride-booking.md` R3 while the fallback is displayed.

**Dependencies:** R1, R2.

---

### R4: Driver card on match
**Description:** When a driver accepts the ride, a bottom-sheet driver card reveals the driver's profile: name, profile photo (with a fallback avatar when the photo is missing), license plate, vehicle type (display-only, sourced from the driver profile — no pre-booking filtering), star rating, and completed ride count. The map camera re-centers on the driver's reported position at the moment of match.

**Acceptance Criteria:**
- [ ] On transition to `matched`, a bottom-sheet driver card is presented.
- [ ] The card displays the driver's `name`, `vehiclePlate`, `vehicleType` string, `rating`, and completed ride count.
- [ ] The card displays the driver's profile photo when one is available, and a deterministic fallback avatar when the photo is missing or fails to load.
- [ ] The `vehicleType` string is rendered verbatim from the driver payload; no client-side filtering or routing decision is made on its value.
- [ ] The map camera re-centers on the driver's `latitude` and `longitude` at the moment the match event is processed.
- [ ] The card is not presented while the ride state is any value other than `matched` or `pickup_en_route`.

**Dependencies:** R1.

---

### R5: Reusable components and hook/service split
**Description:** The matching UI is decomposed into reusable components — at minimum a `DriverCard` component and a `RetryTimeline` component — exposed from the shared UI layer. The matching state logic lives in a dedicated hook and service, not inline in any screen. Consumers of the matching state observe it through the ride store (R1) and the hook's derived values, never by inlining network calls.

**Acceptance Criteria:**
- [ ] A reusable `DriverCard` component is exported from the shared UI layer and consumed by the matching screen.
- [ ] A reusable `RetryTimeline` component is exported from the shared UI layer and consumed by the matching screen.
- [ ] A dedicated matching hook exposes the current matching sub-state (active attempt index, in-fallback flag, matched driver) as derived values from the ride store.
- [ ] A dedicated matching service encapsulates the realtime subscription lifecycle and the polling fallback.
- [ ] No screen component contains inline realtime subscription setup, polling timers, or retry-attempt bookkeeping.

**Dependencies:** R1, R2, R3, R4.

---

### R6: Demo mode
**Description:** When the app runs in demo mode, the matching flow simulates a driver acceptance after a short, deterministic delay using fixture driver data. No realtime subscription is opened and no polling request is dispatched.

**Acceptance Criteria:**
- [ ] In demo mode, after ride creation (per `cavekit-ride-booking.md` R4) the matching flow transitions to `matched` after a short, deterministic delay.
- [ ] The matched driver in demo mode is a fixture object that fully satisfies the driver card shape required by R4 (name, photo or fallback, plate, vehicleType, rating, ride count, latitude, longitude).
- [ ] No outgoing HTTP request is dispatched during the matching flow in demo mode.
- [ ] No realtime subscription is opened during the matching flow in demo mode.
- [ ] The retry timeline (R2) still renders in demo mode for visual parity, even though the match resolves before the third attempt.

**Dependencies:** R1, R2, R4, `cavekit-api-client.md` R4.

---

## Out of Scope
- Pickup pin selection and confirmed pickup transmission — see `cavekit-pickup-selection.md`.
- Live driver position tracking and ETA banner — see `cavekit-ride-tracking.md`.
- Push notifications on driver match (deferred beyond Phase 2).
- Pre-booking vehicle type filtering (Phase 3); vehicle type on the driver card is display-only.
- In-app call or chat with the matched driver.
- Driver-side match acceptance UI (lives in the driver app, not this client).
- Surge pricing or dynamic fare adjustment during matching (fare is locked by the ride-booking kit).
- Server-side matching algorithm internals.
- Analytics or telemetry on match success/failure rates.

## Cross-References
- See also: `cavekit-ride-booking.md` — consumes the ride `id` produced by ride creation and the cancel affordance during searching.
- See also: `cavekit-api-client.md` — polling fallback requests are routed through the shared client for auth, error normalization, and demo-mode bypass.
- See also: `cavekit-nearby-drivers.md` — shares the driver coordinate convention and reuses the `vehicleType`, `vehiclePlate`, `rating`, `latitude`, `longitude` fields on the matched driver payload.
- See also: `cavekit-pickup-selection.md` — consumes the `matched` state transition as its entry trigger.
- See also: `cavekit-ride-tracking.md` — consumes the matched driver and the `pickup_en_route` state transition to drive live tracking.

## Changelog
