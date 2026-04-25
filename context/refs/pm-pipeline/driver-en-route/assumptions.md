# PM Assumption Analysis — Driver En-Route Feature

**Feature:** When driver enters `pickup_en_route` state, draw a route polyline on the Mapbox map from driver's live location to the user's pickup/destination, show a mini bottom sheet with driver info card and ETA countdown, and render a map-pin icon as the visual end-anchor of a progress bar in the top portion of the mini modal.

**Tech context:** Expo 54 / RN 0.81 / React 19 / TypeScript strict. Existing `rideStore` (`idle → searching → matched → pickup_en_route → completed/cancelled`), `BookingSheet` with snap levels (mini/peek/full), `cameraRef` (Mapbox), `routeDirectionsService` for polyline, `MapboxGL.ShapeLayer` for drawing paths, `trackingService` (WebSocket + HTTP poll fallback, 5 s interval).

**Date:** 2026-04-22

---

## Assumption Table

| # | Category | Assumption | Confidence | Fast Validation Test |
|---|----------|------------|------------|----------------------|
| 1 | **Value** | Riders in Senegal will find a live route polyline + ETA countdown meaningfully reassuring during the en-route wait, reducing ride abandonment or support contacts compared to the current static "driver matched" screen. | LOW | A/B test the existing `matched` screen (no polyline) vs. a static polyline screenshot mock shown to 10 riders via WhatsApp; ask: "Does seeing the driver's route on the map make you feel more confident?" Rate on 1–5. |
| 2 | **Value** | The ETA countdown to *destination* (not just to pickup) is what riders care about most in `pickup_en_route` — not the ETA to their current pickup point. | MEDIUM | 5-minute hallway test with 5 Dakar riders: show two wireframes (ETA to pickup vs. ETA to destination) and ask which number they look at first and why. |
| 3 | **Usability** | Riders will intuitively understand that the map-pin icon anchoring the progress bar represents the destination and not the driver's current position, without any label. | LOW | Guerrilla test: show the mini modal mockup to 8 riders cold, ask "what does the pin represent?" Accept if 6/8 identify destination correctly. |
| 4 | **Usability** | The mini bottom sheet (100 px snap) leaves enough visible map area for riders to see the full polyline route without having to manually drag the sheet down. | MEDIUM | On a physical device (iPhone SE — smallest common form factor in Senegal market), render the sheet at mini snap with a Dakar-scale polyline and verify the full route is visible above the sheet. Takes < 30 min with Expo Go. |
| 5 | **Feasibility** | The existing `trackingService` WebSocket + 5 s HTTP poll fallback provides location updates at sufficient frequency to re-fetch and redraw a live polyline without causing visible map jitter or performance degradation on mid-range Android devices. | MEDIUM | Profile on a Tecno Spark (popular Senegal device) during a demo-mode tracking session: measure JS thread frame drops when updating `MapboxGL.ShapeLayer` coordinates every 5 s. Accept if < 5 dropped frames per update cycle. |
| 6 | **Feasibility** | `routeDirectionsService.getRoute()` can be called repeatedly (every driver location update) without hitting Mapbox Directions API rate limits or incurring unacceptable cost at scale. | LOW | Check Mapbox Directions API pricing tier and rate limit docs. Calculate cost at 1 call per 5 s × average 8-min ride = ~96 calls/ride × projected concurrent rides. Decide if route should be fetched once on state entry or refreshed on each position update. |
| 7 | **Feasibility** | The `pickup_en_route` state is reliably set by the backend and propagated to the client in time to trigger the polyline/sheet render before the driver is already near the pickup. | MEDIUM | In demo mode, log the timestamp delta between driver accepting a ride (backend) and `rideStore` reaching `pickup_en_route` on client. Repeat 10 times. Accept if median < 3 s. |
| 8 | **Viability** | The additional Mapbox Directions API calls introduced by this feature (one per ride, or one per position update if refreshed) fit within the current or next pricing tier without requiring a pricing model change for riders. | LOW | Pull current monthly Mapbox API spend from the dashboard. Model the cost increase at 10, 100, and 500 daily rides. Flag if projected spend exceeds 20% of current infra budget before launch. |
| 9 | **Ethics** | Continuously transmitting the driver's live GPS location to the rider during `pickup_en_route` does not create a privacy or safety risk for drivers (e.g., location harvesting, stalking after ride ends). | MEDIUM | Confirm that: (a) tracking subscription is torn down immediately on `completed` or `cancelled` transition; (b) driver location is not stored client-side beyond the active session; (c) drivers are informed at onboarding that their location is shared during active rides. Audit `trackingService` cleanup logic (already has `tearingDown` guard). |
| 10 | **Strategy** | Shipping route polyline + live ETA now (during `pickup_en_route`) is the right sequencing — it does not require changes to the backend ride lifecycle or driver app, and the frontend can own this feature end-to-end. | HIGH | Verify with backend team: does `pickup_en_route` state already fire from driver app action? Does `/rides/:id/position` already return `etaSeconds` and `driverLocation`? Confirm `TrackingPositionUpdate` type in `@rentascooter/shared` has both fields. |
| 11 | **Go-to-Market** | Riders will notice and attribute the improved en-route experience to Glidey as a brand differentiator vs. informal moto-taxi alternatives, increasing word-of-mouth referrals. | LOW | Post-ride survey (2 questions, in-app or WhatsApp): "Did you feel informed during your ride?" and "Would you recommend Glidey to a friend?" Compare cohorts before/after feature rollout. Run for 2 weeks with 50 completed rides. |
| 12 | **Team** | The team has sufficient Mapbox GL RN + Reanimated expertise to implement the animated progress bar with a map-pin end-anchor inside the existing `BookingSheet` mini snap without introducing regressions to the current snap gesture system. | MEDIUM | Spike: one developer builds a throwaway prototype of the progress bar component (no integration) in < 4 hours using existing `useSharedValue` / `useAnimatedStyle` patterns from `BookingSheet.tsx`. If it takes > 1 day, escalate to `ck:research` for a simpler static alternative. |

---

## Key Risk Clusters

**Highest-risk pair (act first):**
- **#6 + #8** (Mapbox cost) — the decision of whether to call `getRoute()` once on state entry or on every position tick is both a feasibility and viability question. Resolve this in spike before any implementation begins. A single fetch per ride is almost certainly the right default.
- **#3** (progress bar legibility) — the map-pin-as-progress-anchor is the most novel UI pattern here and the one most likely to confuse riders. Run the guerrilla test with a Figma frame before writing a line of code.

**Low-hanging validations (< 1 hour each):**
- #7: demo mode log check
- #10: backend/type audit
- #4: device render check in Expo Go
