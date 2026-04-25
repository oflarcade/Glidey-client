# PRD: Fake Driver Match (Mock Acceptance Flow)

**Feature ID:** T-FDM  
**Date:** 2026-04-22  
**Status:** Draft

---

## 1. Summary

When a client books a ride and the app enters the `searching` RideState, a deterministic mock event fires after 2–3 seconds, automatically transitioning the store to `matched` with a hardcoded `MatchedDriver` payload. This unblocks UI development of the driver-accepted screen — `DriverReveal` + countdown — without requiring the real driver app, backoffice, or a live WebSocket/polling backend.

---

## 2. Problem

**Pain:** The client UI is blocked past the `searching` state. `DriverReveal` renders conditionally on `rideState === 'matched'` and a non-null `matchedDriver` in the store, but that transition currently only fires when `subscribeToMatching` receives a real `ride:accepted` WS frame or a polled `/rides/:id` response with `status: accepted`. Neither is available during standalone client development.

**Current workaround:** Developers manually call `useRideStore.getState().transition('matched', { driver: DEMO_DRIVER })` from the React DevTools console — error-prone, undiscoverable, and not reproducible in simulator demos or design reviews.

The existing `EXPO_PUBLIC_USE_DEMO=true` path in `matchingService.subscribeToMatching` already schedules a `setTimeout` chain but fires only after `attempt >= 3` (i.e., ~9 seconds total and three fake "retry" cycles). That delay is too long for interactive UI work and forces the `MatchingModal`'s `RetryTimeline` through all three attempt states before the match fires.

---

## 3. Objective

Deliver a fast, zero-infrastructure mock match that lets any developer or designer see the full `searching → matched` transition — including `DriverReveal` slide-up animation and driver info card — within 2–3 seconds of booking, using only `EXPO_PUBLIC_USE_DEMO=true`. No backend, no driver app, no manual store mutations.

**Measure of success:** A developer running `yarn dev` with demo mode can book a ride and see the `DriverReveal` card with correct mock driver data in under 5 seconds, every time, reproducibly.

---

## 4. Target Users

**Primary:** Client-app engineers and designers working on ride-booking UI flows in isolation (no backend dependency). Context: Expo dev server, simulator or physical device, `EXPO_PUBLIC_USE_DEMO=true`.

**Secondary:** PM and design leads during demo walkthroughs and design reviews who need to demonstrate the full post-booking UX without a live environment.

---

## 5. User Stories

1. **As a client-app developer**, I want the mock match to fire automatically 2–3 seconds after booking so that I can iterate on `DriverReveal` animations without touching the store manually.

2. **As a client-app developer**, I want the fake driver payload to populate all `MatchedDriver` fields (`name`, `vehiclePlate`, `vehicleType`, `rating`, `completedRides`, `profilePhoto`, `location`) so that `DriverCard` renders a fully realistic UI with no empty states.

3. **As a designer**, I want the mock acceptance to trigger the same `Animated.spring` slide-up on `DriverReveal` that the real flow uses so that I can review the motion design in context.

4. **As a developer**, I want the fake match path to be gated behind `EXPO_PUBLIC_USE_DEMO=true` (already enforced in `matchingService`) so that it can never accidentally activate in production builds.

5. **As a client-app developer**, I want the `MatchingModal`'s `RetryTimeline` to show one brief searching beat before the match resolves so that the transition feels natural rather than instant.

6. **As a PM doing a demo walkthrough**, I want to see the `rideState` transition from `searching` → `matched` with a named Senegalese driver so that the demo tells a coherent market-specific story.

---

## 6. Scope

### In

- Modify the `EXPO_PUBLIC_USE_DEMO=true` branch of `subscribeToMatching` in `services/matchingService.ts` to fire the `matched` event after a single ~2 500 ms delay instead of the current three-attempt 9-second chain.
- Update the hardcoded `DEMO_DRIVER` constant (already in `matchingService.ts`) with a complete `MatchedDriver` payload: Senegalese name, realistic plate (`DK-1234-A`), `vehicleType: 'Moto-taxi'`, `rating: 4.8`, `completedRides: 142`, and a stable placeholder avatar URL (or `undefined` to exercise the fallback avatar path in `DriverCard`).
- The `useMatching` hook and `MatchingModal` require no changes — they already consume `subscribeToMatching` and react to the `matched` event via `transition('matched', { driver })`.
- The `DriverReveal` component requires no changes — it already reads `selectMatchedDriver` from `useRideStore` and animates on `visible && matchedDriver`.

### Out

- Any real backend integration or WebSocket changes.
- ETA countdown timer UI (separate ticket — the countdown component is not yet implemented).
- `DriverReveal` displaying a real photo fetched from a URL (no networking in demo mode).
- Changes to the non-demo (real) polling or WS path in `matchingService`.
- Android/iOS push notification for match event.
- Any change to the `failed` / `cancelled` demo path.

---

## 7. Success Metrics

1. **Time-to-reveal:** From `transition('searching')` to `DriverReveal` visible on screen: ≤ 4 seconds in demo mode (target: 2.5 s timer + animation).

2. **Zero manual intervention rate:** 100% of demo-mode booking flows reach `matched` state without developer console commands or store mutations.

3. **Field completeness:** `DriverCard` renders with 0 empty/fallback fields for `name`, `vehiclePlate`, `vehicleType`, `rating`, and `completedRides` in every demo session.

---

## 8. Open Questions

1. **Avatar image:** Should `DEMO_DRIVER.profilePhoto` point to a bundled local asset (requires asset registration in Expo) or remain `undefined` to exercise the deterministic fallback avatar in `DriverCard`? The fallback path is currently untested in real usage.

2. **ETA value:** `DriverReveal` currently shows no countdown — the `TrackingPositionUpdate` shape has `etaSeconds` but no UI consumes it yet. Should this PRD expand scope to include a static hardcoded ETA label (e.g., "Arrivée dans 4 min") on `DriverReveal`, or is that a separate ticket?

3. **Demo mode discoverability:** The `EXPO_PUBLIC_USE_DEMO=true` flag is set at build time in EAS profiles but is not surfaced in the dev UI. Should a visible "DEMO" badge or toast appear when the fake match fires, so reviewers know they are not seeing live data?
