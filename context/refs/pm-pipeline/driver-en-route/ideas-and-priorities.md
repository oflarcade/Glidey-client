# Driver En-Route Feature — Ideation & Prioritization

**Feature scope:** When the ride transitions to `pickup_en_route`, draw a live route polyline
from the driver's current GPS position to the user's pickup/destination on the Mapbox map,
and surface a mini bottom sheet showing driver info + ETA countdown with a progress-bar
anchor pin.

**Tech baseline (from codebase audit):**
- Expo 54 / RN 0.81 / React 19 / TypeScript strict
- `rideState` machine: `idle → searching → matched → pickup_en_route → completed/cancelled`
- Existing `BookingSheet` with `MINI_HEIGHT=100 / PEEK_HEIGHT=460 / FULL_HEIGHT=580` snap levels,
  powered by `react-native-reanimated` pan gesture + `withSpring`
- `useRideTracking` already yields `driverPosition`, `currentEta`, `stale`, `progress`
  (subscribed via `trackingService`, stale flag at 12 s)
- `routeDirectionsService.getRoute()` returns `{ distanceM, durationS, polyline }`
- `MapboxGL.ShapeSource` + `MapboxGL.LineLayer` already used for the destination route line
  in `(main)/index.tsx`
- `cameraRef` (`MapboxGL.Camera`) available in both `index.tsx` and `tracking.tsx`
- ArrivalBanner + TrackingScreen exist but are separate-screen wrappers (not in-map)
- `matchedDriver` shape: `{ name, rating, vehicleType, vehiclePlate, etaSeconds }`
- Payment context: cash-only, XOF currency, Senegal market (French UI strings)

---

## Part 1 — Brainstorm

### A. Product Manager (market fit, value creation, competitive edge)

**PM-1 — Live polyline with camera bounds-fit**
Show the driver-to-pickup route as a color-distinguished polyline (different hue from the
destination route already shown pre-booking). Auto-fit the Mapbox camera to include both
the driver pin and the user pin in frame so the rider always sees the full picture without
manual panning. Competitive table-stakes: InDrive and Yango both show this; absence of it
signals an unfinished product to Senegalese riders already familiar with these apps.

**PM-2 — ETA recalculation disclosure**
When `useRideTracking` resets the origin ETA (>20% spike, already detected at T-112),
surface a brief non-blocking toast: "Itinéraire recalculé — ~X min". Reduces support
contacts driven by riders thinking the app is broken when the ETA jumps. Directly reduces
churn from the most anxiety-inducing moment of the ride flow.

**PM-3 — Cancel-fee gate on en-route state**
Senegal taxi culture expects some negotiability, but InDrive enforces a cancellation fee
after driver is en route. Show a clear XOF amount in the cancel confirmation dialog for the
`pickup_en_route` state specifically. Protects driver earnings and signals platform
professionalism to drivers — critical for driver-side retention in Phase 4.

**PM-4 — Driver contact action (call/WhatsApp)**
A single "Appeler" button in the mini sheet (using `Linking.openURL('tel:...')`) that dials
the driver's masked number. No backend work required if a masked number is already available
on `matchedDriver`. In Senegal, voice communication is the default fallback when GPS is
ambiguous — this directly reduces failed pickups.

**PM-5 — Post-ride rating prompt triggered by completion transition**
When `rideState` moves from `pickup_en_route` to `completed`, briefly show a 5-star rating
prompt before the sheet dismisses. Captures feedback at maximum emotional relevance. Builds
the ratings corpus needed to surface driver quality scores, which InDrive uses as its main
driver differentiation mechanism.

---

### B. Product Designer (UX, onboarding, engagement loops)

**PD-1 — Animated driver dot with heading indicator**
Replace the static `driverDot` (already in `tracking.tsx`) with a teardrop/arrow marker
that rotates to the driver's bearing (computed from consecutive GeoPoints). Gives the rider
spatial confidence about which direction the driver is coming from — especially critical in
Dakar where street layouts are irregular and address matching is imprecise.

**PD-2 — Progress bar with map-pin end-anchor in mini sheet**
In the mini snap (`MINI_HEIGHT=100`), render a horizontal track with a scooter/map-pin icon
that slides from left (0%) to right (100%) as `progress` increases (already computed by
`useRideTracking`). This visual metaphor maps directly to "driver getting closer" without
requiring the rider to read numbers — high comprehension for users with lower literacy,
important for Glidey's Senegal demographic.

**PD-3 — Dual-tone route polyline (driver-to-pickup vs pickup-to-destination)**
Display driver's remaining route in a saturated brand color (e.g., `colors.primary.main`)
and the onward pickup-to-destination route in a muted/dashed style. Two visual layers give
the rider the complete journey arc. Uses the same `MapboxGL.ShapeSource` pattern already
established in `index.tsx` — designer constraint is purely color and dash configuration.

**PD-4 — Haptic pulse at ETA milestones**
Fire `Haptics.impactAsync(Medium)` at 5-min, 2-min, and 1-min ETA marks. At arrival
(ETA=0), fire the existing `Haptics.notificationAsync(Success)` already used on match.
Creates a tactile engagement loop that keeps the rider informed without them watching the
screen — important for users who pocket their phone and wait.

**PD-5 — "Conducteur arrive dans X" animated countdown ring**
Wrap the driver initials avatar in a circular SVG progress ring that empties as ETA counts
down. Visually ties the driver's identity to the ETA in a single glanceable element. Works
inside the existing `matchedDriverRow` layout in `BookingSheet` with no structural changes —
just a wrapped `Svg` + `AnimatedCircle` around the avatar view.

---

### C. Engineer (technical innovation, integrations, platform leverage)

**ENG-1 — State-gated polyline hook (`useEnRouteRoute`)**
Create a `useEnRouteRoute(rideState, driverPosition, pickupGeoPoint)` hook that:
1. Only fires `routeDirectionsService.getRoute()` when `rideState === 'pickup_en_route'`
2. Debounces refetch to every 30 s (driver position updates at ~5 s; route API is stateless REST)
3. Returns `{ routeCoords, distanceM, durationS }` shaped for direct insertion into
   `MapboxGL.ShapeSource`
Cleanly separates en-route routing from the pre-booking `useRouteDirections` hook.
No new dependencies; reuses existing `routeDirectionsService`.

**ENG-2 — Camera bounds orchestration utility**
Extend `mapAnimations.ts` with `fitBoundsToMarkers(cameraRef, markers: GeoPoint[])` using
`MapboxGL.Camera.fitBounds()`. Called when `pickup_en_route` activates to frame both
driver + user pickup in view. Also re-used by PD-3 (dual polyline) so both route segments
are visible. Single utility = single place to tune padding/animation duration.

**ENG-3 — `rideState` guard in `BookingSheet` for `pickup_en_route` branch**
The existing `BookingSheet` handles `idle / searching / matched` but has no explicit
`pickup_en_route` branch. Adding a discriminated branch (similar to the `isMatched` guard
already in place) means the mini-sheet content for en-route is fully isolated — no risk of
regressions in the `matched` state's ETA countdown or cancel dialogs.

**ENG-4 — Polyline decode utility (Encoded Polyline Algorithm Format)**
`routeDirectionsService` returns an EPAF-encoded polyline string. The existing
`getRouteLineCoordinates` util in `utils/routeLineCoordinates.ts` presumably decodes this.
Confirm it handles the driver-origin coordinate correctly (dynamic origin vs static
pickup). If not, extend or fork the util — avoids shipping a new npm package when the
algorithm is 40 lines of pure TypeScript.

**ENG-5 — Stale-position visual degradation on en-route polyline**
When `stale === true` (already flagged by `useRideTracking` at 12 s), apply
`lineOpacity: 0.35` to the driver-route `LineLayer` (mirrors `driverDotStale` opacity
already in `tracking.tsx`). Keeps visual consistency between the dot and the route line
when connectivity drops. Pure style change; no logic branching needed.

---

## Part 2 — ICE Prioritization

ICE scores use a 1–10 scale for each dimension.
**ICE = Impact × Confidence × Ease**

| ID | Feature | Impact | Confidence | Ease | ICE | Rationale |
|----|---------|--------|-----------|------|-----|-----------|
| ENG-3 | `pickup_en_route` branch in BookingSheet | 9 | 10 | 9 | **810** | Zero-risk foundation. Without this discriminated branch every other en-route feature is bolted onto the wrong state guard. Effort is one conditional block mirroring existing `isMatched` pattern. |
| ENG-1 | `useEnRouteRoute` hook | 9 | 9 | 8 | **648** | Directly enables the polyline (the primary deliverable of this feature). Clean hook isolation means the route API is only called in the right state. Reuses 100% of existing service layer. |
| PD-2 | Progress bar + map-pin anchor in mini sheet | 8 | 9 | 8 | **576** | Core UX requirement from the feature brief. `progress` value already computed by `useRideTracking` — this is purely a render concern. High comprehension value for low-literacy users. |
| ENG-2 | Camera bounds-fit utility | 8 | 9 | 7 | **504** | Without camera bounds-fit, the polyline can render off-screen and the feature looks broken. Utility is self-contained in `mapAnimations.ts`. Used by both polyline layers (PD-3) and the en-route state entry. |
| PD-3 | Dual-tone polyline (driver-route + destination-route) | 8 | 8 | 7 | **448** | Directly satisfies the stated feature requirement to draw driver-to-pickup route. The destination route is already drawn — adding a second `ShapeSource` with different style is low effort. High rider trust value. |

---

### Full Ranked Table (all 15 ideas)

| Rank | ID | Feature | Impact | Confidence | Ease | ICE |
|------|----|---------|--------|-----------|------|-----|
| 1 | ENG-3 | `pickup_en_route` BookingSheet branch | 9 | 10 | 9 | 810 |
| 2 | ENG-1 | `useEnRouteRoute` hook | 9 | 9 | 8 | 648 |
| 3 | PD-2 | Progress bar + pin anchor (mini sheet) | 8 | 9 | 8 | 576 |
| 4 | ENG-2 | Camera bounds-fit utility | 8 | 9 | 7 | 504 |
| 5 | PD-3 | Dual-tone route polyline | 8 | 8 | 7 | 448 |
| 6 | ENG-5 | Stale polyline opacity degradation | 6 | 10 | 9 | 540* |
| 7 | PD-4 | Haptic pulse at ETA milestones | 6 | 9 | 9 | 486 |
| 8 | PM-1 | Live polyline camera auto-fit | 8 | 8 | 6 | 384 |
| 9 | PD-1 | Animated driver heading indicator | 7 | 7 | 6 | 294 |
| 10 | PM-2 | ETA recalculation toast | 6 | 8 | 7 | 336 |
| 11 | ENG-4 | Polyline decode util audit/extension | 5 | 9 | 8 | 360 |
| 12 | PM-4 | Driver contact (call button) | 7 | 6 | 6 | 252 |
| 13 | PD-5 | Countdown SVG ring around avatar | 6 | 7 | 5 | 210 |
| 14 | PM-3 | Cancel-fee gate (en-route) | 5 | 7 | 6 | 210 |
| 15 | PM-5 | Post-ride rating prompt | 7 | 6 | 4 | 168 |

*ENG-5 scores 540 but is a micro-polish that depends on ENG-1 being done first; moved to
 implementation-phase backlog rather than feature-design top-5.

---

## Top 5 — Final Priority List

### 1. ENG-3 — `pickup_en_route` discriminated branch in BookingSheet (ICE 810)
**Why first:** Every other feature in this spec is content that lives inside this branch.
Adding an `isEnRoute` guard next to the existing `isMatched` guard is the structural
prerequisite. It takes the current `matched`-state mini sheet and gives `pickup_en_route`
its own independent render path — driver info card, progress bar, route polyline are all
hung off this branch.

### 2. ENG-1 — `useEnRouteRoute` hook (ICE 648)
**Why second:** The polyline is the most visible deliverable. The hook debounces route
re-fetches against rapid driver-position updates, separates concerns cleanly from
`useRouteDirections` (pre-booking), and returns GeoJSON coords ready for `ShapeSource`.
No new dependencies; builds on `routeDirectionsService.getRoute()` already battle-tested
in the booking flow.

### 3. PD-2 — Progress bar with map-pin end-anchor in mini sheet (ICE 576)
**Why third:** Specified in the feature brief as the visual centrepiece of the mini modal.
The `progress` value (0→1) is already emitted by `useRideTracking`; this feature is a pure
render task. The sliding map-pin icon is immediately comprehensible without text — critical
for Glidey's target demographic in Senegal.

### 4. ENG-2 — Camera bounds-fit utility (ICE 504)
**Why fourth:** Without it, a rider whose driver is 1.5 km away (typical Dakar scenario)
will open the app and see neither the driver marker nor the route line because the camera
is still centered on their pickup. `fitBoundsToMarkers` called on `pickup_en_route` entry
solves this and doubles as the mechanism for PD-3's dual-polyline view.

### 5. PD-3 — Dual-tone route polyline (ICE 448)
**Why fifth:** The stated feature requirement is "draw the route polyline from driver
current location to user pickup/destination." Rendering a second `MapboxGL.ShapeSource`
using the coords from `useEnRouteRoute` with a distinct color from the destination line
(already on screen) closes the core user story. Style-only differentiation; no new API
calls beyond what ENG-1 provides.

---

## Deprioritized — Rationale

| ID | Feature | Why Deprioritized |
|----|---------|------------------|
| ENG-5 | Stale polyline opacity | Polish item, zero functional value until ENG-1 ships. Add in the same PR as ENG-1 as a 3-line style toggle — not a separate planning unit. |
| PD-4 | Haptic ETA milestones | Nice-to-have. `Haptics` is already in use so effort is minimal, but milestone logic adds interval-tracking state that should wait until ETA accuracy is validated in production. |
| PD-1 | Driver heading indicator | Requires bearing computation across sequential GeoPoints and a custom SVG marker. Medium effort, medium uniqueness. Deferred to v2 polish phase. |
| PM-2 | ETA recalculation toast | Good defensive UX but addresses an edge case (>20% ETA spike). The stale banner in `tracking.tsx` already signals connectivity issues. Lower priority than core polyline. |
| ENG-4 | Polyline decode audit | Should be done as a pre-flight check within ENG-1's spike, not as a standalone feature. |
| PM-4 | Driver call button | High user value for Senegal but requires backend to expose a masked phone number on `matchedDriver`. Currently the MatchedDriver type has no phone field. Backend contract change = separate ticket. |
| PD-5 | Countdown SVG ring | High visual appeal, moderate effort (SVG + animation in Reanimated). Deferred until the base ETA countdown is validated at scale. |
| PM-3 | Cancel-fee gate en-route | Requires a backend field for the fee amount. Product policy not yet defined. Separate backlog item once driver-side cancellation policy is finalized. |
| PM-5 | Post-ride rating prompt | Valuable for driver quality loop but belongs to the `completed` state transition, not the `pickup_en_route` feature. Separate ticket targeting Phase 5 ratings module. |

---

## Implementation Dependency Graph

```
ENG-3 (BookingSheet branch)
  └── ENG-1 (useEnRouteRoute hook)
        ├── PD-3 (dual-tone polyline — ShapeSource in map)
        └── ENG-2 (camera bounds-fit)
              └── PM-1 (auto camera on en-route entry)
  └── PD-2 (progress bar in mini sheet — uses existing `progress` from useRideTracking)
        └── PD-5 (countdown ring — v2)
              └── PD-4 (haptic milestones — v2)
```

ENG-3 + ENG-1 are the critical path. PD-2 and ENG-2 can be parallelized once ENG-3 is
merged. PD-3 depends on ENG-1 coords being available.

---

*Generated: 2026-04-22 | Author: PM Ideation Agent | Scope: driver-en-route feature, Phase 4*
