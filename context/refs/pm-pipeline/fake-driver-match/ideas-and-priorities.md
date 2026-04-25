# Glidey — Fake Driver Match: Ideas & Prioritization

**Feature:** Mock driver acceptance flow — unblock client UI development without the real driver app or backoffice
**Date:** 2026-04-22
**Stack:** Expo 54, RN 0.81, React 19, TypeScript strict, Zustand (`rideStore` FSM), `useMatching` hook, `matchingService.subscribeToMatching`, `DriverReveal` component

---

## Context

The client already has the full ride FSM (`idle → searching → matched → pickup_en_route → completed/cancelled/failed`) in `packages/shared/src/stores/rideStore.ts` and a demo path inside `matchingService.subscribeToMatching` gated by `EXPO_PUBLIC_USE_DEMO=true`. That demo path fires after a 9 s delay (3 × 3 s intervals). The goal of this feature is to make the mock path more useful, more realistic, and more testable — so the full `searching → matched` UI can be built and reviewed with zero backend dependency.

Key integration points (from code review):
- `matchingService.ts` — `DEMO_DRIVER` fixture (hardcoded), `subscribeToMatching` demo branch
- `useMatching.ts` — attempt timers (3 × 30 s), `resolvedRef`, `transition()` call on match
- `MatchingModal.tsx` — `RetryTimeline`, attempt copy in French, cancel always visible
- `DriverReveal.tsx` — spring-animated bottom sheet, reads `matchedDriver` from `rideStore` via `selectMatchedDriver`
- `DriverCard` (from `@rentascooter/ui`) — consumes `name`, `vehiclePlate`, `vehicleType`, `rating`, `completedRides`, `profilePhoto`

---

## Part 1 — Brainstorm by Perspective

### Product Manager — Market Fit, Value Creation, Competitive Edge

**PM-1: Configurable delay via env var for stakeholder demos**
Expose `EXPO_PUBLIC_FAKE_MATCH_DELAY_MS` so a demo build can be configured at EAS build time (e.g., 2 000 ms for a live pitch, 10 000 ms for a slow-match stress demo). Product and investors can see the full searching→matched flow at the pace that makes the demo land. Zero UX code change; one env-var read in `matchingService`.

**PM-2: Multiple fake driver personas for market validation testing**
Define 3–5 `DEMO_DRIVER` fixtures representing real Senegalese driver profiles (different names, ratings, ride counts, vehicle types). Cycle through them on repeated bookings so user research sessions and stakeholder demos feel varied and representative rather than always showing the same "Moussa Diallo" card. Validates whether the trust-signal hierarchy (name → rating → ride count → plate) resonates across persona types.

**PM-3: Fake match toggle in Settings screen (non-production builds only)**
Add a dev/demo toggle in the existing Settings screen (`app/(main)/settings.tsx`) behind `__DEV__ || process.env.EXPO_PUBLIC_USE_DEMO`. Lets PMs and QA trigger the mock flow on a physical device without restarting the bundler. Speeds up iterative review cycles during Phase 4.

**PM-4: ETA randomization within a realistic range**
Instead of a fixed ETA, generate a random value between 3–8 min for the fake driver. Reflects real-world variance, prevents stakeholder habituation to a single number, and exercises the countdown timer UI across its full range. Still deterministic per session (seed from `rideId` string hash) so QA can reproduce specific ETAs.

**PM-5: Fake match as a fallback when the real backend times out**
In non-demo builds, if the WebSocket and polling both fail to return a result within the 90 s window (the `inFallback` state), offer an opt-in "Test with demo driver" button instead of just the generic fallback copy. Converts an error state into a useful development/QA tool and demonstrates the `DriverReveal` component even when the backend is unreachable.

---

### Product Designer — UX, Onboarding, Engagement Loops

**PD-1: Realistic ETA countdown in DriverReveal (not just a static card)**
The current `DriverReveal` component shows a static `DriverCard` with no ETA. Add a prominent "Arrives in X:XX" countdown that starts from the fake ETA and ticks down in real time. This completes the post-match UX state, lets designers and stakeholders review the full driver-accepted screen as it will look in production, and surfaces any layout issues with the countdown timer early.

**PD-2: Avatar placeholder with initials fallback (not blank)**
`DEMO_DRIVER.profilePhoto` is `undefined`, which means the `DriverCard` renders whatever fallback `@rentascooter/ui` defines. Define a deterministic initials-based avatar in the fake driver fixture (e.g., a local SVG with the driver's initials and a branded colour). This makes the mock screen look finished in demos — no broken image state — and doubles as a design spec for the real photo fallback that production will also need.

**PD-3: Haptic + sound feedback on driver match event**
When `transition('matched', ...)` fires, trigger a short haptic pulse (`expo-haptics`) and optionally a soft "ding" sound (`expo-av`). Gives the searching→matched moment physical weight — the same micro-delight moment that Uber and Bolt use. Reviewable only once the fake match fires; impossible to evaluate without the mock flow. The implementation would live in `useMatching` alongside the existing `transition` call.

**PD-4: Animated driver pin appearing on map at match time**
When the `matched` state activates, drop a new driver-location annotation on the Mapbox map at the fake driver's hardcoded `location` (`{ latitude: 14.6961, longitude: -17.4473 }`) with a spring animation. Camera should smoothly pan to frame both the driver pin and the user's pickup pin. This is the primary map-layer UX for the matched state and can only be designed and reviewed with the fake match data in place.

**PD-5: Staggered reveal animation for DriverCard fields**
Instead of the entire `DriverReveal` sheet sliding up as a unit, stagger the appearance of individual fields (photo → name → rating stars → plate → ride count) with 80 ms delays between each. Creates a premium reveal feeling — similar to a "loading in" effect — that makes the match moment feel more celebratory. The fake match is the only way to review this animation during development.

---

### Engineer — Technical Innovation, Integrations, Platform Leverage

**ENG-1: Thin `FakeMatchingAdapter` behind the existing `subscribeToMatching` interface**
Extract the current inline demo branch from `subscribeToMatching` into a named `FakeMatchingAdapter` that implements the same `(rideId, onEvent) => MatchingCleanup` signature. The adapter lives in `services/fakeMatchingAdapter.ts` and is imported by `matchingService.ts` only when `EXPO_PUBLIC_USE_DEMO=true`. This keeps the real path clean, makes the fake logic independently testable, and creates a clear seam for future mock variants (slow match, immediate cancel, etc.).

**ENG-2: Scenario enum for different fake match outcomes**
Define a `FakeMatchScenario` enum (`FAST_MATCH | SLOW_MATCH | NO_DRIVERS | DRIVER_CANCELLED`) read from `EXPO_PUBLIC_FAKE_SCENARIO`. Each scenario drives `FakeMatchingAdapter` to fire different events with different timings. Gives QA one-command access to every branch of the `useMatching` FSM without code changes — including the `inFallback` path and the `cancelled` transition, which are otherwise hard to trigger manually.

**ENG-3: `useMatching` delay override for unit-test ergonomics**
Accept an optional `delayMs` parameter on `useMatching` (defaulting to `ATTEMPT_MS = 30_000`) and thread it into the attempt timers. In test files, pass `delayMs: 0` to collapse all timer waits. This makes `useMatching` fully synchronously testable with `@testing-library/react-native` `act()` without `jest.useFakeTimers` hacks. The fake match feature motivates this refactor because it is the first time the hook's timing behaviour matters for visual review.

**ENG-4: Shared `FAKE_DRIVERS` fixture array in `@rentascooter/shared`**
Move `DEMO_DRIVER` out of `matchingService.ts` (an app-layer service) into `packages/shared/src/fixtures/fakeDrivers.ts`, exported as `FAKE_DRIVERS: MatchedDriver[]`. Any future mock consumer (Storybook stories, unit tests, Expo Storyshots) can import the same canonical data rather than duplicating it. Enforces the type contract (`MatchedDriver`) at the fixture definition site.

**ENG-5: Metro bundler plugin to strip fake adapter from production bundle**
Add a custom Metro resolver condition (`__FAKE_MATCHING__`) that resolves `fakeMatchingAdapter` to a no-op stub when building with `EXPO_PUBLIC_USE_DEMO` unset. Ensures zero fake-matching code ships in the production APK/IPA — important once the app goes to the app stores. Complements the EAS build matrix (dev/preview = demo on; production = demo off) already described in `CLAUDE.md`.

---

## Part 2 — ICE Scoring & Prioritization

### Scoring Rubric
- **Impact (1–10):** How much does it unblock UI completion, improve demo quality, or reduce dev friction?
- **Confidence (1–10):** How certain are we this will work as designed given the existing codebase?
- **Ease (1–10):** How low-effort is implementation? (10 = trivial, 1 = substantial native or infra work)
- **ICE Score = Impact × Confidence × Ease**

---

### ICE Scoring Table

| # | Feature | Source | Impact | Confidence | Ease | ICE |
|---|---------|--------|--------|------------|------|-----|
| 1 | Thin `FakeMatchingAdapter` behind `subscribeToMatching` | ENG-1 | 9 | 10 | 9 | **810** |
| 2 | Realistic ETA countdown in `DriverReveal` | PD-1 | 9 | 9 | 8 | **648** |
| 3 | Scenario enum for fake match outcomes | ENG-2 | 8 | 9 | 8 | **576** |
| 4 | Animated driver pin on map at match time | PD-4 | 9 | 8 | 7 | **504** |
| 5 | `FAKE_DRIVERS` fixture array in `@rentascooter/shared` | ENG-4 | 7 | 10 | 9 | **630** |
| 6 | Configurable delay via env var | PM-1 | 7 | 10 | 9 | **630** |
| 7 | Avatar placeholder with initials fallback | PD-2 | 7 | 9 | 8 | **504** |
| 8 | Multiple fake driver personas | PM-2 | 6 | 9 | 8 | **432** |
| 9 | Haptic + sound on match event | PD-3 | 7 | 8 | 7 | **392** |
| 10 | Staggered reveal animation for `DriverCard` fields | PD-5 | 6 | 8 | 7 | **336** |
| 11 | `useMatching` delay override for test ergonomics | ENG-3 | 6 | 9 | 8 | **432** |
| 12 | Dev toggle in Settings screen | PM-3 | 5 | 8 | 7 | **280** |
| 13 | ETA randomization with `rideId`-seeded value | PM-4 | 4 | 8 | 8 | **256** |
| 14 | Metro bundler plugin to strip fake adapter | ENG-5 | 5 | 7 | 5 | **175** |
| 15 | Fake match fallback in `inFallback` state | PM-5 | 4 | 7 | 6 | **168** |

---

### Top 5 Features (Ranked by ICE)

---

#### #1 — Thin `FakeMatchingAdapter` behind `subscribeToMatching` (ICE: 810)
**Source:** ENG-1

**Rationale:**
This is the structural prerequisite for every other item on this list. The current demo branch is an inline `if` block embedded directly in `subscribeToMatching` — untestable in isolation and increasingly hard to extend as scenarios multiply. Extracting it into `services/fakeMatchingAdapter.ts` with the same `(rideId, onEvent) => MatchingCleanup` signature costs 30–45 minutes and delivers four benefits at once: the real path stays clean, the fake path is independently testable, the interface is explicit, and every other fake-match enhancement becomes a modification to one small file rather than a surgery on a live service. Confidence is maximum — this is a pure refactor with no behaviour change. Ease is 9/10 — the existing code already does the right thing, it just needs extraction.

**What it enables downstream:**
- `FakeMatchScenario` enum (ENG-2) plugs directly into the adapter
- `FAKE_DRIVERS` fixture (ENG-4) is consumed by the adapter
- `delayMs` override (ENG-3) lives in the adapter's timer logic
- Metro strip (ENG-5) has a clean single file to stub out

---

#### #2 — Realistic ETA Countdown in `DriverReveal` (ICE: 648)
**Source:** PD-1

**Rationale:**
The `DriverReveal` component currently renders a static `DriverCard` with no temporal information. The matched state in production will always include an ETA — so the mock must too, or designers and stakeholders are reviewing an incomplete screen. A `useEffect`-driven countdown (`setInterval` decrementing from `fakeEtaSeconds`) added to `DriverReveal` requires no new dependencies and no backend changes. It completes the post-match screen as a shippable design artefact. Impact is 9/10 because without it the matched state looks like a finished card when it is actually missing its most important dynamic element. Ease is 8/10 — pure React Native, uses existing `Animated` or plain `useState`, slots into the existing `DriverReveal` layout.

**Implementation note:**
The fake ETA value flows from `FakeMatchingAdapter` → `MatchingEvent` → `useMatching` → `rideStore`. The `MatchedDriver` type does not currently carry `etaSeconds`; a lightweight addition to the `MatchingEvent` payload (not `MatchedDriver` itself) keeps the matched-driver shape clean while threading ETA to the UI.

---

#### #3 — `FAKE_DRIVERS` Fixture Array in `@rentascooter/shared` (ICE: 630)
**Source:** ENG-4

**Rationale:**
`DEMO_DRIVER` currently lives in `services/matchingService.ts` — an app-layer file that is not importable by `@rentascooter/ui` component stories, unit tests in `packages/shared`, or any future Storybook setup. Moving it to `packages/shared/src/fixtures/fakeDrivers.ts` as `FAKE_DRIVERS: MatchedDriver[]` (3–5 entries) makes canonical test data available to the entire monorepo under the `MatchedDriver` type contract. Cost is trivial (move + expand the existing object). Confidence is 10/10 — no runtime behaviour changes, purely a module reorganisation. The ICE score of 630 reflects that this is the foundational data layer that both ENG-1 and PD-1 depend on.

---

#### #4 — Configurable Delay via Env Var `EXPO_PUBLIC_FAKE_MATCH_DELAY_MS` (ICE: 630)
**Source:** PM-1

**Rationale:**
The current 9 s demo delay (3 × 3 s) is hard-coded. A 2–3 s delay is better for live demos; a 25–30 s delay is better for testing the `RetryTimeline` animation and attempt-advance logic in `useMatching`. One env-var read in `FakeMatchingAdapter` — `parseInt(process.env['EXPO_PUBLIC_FAKE_MATCH_DELAY_MS'] ?? '3000', 10)` — unlocks the full configurability with zero UX code changes. Confidence is 10/10 (env vars work in Expo via `EXPO_PUBLIC_*`). Ease is 9/10. This is a 10-minute change with high leverage for demo builds and QA sessions across the team.

---

#### #5 — Animated Driver Pin Appearing on Map at Match Time (ICE: 504, tied with PD-2)
**Source:** PD-4

**Rationale:**
The map is the primary canvas of the app. When the ride transitions to `matched`, the map should immediately show the driver's location as a pin and smoothly pan to frame both the driver and the pickup point. Without the fake match providing a `location: GeoPoint`, this map behaviour cannot be designed, reviewed, or iterated on. The `DriverReveal` sheet and the map pin are the two visual outputs of the `matched` state — completing both is what makes the matched-state screen reviewable as a whole. Implementation requires wiring `matchedDriver.location` from `rideStore` into the existing Mapbox `Camera` + annotation layer already used by `DriverMarkers`. Ease is 7/10 (Mapbox camera animation is well-understood in this codebase; the pin is a new annotation type but follows the `DriverMarkers` pattern).

---

### Deprioritized Features & Rationale

| Feature | ICE | Why Deprioritized |
|---------|-----|-------------------|
| Avatar placeholder with initials fallback (PD-2) | 504 | Valuable polish, but `DriverCard` already handles `undefined` profilePhoto gracefully. Defer until `DriverCard` design is finalized; don't pre-solve a design decision. |
| Scenario enum for fake match outcomes (ENG-2) | 576 | High value for QA but requires `FakeMatchingAdapter` (ENG-1) to land first. Phase 2 of the adapter work — ship after ENG-1 stabilizes. |
| `useMatching` delay override for test ergonomics (ENG-3) | 432 | Important for future unit tests but no test runner is currently configured (`CLAUDE.md`: "No test runner is currently configured"). Premature optimization. |
| Multiple fake driver personas (PM-2) | 432 | Nice for varied demos but one realistic fixture is sufficient to unblock UI review. Add personas once the card design is locked. |
| Haptic + sound on match event (PD-3) | 392 | `expo-haptics` is likely already linked; `expo-av` may not be. Sound adds bundle weight and accessibility concerns. Defer to polish sprint. |
| Staggered `DriverCard` reveal animation (PD-5) | 336 | High delight, low urgency. The slide-up spring in `DriverReveal` is sufficient for design review. This is a Phase 4 animation polish item. |
| Dev toggle in Settings screen (PM-3) | 280 | Convenient but the env-var approach (PM-1, #4) is simpler and doesn't add Settings UI complexity. Revisit if QA requests it. |
| ETA randomization with `rideId` seed (PM-4) | 256 | Added complexity for marginal demo realism. A single configurable default delay (PM-1) covers the same need more cleanly. |
| Metro bundler plugin to strip fake adapter (ENG-5) | 175 | Important for production hygiene but premature — the app is not yet in production. The EAS build matrix (`EXPO_PUBLIC_USE_DEMO` unset in production) provides sufficient protection. Revisit before first store submission. |
| Fake match fallback in `inFallback` state (PM-5) | 168 | Conflates dev tooling with production UX. The fallback screen should communicate a real error, not offer a demo shortcut. Architecturally wrong direction. |

---

## Recommended Build Order

Given the ICE ranking and the dependency graph:

1. **ENG-4** — Move `DEMO_DRIVER` → `FAKE_DRIVERS` fixture in `@rentascooter/shared` (data layer, no behaviour change, 15 min)
2. **ENG-1** — Extract `FakeMatchingAdapter` from `matchingService.ts`, wire `FAKE_DRIVERS[0]` (structural refactor, 45 min)
3. **PM-1** — Add `EXPO_PUBLIC_FAKE_MATCH_DELAY_MS` env-var read inside `FakeMatchingAdapter` (10 min)
4. **PD-1** — Add ETA countdown to `DriverReveal` (thread `etaSeconds` from `MatchingEvent`; `useState` + `setInterval` in component, 60 min)
5. **PD-4** — Wire `matchedDriver.location` to Mapbox camera + driver pin annotation (60–90 min, depends on `DriverMarkers` pattern)

Total estimated effort for all five: ~3.5–4 h of focused work. Unlocks a fully reviewable `searching → matched` UI state with no backend dependency.

---

*Generated by PM Ideation Pipeline — Glidey Fake Driver Match*
