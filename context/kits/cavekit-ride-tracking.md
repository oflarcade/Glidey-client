---
created: "2026-04-19"
last_edited: "2026-04-19"
---

# Cavekit: Ride Tracking

## Scope
The live wait experience between the user's pickup confirmation and the driver's arrival. Covers live driver GPS updates on the map, the arrival-time banner with embedded progress bar, the screen keep-awake policy for active tracking, the WebSocket-primary / polling-fallback transport strategy, and the reusable component split. This kit consumes the matched driver and the `pickup_en_route` state transition produced by the driver-matching kit.

## Requirements

### R1: Live driver position on map
**Description:** While the ride is in active tracking (`matched` through `pickup_en_route` until the driver arrives), the driver's GPS position is updated on the map every 3 to 5 seconds. Updates are driven primarily by realtime push; when realtime is unavailable, a polling fallback takes over (see R5). The driver marker animates smoothly between successive positions — it must not teleport across the map from one update to the next.

**Acceptance Criteria:**
- [ ] While the ride is in the active tracking phase, the driver marker's position is updated on the map at a cadence of once every 3 to 5 seconds.
- [ ] When the realtime channel is connected, position updates are sourced from realtime push events, not polling.
- [ ] Successive driver positions are interpolated so the marker animates smoothly between updates; no visible teleport step is introduced when a new position arrives.
- [ ] When the realtime channel is disconnected, the polling fallback (R5) supplies position updates at the same cadence.
- [ ] When no new position has been received for longer than the expected cadence, the UI indicates a stale state rather than silently showing a position known to be outdated.

**Dependencies:** `cavekit-driver-matching.md` R1.

---

### R2: Arrival time banner
**Description:** Once the ride is in the `pickup_en_route` state, a persistent banner is presented at the bottom of the map screen displaying the estimated time until the driver arrives (e.g. "Driver arriving in ~X min") alongside the driver's name or an equivalent identifying label. The banner's ETA text updates whenever the ETA value changes.

**Acceptance Criteria:**
- [ ] The arrival banner is rendered at the bottom of the map screen while the ride is in `pickup_en_route`.
- [ ] The banner displays the driver's name (or equivalent identifying label) and the current ETA in minutes.
- [ ] The banner is not rendered while the ride is in any state other than `pickup_en_route` (`idle`, `searching`, `matched` before pickup confirmation, `completed`, `cancelled`, `failed`).
- [ ] When the ETA value changes, the banner's displayed ETA updates to the new value without a full screen reload.
- [ ] The banner remains visible when the user interacts with the map (pan, zoom) — it is not dismissed by map gestures.

**Dependencies:** R1, `cavekit-driver-matching.md` R1, `cavekit-pickup-selection.md` R4.

---

### R3: Progress bar in arrival banner
**Description:** The arrival banner contains a visual progress indicator that fills as the driver approaches. Progress is derived from the ratio of the remaining ETA to the original ETA captured at the start of the tracking phase. If the remaining ETA increases significantly (e.g. the driver has to reroute), the progress bar resets to reflect the new, longer journey.

**Acceptance Criteria:**
- [ ] The banner contains a visible progress indicator that advances as the remaining ETA decreases.
- [ ] Progress is derived from `(originalEta - remainingEta) / originalEta`, where `originalEta` is captured on entry to the tracking phase.
- [ ] When the remaining ETA increases by more than 20% above the last observed remaining ETA value, the progress bar resets — the new remaining ETA becomes the new `originalEta` reference and the bar fills from zero again.
- [ ] The progress bar never displays a value outside the `[0, 1]` range, regardless of ETA anomalies.
- [ ] On arrival (ETA at or near zero), the progress bar is fully filled.

**Dependencies:** R2.

---

### R4: Screen keep-awake during tracking
**Description:** The device screen must not sleep or dim while the ride is in the active tracking phase so the user can keep the map visible without touching the device. Keep-awake is enabled when the tracking phase begins and disabled when the phase ends.

**Acceptance Criteria:**
- [ ] The device screen does not enter sleep or dim during the active tracking phase, independent of the device's normal idle timer.
- [ ] Keep-awake is engaged no later than the transition into the tracking phase.
- [ ] Keep-awake is released on every terminal exit from the tracking phase: driver arrival, ride cancellation, or a failed state.
- [ ] Keep-awake is not engaged while the ride is in `idle`, `searching`, or states before tracking begins.
- [ ] Keep-awake release is idempotent — repeated release calls do not leave the device stuck in keep-awake.

**Dependencies:** R1.

---

### R5: Polling fallback transport
**Description:** When the realtime channel drops during active tracking, the client automatically falls back to polling the backend for the driver's current position at 5-second intervals. When realtime becomes available again, the client reconnects and polling stops.

**Acceptance Criteria:**
- [ ] A realtime disconnect during the active tracking phase triggers the polling fallback within 5 seconds.
- [ ] Polling dispatches a driver-position fetch every 5 seconds while the realtime channel remains disconnected.
- [ ] Polling requests are authenticated via the shared API client.
- [ ] On realtime reconnection, polling stops before the next poll interval fires.
- [ ] A polling request failure is surfaced as a typed `ApiError` but does not break the tracking phase — the next poll interval is still attempted.
- [ ] Polling is not dispatched while the realtime channel is connected.

**Dependencies:** R1, `cavekit-api-client.md` R1, R3.

---

### R6: Reusable components and hook/service split
**Description:** The tracking UI is a thin composition. The arrival banner with its embedded progress bar is extracted as a reusable `ArrivalBanner` component. The driver position update logic — realtime subscription, polling fallback, marker interpolation — lives in a dedicated hook and service layer, not inline in any screen.

**Acceptance Criteria:**
- [ ] A reusable `ArrivalBanner` component (including the R3 progress bar) is exported from the shared UI layer and consumed by the tracking screen.
- [ ] A dedicated tracking hook exposes the current driver position, the current ETA, and a stale flag derived from cadence.
- [ ] A dedicated tracking service encapsulates the realtime subscription lifecycle, the polling fallback, and the keep-awake acquire/release.
- [ ] The tracking screen contains layout and composition only; it does not define realtime subscription setup, polling timers, or keep-awake acquisition logic inline.
- [ ] No screen component references raw platform response objects or raw thrown exceptions; failures surface through the shared `ApiError` shape.

**Dependencies:** R1, R2, R3, R4, R5.

---

## Out of Scope
- Turn-by-turn navigation, textual or voice directions for the rider.
- Payment collection or fare settlement at ride end.
- Post-ride rating, tipping, or feedback capture.
- Push notifications on driver arrival or ETA changes (deferred beyond Phase 2).
- In-app call or chat with the driver from the tracking surface.
- In-trip driver tracking (after pickup, on the way to the destination) — this kit covers only the pre-pickup wait.
- Analytics or telemetry on driver position update cadence.
- Offline mode — tracking requires network connectivity.
- Server-side ETA computation internals.

## Cross-References
- See also: `cavekit-driver-matching.md` — consumes the matched driver profile (name, photo) and the `pickup_en_route` state transition.
- See also: `cavekit-pickup-selection.md` — the tracking phase begins on the successful pickup confirmation produced by that kit.
- See also: `cavekit-ride-booking.md` — shares the ride identifier used to scope realtime subscriptions and polling requests.
- See also: `cavekit-api-client.md` — the polling fallback is routed through the shared client for auth and error normalization.
- See also: `cavekit-nearby-drivers.md` — shares the driver latitude/longitude coordinate convention used for map placement.

## Changelog
