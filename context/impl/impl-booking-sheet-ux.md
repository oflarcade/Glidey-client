---
created: "2026-04-20"
last_edited: "2026-04-20"
---
# Implementation Tracking: booking-sheet-ux

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-057 | GAP | Kit R1: booking sheet should auto-present on destination confirmation over the map. Current impl: router.push('/(main)/booking') — a standalone route, not an in-map sheet. |
| T-058 | GAP | Kit R2: snap-point behavior and gesture arbitration not implemented — standalone route has no sheet snap points |
| T-059 | DONE | Kit R3: booking.tsx:89-96 — destination row renders name/address from params |
| T-060 | GAP | Kit R4: ScooterCarousel component exists (components/ScooterCarousel/) but uses hardcoded DEFAULT_OPTIONS and dollar prices, not backend FareEstimateResponse data. booking.tsx does not use ScooterCarousel — uses inline fare row instead. |
| T-061 | GAP | Kit R5: payment row placeholder not in booking.tsx |
| T-062 | DONE | Kit R6: booking.tsx:133-144 — Book Now button disabled while isFareLoading or !canBook; isBusy disables during in-flight; delegates to bookRide() |
| T-063 | GAP | Kit R7: in-sheet searching state — MatchingModal is a separate Modal overlay (not in-sheet replacement); route stack changes do occur (standalone booking screen navigated to) |
| T-064 | GAP | Kit R8: standalone booking route app/(main)/booking.tsx still exists; kit requires it retired |
| T-065 | GAP | Kit R9: type-safety — booking.tsx has no `any` types; however full in-map sheet not yet implemented |

## Audit Notes

**T-057 — Automatic sheet presentation (kit R1)**
- Current: `app/(main)/booking.tsx` is a standalone route pushed via router.push
- Kit requires in-map bottom sheet that opens over the map without route navigation
- GAP: navigation-based presentation, not in-map sheet

**T-058 — Snap-point behavior (kit R2)**
- Not implemented — no bottom sheet library (react-native-bottom-sheet or equivalent) in use
- GAP

**T-059 — Destination row (kit R3)**
- `booking.tsx:89-96` — destination name/address rendered
- `booking.tsx:91-93` — shows name or address
- PARTIAL: kit requires name AND address displayed; booking.tsx shows `destination.name || destination.address || '—'` (single string, not both)

**T-060 — Vehicle-type carousel (kit R4)**
- `ScooterCarousel/ScooterCarousel.tsx` exists but uses `DEFAULT_OPTIONS` with hardcoded dollar prices
- `booking.tsx` does NOT use ScooterCarousel — renders a single fare row for selectedEstimate only
- Kit requires: carousel backed by backend catalog + per-type fare estimates, selectable cards
- GAP: no carousel integration with FareEstimateResponse in booking screen

**T-061 — Payment row placeholder (kit R5)**
- Not present in `booking.tsx`
- GAP

**T-062 — Book Now action (kit R6)**
- `booking.tsx:62` — `canBook = !isFareLoading && !fareError && selectedEstimate !== null && !isBusy`
- `booking.tsx:133` — button disabled when !canBook
- `booking.tsx:139-142` — shows ActivityIndicator while isBusy; renders "Réserver maintenant" when idle
- `booking.tsx:136` — onPress={bookRide} — delegates to hook
- SATISFIED for kit R6 requirements (disabled states, concurrent guard via busyRef in useBooking)

**T-063 — In-sheet searching state (kit R7)**
- `booking.tsx:147-153` — MatchingModal rendered as separate Modal overlay, not in-sheet
- `booking.tsx:125-130` — cancel button shown while isSearching (separate from sheet)
- Kit requires: in-sheet content replacement, no route navigation — GAP

**T-064 — Retired booking route (kit R8)**
- `app/(main)/booking.tsx` still exists as standalone route
- GAP — kit requires zero references to standalone booking route

**T-065 — Type-safety (kit R9)**
- `booking.tsx` has no `any` types; imports GeoPoint, Location from @rentascooter/shared
- `useBooking.ts` — fully typed
- PARTIAL: full in-map sheet not yet implemented, so full type-safety audit deferred
