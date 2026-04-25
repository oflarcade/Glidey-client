---
feature: Fake Driver Match (Mock Acceptance Flow)
created: "2026-04-22"
phase: 4
scope: |
  When the client books a ride and enters `searching` state, after a short delay (2–3 s)
  automatically fire a fake "driver matched" event with hardcoded driver data so the
  client UI can be completed without the real driver app or backoffice.
  Tech surface: matchingService.subscribeToMatching → useMatching hook → rideStore
  (idle→searching→matched) → DriverReveal component + DriverCard.
code_anchors:
  - services/matchingService.ts — demo path already exists (lines 69-86, EXPO_PUBLIC_USE_DEMO)
  - hooks/useMatching.ts — ATTEMPT_MS=30 000, MAX_ATTEMPTS=3, resolvedRef pattern
  - packages/shared/src/stores/rideStore.ts — FSM guard, MatchedDriver shape
  - components/DriverReveal/DriverReveal.tsx — visible prop, spring animation
  - packages/ui/src/components/DriverCard/DriverCard.tsx — full card shape (name, plate, type, rating, completedRides, profilePhoto)
  - utils/mockDrivers.ts — Senegalese name/plate fixture convention already established
---

# Fake Driver Match — PM Assumption Analysis

## Context

The feature re-uses the **demo path that already ships in `matchingService.ts`** (`EXPO_PUBLIC_USE_DEMO=true`, lines 69–86).
That path fires `{ state: 'matched', driver: DEMO_DRIVER }` after 3 × 3 s delays with no HTTP or WebSocket traffic.
The `DEMO_DRIVER` fixture (`matchingService.ts:52-61`) fully satisfies the `MatchedDriver` shape consumed by `DriverReveal` and `DriverCard`.
The fake-driver-match feature is therefore largely a **configuration / UX decision**, not a net-new build — the primary unknowns are product and team assumptions, not feasibility.

---

## Assumption Register

| # | Category | Assumption | Confidence | Code / Evidence Anchor | Fast Test / Experiment |
|---|----------|-----------|------------|------------------------|------------------------|
| 1 | **Value** | Unblocking the client UI now — before a real driver app exists — will let the team validate the full rider journey (search → match → driver card → countdown) and surface UX gaps early enough to fix them before integration. | MEDIUM | The `rideStore` FSM already enforces `searching → matched → pickup_en_route` transitions (`rideStore.ts:5-10`). Without a fake match there is no way to reach `matched` state in a device build. | Run a 30-min internal walkthrough session on a dev build with `EXPO_PUBLIC_USE_DEMO=true`. Count UI issues discovered vs. issues found previously on the booking screen alone. If the ratio is >3:1, the unlock is delivering disproportionate discovery value. |
| 2 | **Value** | The 2–3 s fake delay is short enough to feel "real" during demos and stakeholder reviews, but not so instant that it looks scripted. | MEDIUM | Current demo path fires every 3 000 ms × 3 iterations = resolves at 9 s (`matchingService.ts:79`). The feature brief calls for 2–3 s direct. These are misaligned. | Show three demo variants (1 s / 3 s / 9 s) to 5 internal stakeholders in a quick preference vote. Pick the winner; make the delay a single named constant so it can be tuned without a code search. |
| 3 | **Usability** | Riders will understand that the "Recherche d'un conducteur…" modal is temporary and will resolve on its own — they will not tap Cancel thinking the app has hung. | LOW | `MatchingModal.tsx:47-58` shows a `RetryTimeline` with attempt text ("Tentative 1 sur 3"). The fake match resolves before attempt 2. But there is no ETA or "usually takes X seconds" copy. | Unmoderated test: hand 5 non-technical testers a device. Ask them to book a ride and observe body language during the 2–3 s wait. Flag any who reach for Cancel or look confused before the card appears. |
| 4 | **Usability** | The `DriverReveal` slide-up animation (spring, tension 60, friction 10, from translateY 200) will feel smooth and not jarring after a 2–3 s search — riders will associate the animation with a positive "found you a driver" moment. | MEDIUM | `DriverReveal.tsx:21-27` uses `Animated.spring`. The existing spring config is untested on low-end Android (Tecno Spark class devices common in Dakar). React Native's JS-thread spring can drop frames on cold-start renders. | Profile the DriverReveal animation on a mid-range Android (≤4 GB RAM) using the React Native Performance Monitor. If frame rate drops below 55 fps, switch `useNativeDriver: true` (already set) is in place — check if the transform is hardware-accelerated correctly or if elevation/shadow is forcing a re-layout. |
| 5 | **Usability** | The `DriverCard` "completed rides" counter showing `142` (the current `DEMO_DRIVER` fixture value in `matchingService.ts:60`) and a 4.8 rating will read as plausible and credible to Senegalese riders, not obviously fake. | LOW | `mockDrivers.ts:17` uses local Senegalese names (Moussa D., Fatou N., Ibrahima S.). But `DEMO_DRIVER.name` is "Moussa Diallo" with plate "DK-1234-A" — consistent with the Dakar plate convention. The avatar falls back to a deterministic color avatar (`DriverCard.tsx:27-29`). | Show the card to 5 Dakar-resident testers and ask "does this look like a real driver profile?" Record yes/no and the first thing they say. If >2 flag it as fake, revise the fixture data (name variety, plate format, ride count range). |
| 6 | **Viability** | Keeping `EXPO_PUBLIC_USE_DEMO=true` scoped to dev/preview EAS builds (not production) is sufficient — there is no risk of the fake match path shipping to end users. | HIGH | `CLAUDE.md` documents: "Dev/preview EAS builds use demo; production does not." The guard is a single `process.env` check (`matchingService.ts:70`). Dead-code elimination in the Metro production bundle will strip the demo path entirely if the env var is absent. | Add a CI check (or `eas.json` build profile validation) that asserts `EXPO_PUBLIC_USE_DEMO` is absent from the `production` profile. One-line shell check: `grep -r "EXPO_PUBLIC_USE_DEMO" eas.json` and fail the pipeline if it appears in the production profile. |
| 7 | **Viability** | The hardcoded `location: { latitude: 14.6961, longitude: -17.4473 }` on `DEMO_DRIVER` (Dakar city centre) will not cause errors if the map camera re-centers on it — the coordinate is within the Mapbox viewport range and will not break the map when `DriverReveal` is shown. | MEDIUM | Kit R4 AC5 requires "map camera re-centers on the driver's latitude/longitude at the moment the match event is processed." `DriverReveal.tsx` does not implement the camera move — it only renders the card. The camera re-center logic has not been identified in the audited files. | Grep for `setCamera` / `flyTo` / `moveTo` in the booking screen and map component. If camera re-center is not yet wired, add it as a known gap before demo — a missing camera move during a stakeholder demo will look like a bug even if it is not. |
| 8 | **Feasibility** | The existing `useMatching` hook's `resolvedRef` pattern cleanly halts the 30 s × 3 attempt timers when the fake match fires at 2–3 s — there will be no lingering timer callbacks or state updates after the match resolves. | HIGH | `useMatching.ts:30, 47-61` — `resolvedRef.current = true` is checked inside each timer callback before advancing attempt index. `matchingService.ts:82-85` returns a cleanup that clears all timers. The `useEffect` cleanup (`useMatching.ts:74-77`) calls both. This is correctly designed. | Unit test (even a quick manual check): add a `console.log` to the attempt-advance timers; run with demo mode; verify nothing logs after the match fires. |
| 9 | **Feasibility** | The `MatchedDriver` type shape produced by `DEMO_DRIVER` fully satisfies every field consumed by `DriverCard` — there are no TypeScript strict-mode gaps that would surface at runtime. | HIGH | `DEMO_DRIVER` (`matchingService.ts:52-61`) has: `id`, `name`, `vehiclePlate`, `vehicleType`, `rating`, `completedRides`, `profilePhoto: undefined`, `location`. `DriverCard` props (`DriverCard.tsx:7-14`) require: `name`, `vehiclePlate`, `vehicleType`, `rating`, `completedRides`, `profilePhoto?` — all satisfied. `profilePhoto: undefined` triggers the deterministic color avatar fallback (`DriverCard.tsx:40`). | Run `yarn tsc --noEmit` with `EXPO_PUBLIC_USE_DEMO=true` in scope. Zero errors expected. If any appear they will be in `DriverReveal.tsx` where `location` is not currently consumed. |
| 10 | **Ethics** | Showing fake driver data (a person who does not exist, with a made-up rating and ride count) in a prototype demo will not mislead real users or create false expectations about the driver pool quality that are later disappointed at launch. | MEDIUM | The feature is explicitly scoped to dev/preview builds. However, if a prototype demo video leaks or is used in marketing materials, "Moussa Diallo — 4.8 stars — 142 rides" could set an expectation of high-quality, high-volume supply that does not exist at launch. | Establish a policy: demo recordings are marked "prototype — not final supply." If the app is ever shown to press or investors, use a disclaimer slide. Consider varying the fixture rating (e.g., 4.3) and ride count (e.g., 37) to something less "too good to be true." |
| 11 | **Go-to-Market** | The fake match flow gives the team enough fidelity to conduct meaningful stakeholder demos and investor previews before the real driver app is built — the mock state is indistinguishable from a real match at the UI level. | MEDIUM | `DriverCard.tsx:62` shows `{completedRides} rides` in English. All other UI strings in `MatchingModal.tsx` are in French ("Recherche d'un conducteur…", "Tentative 1 sur 3"). This language inconsistency will be noticed in a live demo. | Audit all strings visible during the fake match flow for language consistency before any external demo. At minimum, `completedRides` → "trajets" in French. Check `RetryTimeline` text and any toast messages triggered on match. |
| 12 | **Team** | The team has sufficient context on the existing demo-mode architecture (`EXPO_PUBLIC_USE_DEMO` env var, `matchingService.ts` demo path) to implement the 2–3 s fake match without inadvertently breaking the real WebSocket/polling path or adding a third code branch. | HIGH | `matchingService.ts` already has exactly one demo branch (lines 69-86) and one real branch (lines 88-188). The feature only requires adjusting the delay constant (currently 3 000 ms × 3 = 9 s total; brief calls for 2–3 s direct) and potentially adding an ETA field to `DEMO_DRIVER`. No new service, hook, or component is needed. | Time-box the change to 30 min. If it takes longer than that it is a signal that the demo-path structure is less understood than assumed and needs a brief onboarding session before implementation. |

---

## Risk Heat Map

| Confidence \ Impact on Feature Success | High Impact | Medium Impact |
|----------------------------------------|-------------|---------------|
| **LOW confidence** | #3 Riders misread the search modal as hung — tap Cancel prematurely | #5 Fixture data reads as obviously fake to Dakar testers |
| **MEDIUM confidence** | #2 Delay length misaligned with spec (9 s vs 2–3 s today) — will look broken in demos | #4 Spring animation jank on low-end Android, #7 Camera re-center not wired, #10 Fake persona leaks into marketing, #11 Language inconsistency in live demo |
| **HIGH confidence** | — | #6 Demo env var scoping, #8 Timer cleanup correctness, #9 TypeScript shape coverage, #12 Team implementation time |

---

## Recommended Test Priority (before first stakeholder demo)

1. **#2 Delay calibration** — change the demo path to fire once after 2 500 ms (single `setTimeout`), not after 3 × 3 s. This is a one-line change in `matchingService.ts:79` and is the highest-visibility fix.
2. **#7 Camera re-center gap** — grep the booking screen for `setCamera`/`flyTo`; wire the Mapbox camera move on `matched` transition before any demo or the map will visually ignore the driver position.
3. **#11 Language consistency** — audit every string visible during the 2–3 s flow for French/English mixing before an external audience sees it.
4. **#3 Usability test** — 30-min hallway test with 5 people; costs almost nothing and directly validates the most uncertain user assumption.
5. **#6 CI guard** — one shell check in the build pipeline; prevents the only scenario where this feature could harm production users.

---

## Out of Scope for This Analysis

- ETA countdown timer on the driver card (not yet in `DriverReveal.tsx` or `DriverCard.tsx` — tracked separately)
- Push notification on match (disabled per `CLAUDE.md` — entitlement stripped)
- Server-side matching algorithm design
- Real driver app / backoffice integration timeline
