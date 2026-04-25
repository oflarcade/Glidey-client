# Synthesis: Booking Bottom Sheet

**Date:** 2026-04-20
**Slug:** booking-bottom-sheet

---

## Recommended Features (top 3)

**1. vehicleType plumbed into CreateRideV2Request (ENG-2, ICE 9.3)**
The vehicle-type carousel is the sheet's primary differentiator. Without this field, every booking is under-specified and the carousel is decorative. A 3-file change: `packages/shared/src/types/index.ts` (add `vehicleType: string` to `CreateRideV2Request`), `services/bookingService.ts` (pass the field), `hooks/useBooking.ts` (accept as param). Must ship as part of this feature — it is a prerequisite, not an enhancement.

**2. Scroll/drag gesture conflict worklet (ENG-1, ICE 7.7)**
The horizontal vehicle-type carousel (FlatList) inside a vertical draggable sheet is the hardest gesture-interaction problem in this feature. The existing `BottomSheet` uses `PanResponder`. The correct fix is a Reanimated `activeOffsetY`/`activeOffsetX` split so the sheet drag and carousel scroll never compete. Must be validated on Android before full build begins. This is a correctness gate, not an enhancement.

**3. Inline searching state in the sheet (UX-4 + PRD requirement)**
`MatchingModal` is currently a full `Modal` overlay. In the bottom sheet, overlaying a Modal over a sheet causes z-index and gesture conflicts. The solution is to extract a `SearchingView` component from `MatchingModal` (RetryTimeline + cancel button, no modal wrapper) and render it inside the sheet when `rideState === 'searching'`. This resolves the open question from the PRD and gives `MatchingModal` an `inline` prop or a standalone `SearchingView` export.

---

## Key Risks to Address in Spec

| Risk | Confidence | Must-Become Acceptance Criterion |
|------|------------|----------------------------------|
| A2 — vehicleType backend compatibility | **LOW** | `CreateRideV2Request.vehicleType` accepted by `/rides/create` without schema rejection; old requests without the field still route correctly |
| A6 — Fare per vehicle type | **LOW** | At launch, carousel shows a single estimated fare for all vehicle types (not per-type). Label makes this explicit: "Estimation" not "Prix fixe par type". Per-type pricing is deferred. |
| A7 — Fleet reality (single vs. multi-type) | **LOW** | Carousel vehicle types are driven by a static client-side config (at least Standard + E-Scooter for launch). If only one type is operationally active, selected type is still transmitted to backend for future dispatch routing. |
| A9 — Cold-resume / orphaned booking | **MEDIUM** | On cold resume during `rideState === 'searching'`, the sheet reopens in searching state (not idle). useRideStore FSM state is not persisted across cold starts in the current implementation — this must be explicitly addressed or documented as a known gap with a user-facing banner. |

---

## Constraints

- **Reanimated 4.x** — must use `activeOffsetY`/`activeOffsetX` gesture arbitration; cannot use `@gorhom/bottom-sheet` (it pins to Reanimated 3 API). Custom sheet implementation required.
- **Single fare estimate** — `FareEstimateResponse` returns one `fareEstimate: number`; no per-type breakdown. All carousel cards show the same XOF amount at launch.
- **ENG-3 (fare pre-fetch)** — move `estimateFare()` from sheet-mount to `handleDestinationSelect` in `index.tsx` to eliminate the loading spinner the rider sees when the sheet opens.
- **Payment row** — placeholder only (coming soon toast or no-op). No payment logic.
- **`/(main)/booking.tsx` deleted** — the route is retired entirely; no navigation references to it should remain.

---

## Suggested Domain Decomposition

**Domain A: `booking-sheet-ux` (CREATE NEW)**
Everything visual and interactive about the bottom sheet itself: snap points, drag handle, scroll isolation, destination row, vehicle-type carousel, payment row placeholder, BOOK NOW button, in-sheet searching state (SearchingView). This domain owns the `BookingBottomSheet` component and `ScooterTypeCard` component. Renders inside `(main)/index.tsx` as a map-layer overlay — no route navigation.

**Domain B: `ride-booking` (EXTEND EXISTING)**
Add to the existing `cavekit-ride-booking.md`:
- `vehicleType: string` on `CreateRideV2Request` (R2 extension)
- Fare pre-fetch on destination commit (new R6)
- Retirement of the `/(main)/booking.tsx` route (architecture constraint)

These extend requirements already specced in R1–R5; they do not form a new domain.

---

## Success Criteria Candidates

From PRD + metrics — these become cavekit acceptance criteria:

1. Sheet opens automatically when destination is confirmed in LocationModal (no manual trigger)
2. Horizontal carousel scroll does not trigger sheet dismiss on any snap point on both iOS and Android
3. `vehicleType` is present and non-null on every `CreateRideV2Request` sent to the backend
4. Tapping BOOK NOW transitions sheet content to RetryTimeline + cancel affordance **without a route push** — map remains visible
5. Cancel in searching state calls `cancelRide`, transitions `rideState → 'cancelled'`, sheet dismisses cleanly
6. `/(main)/booking.tsx` is deleted with no remaining navigation references in the codebase
7. Fare estimate is fetched at destination-commit time, not at sheet-open time; sheet opens with price already populated
8. Zero TypeScript strict-mode errors on `CreateRideV2Request` or `BookingBottomSheet` after the change
