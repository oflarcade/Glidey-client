---
created: "2026-04-19"
last_edited: "2026-04-21"
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
| T-089 | DONE | useRideStore — Zustand FSM, VALID_TRANSITIONS guard, console.warn on invalid, reset() always allowed |
| T-090 | DONE | bookingService — estimateFare (GET), createRide (POST), cancelRide (POST) via authedFetch + ApiError |
| T-091 | DONE | booking demo mode — DEMO_FARE (1250 XOF), demoRide() with timestamp id, DEMO_CANCEL; co-located in bookingService.ts |
| T-092 | DONE | RideMatchingPayload + TrackingPositionUpdate in shared/types; all coords use GeoPoint; no parallel lat/lng |
| T-093 | DONE | useBooking hook — fare-estimate auto-fetch, bookRide/cancel actions, isBusy guard, FSM transition; thin booking.tsx scaffold |
| T-094 | DONE | matchingService — WS on /rides/{id}/events, 5s poll fallback on error/close, teardown on terminal states |
| T-095 | DONE | pickupService — Mapbox reverse geocoding, POST /rides/{id}/confirm-pickup |
| T-096 | DONE | trackingService — WS on /rides/{id}/tracking, 5s poll fallback, activateKeepAwake/deactivateKeepAwake |
| T-097 | DONE | matchingService demo mode — co-located; 3×3s delays → matched with DEMO_DRIVER fixture |
| T-098 | DONE | pickupService demo path — co-located; isApiError(DEMO_MODE_ERROR) → { state: 'pickup_en_route' } |
| T-099 | DONE | trackingService demo path — co-located; 5s interval, ETA decrement from 300s, randomized Dakar coords |
| T-100 | DONE | BookingScreen: XOF fare display, Book Now disabled until estimate resolves, error banner, destination-change clear via useBooking |
| T-101 | DONE | Cancel button visible only in searching state (co-located in BookingScreen) |
| T-102 | DONE | MatchingModal: 3-attempt × 30s timer, RetryTimeline wiring, attempt label, cancel affordance |
| T-103 | DONE | No-driver fallback: passive ActivityIndicator + copy, cancel retained (co-located in MatchingModal) |
| T-104 | DONE | DriverReveal: Animated spring slide-up sheet, DriverCard, guarded by rideState === 'matched' |
| T-105 | DONE | useMatching: subscribeToMatching wrapper, 30s attempt timer, activeAttemptIndex/completedAttempts/inFallback |
| T-106 | DONE | usePickup: GPS geocode on mount, drag-end geocode, AsyncStorage tooltip persistence |
| T-107 | DONE | useRideTracking: subscribeToTracking wrapper, driverPosition/currentEta/stale/progress + T-112 ETA-reset |
| T-108 | DONE | PickupScreen: PickupPinSheet + usePickup, geocoded label, tooltip, Confirm → confirmPickup → pickup_en_route |
| T-109 | DONE | TrackingScreen: FullScreenMap + driver MarkerView + ArrivalBanner + stale banner |
| T-110 | DONE | PickupScreen useEffect guard: router.back() when rideState !== 'matched' |
| T-111 | DONE | ArrivalBanner re-renders on each useRideTracking update via useState binding |
| T-112 | DONE | >20% ETA-increase resets originalEtaRef in useRideTracking |
| T-113 | DONE | trackingService.deactivateKeepAwake in cleanup → released on TrackingScreen unmount |
| T-114 | DONE | WS primary; stopPolling on onopen; startPolling on onerror/onclose — both services |
| T-115 | DONE | useRideTracking stale flag; driver dot opacity 0.35 + banner in TrackingScreen |
| T-116 | DONE | busyRef + isBusy in useBooking.bookRide early-return guard |
| T-117 | DONE | BookingScreen cancel only rendered when isSearching; hidden post-match |
| T-118 | DONE | PickupScreen catch → setConfirmError → PickupPinSheet.confirmError → stays on screen |
| T-119 | DONE | polling setInterval catch swallows single failure; next tick fires normally |
| T-ENG-3 | DONE | createRide: POST /rides/create → POST /rides with flat payload (pickupLat/Lng, destLat/Lng, destAddress, distanceM, durationS, vehicleTypeId) |
| T-ENG-CANCEL | DONE | cancelRide: POST /rides/{id}/cancel → PATCH /rides/{id}/cancel (no body; backend returns no JSON on cancel) |
| T-ENG-WS | DONE | matchingService: WS URL → /realtime?token= (resolveToken async); polling → GET /rides/:id; ride:accepted → placeholderDriver (backend gap: no driver details in event) |
| T-079 | DONE | Cancel confirmation dialog in BookingSheet searching state: confirm prompt, in-flight loading, error recovery with retry; onCancel prop changed to () => Promise<void> |
| T-ENG-PROFILE | DONE | ensureClientProfile (services/userService.ts) — POST /client on first auth, swallows 409; skipped in demo mode (EXPO_PUBLIC_USE_DEMO=true); falls back to EXPO_PUBLIC_TEST_PHONE for NL/DE real-device testing when account has no stored phone |
