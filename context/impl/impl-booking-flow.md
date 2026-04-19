---
created: "2026-04-19"
last_edited: "2026-04-19"
---
# Implementation Tracking: booking-flow

Build site: context/plans/build-site-booking-flow.md

| Task | Status | Notes |
|------|--------|-------|
| T-084 | DONE | RideState, FareEstimateRequest/Response, CreateRideV2*, MatchedDriver, CancelRide*, ConfirmPickup* — appended to packages/shared/src/types/index.ts |
| T-085 | DONE | RetryTimeline — 3 simultaneous stages, Reanimated pulse on active node, segments filled on completion |
| T-086 | DONE | DriverCard — name/vehicleType/plate/rating/rides, Avatar with deterministic bg-color fallback, StarRating |
| T-087 | DONE | PickupPinSheet — draggable pin (PanResponder), address label slot with loading/fallback states, onboarding tooltip, Confirm button; GeoPoint shape used throughout; no lat/lng alias |
| T-088 | DONE | ArrivalBanner + ProgressBar — driverName/ETA display, progress [0,1] clamped, "Arriving now" when etaMinutes≤0, "Your driver" fallback |
| T-089 | TODO | Implement useRideStore Zustand FSM with transition guard + invalid-transition logging |
| T-090 | TODO | Implement bookingService — estimateFare, createRide, cancelRide + ApiError plumbing |
| T-091 | TODO | Implement booking-service demo mode |
| T-092 | TODO | Define RideMatching + TrackingPosition payload types and GeoPoint reuse guard in @rentascooter/shared |
| T-093 | TODO | Implement useBooking hook + thin BookingScreen scaffold |
| T-094 | TODO | Implement matchingService — realtime subscription lifecycle, 5s polling fallback |
| T-095 | TODO | Implement pickupService — reverse geocoding + confirmPickup transmit |
| T-096 | TODO | Implement trackingService — realtime position subscription, polling fallback, expo-keep-awake |
| T-097 | TODO | Implement matchingService demo mode |
| T-098 | TODO | Implement pickupService demo path |
| T-099 | TODO | Implement trackingService demo path |
| T-100 | TODO | Wire booking UI — fare display, Book Now enable/disable, error state |
| T-101 | TODO | Wire cancel-during-search affordance |
| T-102 | TODO | Build MatchingModal — 3-attempt timeout loop, RetryTimeline wiring |
| T-103 | TODO | Build no-driver fallback UI layer |
| T-104 | TODO | Wire DriverCard reveal on matched transition |
| T-105 | TODO | Implement useMatching hook |
| T-106 | TODO | Implement usePickup hook — initial-GPS geocode, drag-end geocode state, tooltip persistence |
| T-107 | TODO | Implement useRideTracking hook |
| T-108 | TODO | Compose PickupScreen — PickupPinSheet, geocoded label, first-use tooltip, Confirm button |
| T-109 | TODO | Compose TrackingScreen |
| T-110 | TODO | Gate pickup map visibility to matched state only |
| T-111 | TODO | Integrate arrival-banner ETA-update path |
| T-112 | TODO | Integrate progress-bar reset logic |
| T-113 | TODO | Integrate keep-awake terminal release |
| T-114 | TODO | Integrate realtime-connected vs disconnected transport routing |
| T-115 | TODO | Integrate driver-marker staleness detector |
| T-116 | TODO | Integrate ride-creation concurrent-tap guard |
| T-117 | TODO | Integrate cancellation post-match suppression |
| T-118 | TODO | Integrate ApiError surface for pickup confirm failure |
| T-119 | TODO | Integrate polling-failure continuation |
