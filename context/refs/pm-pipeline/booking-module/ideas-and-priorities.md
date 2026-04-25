# Booking Module — Ideas & Priorities
**Feature:** Wire BookingSheet UI to real Glidey backend API
**Date:** 2026-04-21
**Phase:** Pre-implementation ideation

---

## Framing: The Core Tension

The existing UI was designed around a **pre-estimate → vehicle selection → book** flow:

- `useBooking.ts` calls `estimateFare()` before creating a ride
- `ScooterCarousel` displays per-type fare estimates for selection
- `BookingSheet` gates the "Réserver maintenant" button on a selected vehicle type with a confirmed fare

The real backend breaks all three assumptions:

| Assumption | Reality |
|---|---|
| `/fare/estimate` endpoint exists | Does not exist — fare is server-side on ride creation only |
| Vehicle catalog is fetched from backend | No `/vehicle-types` endpoint — vehicleType is a free-form string |
| User picks a vehicle type before booking | There is nothing to pick from |

Everything below is grounded in this gap.

---

## Part 1 — Brainstorm

### Perspective 1: Product Manager (Maximize Conversion)

**PM-1: Commit-First, Reveal-After**
Remove the pre-estimate step entirely. The CTA becomes "Trouver un conducteur" (not "Réserver"). Once the ride is created and the real fare is returned from `POST /rides`, show a fare confirmation modal before the matching search begins. User sees the price; one tap confirms and matching starts; another tap cancels at zero cost. Mirrors the mental model of Bolt/Indriver in low-connectivity markets where latency is high — no wasted round trips.

**PM-2: Inline Fare Skeleton with Actual Price on Confirm**
Keep the booking sheet layout intact but replace the carousel fare section with a skeleton loader that resolves to the real fare from the `POST /rides` response. The sheet transitions: search → booking (skeleton animating) → fare revealed → user confirms → matching. Feels fast, requires no redesign of the sheet states.

**PM-3: Transparent Fare Formula Banner**
Since there is no estimate, build trust differently: display a static fare formula row ("300 XOF base + 100/km + 15/min") sourced from app config (matching the backend's actual formula). User can mentally estimate before booking. Formula is hardcoded in the app but matches real server math — no backend endpoint needed. Reduces uncertainty without a round trip.

**PM-4: Historical Fare Reference ("Last time: X XOF")**
Pull from `GET /rides/history` (which already exists). On the booking sheet, show the fare from the user's most recent ride on the same or similar route as a soft anchor. "Votre dernier trajet similaire : ~1 400 XOF". Low engineering cost, high trust signal for repeat users. Degrades gracefully to empty for first-time riders.

**PM-5: Single Vehicle Type + Hardcoded Name**
Eliminate vehicle selection UX entirely for the first production release. The vehicleType field sent to the backend is hardcoded to `"moto"` (the dominant mode in Dakar). ScooterCarousel is replaced by a simple confirmation strip: "Moto-taxi — tarif calculé à la création". No carousel, no fake estimates, no confusion. Ship faster, add vehicle variety in v2 once backend supports a catalog.

---

### Perspective 2: Product Designer (Handle the Missing Pre-Estimate Elegantly)

**DES-1: Two-Phase Sheet — "Ready to Go" then "Price Confirmed"**
Design the booking sheet with two distinct visual states that feel intentional, not like a loading gap. State 1 (Ready): destination, distance, payment method, route preview on map, a pulsing "Calculer le tarif" button. State 2 (Price Confirmed): fare amount animates in large, centered — "1 450 XOF" with breakdown icon, plus "Confirmer" and "Annuler" actions. The transition between states is a vertical slide-up of the price card. This makes the async nature a designed moment rather than a perceived delay.

**DES-2: Fare as a Range Derived from Formula**
Render "Environ 1 200 – 1 600 XOF" using the known formula applied at ±15% bounds on the route distance. Once POST /rides returns the real fare, the range collapses with an animation to the exact figure. The visual metaphor of narrowing tells the user the system is working toward precision. Requires only client-side math on top of useRouteDirections data.

**DES-3: Purposeful Loading State — "Votre tarif est en cours de calcul"**
Replace the carousel entirely with a centered, branded loading card during the POST /rides call (typically <1s on Dakar 4G). Use a Glidey-branded pulse or wave animation. The loading is the experience — not a bug. This is better than showing skeleton bones over a structure that implies data that doesn't exist yet. When the fare arrives it fades in with a bounce.

**DES-4: Vehicle Type as a Visual Confirmation, Not a Choice**
Since vehicleType is always moto for v1, show the ScooterCarousel with a single card, pre-selected, non-tappable. The card still renders label, icon, and "Tarif calculé" as placeholder text. When the POST resolves, the price slot animates to the real fare. The carousel structure is preserved for future multi-type expansion — just disable interaction and populate with one item. Zero structural change to BookingModeContent.

**DES-5: Micro-copy Reframe — "Prix fixé à la confirmation"**
The smallest surface area change: swap the fare loading spinner copy from "Calcul du tarif…" to "Prix fixé à la confirmation". Add a small info icon (i) that opens a tooltip: "Chez Glidey, le tarif exact est calculé au départ selon la distance et la durée réelles." This sets correct expectations and removes the implication that a pre-estimate is coming. Works with or without a carousel.

---

### Perspective 3: Engineer (Minimal-Change vs. Redesign)

**ENG-1: Minimal Change — Stub `estimateFare` Locally, Remove `/fare/estimate` Call**
The least-disruptive path. In `bookingService.ts`, rewrite `estimateFare()` to return a deterministic local estimate computed from the known formula (matching `demoFare()` logic that already exists). It stays async, returns a single `FareEstimateItem` with `vehicleTypeId: 'moto'`. `useBooking.ts` does not change. `BookingSheet` does not change. The only delta: `estimateFare` becomes a pure function pretending to be a network call. Unblocks all downstream UI with one-file change.

**ENG-2: Replace `useBooking` with `useBookingV2` — Two-Phase Hook**
Create a new `useBookingV2` hook that separates concerns cleanly:
- Phase 1 (`ready`): has pickup, destination, route — no fare yet
- Phase 2 (`confirming`): calls `POST /rides`, gets back `fareBase/farePerKm/farePerMin + distanceM + durationS` to compute display fare
- Phase 3 (`searching`): transitions rideStore to searching

The existing `useBooking` stays untouched for backward compatibility. `BookingSheet` is wired to `useBookingV2` via a feature flag or direct swap. Clean separation, testable states, no carousel regression.

**ENG-3: Adapt `createRide` Payload to Real API Shape**
The current `bookingService.createRide` calls `/rides/create` with a non-standard shape. The real endpoint is `POST /rides` expecting `{ pickupAddress, destAddress, pickupLat, pickupLng, destLat, destLng, distanceM, durationS, route? }`. Adapter needed in `authedFetch` call — maps `Location` + `GeoPoint` types to the flat API shape. This is required regardless of which UX strategy is chosen; it should be the first engineering task.

**ENG-4: Polling `GET /rides/history` as the Only Status Mechanism**
Since there is no `GET /rides/:id` and the matching service (`matchingService.ts`) currently calls `subscribeToMatching()`, the matching subscription must be replaced or augmented. The pragmatic minimal path: after `POST /rides` returns `rideId`, poll `GET /rides/history` every 3 seconds, find the matching record by ID, and feed its `status` field into the existing `useMatching` state machine. No WebSocket needed, no backend change needed. Poll interval can be tuned.

**ENG-5: Isolate `vehicleType` as a Config Constant, Not a Runtime API Value**
Remove `useVehicleTypes`, `getVehicleTypes`, and `GET /vehicle-types` from the runtime call path entirely. Introduce a `VEHICLE_TYPE_CONFIG` constant in `config/`:
```ts
export const VEHICLE_TYPE_CONFIG = [
  { id: 'moto', name: 'Moto-taxi', iconKey: 'moto' }
] as const;
```
ScooterCarousel receives this at build time. The `vehicleTypeId` sent to `POST /rides` is always `'moto'` for v1. Eliminates one unnecessary async dependency in the booking critical path.

---

## Part 2 — ICE Prioritization (Top 5 Features)

ICE = Impact (1–10) × Confidence (1–10) × Ease (1–10)

| # | Feature | Impact | Confidence | Ease | ICE Score | Why |
|---|---|---|---|---|---|---|
| 1 | **ENG-3: Adapt createRide payload to real API shape** | 10 | 10 | 9 | **900** | Hard blocker. Nothing works until the POST /rides call matches the actual API contract. Required by every other feature on this list. |
| 2 | **ENG-5: Isolate vehicleType as a config constant** | 8 | 10 | 9 | **720** | Eliminates a broken API dependency (`GET /vehicle-types` does not exist) with near-zero effort. Unblocks the carousel rendering without a network call. One file change. |
| 3 | **PM-1 + DES-1: Commit-First, Reveal-After (Two-Phase Booking)** | 9 | 8 | 7 | **504** | The right UX strategy for a backend that only returns fare on ride creation. High conversion impact — user commits to destination, sees real fare, confirms or bails. Pairs with DES-1's visual design. Requires `useBookingV2` (ENG-2) and a new fare confirmation micro-UI. |
| 4 | **ENG-4: Poll GET /rides/history for matching status** | 9 | 9 | 6 | **486** | Closes the matching loop. Without it the app cannot detect when a driver accepts. The current `subscribeToMatching` points at a non-existent mechanism. Polling is the only available path and is fully sufficient for v1. |
| 5 | **PM-3: Transparent Fare Formula Banner** | 7 | 9 | 8 | **504** | Low-effort trust signal. Hardcode the real formula (300 XOF base + 100/km + 15/min) as a static row in the booking sheet. No backend dependency, sets accurate expectations, reduces abandonment while user waits for real fare. |

---

## Deprioritized Features and Rationale

| Feature | Score | Reason Deprioritized |
|---|---|---|
| **ENG-1: Stub `estimateFare` locally** | Medium | Creates a plausible-looking fake that diverges from real backend math as pricing evolves. ENG-5 + ENG-3 together achieve the same unblocking without the technical debt of a ghost endpoint. |
| **ENG-2: `useBookingV2` hook** | Medium | Valuable refactor but can be done as part of implementing PM-1/DES-1 rather than as a standalone deliverable. Not separately prioritized — folded into the two-phase booking feature. |
| **DES-2: Fare as a range** | Medium | Adds client-side formula math that may drift from real backend pricing. Introduces a user expectation (range) that could be violated by actual fare. PM-3's static formula is more honest for v1. |
| **DES-3: Purposeful loading state** | Low-Medium | Pure polish. Valuable once the two-phase booking flow is working; premature to build a bespoke loading card before the data plumbing is correct. |
| **DES-4: Single pre-selected carousel card** | Low | Preserves carousel structure at cost of confusing users who tap a card that does nothing. Better to hide the carousel entirely in v1 (per PM-5/ENG-5) and restore it when multi-type is real. |
| **PM-4: Historical fare reference** | Low | Requires ride history to be populated (new users see nothing), and adds a read call to the booking critical path. Good for v2 personalization sprint. |
| **PM-5: Hardcode vehicleType to moto** | — | Folded into ENG-5 (config constant). Not separately deprioritized — it IS the implementation of that feature. |
| **DES-5: Micro-copy reframe only** | Low | Necessary regardless but insufficient alone. A copy fix without fixing the underlying data plumbing just decorates the problem. |

---

## Recommended Implementation Order

```
Sprint 0 (Unblocking)
  └── ENG-3: Fix createRide payload shape        ← nothing works without this
  └── ENG-5: vehicleType as config constant       ← kills broken /vehicle-types call

Sprint 1 (Core Flow)
  └── ENG-4: Polling for matching status          ← closes the ride lifecycle loop
  └── PM-1 + DES-1: Two-phase booking UX          ← real fare reveal flow
  └── PM-3: Fare formula banner                   ← trust + expectation setting

Sprint 2 (Polish)
  └── DES-3: Loading state polish
  └── PM-4: Historical fare reference (v2)
  └── Multi-vehicle-type support (when backend ready)
```

---

## Key Risks

1. **Polling latency vs UX**: `GET /rides/history` polling at 3s intervals adds up to 3s delay between driver accept and UI update. Acceptable for v1; flag for WebSocket upgrade in v2.
2. **Fare formula drift**: Hardcoding `300 + 100/km + 15/min` in PM-3 will mislead users if the backend changes pricing. Must be tied to an env/config variable that can be hot-patched without an app release.
3. **Cancellation window**: In the commit-first flow (PM-1), the ride is created before the user sees the fare. Ensure `PATCH /rides/{rideId}/status` with `status: "cancelled"` is called immediately and synchronously on user rejection — the ride must not enter matching before cancellation completes.
4. **Demo mode parity**: `demoFare()` in `bookingService.ts` simulates a multi-vehicle estimate. Once the real flow is single-vehicle and commit-first, the demo fixture should mirror that shape exactly to avoid QA confusion.
