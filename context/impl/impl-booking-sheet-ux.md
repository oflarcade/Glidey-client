---
created: "2026-04-20"
last_edited: "2026-04-20"
---
# Implementation Tracking: booking-sheet-ux

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-057 | DONE | BookingSheet component renders in-map; `visible={selectedDestination !== null}` in index.tsx:439; no route navigation |
| T-058 | DONE | 3 snap points (MINI=155, PEEK=330, FULL=580); Reanimated `useSharedValue` + RNGH `GestureDetector` wrapping full sheet; spring `{ damping:14, stiffness:280, mass:0.8 }` |
| T-059 | DONE | Destination row shows name + address in BookingSheet peek/full states |
| T-060 | DONE | Vehicle-type carousel backed by `fareEstimates: FareEstimateItem[]` prop; selectable cards with XOF prices; isFareLoading spinner |
| T-061 | DONE | Payment row placeholder rendered below carousel in peek/full states |
| T-062 | DONE | Book Now button calls `onBookRide(selectedVehicleTypeId)`; disabled when no vehicle selected, isFareLoading, or isBusy |
| T-063 | DONE | In-sheet searching state: `useMatching(isSearching ? rideId : null)` embedded; RetryTimeline + DriverReveal replace form content inside the sheet |
| T-064 | DONE | `app/(main)/booking.tsx` replaced with `<Redirect href="/(main)/" />`; no route refs to /booking remain |
| T-065 | DONE | `BookingSheetProps` interface exported; all props typed; no `any`; GeoPoint/Location/RideState from @rentascooter/shared |

## Audit Notes

**T-057 — Automatic sheet presentation**
- `app/(main)/index.tsx:125` — `showBookingSheet = selectedDestination !== null`
- `app/(main)/index.tsx:438` — `<BookingSheet visible={showBookingSheet} ...>`
- No router.push — sheet is a positioned View rendered over the map
- DONE

**T-058 — Snap-point behavior + gesture arbitration**
- `components/BookingSheet/BookingSheet.tsx` — `snapLevel` shared value (0=mini,1=peek,2=full)
- `MINI_HEIGHT=155`, `PEEK_HEIGHT=330`, `FULL_HEIGHT=580`
- `GestureDetector` wraps entire `Animated.View`; `pointerEvents='auto'`
- `runOnJS(setSnapFn)()` syncs worklet snap state to JS side for content rendering
- DONE

**T-060 — Vehicle-type carousel**
- Props: `fareEstimates: FareEstimateItem[]`, `selectedVehicleTypeId`, `onSelectVehicleType`
- Carousel cards show vehicleTypeName + iconKey icon + formatted XOF fare
- Wired to `useBooking` hook which pre-fetches from `/fare/estimate`
- DONE

**T-063 — In-sheet searching state**
- `useMatching(isSearching ? rideId : null)` embedded in BookingSheet
- When `rideState === 'searching'`: RetryTimeline replaces fare form; cancel shown
- When `rideState === 'matched'`: DriverReveal slides up inside sheet
- DONE

**T-064 — Retire /booking route**
- `app/(main)/booking.tsx`: single `<Redirect href="/(main)/" />`
- No remaining navigation calls to `/(main)/booking` in codebase
- DONE
