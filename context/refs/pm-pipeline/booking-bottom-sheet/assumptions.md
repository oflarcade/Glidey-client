# PM Assumption Log — Booking Bottom Sheet

**Feature:** Reanimated-powered booking bottom sheet on the main map  
**Date:** 2026-04-20  
**Phase:** Pre-build validation  
**Author:** PM Assumption Analyst (Claude)

---

## Summary

The booking bottom sheet collapses the current separate `/(main)/booking.tsx` route into an in-map sheet that covers destination selection → vehicle pick → payment → booking → driver-search, all without leaving the map view. The table below surfaces the riskiest assumptions that need validation before or during build.

---

## Assumption Table

| # | Category | Assumption | Confidence | Validation Experiment |
|---|----------|-----------|------------|----------------------|
| 1 | **Feasibility** | The existing `BottomSheet` component (which deliberately uses `PanResponder` + `Animated` instead of Reanimated to avoid Reanimated v4 conflicts) can be reused or extended for the booking sheet without re-introducing the gesture-conflict problem. The booking sheet's internal `ScrollView` (carousel, payment row) will not steal touches from the drag handle when the sheet is minimized. | **MEDIUM** | Mount a spike branch: nest the existing `ScooterCarousel` `ScrollView` inside the `BottomSheet` wrapper, set `onStartShouldSetPanResponder` to `false` when the touch origin is inside the scroll area, and run on both iOS simulator and a physical Android device. If horizontal scroll and vertical sheet drag coexist cleanly, assumption holds. Ship only after confirming both platforms. |
| 2 | **Feasibility** | `CreateRideV2Request` can be safely extended with a `vehicleType` field — both the backend route `/rides/create` and the shared types package `@rentascooter/shared` can absorb the addition without a breaking migration or a versioned API bump. | **LOW** | Pull the backend monolith at `/opt/EMIN/glidey/RentAScooter-Backend-Monolith/` and inspect the `/rides/create` handler and Zod/Joi schema. Confirm the field is either already present (optional) or can be added as `vehicleType?: string` without changing the existing validation logic. If the backend is strict (no extra fields), a coordinated deploy is required before the client ships. |
| 3 | **Usability** | Riders in Senegal will immediately understand that the bottom sheet is drag-expandable and that tapping the destination row re-opens the `LocationModal` to change their destination. No explicit tutorial hint is needed. | **LOW** | Run a 5-person hallway test in Dakar with the minimized sheet on screen. Ask: "How would you change your destination?" and "Can you make this panel bigger?" Track if users discover drag and destination tap without prompting. If fewer than 3/5 succeed unaided, add a one-time tooltip or animate the handle on first open. |
| 4 | **Usability** | The "searching for driver" in-place transition — where the sheet content swaps from the booking form to the `MatchingModal` content without a route push — will feel coherent rather than jarring to first-time users. The current `MatchingModal` is a full `Modal` overlay; embedding it inside the sheet changes its visual weight and cancel affordance significantly. | **MEDIUM** | Prototype the two states as static Figma frames and run a 3-user preference test. Then implement the sheet-embedded version and A/B against a lightweight modal overlay (the current approach). Measure: task completion, cancel rate, support tickets about "where did my ride go?". |
| 5 | **Value** | Removing the route push to `/(main)/booking.tsx` meaningfully reduces drop-off between destination selected and BOOK NOW tapped. Users abort less when they never leave the map. | **MEDIUM** | Add analytics events `booking_sheet_opened`, `booking_sheet_vehicle_selected`, `book_now_tapped`, `booking_route_opened` (legacy). Compare funnel completion rates for 2 weeks post-launch vs. the 2-week pre-launch baseline. A 10%+ improvement in step-to-step conversion is the threshold for confirming the assumption. |
| 6 | **Viability** | The vehicle-type carousel (Standard / E-Scooter) maps cleanly to backend pricing logic — i.e., `fareEstimate` either already returns per-type prices or can be extended to do so, and the XOF fare displayed is accurate and legally safe (no hidden fees that differ by vehicle). | **LOW** | Check the `/rides/estimate` response shape (`FareEstimateResponse` in `@rentascooter/shared`). Currently it returns a single `fareEstimate: number`. If multi-type pricing is not yet available, the carousel will show hardcoded or identical prices, which is misleading. Spike needed: extend `estimateFare` to accept `vehicleType` and return a map, or query per-type in parallel. Validate displayed price matches backend-computed fare before launch. |
| 7 | **Viability** | The scooter fleet in deployment areas actually includes multiple vehicle types (Standard + E-Scooter at minimum) so the carousel is not decorative UX — there are real SKUs to select. If only one type is operationally deployed, the carousel adds UI complexity with zero rider benefit. | **LOW** | Check with ops: how many distinct vehicle types are currently active in the Dakar fleet? If only one, hide the carousel until a second type launches. Gate the carousel on a feature flag (`EXPO_PUBLIC_VEHICLE_TYPES_ENABLED`) so it can be toggled remotely. |
| 8 | **Feasibility** | The `LocationModal` close + booking sheet open handoff can be sequenced without a visible flash. Both sheets use the same `BottomSheet` component under the hood; animating one out while the other animates in on the same render cycle will not cause a dropped frame or conflicting `Animated.spring` calls. | **MEDIUM** | Time the handoff in the React DevTools profiler on a mid-range Android (e.g., Samsung A-series). Measure frame drops during the 300 ms transition window. If frame drops exceed 3 during transition, introduce a 150 ms delay before starting the booking sheet open animation, or use `InteractionManager.runAfterInteractions`. |
| 9 | **Ethics** | The "searching for driver" in-place state adequately communicates to the user that a real booking has been placed and money may be charged, especially in fallback/failed states. Riders in Senegal may have limited data and re-open the app mid-search; the FSM state (`useRideStore`) must surface the correct sheet state on cold resume. | **MEDIUM** | Test the cold-resume scenario: place a booking, force-kill the app during `searching` state, reopen. Verify the sheet re-opens in the searching state (or a clear "your ride is still being processed" banner). If the FSM resets to `idle` on cold start and the booking is silently orphaned, users may be charged without knowing. File as a data-integrity risk to fix before launch. |
| 10 | **Strategy** | Embedding the full booking flow in an in-map sheet aligns with the product vision of a Uber-like single-screen experience, and does not conflict with planned features (ride tracking, driver reveal, pickup confirmation) that also live in-map as overlays. | **HIGH** | Cross-reference the `/(main)/pickup.tsx`, `/(main)/tracking.tsx` routes and `DriverReveal` component: they already operate as map-layer overlays post-match. The booking sheet is the missing pre-match layer in that progression. Validate by mapping the full FSM (`idle → searching → matched → pickup_en_route → completed`) to screen layers — the booking sheet should only own `idle` and `searching`; everything after `matched` should be handed off cleanly without a stacking conflict. |
| 11 | **Go-to-Market** | The booking sheet is a self-contained enough change that it can be shipped as a patch release without coordinating a driver-app update, ops training, or marketing announcement. | **HIGH** | Confirm with backend team: `vehicleType` field addition is additive (old rides without the field still route correctly). Confirm with driver-app team: drivers do not see or handle `vehicleType` in their current dispatch UI. If both are true, the client change is safe to ship independently. If either is false, coordinate a joint release and schedule ops briefing on new vehicle-type dispatch. |
| 12 | **Team** | The team has working knowledge of `PanResponder` + `Animated` gesture coordination sufficient to correctly implement the internal `ScrollView` / outer drag-handle touch arbitration without introducing subtle Android-specific gesture bugs (e.g., the sheet consuming horizontal swipe on the carousel). | **MEDIUM** | Before build, nominate a single engineer to own the gesture layer and conduct a 2-hour technical spike with the specific combo: `PanResponder` on the sheet wrapping a horizontal `ScrollView` (the carousel). Capture findings in a short decision note. Do not merge until the spike confirms correct behavior on Android API 31+. |

---

## Priority Order for Validation

1. **A6, A7** — Pricing and fleet reality must be confirmed before building the carousel. If fares can't be per-type and only one vehicle exists, the carousel is scope to cut entirely.  
2. **A2** — `vehicleType` on `CreateRideV2Request` requires a backend coordination check before any client work touches `bookRide`.  
3. **A1, A12** — Gesture arbitration is the core technical risk; spike before committing to the full build.  
4. **A9** — Cold-resume + orphaned-booking is an ethical/data-integrity risk that must be fixed before launch, not after.  
5. **A3, A4** — Usability tests can run in parallel with build using a Figma prototype, costing zero engineering time.  
6. **A5** — Analytics instrumentation should be added from day one, not retro-fitted; funnel data is only valid if tracking goes live with the feature.  
7. **A8, A10, A11** — Lower-risk; validate during implementation and QA.

---

## Codebase Anchors Referenced

| File | Relevance |
|------|-----------|
| `components/LocationModal/BottomSheet.tsx` | Existing sheet implementation using PanResponder — the gesture arbitration baseline |
| `components/ScooterCarousel/ScooterCarousel.tsx` | Horizontal ScrollView that must coexist with vertical sheet drag |
| `components/MatchingModal/MatchingModal.tsx` | Currently a full Modal overlay; must be adapted or embedded for in-sheet searching state |
| `hooks/useBooking.ts` | `bookRide()` calls `createRide()` without `vehicleType` — needs extension |
| `hooks/useMatching.ts` | 3-attempt retry loop (30s each) — drives the searching state UX duration |
| `services/bookingService.ts` | `CreateRideV2Request` shape is the contract to extend for vehicleType |
| `app/(main)/booking.tsx` | The route being deprecated — ensure no other screen navigates to it |
