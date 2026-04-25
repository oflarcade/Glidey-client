# Unified Booking Modal — PM Ideation & ICE Prioritization

**Feature scope:** Replace the current two-overlay pattern (LocationModal for search + BookingSheet for booking) with a single persistent bottom sheet that holds both "search" mode and "booking" mode internally, transitioning between them with animated snap-point changes. The sheet persists across the full interaction — tapping the destination row in mini/peek mode opens inline search within the same sheet. Snap points (mini / peek / full) are preserved. No more X-dismiss → LocationModal reopen → BookingSheet reopen loop.

**Codebase anchors:** `LocationModal/` (search, autocomplete, history), `BookingSheet` (vehicle carousel, fare, BOOK NOW), `useUIStore` (`locationModalOpen`, `activeBottomSheet`), `useRideStore` (FSM), Reanimated 4.x, `useBooking`, `useMatching`, `@rentascooter/shared` stores, `colors.primary.main = #FFC629`.

---

## Part 1 — Brainstorm

### Product Manager Perspective (market fit, value creation, competitive edge)

**PM-1 — Persistent destination row as a permanent booking entry point**
Once the unified sheet is in mini/peek state, keep a condensed destination row always visible above the map (like Uber's persistent bottom bar). The user never loses their place — switching from search to booking to map exploration happens within a single surface. In the Senegal market where users may be distracted mid-booking (vendor calls, traffic), returning to the same state without restarting is a meaningful retention and conversion lever vs. the current flow that resets on dismiss.

**PM-2 — In-sheet recent-trip re-book shortcut surfaced before search**
In the unified sheet's search mode, before the keyboard opens, show the last 3 destinations as quick-select chips derived from `useLocationHistory`. The user can confirm a repeat trip with 2 taps (open sheet → tap chip). Currently this requires 6+ taps through the X-dismiss-reopen cycle. For daily commuter riders — the highest LTV segment — this compresses the dominant use case to its minimum viable taps.

**PM-3 — Mode-aware sheet header with fare anchoring during search**
When the sheet is in booking mode and the user switches to edit their destination (search mode), show the current fare estimate greyed out in the sheet header ("~1 400 XOF — modifier"). This anchors the price expectation while search is open and signals that the booking context is preserved. No competitor surfaces fare during destination editing — it is a trust and continuity signal unique to the persistent-modal pattern.

**PM-4 — Post-booking state retained in the sheet (no new screen)**
When the driver is found, transition the sheet in-place from booking mode to a "driver found" mini-card (driver photo, vehicle, ETA, live tracking CTA) rather than routing to a separate `/(main)/booking.tsx` screen. The map remains fully interactive. This eliminates the navigation stack push that currently disconnects the map from the booking state and enables the "map-first" ride tracking experience Bolt's redesign (2023) proved increases engagement.

**PM-5 — Operator-facing conversion tracking by sheet mode**
The unified sheet creates a well-defined funnel with two discrete events: `sheet_mode: search → booking` and `sheet_mode: booking → confirmed`. Instrument these transitions with distinct analytics events (Amplitude / Firebase Analytics). The current two-modal pattern logs `locationModal_closed` and `bookingSheet_opened` with no causal link, making funnel analysis unreliable. Clean funnel data is a competitive operations advantage — Glidey can optimize per-neighborhood conversion rates.

---

### Product Designer Perspective (UX, onboarding, engagement loops)

**UX-1 — Animated mode transition using shared-element snap interpolation**
Use Reanimated `withSpring` on the sheet's `translateY` shared value to animate between search-mode full-expansion and booking-mode peek in a single fluid gesture — the search input collapses upward as the vehicle carousel rises from below. Both directions feel like a natural physical pull. Because it is one sheet (not two separate components mounting/unmounting), enter/exit transitions become interpolations, not conditional renders. The resulting motion is cohesive in a way that two separate modals cannot achieve.

**UX-2 — Destination row tap in mini/peek opens keyboard-first search inline**
When the user taps the destination text in mini or peek state, the sheet snaps to full and the search `TextInput` gains focus and opens the keyboard — all in one gesture response, ~200 ms. No X button, no new modal, no white flash. The keyboard appearance is the only new UI; existing autocomplete results render in the sheet body. This is the core micro-interaction the feature is named for, and it must be imperceptibly fast to feel native.

**UX-3 — Haptic accent on mode transitions**
Fire `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` on every search→booking transition (destination selected) and `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on every snap-point change. The haptic cadence maps to the physical metaphor of the sheet snapping into a new position. Expo Haptics is already imported in the main map screen. These two lines of code convert a visual-only affordance into a cross-sensory one — measurably reducing "did it register?" confusion without any UI change.

**UX-4 — Search mode empty state as a contextual onboarding surface**
When the unified sheet opens for the first time (no history, no destination set), the full-sheet search mode shows a minimal illustrated prompt: "Où allez-vous?" with two suggestion chips ("Plateau" / "Almadies" — common Dakar destinations). This replaces the blank autocomplete list that currently shows in `LocationModal` on first use. The illustration uses the scooter silhouette SVG from `packages/ui/src/assets/icons/`. First-time users get onboarded to the destination input pattern without a separate tutorial step.

**UX-5 — Dismissal prevention in booking mode with "hold to cancel" confirmation**
In booking mode (once a destination is set and fare is shown), remove the drag-to-dismiss gesture and replace it with a visible "Annuler" text link that triggers a 2-second hold confirmation. This prevents accidental dismissal at the highest-intent moment in the funnel. The sheet in booking mode is intentionally "sticky" — the user must explicitly choose to cancel. Matches the behavioral pattern of payment confirmation flows (Wave, Orange Money) that Senegalese users are already trained on.

---

### Engineer Perspective (technical innovation, platform leverage)

**ENG-1 — Single Reanimated `animatedIndex` drives both mode and snap state**
Model the unified sheet's state as a single Reanimated shared value (`animatedIndex`: 0 = mini, 1 = peek, 2 = full-search, 3 = full-booking). All visual properties (sheet height, search input opacity, carousel opacity, destination row scale) are derived via `interpolate()` from this one value. No `useState` for mode — mode is a visual consequence of `animatedIndex`. This ensures zero JS bridge crossings during drag and transition, and makes the sheet impossible to get into a split state (e.g., booking content visible while keyboard is open).

**ENG-2 — `useUIStore` refactor: replace `locationModalOpen` + `activeBottomSheet` with a single `sheetMode` atom**
Currently `useUIStore` has two separate booleans / identifiers for the two-modal pattern. Replacing them with a single `sheetMode: 'idle' | 'search' | 'booking' | 'matching' | 'driver-found'` atom is the minimal state refactor required by the unified modal. It eliminates the race condition where `locationModalOpen = true` and `activeBottomSheet = 'booking'` can briefly coexist during the dismiss/reopen cycle that causes the current jarring UX. Every component that reads either flag becomes simpler — one conditional instead of two.

**ENG-3 — Fare pre-fetch on destination commit, not on sheet mode change**
Fire `estimateFare()` the moment the user selects a destination (in `handleDestinationSelect`) rather than when the sheet transitions to booking mode. By the time Reanimated finishes the search→booking snap animation (~300 ms), the fare is already in-flight. In the unified sheet, the transition animation is the loading skeleton — no spinner is ever visible. This requires surfacing `fareEstimate` state to the parent or into `useRideStore`; consistent with the existing Zustand pattern.

**ENG-4 — Keyboard-avoiding layout via Reanimated `useAnimatedKeyboard`**
In search mode at full expansion, use `useAnimatedKeyboard()` (Reanimated 3+) to derive the keyboard height as a shared value and translate the sheet's content container upward — without `KeyboardAvoidingView`. This runs on the UI thread, eliminating the frame-drop jank that `KeyboardAvoidingView` produces on Android (a known React Native issue). The autocomplete result list shrinks its `maxHeight` proportionally so results remain visible above the keyboard.

**ENG-5 — Shared `destinationData` ref bridging search→booking without prop drilling**
Use a Reanimated `useSharedValue<Location | null>(null)` (or a Zustand atom on `useLocationStore`) to hold the selected destination and pass it directly to the booking section of the unified sheet without prop-drilling through the parent `index.tsx`. When search mode resolves a selection, it writes to this ref; booking mode reads from it reactively. This decouples the two sections of the sheet so they can be developed and tested independently before being composed into the unified component.

---

## Part 2 — ICE Scoring & Prioritization

**Scoring key:** Impact 1–10 (needle moved for users/business), Confidence 1–10 (certainty it will work as hypothesized), Ease 1–10 (10 = trivial, 1 = very hard). ICE = (I + C + E) / 3, rounded to 1 decimal.

| # | Idea | Impact | Confidence | Ease | ICE | Notes |
|---|------|--------|------------|------|-----|-------|
| ENG-2 | `useUIStore` refactor: single `sheetMode` atom | 9 | 10 | 8 | **9.0** | Prerequisite for unified sheet; eliminates race condition; pure state refactor |
| UX-2 | Destination row tap → keyboard-first inline search | 9 | 9 | 8 | **8.7** | Core micro-interaction of the feature; entirely within one component once ENG-2 done |
| UX-3 | Haptic accents on mode transitions + snap changes | 7 | 10 | 9 | **8.7** | Expo Haptics already imported; 2-line additions; cross-sensory confirmation |
| ENG-3 | Fare pre-fetch on destination commit | 8 | 9 | 8 | **8.3** | Eliminates visible loading state; pure call-site refactor; no new API |
| ENG-1 | Single `animatedIndex` shared value drives all visual state | 9 | 8 | 7 | **8.0** | Architectural foundation; prevents split-state bugs; pure UI-thread execution |

### Rank order by ICE score

| Rank | Idea | ICE |
|------|------|-----|
| 1 | ENG-2 — Single `sheetMode` atom in `useUIStore` | 9.0 |
| 2 | UX-2 — Destination row tap opens inline search | 8.7 |
| 2 | UX-3 — Haptic accents on transitions | 8.7 |
| 4 | ENG-3 — Fare pre-fetch on destination commit | 8.3 |
| 5 | ENG-1 — Single `animatedIndex` drives all visual state | 8.0 |

---

### Top 5 Rationale

**1. ENG-2 — Single `sheetMode` atom (ICE 9.0)**
This is the load-bearing state change for the entire feature. The current `locationModalOpen` + `activeBottomSheet` duality is why switching between the two overlays is jarring — the two booleans can be momentarily inconsistent, causing a frame where neither is active (blank) or both are active (overlay-on-overlay). A single `sheetMode` enum (`idle | search | booking | matching | driver-found`) is a mechanical refactor of `useUIStore` and the two or three components that read these flags. Confidence is 10 because the Zustand pattern is well-established in the codebase. Ease is 8 because every consumer of the old flags needs updating, but each update is a straightforward substitution. Without this, no other part of the unified sheet can be built coherently.

**2. UX-2 — Destination row tap opens keyboard-first inline search (ICE 8.7)**
This is the defining moment of the feature: the user taps their destination and the sheet responds in-place rather than dismissing and relaunching. The quality of this transition determines whether the unified sheet feels like a native product or a web-view wrapper. Implementation — snap to full + `TextInput.focus()` in a single `runOnJS` callback from the tap handler — is straightforward once ENG-2 provides a clean mode signal. Impact is 9 because it directly removes the 3-step dismiss/reopen/pick cycle from the most frequent interaction in the app.

**3. UX-3 — Haptic accents on mode transitions (ICE 8.7)**
Identical ICE score to UX-2 but for different reasons. The haptic layer costs near-zero effort (Expo Haptics already imported, 2 calls) but delivers disproportionate perceived quality — users attribute "snappiness" to haptics even on slow devices. Confidence is 10 because the API is proven and the trigger points (destination selected, snap-point settled) are deterministic. This is a 10-minute implementation that permanently elevates the feel of every mode transition.

**4. ENG-3 — Fare pre-fetch on destination commit (ICE 8.3)**
In the unified sheet, the search→booking transition animation (~300 ms) is the only "loading window" available before booking content is visible. If `estimateFare()` is fired at destination commit rather than at mode change, the fare resolves during the animation and the booking mode opens with the price already populated. Impact is 8 because eliminating the fare spinner removes the only visible latency in the booking mode entry. Ease is 8 because it is a call-site move — the `estimateFare` call moves from the booking section's mount effect into the destination selection handler in the parent.

**5. ENG-1 — Single `animatedIndex` drives all visual state (ICE 8.0)**
This is the architectural choice that makes the sheet's animations impossible to desync. If sheet height, search-input opacity, carousel opacity, and destination-row scale are all derived from one interpolated shared value, transitions cannot produce intermediate states where the wrong content is visible at the wrong snap point. Ease is 7 (not 10) because setting up the interpolation ranges for all derived properties requires careful measurement and iteration on both iOS and Android. The payoff is a sheet that is correct by construction — no state machine needed to guard against "booking content visible in full-search mode" edge cases.

---

### Deprioritized Ideas — Why

| Idea | ICE | Reason Deprioritized |
|------|-----|----------------------|
| PM-1 — Persistent destination row always visible above map | ~7.3 | High-value end state but requires native layout changes (inset handling, safe-area adjustments) that add scope beyond the modal refactor. Correct to build the unified sheet first, then extend to persistent persistence as a follow-on. |
| ENG-4 — `useAnimatedKeyboard` for keyboard avoidance | ~7.3 | Correct technical approach but Android-specific impact. After ENG-1 is in place, this becomes a focused Android polish PR. Not a blocker for the unified sheet on iOS. |
| ENG-5 — Shared `destinationData` ref between sheet sections | ~7.0 | Elegant but ENG-2's `sheetMode` atom paired with `useLocationStore`'s existing `destination` field already provides the bridge. ENG-5 is only needed if the two sheet sections are split into separate components with no shared Zustand access — an implementation detail to decide during build. |
| PM-4 — Post-booking driver-found state in sheet (no new screen) | ~7.0 | Right long-term direction but requires `useMatching` and the matching flow to be redesigned in-sheet. The current `MatchingModal` is a separate concern from the search↔booking unification. Phase 5 item. |
| UX-4 — Empty-state illustrated onboarding in search mode | ~6.7 | Good first-time UX but requires new SVG design assets. Deprioritize until the interaction architecture is proven; add as a design polish sprint item once the sheet is functional. |
| UX-5 — Dismissal prevention with hold-to-cancel | ~6.3 | Sound UX principle but increases perceived friction for users who intentionally want to cancel. Requires user-testing in the Senegalese context before shipping; assumption that Wave/Orange Money trained users on hold-confirmation may not transfer to ride booking. |
| PM-3 — Mode-aware fare anchoring during search | ~6.0 | Differentiating copy pattern but requires design decision on header layout. No engineering blocker — it is a UI composition question. Add to the booking-mode design spec rather than the build sprint. |
| PM-2 — Recent-trip re-book chips before keyboard opens | ~5.7 | `useLocationHistory` exists. However, surfacing chips in the peek state competes with the search input layout. The unified sheet's search mode already shows history by default in the `LocationModal` pattern — this is a layout/ordering question, not a new feature. Resolve in the design spec. |
| PM-5 — Funnel analytics by sheet mode | ~5.3 | High operational value but zero user-facing impact. Instrument after the sheet is shipped; analytics should reflect the real final interaction pattern, not a draft. |

---

*Generated: 2026-04-20 | Phase 4 | Unified Booking Modal feature*
