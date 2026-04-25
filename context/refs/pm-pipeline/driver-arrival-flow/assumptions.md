# PM Assumption Analysis — Driver Arrival Flow

**Feature:** Driver arrival flow — minimisable matched modal, late-cancel fee warning, arrived state  
**Date:** 2026-04-22  
**Analyst:** PM Assumption Analyst  
**Codebase grounded:** Yes (BookingSheet.tsx, rideStore.ts, trackingService.ts, matchingService.ts, shared types/constants)

---

## How to read this document

Each assumption is something the feature spec takes for granted. The confidence rating reflects how well-supported the assumption is by existing code or prior art in this repo. Low confidence = validate before building; high confidence = proceed but verify in QA.

---

## A-01 — The FSM has no `driver_arrived` state; arrival is purely client-derived from ETA reaching zero

**Assumption:** The "Driver arrived and waiting" state is triggered client-side when `etaSeconds` counts down to zero (or when the tracking poll returns `etaSeconds === 0`), not by a dedicated server-pushed event or a new `RideState` enum value.

**Evidence against this assumption:**
- `RideState` in `packages/shared/src/types/index.ts:306–313` lists: `idle | searching | matched | pickup_en_route | completed | cancelled | failed`. There is no `driver_arrived` state.
- `RIDE_CONFIG.ARRIVAL_RADIUS_METERS: 50` exists in constants, implying geo-fence logic is intended somewhere — but it is not wired into the client FSM.
- `NotificationType` in the same file includes `driver_arrived` and `driver_arriving` as push notification types (line 276), suggesting the backend _does_ model arrival as a distinct event — but push notifications are currently disabled (`expo-notifications` plugin commented out in `app.config.js`).
- `matchingService.ts` maps WS events `ride:accepted | ride:cancelled | ride:started | ride:completed` — no `ride:arrived` event is in the current contract.
- `trackingService.ts` demo path decrements `etaSeconds` by 5 every 5 s starting from 300 — arrival is never explicitly signalled; it just reaches zero.

**Confidence: LOW**

The backend _appears_ to have an arrival concept (push type exists, ARRIVAL_RADIUS_METERS constant exists) but the client-side FSM and WS event contract have no arrival state. If the backend emits `ride:arrived`, the client will silently ignore it. The two sources of arrival signal (ETA = 0 vs. server event) may fire at different times and produce an inconsistent UX.

**Fast test:** Ask the backend team to confirm whether the Spring Boot monolith emits a WS event for driver arrival. If yes, add `ride:arrived` to `matchingService.ts` event handling and a corresponding `driver_arrived` state (or sub-state) to `rideStore.ts` before building any UI for this state.

---

## A-02 — ETA countdown in BookingSheet is purely local and diverges from real driver position

**Assumption:** The `etaS` countdown in `BookingSheet.tsx` (line 396–400) is a good-enough proxy for the driver's actual arrival time and can safely gate the "arrived" state.

**Evidence against this assumption:**
- `etaS` is initialised from `matchedDriver.etaSeconds ?? 300` and decrements by 1 every second via `setInterval` — it is pure local state with no re-synchronisation from `trackingService`.
- `trackingService` delivers `TrackingPositionUpdate.etaSeconds` on every poll/WS frame, but `BookingSheet` does not consume the tracking stream — it only reads the initial `matchedDriver.etaSeconds` set at match time.
- A driver stuck in traffic, taking a detour, or accepted from further away than the demo's fixed 300 s will cause the local countdown to hit zero while the driver is still minutes away, falsely triggering the "arrived" state.

**Confidence: LOW**

**Fast test:** In demo mode, manually set `DEMO_DRIVER.etaSeconds = 30` and observe whether the UI switches to "arrived" state exactly when the local countdown expires, then add a log that also prints the tracking service's last-known `etaSeconds`. If they diverge, the arrived trigger must be moved to the tracking subscription, not the local countdown.

---

## A-03 — The mini snap in `matched` state shows meaningful content with the current sheet architecture

**Assumption:** Collapsing the matched modal to `mini` (100 px) is useful — the rider can glean enough information from the mini bar to justify keeping the gesture available.

**Evidence against this assumption:**
- The existing mini body (`BookingSheet.tsx:558–587`) is built for the _booking_ mode: it shows destination name, a "Réserver" button, and a cancel button. None of this is appropriate for the matched state.
- The matched body (`line 529–557`) renders a driver card + ETA block + cancel button — all of which disappear at mini height. The current code has no matched-specific mini body; it would fall through to the booking mini body, showing a "Réserver" button while a ride is already active.
- The UX spec (`unified-booking-modal/ux-spec.md`) defines `matching` as valid at mini snap but does not specify what content appears there.
- The PRD (US-1) says mini snap is allowed for `matched`, but does not define the copy for the peek strip, listing it as Open Question #4.

**Confidence: LOW**

**Fast test:** Set `rideState` to `matched` in demo mode, drag the sheet to mini, and screenshot the result. The current code will show the booking mini bar with a "Réserver" button — a clear regression. Define the mini/matched content (driver name + "En route" label + ETA chip) before implementation begins, otherwise the gesture is technically available but visually broken.

---

## A-04 — The cancel confirmation dialog already handles the fee-warning copy requirement with a text change only

**Assumption:** The existing `confirmCancelOpen` dialog in `BookingSheet.tsx` (lines 609–639) is the right component to extend for the late-cancel fee warning — it just needs new copy injected.

**Evidence against this assumption:**
- The current dialog body (`line 614–616`) reads: "Votre demande sera supprimée et aucun conducteur ne pourra l'accepter." This is only appropriate for the `searching` state (pre-match). For the `matched` state, the PRD requires different copy: "Vous serez facturé des frais d'annulation."
- The dialog is rendered unconditionally from a single `confirmCancelOpen` boolean, with no awareness of `rideState`. A single-boolean flag cannot express "show generic cancel" vs. "show fee warning cancel."
- The dialog is rendered inside the sheet's `GestureDetector` subtree via a sibling `<>` fragment, meaning it sits on top of the sheet but not above the system safe-area or other overlays — if the sheet is at mini snap when cancel is tapped, the dialog may clip.
- There is no `isCancellationFeeApplicable` field from the backend — the dialog would always show the warning copy post-match, even if the backend would not charge (e.g., driver was >10 min late).

**Confidence: MEDIUM**

The extension path exists but requires branching the dialog on `rideState`, updating copy, and confirming whether the fee is always charged post-match or conditional on driver behaviour.

**Fast test:** Add `rideState` as a prop to the cancel confirmation block and conditionally render the fee-warning copy string. QA by triggering cancel in both `searching` and `matched` states in demo mode to confirm correct copy per state.

---

## A-05 — Blocking dismiss in `matched` state is fully achievable with the existing pan gesture guard

**Assumption:** Setting `isBookingModeShared.value = 1` in the worklet (which already clamps to mini, not off-screen) is sufficient to prevent all dismiss paths in the `matched` state.

**Evidence against this assumption:**
- The current gesture guard (`BookingSheet.tsx:316–329`) fires when `isBookingModeShared.value === 1` — it only covers the Reanimated pan gesture on the handle. It does not cover:
  1. Android hardware back button / predictive back gesture (PRD explicitly defers this to "nav hardening epic").
  2. Expo Router's default `onDismiss` for modal-style routes — if the sheet is ever lifted into a modal route, the router can dismiss it.
  3. The `onDismissToSearch` prop path, which currently triggers `triggerDismiss()` on fast downward flick from mini (`line 332–335`). In `matched` state, `isBookingModeShared.value === 1` prevents reaching that branch — but only while the gesture is handled by the pan responder.
  4. Programmatic `setSheetMode('idle')` calls from parent components — no guard exists at the store level.

**Confidence: MEDIUM**

The gesture path is guarded. The Android back button path is explicitly out of scope in the PRD, which is a documented risk. The programmatic path is unguarded.

**Fast test:** In demo mode with `rideState === 'matched'`, test: (1) swipe down hard — should stop at mini; (2) on Android, press hardware back — document current behaviour; (3) find all call sites of `setSheetMode('idle')` in the parent map screen and confirm none fire during matched state.

---

## A-06 — Demo mode can reliably exercise the arrived state within a reasonable wait time

**Assumption:** The demo tracking path (5 s interval, 300 s initial ETA) will reach `etaSeconds === 0` in demo sessions, allowing QA to test the arrived state without code changes.

**Evidence against this assumption:**
- At 5 s intervals decrementing by 5 s each tick, reaching 0 from 300 takes exactly 300 s (5 minutes) of continuous app foreground time.
- `expo-keep-awake` is activated during tracking, preventing screen sleep, but 5 minutes is an impractical QA wait time.
- The PRD success metric requires a "CI smoke test" that all 3 states are reachable — a 5-minute wait is incompatible with CI.
- There is no demo shortcut to jump to `etaSeconds === 0` or to the arrived state.

**Confidence: LOW**

**Fast test:** Add a `DEMO_ARRIVAL_DELAY_MS` environment variable (e.g., `EXPO_PUBLIC_DEMO_ARRIVAL_DELAY_MS=15000`) that overrides the initial ETA in demo tracking, defaulting to 15 s for development and CI. This is a one-line change in `trackingService.ts` and unblocks all QA and CI requirements.

---

## A-07 — The `pickup_en_route` FSM state maps cleanly to "arrived" — no sub-state or new state is needed

**Assumption:** The arrived UI can be keyed off `rideState === 'pickup_en_route'` combined with `etaSeconds === 0`, without needing a new `driver_arrived` FSM state or a rideStore transition.

**Evidence against this assumption:**
- `RideState` has `pickup_en_route` which the PRD says is "active" (driver moving toward rider). The arrived condition is a sub-state of `pickup_en_route`, not a distinct FSM state.
- However, `pickup_en_route` in the current FSM is only reachable via `confirmPickup()` (`pickupService.ts:21–35`) — a separate user action where the _rider_ confirms the pickup point. This is the _departure_ event, not the _arrival_ event.
- The state machine: `matched → pickup_en_route → completed`. According to the existing code, `pickup_en_route` means the ride is _in progress_ (driver + rider moving to destination), not "driver waiting at pickup."
- Using `etaSeconds === 0` inside `pickup_en_route` for "arrived" contradicts this: `etaSeconds` in `TrackingPositionUpdate` measures time to pickup, but `pickup_en_route` means the rider is already in the vehicle.

**Confidence: LOW** — this is a significant semantic ambiguity in the FSM.

**Fast test:** Confirm with the backend team: what server-side state does the ride enter when the driver reaches the pickup point but before the rider boards? Is it still `accepted` (client: `matched`) or does it transition to a new state? The answer determines whether a new `driver_arrived` FSM state is needed or whether arrival is truly a UI-only overlay on `matched`.

---

## A-08 — The cancel button being "unmounted" (not hidden) in the arrived state is straightforward to implement

**Assumption:** The PRD's requirement that "cancel CTA is unmounted (not hidden via opacity)" in the arrived state is easily satisfied because the arrived body is a new component branch that simply does not include the cancel button.

**Evidence against this assumption:**
- The current matched body (`BookingSheet.tsx:529–557`) has the cancel button hardcoded as the last child of the body `View`. If the arrived state is implemented as a conditional rendering branch inside the same matched body, there is a risk that a developer uses `opacity: 0` / `pointerEvents: 'none'` rather than unmounting — especially under time pressure.
- There is no test infrastructure (no Detox, no Jest component tests) currently in the repo (`CLAUDE.md`: "No test runner is currently configured"). The PRD success metric ("Cancel CTA absent in 100% of arrived-state renders — Detox assertion in CI") has no test infrastructure to run against.
- The `confirmCancelOpen` state variable persists in component state — if the cancel dialog is open when the arrived state is entered (race: rider taps cancel at the same moment ETA hits 0), the dialog will remain visible even though the arrived body has no cancel button.

**Confidence: MEDIUM**

**Fast test:** Define the arrived state as a top-level conditional branch (`if (isArrived) return <ArrivedBody />`), making it structurally impossible for the cancel button to leak in. For the race condition: call `setConfirmCancelOpen(false)` inside the `useEffect` that detects the arrived state transition.

---

## A-09 — Snap-level behaviour in the arrived state is sufficiently specified ("peek or full, never mini-only")

**Assumption:** The PRD's constraint "snap level stays at peek or full, never mini-only" for the arrived state is unambiguous and implementable with the existing snap guard.

**Evidence against this assumption:**
- The PRD says "never mini-only" but does not say what happens if the sheet _is already_ at mini when the arrived state is entered (e.g., rider minimised the sheet while watching the driver approach and ETA hits 0 while minimised).
- There is no automatic snap-up logic in the current `BookingSheet` — snap changes only happen on gesture end or mode change. An arrived transition would need to programmatically call `snapToPeek()` if the current snap is `mini`.
- The PRD does not specify whether the arrived state should auto-expand (potentially jarring if the rider is interacting with something else on screen) or stay at mini until the rider swipes up.

**Confidence: MEDIUM**

**Fast test:** In demo mode, set snap to mini then trigger the arrived state. Document current behaviour (sheet stays at mini, arrived content renders at 100 px — likely unreadable). Decide: auto-expand with haptic feedback, or allow mini but show a condensed arrived indicator. This decision must be made before implementation.

---

## A-10 — The fee warning copy "Vous serez facturé des frais d'annulation" is legally and commercially accurate

**Assumption:** Displaying this string to riders is safe — the platform actually charges a cancellation fee post-match, the fee amount/policy is defined, and legal has approved this copy.

**Evidence against this assumption:**
- The backend has no cancellation fee logic visible in the client codebase — `cancelRide()` in `bookingService.ts` calls `PATCH /rides/:id/cancel` with no fee parameter.
- The PRD explicitly scopes out "Actual fee calculation or backend charge logic" — meaning the warning string will be displayed even though no fee is currently implemented.
- In Senegal, consumer-facing fee notices may require regulatory disclosure of the fee amount. Generic copy without an amount may be misleading if the fee is not actually charged.
- Riders who see the warning and are not charged will learn to ignore it, degrading its deterrence value when fees are eventually implemented.

**Confidence: LOW**

**Fast test:** Before shipping the warning copy, confirm in writing with product and legal: (1) Is a cancellation fee currently charged in production? (2) If not, should the copy say "des frais d'annulation pourront être appliqués" (future tense / conditional) instead? (3) Is a fee amount required in the copy? Ship the copy only after confirmation.

---

## A-11 — The gesture for minimising the matched modal ("same gesture as booking modal") works correctly when the sheet is in `matching` sheetMode

**Assumption:** The existing `isBookingModeShared` worklet guard, which fires when `sheetMode === 'booking' || sheetMode === 'matching'`, correctly enables the mini snap for the matched FSM state because the sheet will be in `matching` sheetMode when `rideState === 'matched'`.

**Evidence against this assumption:**
- `sheetMode` (`uiStore`) and `rideState` (`rideStore`) are separate stores with no synchronisation logic between them. A transition to `rideState === 'matched'` does not automatically set `sheetMode = 'matching'`.
- In `BookingSheet.tsx`, the `isBookingModeShared` worklet value is set from `sheetMode` (UI store), not from `rideState` (ride store). If the parent component fails to call `setSheetMode('matching')` when the ride transitions to `matched`, the gesture guard will not activate and the sheet will remain dismissable.
- There is no enforced binding between `rideState` transitions and `sheetMode` updates in the current codebase — the mapping lives in parent component logic that is not visible in the files reviewed.

**Confidence: MEDIUM**

**Fast test:** Search the map screen (`app/(main)/index.tsx`) for the `useEffect` that calls `setSheetMode('matching')` on `rideState === 'matched'`. If it is missing or the condition is wrong, the gesture guard for the matched state is broken from day one. Add an integration test: simulate the `matched` transition in demo mode and assert that `useUIStore().sheetMode === 'matching'`.

---

## A-12 — `TrackingPositionUpdate.etaSeconds` is a reliable signal for the arrived UI trigger across both WS and polling paths

**Assumption:** Whether the client is on the WebSocket path or the polling fallback (5 s interval), `etaSeconds` from `trackingService` will reliably reach and sustain `0` to trigger the arrived state, not oscillate around zero or jump from a positive value past zero.

**Evidence against this assumption:**
- The polling path polls `GET /rides/:rideId/position` every 5 s. If the driver arrives in the interval between polls, the client may receive `etaSeconds = 12` then `etaSeconds = 0` in the next poll — a clean zero crossing. But if the backend rounds or re-computes ETA after arrival, it could return a small positive value (e.g., 3 s) in a subsequent poll even after the driver has stopped, causing the arrived state to flicker on and off.
- The WS path has no guaranteed delivery — a missed frame means the client may never receive `etaSeconds = 0` and instead see `etaSeconds = 5` then silence.
- The demo path decrements discretely by 5 s per tick, so it hits exactly 0 — but real GPS-derived ETAs are continuous and may never be exactly 0 from the server.
- There is no hysteresis or "latched" arrived state in the current code — if `etaSeconds` returns to a positive value after hitting zero (driver circling, GPS jitter), the arrived UI would be dismissed.

**Confidence: LOW**

**Fast test:** Define the arrived trigger as "ETA has been ≤ 0 _or_ a `ride:arrived` WS event was received" with a latch: once arrived, do not revert. Implement as `const [hasArrived, setHasArrived] = useState(false)` that is set to true when the condition is first met and never reset to false during the same ride. Test in demo mode by manually injecting a positive ETA after the arrived state is entered and confirm the UI does not revert.

---

## Summary Table

| ID | Assumption | Confidence | Priority to validate |
|---|---|---|---|
| A-01 | Arrival triggered by ETA=0 (no server event) | LOW | P0 — blocks architecture |
| A-02 | Local ETA countdown is accurate enough to gate arrived state | LOW | P0 — blocks trigger design |
| A-07 | `pickup_en_route` = arrived sub-state (no new FSM state needed) | LOW | P0 — blocks FSM design |
| A-10 | Fee warning copy is legally/commercially safe to ship | LOW | P0 — legal risk |
| A-12 | `etaSeconds = 0` is a reliable, non-oscillating arrived signal | LOW | P0 — blocks trigger reliability |
| A-03 | Mini snap shows useful content in matched state | LOW | P1 — UX regression if wrong |
| A-06 | Demo mode can exercise arrived state in practical time | LOW | P1 — blocks QA and CI |
| A-04 | Existing cancel dialog is the right extension point | MEDIUM | P1 — implementation path |
| A-05 | Pan gesture guard covers all dismiss paths | MEDIUM | P1 — safety requirement |
| A-08 | "Unmounted" cancel button is structurally guaranteed | MEDIUM | P1 — PRD correctness |
| A-09 | Snap behaviour on arrived entry is specified | MEDIUM | P2 — UX polish |
| A-11 | `sheetMode` and `rideState` stay in sync for gesture guard | MEDIUM | P1 — gesture correctness |
