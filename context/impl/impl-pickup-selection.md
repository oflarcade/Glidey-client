---
created: "2026-04-20"
last_edited: "2026-04-20"
---
# Implementation Tracking: pickup-selection

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-052 | DONE | pickup.tsx:19-21 — gate: useEffect reroutes back if rideState !== 'matched'; PickupPinSheet from @rentascooter/ui renders full-screen map with draggable pin |
| T-053 | DONE | usePickup.ts:40-51 — seeds pickupPoint from GPS on first mount; onDragEnd triggers reverseGeocode on drag-end, not on intermediate frames |
| T-054 | DONE | usePickup.ts:33-36 — tooltip shown on first mount; AsyncStorage persistence of dismissal at TOOLTIP_KEY='@glidey/pickup-tooltip-seen' |
| T-055 | DONE | pickup.tsx:29-48 — handleConfirm: calls confirmPickup(rideId, point), then transition('pickup_en_route') + router.replace('/(main)/tracking'); error surfaces via confirmError state; isConfirming guards concurrent calls |
| T-056 | DONE | usePickup.ts — all coords use GeoPoint (latitude/longitude); pickupService.ts:8 reverseGeocode(point: GeoPoint); confirmPickup(rideId: string, pickup: GeoPoint) — no lat/lng shape |

## Audit Notes

**T-052 — Pickup pin map (kit R1)**
- `pickup.tsx:19-21` — gate: only reachable from 'matched' state
- `pickup.tsx:53-68` — PickupPinSheet from @rentascooter/ui renders full-screen (styles.root: flex:1, styles.sheet: flex:1)
- `usePickup.ts:40-43` — pin seeded from bestLocation (GPS) on first mount
- SATISFIED

**T-053 — Reverse geocoding on drag-end (kit R2)**
- `usePickup.ts:53-65` — onDragEnd: sets pickupAddress(null), isGeocoding(true), then awaits reverseGeocode, sets address or null on error
- Fires on drag-end only (not on frames) — SATISFIED
- `usePickup.ts:40-51` — initial geocoding on mount for GPS position — SATISFIED (kit R2 AC5)
- isGeocoding state passed to PickupPinSheet as isGeocoding prop (pickup.tsx:60) — loading state indicator SATISFIED
- Failed geocode: setPickupAddress(null) — fallback label rendered by PickupPinSheet (component responsibility)

**T-054 — First-use tooltip (kit R3)**
- `usePickup.ts:21` — TOOLTIP_KEY = '@glidey/pickup-tooltip-seen'
- `usePickup.ts:33-36` — AsyncStorage.getItem: shows tooltip if not 'true'
- `usePickup.ts:67-70` — dismissTooltip: setShowTooltip(false) + AsyncStorage.setItem('true')
- showTooltip/onTooltipDismiss passed to PickupPinSheet (pickup.tsx:61-62)
- SATISFIED

**T-055 — Confirm and transmit pickup (kit R4)**
- `pickup.tsx:29` — handleConfirm only called on explicit Confirm tap (PickupPinSheet onConfirm prop)
- `pickup.tsx:34` — `if (!rideId || isConfirming) return` — guards concurrent calls
- `pickup.tsx:35-36` — setIsConfirming(true), setConfirmError(null)
- `pickup.tsx:38` — `await confirmPickup(rideId, point)` — pickup NOT transmitted before this call
- `pickup.tsx:39` — `transition('pickup_en_route')` — advances FSM
- `pickup.tsx:40` — `router.replace('/(main)/tracking')` — navigates to tracking
- `pickup.tsx:43-44` — catch: sets confirmError, stays on pickup surface — SATISFIED (kit R4 AC4)
- `pickupService.ts:21-35` — confirmPickup: POST /rides/{rideId}/confirm-pickup, auth via authedFetch
- SATISFIED

**T-056 — GeoPoint coordinate type (kit R5)**
- `usePickup.ts:5` — imports GeoPoint from @rentascooter/shared
- `pickupService.ts:3` — imports GeoPoint, ConfirmPickupRequest, ConfirmPickupResponse from @rentascooter/shared
- `packages/shared/src/types/index.ts:48-51` — GeoPoint: { latitude: number; longitude: number }
- No parallel lat/lng shape anywhere in pickup flow
- SATISFIED
