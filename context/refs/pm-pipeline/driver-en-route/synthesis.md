# Synthesis: Driver En Route UI

## Scope (1 domain)
All concerns live inside the `pickup_en_route` state — new kit: **driver-en-route-ux**

1. **Route polyline on map** — draw `MapboxGL.ShapeLayer` from user's pickup position to destination, using route geometry from `routeDirectionsService` (fetched at booking time — no new network call). The driver is already with the user when `pickup_en_route` fires.
2. **Sheet auto-snaps to mini** on `pickup_en_route` entry — the sheet immediately collapses to mini snap level. Never dismissible (reuse `isBookingModeShared` / `'matching'` sheetMode).
3. **Mini strip content** — driver avatar (initials) + driver name + ETA countdown to destination + horizontal progress bar with map-pin icon as the visual end-anchor. Progress is linear, capped at 95% until ETA=0.
4. **Peek/full sheet content** — full driver card (name, vehicle, plate, rating) + large ETA block + cancel button (same fee-warning two-step as matched state).
5. **ETA countdown** — seeded from an `enRouteEtaSeconds` value at `pickup_en_route` entry. Same interval pattern as matched state.
6. **Camera** — fit bounds to cover user pickup position + destination on state entry.
7. **Demo trigger** — `pickup_en_route` auto-fires a few seconds after `hasArrived` latches (simulates user boarding). Production: driven by WebSocket event (out of scope for this kit — marked as GAP).

## Key Risks to Address in Spec

- **Driver position source**: `MatchedDriver.location` already exists as a `GeoPoint` — use it as the polyline start. Must be explicit in acceptance criteria so the kit doesn't leave it open.
- **Progress bar over-counting on delay**: Cap linear progress at 95% until ETA=0. Never show 100% until `hasArrived` latches. This is a UX contract, not a backend problem.
- **Sheet mode collision**: Reuse `sheetMode: 'matching'` for `pickup_en_route` — avoids store change, gesture lock is already correct. New `'en_route'` mode is explicit out-of-scope.
- **No real-time driver position streaming**: Polyline is static (drawn at state entry from stored location). Must be stated clearly so it isn't confused with live tracking.

## Constraints
- No backend changes, no new store actions, no new sheetMode values
- Polyline source is already-fetched `routeDirectionsService` geometry — no new API call
- `MatchedDriver.location` is the polyline origin (already in the type)
- All strings French
- Demo mode: `pickup_en_route` fires after a simulated delay post-match; demo driver location hardcoded

## Suggested Domain Decomposition
Single domain: **driver-en-route-ux** — new kit; does not extend existing kits (driver-reveal-ui explicitly excludes post-reveal tracking; matched-arrival-ux covers only the matched sub-states)

## Decision Log (resolved open questions)
1. **Polyline**: pickup position → destination. Driver is already with the user at `pickup_en_route` entry. No driver location needed.
2. **Progress bar**: Linear decay seeded by `enRouteEtaSeconds`, capped at 95% until ETA=0.
3. **Sheet auto-mini**: On `pickup_en_route` entry the sheet immediately snaps to mini (programmatic snap, not user gesture).
4. **Sheet mode**: Reuse `'matching'` — no new enum value introduced.
5. **Demo trigger**: Auto-fire `pickup_en_route` ~3s after `hasArrived` latches. WS trigger is a production GAP.

## Success Criteria Candidates
- Entering `pickup_en_route` draws a polyline from driver location to pickup on the map
- Camera fits both driver origin and pickup in frame
- Sheet locks to mini snap on state entry; mini strip shows driver name + ETA + progress bar with pin anchor
- Peek/full shows full driver card + ETA + cancel button (fee-warning two-step)
- ETA counts down from `matchedDriver.etaSeconds`; progress bar tracks linearly, capped at 95%
- Leaving `pickup_en_route` removes the polyline and resets the sheet
- Demo mode enters `pickup_en_route` automatically a few seconds after the arrived state (or via a manual trigger)
