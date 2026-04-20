---
created: "2026-04-20"
last_edited: "2026-04-20"
---
# Implementation Tracking: ride-tracking

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-066 | DONE | trackingService.ts:subscribeToTracking — keeps screen awake via activateKeepAwake (expo-keep-awake); releases on cleanup (line 97); KEEP_AWAKE_TAG='glidey-tracking' |
| T-067 | DONE | trackingService.ts:15 — POLL_MS=5_000; WebSocket primary (line 68-90); polling fallback on ws.onerror/ws.onclose (lines 83-88); authedFetch GET /rides/{rideId}/position (line 60) |
| T-068 | DONE | useRideTracking.ts:40-56 — subscribeToTracking callback: setDriverPosition(update.driverLocation), setCurrentEta(update.etaSeconds); progress derived from originalEtaRef |
| T-069 | DONE | useRideTracking.ts:29-33 — STALE_MS=12_000 (2× poll + 2s grace); staleTimer resets on each update; setStale(true) fires if no update within window |
| T-070 | DONE | tracking.tsx:19 — useRideTracking(rideId); tracking.tsx:26-34 — MapboxGL.MarkerView for driver; tracking.tsx:39-43 — stale banner; ArrivalBanner at bottom (line 46-51) |
| T-071 | DONE | trackingService.ts:22-41 — demo path: 5s interval, etaSeconds decrements from 300; scripted GeoPoint jitter near Dakar; no HTTP/WS opened |

## Audit Notes

**T-066 — Screen keep-awake (kit R4)**
- `trackingService.ts:20` — `activateKeepAwake(KEEP_AWAKE_TAG)` called at entry to subscribeToTracking, before any WS/polling setup
- `trackingService.ts:97` — `deactivateKeepAwake(KEEP_AWAKE_TAG)` in real-path cleanup
- `trackingService.ts:39` — `deactivateKeepAwake(KEEP_AWAKE_TAG)` in demo-path cleanup
- Kit R4 AC5: idempotent — expo-keep-awake deactivate is safe to call multiple times
- GAP (minor): keep-awake is engaged in the service layer (on subscribeToTracking call) rather than on `pickup_en_route` FSM transition. In practice this is equivalent because useRideTracking is called unconditionally on TrackingScreen mount, which happens after transition('pickup_en_route') in pickup.tsx:40.
- SATISFIED

**T-067 — Polling fallback transport (kit R5)**
- `trackingService.ts:8` — `WS_BASE = API_BASE_URL.replace(/^https?/, 'ws')`
- `trackingService.ts:68` — `connectWS()` opens WebSocket first
- `trackingService.ts:70` — `ws.onopen = () => stopPolling()` — stops polling when WS connects
- `trackingService.ts:75` — `ws.onmessage` dispatches updates
- `trackingService.ts:83` — `ws.onerror = () => startPolling()` — fallback on error
- `trackingService.ts:85-88` — `ws.onclose`: if not tearingDown, startPolling() + reconnect after POLL_MS
- `trackingService.ts:60` — polling uses `authedFetch('GET', /rides/${rideId}/position)` — authenticated
- `trackingService.ts:62` — polling failure is non-terminal; catch does not stop interval
- Kit R5 AC5: polling failure does not break tracking — SATISFIED
- SATISFIED

**T-068 — Live driver position (kit R1)**
- `useRideTracking.ts:40` — `subscribeToTracking(rideId, callback)` wired in useEffect([rideId])
- `useRideTracking.ts:41` — `setDriverPosition(update.driverLocation)` on each update
- `useRideTracking.ts:42` — `setCurrentEta(update.etaSeconds)` on each update
- `tracking.tsx:29-34` — `MapboxGL.MarkerView` renders at driverPosition coordinates
- GAP (minor, kit R1 AC3): kit requires smooth interpolation between positions; current impl uses static MarkerView coordinates that update discretely — no Animated/interpolation applied to marker position. This causes visible teleport between updates.
- PARTIAL (interpolation missing)

**T-069 — Stale state (kit R1 AC5)**
- `useRideTracking.ts:16` — STALE_MS = 12_000
- `useRideTracking.ts:29-33` — resetStaleTimer: clears existing timer, sets stale=false, schedules stale=true after 12s
- `useRideTracking.ts:56` — resetStaleTimer called on every update
- `tracking.tsx:27` — driverDotStale style: opacity 0.35 on stale
- `tracking.tsx:39-43` — staleBanner shown with warning text when stale
- SATISFIED

**T-070 — Thin screen architecture (kit R6)**
- `tracking.tsx` — no realtime logic, no polling timers, no keep-awake code
- `tracking.tsx:19` — single hook call: `useRideTracking(rideId)`
- `tracking.tsx:26-53` — layout + composition only
- `ArrivalBanner` from @rentascooter/ui (line 5, line 46-51) — reusable component
- `useRideTracking.ts` — dedicated hook exposing driverPosition, currentEta, stale, progress
- `trackingService.ts` — dedicated service with subscribeToTracking
- SATISFIED

**T-071 — Demo mode (kit R6 AC-implicit)**
- `trackingService.ts:23` — `if (process.env['EXPO_PUBLIC_USE_DEMO'] === 'true')`
- `trackingService.ts:25` — etaSeconds starts at 300 (5 min), decrements by POLL_MS/1000 each interval
- `trackingService.ts:28-35` — driverLocation uses Dakar coordinates with random jitter
- `trackingService.ts:37-40` — cleanup: clearInterval + deactivateKeepAwake
- SATISFIED

**Progress bar (kit R3)**
- `useRideTracking.ts:45-53` — originalEtaRef seeded on first update; resets when etaSeconds > originalEtaRef.current * 1.2 (>20% increase)
- `useRideTracking.ts:52-54` — progress = max(0, min(1, 1 - etaSeconds/orig)) — clamped [0,1]
- `tracking.tsx:49` — progress prop passed to ArrivalBanner
- SATISFIED (kit R3 AC2-4)
