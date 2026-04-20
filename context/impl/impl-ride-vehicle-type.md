---
created: "2026-04-20"
last_edited: "2026-04-20"
---
# Implementation Tracking: ride-vehicle-type

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-014 | DONE | packages/shared/src/types/index.ts:347-353 — CreateRideV2Request: pickup(GeoPoint), destination(Location), distanceM, durationS, vehicleTypeId?(optional) |
| T-015 | DONE | bookingService.ts:createRide — POST /rides/create with CreateRideV2Request body; demo path: demoRide() returns {id, state:'searching'} |
| T-017 | DONE | useBooking.ts:86-91 — bookRide spreads vehicleTypeId into createRide call when selectedVehicleTypeId is non-null; optional param correctly typed in CreateRideV2Request |
| T-018 | DONE | hooks/useCreateRide.ts:46-51 — vehicleTypeId spread into createRide call; busyRef guard; error surfaced on failure; transition('searching', {rideId}) on success |
| T-019 | DONE | packages/shared/src/types/index.ts:355-358 — CreateRideV2Response: {id: string, state: RideState}; matched by bookingService.ts demoRide() and real path |
| T-075 | DONE | bookingService.ts:33-35 — demoRide(): CreateRideV2Response — {id: demo-ride-${Date.now()}, state:'searching'}; satisfies CreateRideV2Response type |
| T-077 | DONE | hooks/useCreateRide.ts — focused hook extracted from useBooking.ts; params: pickup/destination/distanceM/durationS/vehicleTypeId; returns createRide/isCreating/error/rideId; exported from hooks/index.ts:54-55 |
