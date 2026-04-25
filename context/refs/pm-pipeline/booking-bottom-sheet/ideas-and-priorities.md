# Booking Bottom Sheet — PM Ideation & ICE Prioritization

**Feature scope:** Reanimated-powered bottom sheet on the main map that opens when a destination is selected. Contains a drag handle, destination row, vehicle-type carousel (Standard / E-Scooter etc. with per-type pricing), payment row, and BOOK NOW button. On BOOK NOW, the sheet transitions in-place to a "searching for driver" state. Replaces `/(main)/booking.tsx`. Two snap points: peek (BOOK NOW strip only) and full (all content visible).

**Codebase anchors:** `useBooking`, `useMatching`, `useRideStore` (FSM), `@rnmapbox/maps`, Reanimated 4.x, `colors.primary.main = #FFC629`, `LocationModal` closes on destination select → sheet opens.

---

## Part 1 — Brainstorm

### Product Manager Perspective (market fit, value creation, competitive edge)

**PM-1 — In-sheet ETA badge per vehicle type**
Show a live estimated pickup ETA ("~4 min") next to each vehicle type in the carousel, pulled from the nearby-drivers data already fetched in `useNearbyDrivers`. West African riders are time-sensitive; surfacing ETA before the user commits to a vehicle type is a direct conversion driver vs. selecting blind. Bolt and InDrive both surface ETA at the selection step.

**PM-2 — Price-lock guarantee microcopy**
Display "Prix fixé — pas de surprises" beneath the fare estimate. In the Senegalese market, fare unpredictability is a top-cited trust barrier (common in informal moto-taxi culture). A single line of copy anchoring the fixed-price promise increases booking confidence without any backend change; fare is already fixed by `estimateFare`.

**PM-3 — "Split fare" social prompt on the payment row**
After selecting a payment method, offer a one-tap "Partager le trajet" chip. Generates a short deep-link the user can share over WhatsApp (dominant in Senegal). Positions Glidey in the group-mobility social graph — a differentiated surface vs. Uber/Bolt which surface splitting only after the ride ends.

**PM-4 — Operator surge transparency indicator**
When backend returns a fare above a baseline threshold (computable from `fareEstimate.fareEstimate / distanceM`), show a small amber indicator: "Forte demande — tarif ajusté". No hidden surge; communicates honestly. Reduces post-ride support complaints and builds brand trust vs. opaque surging by competitors.

**PM-5 — Recent-destination re-book shortcut**
The peek state (BOOK NOW strip) could include a chip row of up to 3 recent destinations sourced from `useLocationHistory` (already in `addressSearchService`). User can confirm a repeat trip without re-opening LocationModal. Reduces round-trip taps from ~6 to 2 for returning users.

---

### Product Designer Perspective (UX, onboarding, engagement loops)

**UX-1 — Progressive-reveal sheet with animated fare counter**
On sheet open, fare starts from 0 and counts up to the real estimate over 600 ms (using Reanimated `withTiming` on a shared value). Creates perceived speed and draws attention to the fare value without intrusive animation. Uses the existing `isFareLoading` state as trigger: counter starts when loading resolves. Mirrors the Uber "fare calculation" feel that users already understand.

**UX-2 — Vehicle-type card with scooter silhouette illustration**
Each carousel card renders a small SVG silhouette (Standard moto / E-Scooter) that tilts slightly on scroll (Reanimated interpolation on scroll offset). Gives the carousel tactile identity. SVGs can live in `packages/ui/src/assets/icons/` following the existing SVG-transformer pattern. Differentiates Glidey visually from generic list-based competitor UIs.

**UX-3 — Haptic confirmation on BOOK NOW press**
Fire `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` the moment the user taps BOOK NOW (before async resolves), and `Haptics.notificationAsync(NotificationFeedbackType.Success)` when the sheet transitions to the searching state. Expo Haptics is already imported on `index.tsx` and available. Tactile confirmation reduces "did it register?" double-taps which cause duplicate booking attempts.

**UX-4 — Inline "searching" lottie ring replacing the button**
When `rideState === 'searching'`, animate the BOOK NOW button into a circular pulsing ring (yellow, matching `#FFC629`) using a Reanimated `withRepeat` loop on scale + opacity — no external Lottie dependency needed. The ring sits in the same footer space as the button so the sheet's height doesn't shift. Avoids the jarring MatchingModal overlay and keeps the user anchored to the map.

**UX-5 — Swipe-down to cancel search gesture**
During the searching state, allow a deliberate slow downward swipe (velocity threshold > 800 px/s) on the drag handle to trigger `cancel()`. Adds a gesture shortcut for power users without adding a visible cancel button that might be accidentally tapped. Pair with a confirmation snackbar: "Recherche annulée" for 2 s. Uses the existing Reanimated gesture recognizer already powering the snap behavior.

---

### Engineer Perspective (technical innovation, integrations, platform leverage)

**ENG-1 — Single Reanimated worklet for sheet + scroll conflict resolution**
Use `useAnimatedScrollHandler` on the vehicle carousel's `ScrollView` and gate sheet-drag recognition via `simultaneousHandlers` + an `activeOffsetY` threshold. This eliminates the most common Reanimated bottom-sheet bug (scroll hijacks drag at snap point edges) with zero third-party sheet library. The worklet runs entirely on the UI thread — zero JS bridge crossings during drag.

**ENG-2 — vehicleType field plumbed into CreateRideV2Request**
`useBooking.bookRide()` currently calls `createRide({ pickup, destination, distanceM, durationS })` with no vehicleType. The backend `vehicleType` field is ready. Adding a `vehicleType` param to `UseBookingParams` and threading it through `bookRide` → `createRide` is a 3-file change (`useBooking.ts`, `bookingService.ts`, shared types) that unlocks per-vehicle fare logic and driver dispatch. This is a prerequisite for the carousel to have real business meaning.

**ENG-3 — Fare pre-fetch on destination commit, not on sheet open**
Move `estimateFare()` call from sheet-open into `handleDestinationSelect` in `index.tsx` (fire immediately when destination is set). By the time the user reads the destination row and looks at the vehicle carousel, the fare is already resolved. Eliminates the `isFareLoading` spinner the user currently sees on the current `booking.tsx` screen. Requires surfacing `fareEstimate` state up to the parent or into a shared store.

**ENG-4 — Sheet position as a shared Reanimated value exposed to the map**
Expose the sheet's `animatedPosition` shared value to `index.tsx` so the map camera can pan up by `sheetHeight * 0.4` when the sheet is fully expanded, keeping the destination pin centered in the visible map area. Uses Reanimated's `useAnimatedReaction` to drive a `MapboxGL.Camera` `centerCoordinate` offset — no React state updates, runs on UI thread.

**ENG-5 — Payment method skeleton from `useUIStore` active-sheet state**
`useUIStore` already tracks `activeBottomSheet`. Extend it with a `selectedPaymentMethod` atom (cash / mobile money). Persist to AsyncStorage so the last-used method is pre-selected on the next booking. The Payment row in the sheet reads from this atom and writes on tap — no prop drilling, consistent with the existing Zustand pattern.

---

## Part 2 — ICE Scoring & Prioritization

**Scoring key:** Impact 1–10 (needle moved for users/business), Confidence 1–10 (certainty it will work as hypothesized), Ease 1–10 (10 = trivial, 1 = very hard). ICE = (I + C + E) / 3, rounded to 1 decimal.

| # | Idea | Impact | Confidence | Ease | ICE | Notes |
|---|------|--------|------------|------|-----|-------|
| ENG-2 | vehicleType plumbed into CreateRideV2Request | 9 | 10 | 9 | **9.3** | Backend already accepts it; 3-file change; unlocks carousel business logic |
| ENG-3 | Fare pre-fetch on destination commit | 8 | 9 | 8 | **8.3** | Eliminates loading spinner; pure refactor; no new API call |
| UX-3 | Haptic confirmation on BOOK NOW + state transition | 7 | 10 | 9 | **8.7** | Expo Haptics already imported; 5-line addition; high confidence on felt quality improvement |
| ENG-1 | Worklet-based scroll/drag conflict resolution | 9 | 8 | 6 | **7.7** | Core correctness requirement; moderately complex but well-understood Reanimated pattern |
| UX-4 | Inline searching ring replacing button | 8 | 8 | 7 | **7.7** | Avoids modal overlay; keeps user on map; pure Reanimated — no extra dependency |

### Corrected rank order by ICE score

| Rank | Idea | ICE |
|------|------|-----|
| 1 | ENG-2 — vehicleType in CreateRideV2Request | 9.3 |
| 2 | UX-3 — Haptics on BOOK NOW | 8.7 |
| 3 | ENG-3 — Fare pre-fetch on destination commit | 8.3 |
| 4 | ENG-1 — Scroll/drag conflict worklet | 7.7 |
| 5 | UX-4 — Inline searching ring | 7.7 |

---

### Top 5 Rationale

**1. ENG-2 — vehicleType in CreateRideV2Request (ICE 9.3)**
The vehicle-type carousel is the sheet's primary differentiator. Without this field wired to the backend, the carousel is decorative — it can show different prices per type visually but every booking goes through as the same type. Confidence is 10 because the backend field is confirmed ready and it's a mechanical plumbing change. Ease is 9 because it's three isolated files: `useBooking.ts` (add param), `bookingService.ts` (pass field), shared types (add to `CreateRideV2Request`). This is the minimum for the carousel to have business meaning.

**2. UX-3 — Haptic confirmation (ICE 8.7)**
Booking is an irreversible action (triggers a real driver search). Haptic feedback at the moment of commitment is a standard UX trust signal for fintech/transport apps (Uber, Bolt, Wave all use it). Confidence is 10 because Expo Haptics is already used in `index.tsx` (`impactAsync` and `notificationAsync` are proven APIs). Ease is 9 — the entire change is two `await Haptics.*` calls inside the BOOK NOW press handler and the searching-state transition. Cost to implement: ~5 minutes.

**3. ENG-3 — Fare pre-fetch on destination commit (ICE 8.3)**
The current flow triggers `estimateFare()` when the booking view mounts. The user sees a spinner. By moving the call 1–2 seconds earlier (when `handleDestinationSelect` fires in `index.tsx`), the fare resolves during the map animation, so the sheet opens with the price already populated. Impact is 8 because it removes a friction point at the highest-intent moment in the funnel. Ease is 8: requires lifting `fareEstimate` state to the parent or into `useRideStore`/`useUIStore` — manageable with existing Zustand patterns.

**4. ENG-1 — Scroll/drag conflict worklet (ICE 7.7)**
This is a correctness gate, not a nice-to-have. A bottom sheet with an internal horizontally-scrolling carousel is one of the hardest gesture interaction problems in React Native. If the carousel scroll hijacks vertical drag at the snap boundaries, the sheet feels broken. `simultaneousHandlers` + `activeOffsetY` on the vertical recognizer, and `activeOffsetX` on the carousel's horizontal recognizer, is the established Reanimated 3/4 solution. Ease is 6 because it requires careful gesture handler configuration and testing on both iOS and Android.

**5. UX-4 — Inline searching ring replacing button (ICE 7.7)**
The current `booking.tsx` renders a `MatchingModal` overlay (a separate full-screen component). In the bottom sheet architecture, overlaying a modal over a sheet creates z-index and gesture conflict issues. The inline approach — animating the BOOK NOW button into a pulsing ring in place — keeps the user anchored to the map and avoids all overlay complexity. Pure Reanimated (`withRepeat`, `withTiming`, `withSequence` on scale + opacity). Impact is 8 because it directly shapes the emotional quality of the most anxious moment in the flow (waiting for a driver). Ease is 7 because it requires a controlled state-driven render switch inside the footer area.

---

### Deprioritized Ideas — Why

| Idea | ICE | Reason Deprioritized |
|------|-----|----------------------|
| PM-1 — ETA badge per vehicle type | ~7.0 | Requires per-vehicle-type nearby-driver counts from backend, which is not currently returned. High confidence the UX value is real, but backend work needed first makes it a Phase 5+ item. |
| ENG-4 — Sheet position drives map camera offset | ~7.0 | Valuable polish but adds Reanimated-to-MapboxGL coupling complexity. Better as a follow-on once the sheet itself is stable. Risk of frame drops if the camera reaction is not carefully debounced. |
| PM-2 — Price-lock guarantee microcopy | ~6.7 | High confidence it helps trust (Impact 7), but it's a copy/design decision that needs brand sign-off before shipping. Doesn't block the sheet itself. Add to the sheet design spec, not the build sprint. |
| UX-1 — Animated fare counter | ~6.3 | Moderate delight value but zero functional impact. The `isFareLoading` → resolved transition is fast once ENG-3 (pre-fetch) is done, making the counter animation feel contrived. Revisit only if loading latency remains visible. |
| UX-2 — Vehicle-type SVG silhouette with tilt | ~6.0 | Good brand differentiation but requires new SVG assets to be designed and added to `packages/ui`. Design dependency makes this a Phase 5 item after the carousel interaction is proven. |
| UX-5 — Swipe-down to cancel search | ~5.7 | Clever, but high discoverability risk — if users can't find it, the safety net is missing. Requires a visible cancel fallback anyway per current `booking.tsx` pattern. Implement cancel button first; gesture shortcut is an enhancement. |
| PM-3 — Split fare / WhatsApp deep-link | ~5.3 | Strategically interesting but requires deep-link infrastructure, WhatsApp Share API integration, and ride-sharing backend logic. Significant scope; does not belong in the booking sheet MVP sprint. |
| ENG-5 — Payment method persistence in useUIStore | ~5.3 | Correct architectural pattern, but Glidey currently only supports cash. Until mobile money (Wave, Orange Money) is integrated on the backend, there is nothing to persist. Revisit when payment method selection is real. |
| PM-4 — Surge transparency indicator | ~5.0 | Trust value is real but requires a baseline fare reference in the backend response to compute surge ratio client-side. `FareEstimateResponse` does not currently expose a baseline. Backend change needed; deprioritize until Phase 5 pricing work. |
| PM-5 — Recent-destination re-book shortcut | ~5.0 | `useLocationHistory` exists but re-book from the peek state adds significant layout complexity to a 48-dp strip. The LocationModal already surfaces recent destinations. Redundant at this stage; simplicity of the peek state should be preserved. |

---

*Generated: 2026-04-20 | Phase 4 | Booking Bottom Sheet feature*
