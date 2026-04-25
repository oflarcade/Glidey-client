# Synthesis: Glidey Phase 2 — Booking Flow

**Date:** 2026-04-19
**Pipeline:** pm-pipeline/booking-flow/

---

## Recommended Features (top 3)

1. **Pickup pin placement + reverse geocoding** (ICE: 720) — Draggable map pin defaulting to GPS position, with Mapbox reverse geocoding to confirm street address. Directly prevents mis-pickups, the top cancellation cause in emerging market ride-hailing. Zero new backend cost. Must-have for Phase 2.

2. **Animated "Looking for driver" state + live ETA** (ICE: 576) — Pulsing driver annotations converging on user pin + live "~X min" estimate pulled from polling response. The highest-anxiety moment in the flow; premature cancellations here kill completion rate. React Query polling is already planned — this is UI layer only.

3. **Driver card reveal with trust signals** (ICE: 576) — Bottom-sheet animation on driver acceptance showing name, photo, license plate, rating, ride count. Trust is the primary conversion barrier in a new market. Pure UI component; data comes from the ride acceptance event.

---

## Key Risks to Address in Spec

These LOW-confidence assumptions must become acceptance criteria or explicit scope constraints in the cavekit:

| # | Risk | Mitigation in Spec |
|---|------|--------------------|
| #5 | VM/WebSocket cannot sustain 50–200 concurrent sessions | Spec must include polling fallback (every 5 s) when WebSocket drops; do NOT ship WS-only |
| #3 | Map pickup UX not discoverable without guidance | Spec must include onboarding tooltip or instructional copy on the pickup pin screen |
| #1 | Users abandon "Looking for drivers" without progress feedback | Spec must require a timeout state (defined UX) + progress indicator; no blank/spinner-only screen |
| #9 | Senegal data-protection compliance (Loi 2008-12) | Pickup location must only be transmitted after explicit user confirmation; not stored beyond ride lifetime |

---

## User-Confirmed Decisions (2026-04-19)

### No-driver retry logic
- 3 full matching attempts before giving up. Each attempt = full polling/WS cycle.
- Modal shows all 3 attempt stages simultaneously as a wide animated timeline (stage 1 → 2 → 3 animate through in sequence).
- After 3 failures: "No drivers available nearby — we're working hard to find you a match" with a passive indicator. If a driver becomes available, the app dispatches them automatically (no user action required).
- All retry logic is **client-side only** — no backend changes needed.

### Fare estimate
- Fare is **backend-controlled**. Client must call `GET /rides/estimate?distanceM=&durationS=` before showing "Book Now".
- Backend returns `{ fareEstimate: number }` in XOF using its own rate constants (500 base + 150/km + 25/min today, but rates may change — client must not hardcode them).
- `distanceM` and `durationS` available from route directions service (Phase 1) — passed as query params.
- **Requires new BE endpoint:** `GET /rides/estimate` — add to backend before ride-booking kit can be completed.
- Displayed on the booking confirmation view; "Book Now" is disabled until estimate resolves.

### Scooter / vehicle types
- `vehicleType` is a free-text `varchar(50)` on the `drivers` table, already returned by `GET /drivers/nearby`.
- **Phase 2:** Display the driver's `vehicleType` on the driver card after match only — no pre-booking filter.
- Pre-booking type selection (requires BE enum + filter) is deferred to Phase 3.

### Mobile coding conventions (mandatory in all kits)
- Screens are thin layout/composition only — no inline business logic.
- All reusable UI extracted to `packages/ui/src/` or `components/`.
- Shared types in `@rentascooter/shared`, utils/helpers in dedicated files.
- Every kit AC must reference these conventions.

---

## Constraints

- **Backend protocol:** WebSocket preferred for real-time but polling fallback (5 s interval) is mandatory given Dakar intermittent 3G. The spec must not depend on WebSocket reliability alone.
- **Driver GPS SLA:** Live tracking is only useful if the driver app pushes location every ≤5 s. This is a hard dependency on the driver-side team — must be defined before ride-tracking spec is finalized.
- **Single GCP VM:** No horizontal scaling today; ride-tracking load test required before production. WebSocket connection limit is a real ceiling.
- **Notifications deferred:** Push notification requirements are explicitly OUT for Phase 2. The arrival time banner + progress bar replaces the notification signal entirely for this phase.
- **No payment or rating:** Phase 2 ends when the driver arrives at pickup. Payment and post-ride flow are Phase 3.

---

## Suggested Domain Decomposition

Four bounded domains, each independently specifiable and buildable:

| Domain | Scope | Kit Action |
|--------|-------|------------|
| **ride-booking** | POST /rides/create, "looking for drivers" polling/WS state, cancellation during search, timeout + no-driver fallback UX | CREATE |
| **driver-matching** | Ride lifecycle state machine (idle→searching→matched→pickup_en_route→completed), driver accepted event, driver card display (name, photo, plate, rating) | CREATE |
| **pickup-selection** | Pickup pin map interaction (draggable, defaults to GPS), reverse geocoding confirmed address, confirm → driver notification via backend | CREATE |
| **ride-tracking** | Live driver GPS on Mapbox (every 3–5 s), arrival time banner (bottom sheet), progress bar tied to ETA, session keeps screen awake | CREATE |

**Dependency graph:**
```
Tier 0: ride-booking           (depends on: api-client only)
Tier 1: driver-matching        (depends on: ride-booking — needs ride ID + WS channel)
Tier 1: pickup-selection       (depends on: ride-booking — needs ride ID for notification)
Tier 2: ride-tracking          (depends on: driver-matching — needs matched state + driver coords)
```

---

## Success Criteria Candidates

Derived from PRD Section 7 — these become cavekit acceptance criteria:

1. **Booking completion rate ≥ 70%** — tapping "Book Now" → confirmed driver match within 3 minutes (server-side state transition log).
2. **Map tracking engagement ≥ 80%** — matched rides with app foregrounded on tracking screen until driver arrival.
3. **Pickup pin adoption ≥ 60%** — rides where user moved the pickup pin from default GPS position (signals feature discoverability).
4. **No-driver timeout defined** — spec must prescribe the exact timeout threshold and failure-state copy before engineering begins.
