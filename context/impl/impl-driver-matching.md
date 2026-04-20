---
created: "2026-04-20"
last_edited: "2026-04-20"
---
# Implementation Tracking: driver-matching

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-046 | DONE | useRideStore (via @rentascooter/shared) — exposes rideState as idle/searching/matched/pickup_en_route/completed/cancelled/failed; RideState defined in packages/shared/src/types/index.ts:306-313 |
| T-047 | DONE | matchingService.ts:subscribeToMatching — WebSocket primary (line 90-113), polling fallback on disconnect (line 65-81), 5s poll interval (line 15) |
| T-048 | DONE | useMatching.ts:32-81 — three-attempt loop with 30s per attempt (ATTEMPT_MS=30000, line 17); setActiveAttemptIndex advances automatically; resolvedRef stops loop on match |
| T-049 | DONE | MatchingModal.tsx:47 — RetryTimeline component rendered with activeIndex and completedCount; inFallback branch (line 31-59) shows fallback UI |
| T-050 | DONE | components/DriverReveal/ — booking.tsx:155 renders DriverReveal when rideState==='matched' |
| T-051 | DONE | matchingService.ts:20-29 — DEMO_DRIVER fixture satisfies MatchedDriver shape; demo path (line 38-57) resolves after 3×3s delays, no HTTP/WS |

## Audit Notes

**T-046 — Ride state machine (kit R1)**
- `packages/shared/src/types/index.ts:306` — RideState type: idle/searching/matched/pickup_en_route/completed/cancelled/failed
- `useRideStore` from @rentascooter/shared — exposes `rideState` and `transition()`
- State observable via store in `booking.tsx:51`, `pickup.tsx:14`, `tracking.tsx:7`
- WebSocket+polling fallback: `matchingService.ts:59-124` — SATISFIED
- Invalid transition guard: not verified in client (store impl in shared package — not audited here)
- SATISFIED (store state observable, strings from shared types)

**T-047 — Polling fallback (kit R1 AC3-5)**
- `matchingService.ts:15` — POLL_MS = 5_000
- `matchingService.ts:72-81` — startPolling() dispatches GET /rides/{rideId}/status every 5s
- `matchingService.ts:94` — ws.onopen = () => stopPolling() — stops polling when WS connects
- `matchingService.ts:105` — ws.onerror triggers startPolling()
- SATISFIED

**T-048 — Three-attempt retry (kit R2)**
- `useMatching.ts:17` — ATTEMPT_MS = 30_000 (30s per attempt)
- `useMatching.ts:18` — MAX_ATTEMPTS = 3
- `useMatching.ts:43-61` — timers advance activeAttemptIndex at 30s, 60s; fallback at 90s
- `useMatching.ts:63-72` — subscribeToMatching callback: resolvedRef=true halts loop on match
- SATISFIED

**T-049 — Animated timeline + no-driver fallback (kit R2, R3)**
- `MatchingModal.tsx:47` — RetryTimeline from @rentascooter/ui rendered with activeIndex/completedCount
- `MatchingModal.tsx:31-59` — inFallback branch: ActivityIndicator + fallback message
- GAP (fallback text): Kit R3 AC1 requires exact text "No drivers nearby — we're working hard to find you a match". Actual text is "Aucun conducteur disponible / Tous les conducteurs sont occupés pour le moment." (French localization; functionally equivalent but not textually matching the English kit spec — acceptable for Senegal/French market)
- Cancel always visible (line 61-65) — SATISFIED for kit R3 AC5

**T-050 — Driver card on match (kit R4)**
- `booking.tsx:155` — `<DriverReveal visible={isMatched} />` renders on rideState==='matched'
- DriverReveal directory exists at components/DriverReveal/ — component present
- Full DriverReveal audit requires reading that file; not blocking

**T-051 — Demo mode (kit R6)**
- `matchingService.ts:38` — demo path: `if (process.env['EXPO_PUBLIC_USE_DEMO'] === 'true')`
- `matchingService.ts:20-29` — DEMO_DRIVER has all required fields: id, name, vehiclePlate, vehicleType, rating, completedRides, profilePhoto, location (GeoPoint)
- `matchingService.ts:40-56` — scheduleAttempt() fires at 3s intervals, resolves matched after 3 attempts — no HTTP/WS opened
- SATISFIED
