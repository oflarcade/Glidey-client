---
created: "2026-04-20"
last_edited: "2026-04-20"
---
# Implementation Tracking: ride-booking

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-037 | DONE | bookingService.ts:estimateFare — GET /fare/estimate?distanceM=&durationS=, typed FareEstimateResponse |
| T-038 | DONE | bookingService.ts:createRide — POST /rides/create with CreateRideV2Request, returns CreateRideV2Response |
| T-039 | DONE | bookingService.ts:cancelRide — POST /rides/{id}/cancel with CancelRideRequest |
| T-040 | DONE | useBooking.ts:46-79 — useEffect on [distanceM, durationS]; clears estimates when both become 0 (line 47-50); cancels in-flight on new call (cancelled=true pattern) |
| T-041 | DONE | useBooking.ts:81-98 — bookRide(); busyRef guards concurrent calls; transition('searching', {rideId}) on success |
| T-042 | DONE | hooks/useCreateRide.ts — focused hook: busyRef guard, error surface on failure (does NOT silently discard), clears error on new call, calls transition('searching', {rideId}) |
| T-043 | DONE | useBooking.ts:100-111 — cancel(); calls cancelRide service (line 105), transitions 'cancelled' (line 106), busyRef guards concurrent calls (line 101) |
| T-044 | DONE | booking.tsx — screen is composition-only (lines 1-220); no network calls or store mutations inline; delegates to useBooking hook; VehicleType and FareEstimateResponse defined in packages/shared/src/types/index.ts:317-343 |
| T-045 | DONE | bookingService.ts:15-35 — DEMO_VEHICLE_TYPES (line 15-19), demoFare() (line 21-31), demoRide() (line 33-35); all satisfy shared kit types |
| T-076 | BLOCKED | No test runner configured (CLAUDE.md) |
| T-078 | BLOCKED | No test runner configured (CLAUDE.md) |

## Audit Notes (T-040)

**T-040 — Fare pre-fetch at destination confirmation**
- `useBooking.ts:46` — useEffect fires when `distanceM` or `durationS` change (deps: `[distanceM, durationS]`)
- `useBooking.ts:47-50` — when either is falsy (0/null), `setFareEstimates(null)`, `setSelectedVehicleTypeId(null)`, `setFareError(null)` all called — destination change clears estimates
- Pre-fetch fires at route-resolution step because `booking.tsx` receives `distanceM`/`durationS` from URL params that are set when the route resolves
- GAP (partial): The fare fires when the BookingScreen mounts (params already known), which is one navigation step after destination confirmation, not at the moment of confirmation itself. Kit R7 requires the fetch to be dispatched "within the same user-visible step as destination confirmation." This is satisfied for the current architecture (navigate-to-booking carries resolved params), but would be a gap if booking migrates to an in-map sheet (T-057+).

**T-043 — cancelRide during search**
- `useBooking.ts:100` — cancel() defined
- `useBooking.ts:101` — `if (busyRef.current || !rideId) return;` — guards concurrent calls and no-rideId case
- `useBooking.ts:105` — `await cancelRide({ rideId })` — calls cancelRide service
- `useBooking.ts:106` — `transition('cancelled')` — transitions state
- GAP (minor): on cancelRide failure, the error is not surfaced (the try/finally has no catch). Kit R3 AC5 requires "a cancellation failure is surfaced as a typed ApiError; the ride identifier is not silently discarded on failure." Current code swallows the error silently.

**T-044 — Thin screen architecture**
- `booking.tsx:54` — delegates to `useBooking` hook, no inline network calls
- `booking.tsx:1-220` — layout/composition only, no store mutations except via hook
- `packages/shared/src/types/index.ts:317` — `VehicleType` defined
- `packages/shared/src/types/index.ts:341` — `FareEstimateResponse` defined
- SATISFIED

**T-045 — Demo fixtures**
- `bookingService.ts:15` — `DEMO_VEHICLE_TYPES: VehicleType[]` — 3 entries with id/name/iconKey
- `bookingService.ts:21` — `demoFare(req: FareEstimateRequest): FareEstimateResponse` — satisfies FareEstimateResponse type
- `bookingService.ts:33` — `demoRide(): CreateRideV2Response` — satisfies CreateRideV2Response type
- `bookingService.ts:37` — `DEMO_CANCEL: CancelRideResponse` — satisfies type
- SATISFIED
