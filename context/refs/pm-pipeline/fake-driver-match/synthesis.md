# Synthesis: Fake Driver Match

## Key Finding
The feature is ~80% built. `matchingService.ts` already has a demo branch (`EXPO_PUBLIC_USE_DEMO`) that fires a `DEMO_DRIVER` fixture. The two real gaps are:
1. The delay is 9 s (3 × 3 000 ms) — needs to be 2–3 s
2. The matched-state screen (`DriverReveal`) is incomplete — no ETA countdown, no camera fly-to, no driver pin animation on map

## Recommended Features (top 3)
1. **FakeMatchingAdapter** — extract the demo branch behind a clean `subscribeToMatching` interface; wire `EXPO_PUBLIC_FAKE_MATCH_DELAY_MS` env var for configurable delay; guard production builds
2. **DriverReveal completion** — ETA countdown timer, driver info card with initials avatar fallback, haptic feedback on match
3. **Map integration at match** — animated driver pin placed at match coordinates; Mapbox camera fly-to driver position

## Key Risks to Address in Spec
- Demo mode must be stripped from production (EAS profile guard)
- Camera fly-to not yet wired — `DriverReveal` only renders card, no `setCamera` call
- French/English string mixing — `completedRides` renders in English while all modal copy is French
- Cancel path after match fires — confirm button, cancel dialog behaviour must be defined

## Constraints
- Must work exclusively under `EXPO_PUBLIC_USE_DEMO=true` — zero impact on production path
- Must compose with existing `rideStore` FSM (`searching → matched`), `useMatching` hook, and `DriverReveal` component without restructuring them
- No backend changes — entirely client-side

## Suggested Domain Decomposition
- **Domain A: mock-matching** — FakeMatchingAdapter, FAKE_DRIVERS fixture, delay config, demo guard
- **Domain B: driver-reveal-ui** — DriverReveal card completion (ETA countdown, avatar, haptics), driver map pin animation, camera fly-to on match

## Success Criteria Candidates
- Booking → searching → matched transition completes in ≤ 3 s under demo mode
- DriverReveal shows name, vehicle, ETA countdown, avatar (or initials fallback)
- Map camera flies to driver position on match; driver pin visible
- No mock code reachable in production (`EXPO_PUBLIC_USE_DEMO` absent from prod EAS profile)
- All strings in French
