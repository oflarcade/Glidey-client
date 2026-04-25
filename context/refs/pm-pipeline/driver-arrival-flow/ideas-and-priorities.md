# Driver Arrival Flow — PM Ideation & ICE Prioritization

**Feature scope:** Three interlocking UX states inside the existing `BookingSheet` (Reanimated, snap levels: mini/peek/full):
1. **Matched state is minimisable but never dismissable** — the sheet is pinned to mini/peek only; the gesture worklet already enforces this (`isBookingModeShared.value === 1` branch). The mini strip must carry enough ambient info to be useful.
2. **Cancellation fee warning after driver accepted** — once `rideState === 'matched'`, tapping "Annuler la course" must surface a fee-disclosure step before the confirmation dialog, not skip straight to the existing `confirmCancelOpen` overlay.
3. **"Conducteur arrivé" state replaces matched body when driver arrives** — a new `rideState === 'arrived'` (or equivalent field on `matchedDriver`) replaces the ETA countdown block; the cancel button is removed entirely; the sheet body shifts to a "your driver is here" UI.

**Codebase anchors:** `BookingSheet.tsx` (snap gesture worklet, `isMatched`, `etaS` countdown, `confirmCancelOpen` dialog), `MatchingModal.tsx` (legacy modal — will be superseded by BookingSheet matched state), `useMatching` hook, `useUIStore` (`sheetMode`), `MatchedDriver` type (`@rentascooter/shared`), `rideState` prop (string FSM passed from `index.tsx`), `colors.primary.main = #FFC629`, Expo Haptics already imported, demo mode available via `EXPO_PUBLIC_USE_DEMO=true`.

**Stack:** Expo 54, RN 0.81, TypeScript strict, Reanimated 3/4, react-native-gesture-handler, react-native-safe-area-context.

---

## Part 1 — Brainstorm

### Product Manager Perspective (market fit, value creation, competitive edge)

**PM-1 — Graduated cancellation fee disclosure with countdown timer**
In African ride-hailing markets (Bolt, InDrive), cancellation fees after driver acceptance are a leading source of negative reviews when they feel "hidden." Rather than a flat warning, show a real-time countdown: "Annulation gratuite pendant encore 45 s" that ticks down from a configurable free-cancel window (e.g. 60 s post-match), then flips to "Frais d'annulation : 500 XOF s'appliquent." The fee amount comes from the fare estimate already in state; the timer starts from the `matchedAt` timestamp on the `MatchedDriver` object. This transforms a punitive message into a trust signal — it shows Glidey is being fair, not trapping the user.

**PM-2 — "Conducteur arrivé" push-style ambient notification strip**
When the driver marks arrival (`rideState === 'arrived'`), most users have the phone pocketed. A push notification is already out of scope (entitlement stripped). Instead, use an on-screen ambient banner — a full-width yellow (`#FFC629`) strip that slides down from the top of the map (independent of the BookingSheet) and fires a sustained haptic pattern (`notificationAsync(Success)` × 2 with 400 ms gap). The BookingSheet simultaneously snaps from mini to peek to show the "Conducteur arrivé" body. This two-surface announcement pattern mimics what push notifications would do, without requiring the entitlement. High impact in a market where riders often minimise the app.

**PM-3 — Driver contact surface at arrival (WhatsApp deep-link)**
WhatsApp penetration in Senegal exceeds 90%. At the "Conducteur arrivé" state, the cancel button disappears and is replaced by "Contacter le conducteur" which opens `https://wa.me/<driverPhone>?text=Je+suis+prêt%2C+où+êtes-vous+%3F`. Phone number comes from `MatchedDriver.phone` (field to be added to the type). This is the most culturally resonant contact method — riders and drivers already coordinate via WhatsApp in the informal moto-taxi market. Differentiates Glidey from Uber/Bolt which lock communication inside the app.

**PM-4 — Mini-strip ambient state for matched + arrived**
The mini snap (100 dp) currently shows a generic destination strip with a "Réserver" button. In matched/arrived states this is useless. Replace the mini body with state-aware content: matched → driver initials avatar + "Arrivée dans Xm" (same `etaS` value, formatted); arrived → yellow dot + "Conducteur arrivé — appuyez pour agrandir". This gives the rider a glanceable status without expanding the sheet, which is especially valuable when the phone is held at arm's length in a busy street.

**PM-5 — Post-arrival ride-start confirmation handshake**
After "Conducteur arrivé," require the rider to tap "Démarrer la course" to confirm they've boarded. This event fires a `POST /rides/:id/start` that timestamps the actual ride start vs. driver arrival — generating a "wait time" metric. In Dakar, wait times are a known pain point; capturing this data enables a future "driver waited X min" trust badge on driver profiles. The button replaces the cancel CTA and is styled as the primary action (yellow, full-width) so it cannot be confused with a confirmation step.

---

### Product Designer Perspective (UX, onboarding, engagement loops)

**UX-1 — ETA countdown morphs into "Arrivée imminente" pulse at <60 s**
The current matched body shows `etaS >= 60 ? '${Math.floor(etaS / 60)} min' : 'Arrivée imminente'` as plain text. Enhance: when `etaS < 60`, the ETA value text scales up (Reanimated `withSpring` on font scale shared value), turns yellow (`colors.primary.main`), and pulses gently (`withRepeat(withSequence(withTiming(1.05), withTiming(1.0)), -1)`). No layout shift — the text stays in the `matchedEtaBlock`. This creates a natural anticipation ramp without introducing new UI elements. "Arrivée imminente" is already the copy; the animation is the only addition.

**UX-2 — "Conducteur arrivé" body replaces matched body with a cross-fade + icon burst**
When `rideState` transitions to `'arrived'`, fade out the matched body (driver row + ETA block + cancel btn) and fade in the arrived body using `useAnimatedStyle` on a `modeProgress`-style shared value (same pattern already used for search/booking crossfade in `BookingSheet`). The arrived body: a large scooter icon (from `@rentascooter/ui` icon set, `name="scooter"`), bold "Votre conducteur est arrivé !" text, and the primary "Démarrer la course" button. Clean, unambiguous, no cancel affordance. The icon briefly scales from 0.6 → 1.0 on entry (`withSpring`) to celebrate the moment.

**UX-3 — Handle zone "pill" colour-codes the sheet state**
The 40×4 dp drag handle (`styles.handle`) is currently a static `colors.border.light` grey. Make it state-reactive: searching → animated shimmer (yellow → white → yellow loop on `backgroundColor`); matched → solid yellow (`#FFC629`); arrived → green (`#22C55E`). The pill is always visible in booking/matching/arrived modes. Zero new layout; the handle `backgroundColor` becomes an animated value. Riders get a peripheral glance cue about ride state without reading text — important when the sheet is minimised.

**UX-4 — Cancel fee warning as an inline inline stepped view (not another overlay)**
The current cancel flow opens `confirmCancelOpen` as a full-screen `absoluteFillObject` overlay on top of the sheet. For the post-acceptance fee warning, instead of layering a second overlay on top of the existing one, implement it as a two-step inline view *within* the matched body: step 1 shows the fee disclosure + timer (PM-1); step 2 is the existing "Oui, annuler / Non, continuer" buttons. A `cancelStep` state variable (`'idle' | 'fee-warning' | 'confirm'`) drives the render. This avoids z-index issues with two overlays stacking and keeps the gesture context (the sheet) intact throughout.

**UX-5 — Arrived-state map camera re-centres on driver pin**
When `rideState === 'arrived'`, the driver is at or very near the user. The map should auto-zoom to zoom 17 (street level) and centre between the user and driver pins, so the rider can see exactly where the scooter is parked. Expose `onDriverArrived` callback from `BookingSheet` props → call it in `index.tsx` to trigger a `MapboxGL.Camera` `flyTo` with 1.2 s duration. This is the same camera-ref pattern used elsewhere in `index.tsx`. No new RN animation needed — pure Mapbox Camera API.

---

### Engineer Perspective (technical innovation, integrations, platform leverage)

**ENG-1 — `rideState` extended with `'arrived'` + `MatchedDriver.arrivedAt` timestamp**
The current `rideState` prop is a plain string. To support the "Conducteur arrivé" state cleanly, add `'arrived'` to the union type in `@rentascooter/shared` (`Ride.status` and the client-side FSM string). Add `arrivedAt?: number` (Unix ms) to `MatchedDriver`. The booking FSM in `index.tsx` transitions `matched → arrived` when the backend event fires. This is the minimal type extension needed; all three features (non-dismissable sheet, fee warning, arrived body) key off this state. 2-file change: `types/index.ts` in shared package + `index.tsx` FSM handler.

**ENG-2 — Worklet-safe `cancelStep` state machine using `useSharedValue`**
The current `confirmCancelOpen` boolean lives in React state (`useState`). Because the BookingSheet gesture worklet runs on the UI thread, transitions that depend on both gesture position and cancel state can stutter if they cross the JS/UI bridge. Promote `cancelStep` to a `useSharedValue<0 | 1 | 2>()` (0 = idle, 1 = fee-warning, 2 = confirm) and drive the cancel body render via `useAnimatedStyle`. The fee timer (PM-1) can also live as a `useSharedValue<number>` decremented via `useAnimatedReaction` triggered by a `useDerivedValue` on a clock — entirely on the UI thread, no `setInterval` needed. This is a pure Reanimated win: zero JS timer, frame-accurate countdown.

**ENG-3 — `matchedAt` epoch on `MatchedDriver` enables free-cancel window client-side**
The free-cancel countdown (PM-1) requires knowing when the driver accepted. Add `matchedAt: number` (Unix ms) to `MatchedDriver` — set by the backend on the ride document. Client computes `freeCancelEndsAt = matchedAt + FREE_CANCEL_WINDOW_MS` (configurable constant, e.g. 60000). The `useDerivedValue` from ENG-2 derives remaining seconds from `freeCancelEndsAt - Date.now()`. No new API endpoint — the `matchedAt` field piggybacks on the existing ride document the client already reads. 1-field backend addition + shared type update.

**ENG-4 — `isBookingModeShared` worklet value extended for `arrived` state**
The gesture worklet in `BookingSheet` currently locks swipe-to-dismiss via `isBookingModeShared.value === 1` when `sheetMode === 'booking' || sheetMode === 'matching'`. The arrived state must also be locked (no dismiss). Rather than adding a new shared value, extend the existing `isBookingModeShared` semantic: set it to `1` also when `rideState === 'arrived'`. A `useEffect` dependency on `rideState` alongside the existing `sheetMode` effect handles this. The arrived state should additionally lock mini-to-peek collapse: snap only to `peek` (no `mini` allowed when driver is at the door). This is a 4-line change to the existing `useEffect` + a snap-guard condition in `onEnd`.

**ENG-5 — Demo mode `arrivedAt` injection for "Conducteur arrivé" simulation**
The demo mode (`EXPO_PUBLIC_USE_DEMO=true`) currently simulates matching but has no path to the arrived state. Add a demo timer: 20 s after `rideState` transitions to `'matched'` in demo mode, auto-advance to `'arrived'` by setting `matchedDriver.arrivedAt = Date.now()` in the mock FSM. Controlled by a `__DEV__ || isDemoMode` guard so it never ships in production. This makes the entire arrival flow testable without a real driver — critical for QA of the "Conducteur arrivé" UI and the arrival haptics.

---

## Part 2 — ICE Scoring & Prioritization

**Scoring key:** Impact 1–10 (user/business value), Confidence 1–10 (certainty it works as hypothesised), Ease 1–10 (10 = trivial, 1 = very hard). ICE = (I + C + E) / 3, rounded to 1 decimal.

Note: this feature set has hard sequencing dependencies. ENG-1 (type extension) and ENG-4 (gesture worklet extension) are prerequisites for the visible UX features. ICE scores reflect intrinsic value; sequencing is called out in rationale.

| # | Idea | Impact | Confidence | Ease | ICE | Notes |
|---|------|--------|------------|------|-----|-------|
| ENG-1 | `rideState` extended with `'arrived'` + type changes | 9 | 10 | 9 | **9.3** | Prerequisite for all arrived-state UI; 2-file change |
| ENG-4 | Worklet `isBookingModeShared` extended for arrived + snap lock | 9 | 10 | 9 | **9.3** | Prerequisite for non-dismissable sheet in arrived state; 4-line change |
| UX-4 | Inline stepped cancel view (`cancelStep` FSM) | 8 | 9 | 8 | **8.3** | Avoids overlay z-index issues; cleaner than layered modals |
| UX-2 | "Conducteur arrivé" body cross-fade replacing matched body | 9 | 9 | 8 | **8.7** | Core feature requirement; reuses existing crossfade pattern |
| PM-1 | Graduated cancellation fee disclosure with countdown | 8 | 9 | 7 | **8.0** | Trust-critical; requires ENG-3 (`matchedAt` field) as prerequisite |

### Rank order by ICE score

| Rank | Idea | ICE |
|------|------|-----|
| 1 | ENG-1 — `rideState` type extension + `MatchedDriver.arrivedAt` | 9.3 |
| 1 | ENG-4 — Worklet lock extended for arrived state | 9.3 |
| 3 | UX-2 — "Conducteur arrivé" body cross-fade | 8.7 |
| 4 | UX-4 — Inline stepped cancel flow (`cancelStep` state) | 8.3 |
| 5 | PM-1 — Graduated cancellation fee countdown | 8.0 |

---

### Top 5 Rationale

**1–2. ENG-1 + ENG-4 — Type extension and gesture worklet lock (ICE 9.3 each)**
These are the load-bearing prerequisites. Nothing else in this feature set can ship without them. ENG-1 adds `'arrived'` to the `rideState` union and `arrivedAt?: number` to `MatchedDriver` — a mechanical 2-file change in `@rentascooter/shared` that unlocks every conditional render branch across the sheet. ENG-4 extends the existing `isBookingModeShared` worklet value check to include `rideState === 'arrived'` and adds a snap-guard that collapses to `peek` only (no `mini`) once the driver is at the door. Both are high-confidence because they extend existing, already-working patterns (the FSM string and the worklet snap guard) rather than introducing new ones. Ease is 9 for both because the diff is small and the blast radius is contained.

**3. UX-2 — "Conducteur arrivé" body cross-fade (ICE 8.7)**
This is the centrepiece visible feature. The matched body (driver row + ETA block + cancel button) must give way to the arrived body (scooter icon + "Votre conducteur est arrivé !" + "Démarrer la course" primary button, no cancel). The crossfade uses `modeProgress`-style shared values — the exact same pattern already shipping in `BookingSheet` for the search/booking surface swap. Confidence is 9 because the pattern is copy-paste with a different trigger condition. Impact is 9 because it satisfies the hard requirement (no cancel in arrived state) and creates the highest-emotion moment in the ride flow. Ease is 8: new JSX subtree for the arrived body, new `useSharedValue` for the arrived-transition progress, new `useEffect` keyed on `rideState === 'arrived'`.

**4. UX-4 — Inline stepped cancel flow (ICE 8.3)**
The current `confirmCancelOpen` overlay (`absoluteFillObject` z-index 100) works fine in the searching state, but once the sheet must also render the fee-warning copy (PM-1) before the confirmation step, stacking two full-screen overlays is fragile and produces a jarring modal-on-modal experience. Replacing the boolean with a `cancelStep: 'idle' | 'fee-warning' | 'confirm'` state variable and rendering the cancel content inline inside the matched body (not above it) eliminates the z-index problem, keeps the gesture context intact, and sets up PM-1's countdown view correctly. Confidence is 9 — this is a well-understood pattern. Ease is 8 because the existing `confirmCancelOpen` logic (handleConfirmCancel, setCancelling, cancelErr) can be reused almost verbatim; only the render path changes.

**5. PM-1 — Graduated cancellation fee countdown (ICE 8.0)**
In the Senegal market, surprise fees are the primary source of app-store complaints for Bolt and Yango. A real-time "free cancel ends in 45 s" countdown — rather than a static "fees may apply" warning — reframes the message as transparency rather than punishment, and creates a natural urgency signal that may reduce spurious post-match cancellations. Requires ENG-3 (`matchedAt` timestamp on `MatchedDriver`) as a prerequisite and UX-4's `cancelStep` state as the render host. Confidence is 9 because the timer logic is simple (`freeCancelEndsAt - Date.now()`) and `setInterval`-based (or Reanimated clock via ENG-2 for smoother countdown). Ease is 7 because it adds new copy, a timer, a fee-amount calculation (from `selectedEstimate.fareEstimate` already in scope), and the two-step cancel UX.

---

### Deprioritized Ideas — Why

| Idea | Approx ICE | Reason Deprioritized |
|------|-----------|----------------------|
| ENG-2 — Worklet-safe `cancelStep` via `useSharedValue` | ~7.3 | Technically elegant but premature optimisation. A React-state `cancelStep` is correct and safe; the UI thread is not blocked by this transition. Revisit only if frame drops are measured during cancel-step transitions on low-end Android. |
| ENG-3 — `matchedAt` epoch on `MatchedDriver` | ~8.0 | This is a direct prerequisite for PM-1 rather than a standalone idea. Scored separately to isolate backend dependency; will be implemented as part of the PM-1 ticket, not a standalone deliverable. |
| UX-1 — ETA pulse animation at <60 s | ~7.0 | Pure delight polish. The "Arrivée imminente" copy already signals urgency; the animation adds nothing functional. Deprioritised in favour of the structural arrived-state crossfade (UX-2). Add as a 1-line enhancement after core arrived flow is stable. |
| UX-3 — Handle pill colour-codes sheet state | ~6.3 | Good peripheral cue but the 4 dp pill is too small to be reliably perceived at arm's length on a Dakar street. The arrived body's full visual redesign (UX-2) is a more effective state signal at the same cost. Revisit if A/B testing shows ambient cue value. |
| PM-2 — Ambient yellow banner on arrival (top-of-screen) | ~6.7 | Strategically sound substitute for push notifications but adds a second animated surface (above the map, independent of BookingSheet) with its own `Animated.View` lifecycle and z-index management. The BookingSheet snap-to-peek transition + haptics achieves the alerting goal with less complexity. Revisit when push notification entitlement is restored. |
| PM-3 — WhatsApp deep-link at arrival | ~6.0 | Culturally right for Senegal but requires `MatchedDriver.phone` to be added to the type and exposed by the backend — a non-trivial trust/privacy decision (phone number exposure). Deprioritised until a backend privacy review determines whether raw phone number can be sent to the client. |
| PM-4 — State-aware mini-strip (ambient matched/arrived content) | ~6.7 | Useful but the arrived snap-lock (ENG-4) forces `peek` as minimum — the mini state is unreachable in arrived mode, making the arrived mini-strip content moot. The matched mini-strip content is a nice enhancement but not required for the core feature. Add in a follow-up polish pass. |
| PM-5 — Post-arrival ride-start confirmation handshake | ~5.7 | Generates valuable wait-time telemetry but requires a new `POST /rides/:id/start` backend endpoint and adds a required interaction step at the most time-pressured moment (driver waiting, rider boarding). Risk of frustration if the tap is missed. Deprioritise until backend analytics show the data is needed for driver scoring. |
| ENG-5 — Demo mode `arrivedAt` injection | ~7.0 | High Ease (10) and meaningful for QA confidence but zero production impact. Implement alongside the core arrived-state features as a 10-line addition to the demo FSM — not a standalone prioritised deliverable. |
| UX-5 — Arrived-state map camera re-centre | ~6.7 | Valuable polish — seeing the driver pin at street level is genuinely useful. Deprioritised because it requires a new `onDriverArrived` prop/callback surface on `BookingSheet` and coordination with the `index.tsx` camera ref. Clean to implement after the arrived-state body (UX-2) is stable; add to the follow-up polish sprint. |

---

### Sequencing Recommendation

Dependencies create a strict build order for the top 5:

1. **ENG-1** — type extension (`rideState` union + `MatchedDriver.arrivedAt`, `matchedAt`) — land first; blocks everything else
2. **ENG-4** — gesture worklet lock for arrived state — can land in the same PR as ENG-1
3. **UX-4** — inline `cancelStep` state machine — prerequisite for PM-1's render host
4. **UX-2** — arrived-body cross-fade — can be built in parallel with UX-4 once ENG-1 is merged
5. **PM-1** — fee countdown + graduated disclosure — requires ENG-3 (`matchedAt` on backend) and UX-4 render host; coordinate backend sprint

ENG-5 (demo mode arrived injection) should ship alongside UX-2 so the arrived state is testable immediately in demo builds.

---

*Generated: 2026-04-22 | Phase 4 | Driver Arrival Flow feature*
