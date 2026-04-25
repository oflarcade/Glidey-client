---
created: "2026-04-20T00:00:00Z"
last_edited: "2026-04-21T00:00:00Z"
---


# Cavekit: Booking Sheet UX

## Scope
The in-map bottom sheet that is the primary surface for reviewing a planned ride, selecting a vehicle type, and triggering a booking. Covers the sheet's presentation lifecycle (how it appears/dismisses), its snap-point behavior and gesture arbitration against an embedded horizontal carousel, the destination summary row, the vehicle-type carousel (populated from the backend vehicle catalog and per-type fare estimates), the payment row placeholder, the primary "Book Now" action, and the in-sheet searching state (animated retry timeline plus cancel) that replaces the prior separate searching route. The sheet is a composition surface — all data and lifecycle logic is delegated to the ride-booking domain.

## Requirements

### R1: Automatic sheet presentation on destination confirmation
**Description:** Once a destination is confirmed from the destination-search flow, the booking sheet must appear automatically on top of the map without any additional user tap. The sheet opens with the destination row, the vehicle-type carousel, and a fare already populated (see R6 and `cavekit-ride-booking.md` R7), not in a loading placeholder state. No route-level navigation occurs to present the sheet — the map remains visible underneath.

**Acceptance Criteria:**
- [ ] On destination confirmation, the booking sheet becomes visible on the main map surface within one animation frame after the confirmation event resolves, with no intermediate user gesture required.
- [ ] Presenting the sheet does not push or replace a navigation route; the URL/route stack is unchanged when the sheet opens.
- [ ] The map remains rendered and at least partially visible behind the sheet at every snap point.
- [ ] When the sheet opens, the destination row, vehicle-type carousel, payment row, and "Book Now" control are all mounted (see R3, R4, R5, R6, R7).

**Dependencies:** `cavekit-location-search.md` R1; `cavekit-ride-booking.md` R7.

---

### R2: Snap-point behavior and gesture arbitration
**Description:** The sheet has three snap points: a mini position (only a condensed destination summary bar is visible, map is maximally visible), a peek position (destination row, vehicle-type carousel, and the "Book Now" control are all visible without expanding to full height), and a full position (all rows including any extended content visible). A vertical drag gesture moves the sheet between these snap points or dismisses it (below mini); a horizontal drag gesture inside the vehicle-type carousel must scroll the carousel only and must not move or dismiss the sheet. Gesture arbitration must behave identically on iOS and Android.

**Acceptance Criteria:**
- [ ] The sheet exposes exactly three stable snap points (mini, peek, full); no intermediate rest positions.
- [ ] At the mini snap point, only the condensed destination summary row is rendered in the sheet's visible surface; the vehicle-type carousel and "Book Now" control are not visible.
- [ ] At the mini snap point, the map behind the sheet is maximally visible (the sheet occupies only the vertical space required by the condensed destination row).
- [ ] At the peek snap point, the vehicle-type carousel and the "Book Now" control are both rendered within the visible area of the sheet without requiring the user to drag further.
- [ ] A predominantly vertical drag gesture moves the sheet between the mini, peek, and full snap points.
- [ ] A predominantly horizontal drag gesture starting inside the vehicle-type carousel scrolls the carousel and produces zero vertical translation of the sheet.
- [ ] A horizontal carousel scroll never triggers sheet dismissal, on either iOS or Android, at any of the three snap points.
- [ ] Releasing the sheet between two adjacent snap points animates it to the nearest snap point (mini, peek, or full).
- [ ] A vertical drag that releases the sheet below the mini snap point dismisses the sheet.

**Dependencies:** R1, R4.

---

### R3: Destination row
**Description:** At the top of the sheet, a single row summarises the confirmed destination. It shows a location icon, the destination's display name, the destination's formatted address, and a visible trailing interactive affordance (e.g., a chevron icon) that signals to the user that tapping the row opens destination search. The destination row is interactive: tapping it from the mini or peek snap transitions the sheet inline to search mode (see R10) without presenting a new overlay or pushing a navigation route. The destination row remains visible in all three snap points (mini, peek, full) and in both the search and booking modes.

**Acceptance Criteria:**
- [ ] The destination row renders a location icon, a destination name string, and a destination address string sourced from the confirmed destination.
- [ ] The destination row renders a visible trailing interactive affordance (chevron or equivalent icon) that signals the row is tappable.
- [ ] If the destination name and address are identical, only one of the two is shown (no duplicate line).
- [ ] The destination row does not dispatch any network requests or mutate any booking domain store on mount.
- [ ] The destination row remains visible at the mini, peek, and full snap points.
- [ ] The destination row remains visible in both the search and booking content modes of the unified sheet (see R10).
- [ ] Tapping the destination row from the mini or peek snap transitions the sheet's content to search mode (see R10) without pushing, replacing, or popping any navigation route and without mounting a new overlay.
- [ ] Tapping the destination row from booking mode transitions the sheet's content to search mode (see R10).

**Dependencies:** R1, R10.

---

### R4: Vehicle-type carousel
**Description:** Below the destination row, a horizontally scrollable carousel of vehicle-type cards is rendered. Each card corresponds to one active vehicle type from the backend catalog and displays that type's icon, its human-readable name, and its fare estimate for the current trip in XOF. The carousel is fully populated from backend data — no vehicle-type entries are hardcoded in the client. Exactly one card is selected at a time; the selected card is visually distinguished using the primary action color defined in `DESIGN.md`. Tapping a different card changes the selection. The initial selection is the first card in the carousel ordering returned by the catalog.

**Acceptance Criteria:**
- [ ] The set of cards in the carousel is derived from the backend vehicle-catalog response; there are no client-side hardcoded vehicle-type entries.
- [ ] Each card displays an icon resolved from the vehicle type's icon key, the vehicle type's display name, and a fare estimate string formatted as a whole-number XOF amount.
- [ ] Each card's fare estimate comes from the backend fare-estimation response for the current trip; the client does not compute or hardcode fares.
- [ ] Exactly one card is in the selected state at any time.
- [ ] Tapping an unselected card transitions it to selected and the previously selected card to unselected in the same frame.
- [ ] The selected card's visual treatment uses the primary action color token defined in `DESIGN.md`; unselected cards use the neutral card treatment defined in `DESIGN.md`.
- [ ] The carousel can be scrolled horizontally to reveal cards that do not fit within the sheet's visible width (see R2 for gesture arbitration).

**Dependencies:** R1, R2, `cavekit-ride-booking.md` R6, `cavekit-ride-booking.md` R7, `cavekit-vehicle-catalog.md` R1, `cavekit-fare-estimation-api.md` R1.

---

### R5: Payment row placeholder
**Description:** Below the vehicle-type carousel, a payment row is rendered as a placeholder. It shows a label indicating the current payment method context and a trailing chevron indicating interactivity, but no payment integration is wired up in this kit. Tapping the row surfaces a transient "coming soon" notice to the user and does not open any payment flow.

**Acceptance Criteria:**
- [ ] The payment row renders a label and a trailing chevron affordance.
- [ ] Tapping the payment row surfaces a transient, auto-dismissing notice to the user whose copy indicates the feature is not yet available.
- [ ] Tapping the payment row does not dispatch any network request, does not navigate, and does not mutate the booking store or ride state.

**Dependencies:** R1.

---

### R6: Book Now primary action
**Description:** At the bottom of the sheet, a single primary action control labelled for booking is rendered. Its enabled state is bound to the booking domain's readiness signals: it is disabled while the fare estimate is loading for the current destination, while a ride-creation request is in flight, and whenever the selected vehicle type's fare estimate has not yet resolved. Its visual treatment uses the primary action color token from `DESIGN.md`. Tapping it, when enabled, triggers ride creation for the currently selected vehicle type.

**Acceptance Criteria:**
- [ ] The "Book Now" control uses the primary action color token defined in `DESIGN.md` when enabled.
- [ ] The control is rendered in a visibly disabled (non-interactive) state whenever the fare estimate is loading for the current destination.
- [ ] The control is rendered in a visibly disabled state whenever a ride-creation request for this sheet is in flight.
- [ ] The control is rendered in a visibly disabled state whenever the selected vehicle type has no resolved fare estimate.
- [ ] Tapping the enabled control dispatches exactly one ride-creation action for the currently selected vehicle type (see `cavekit-ride-booking.md` R2 and R6).
- [ ] Concurrent taps on the control produce at most one in-flight ride-creation request.

**Dependencies:** R1, R4, `cavekit-ride-booking.md` R2, `cavekit-ride-booking.md` R6.

---

### R7: In-sheet searching state
**Description:** After a successful tap of "Book Now", the sheet's content transitions in place to a searching state: the destination row remains visible, the vehicle-type carousel and payment row are replaced by an animated retry timeline (three-attempt driver-match progress) and a single cancel control. No route navigation occurs — the map stays visible and the sheet stays on screen. When the user taps cancel, the cancel action from the booking domain is invoked; on confirmation, the sheet dismisses cleanly. On successful driver match, the sheet dismisses (subsequent matched-state UI is owned by the driver-matching kit).

**Acceptance Criteria:**
- [ ] Transitioning from the pre-booking state to the searching state does not push, replace, or pop any navigation route.
- [ ] In the searching state, the destination row is still visible; the vehicle-type carousel, payment row, and "Book Now" control are not rendered.
- [ ] In the searching state, an animated retry timeline and a single cancel control are rendered in place of the replaced rows.
- [ ] The cancel control is rendered below the retry timeline as a secondary/destructive-styled action and remains interactive throughout the searching state, including while the no-driver fallback (see `cavekit-driver-matching.md` R3) is active.
- [ ] Tapping the cancel control does not immediately invoke the cancellation action; a confirmation prompt is presented first with at least two options: confirm cancellation and dismiss (keep searching).
- [ ] While the cancellation request is in flight, the confirmation action is rendered non-interactive and shows a loading indicator; duplicate cancellation requests cannot be dispatched during this window.
- [ ] If the cancellation request returns an error, the confirmation prompt closes, an inline error notice with a retry affordance is shown, and the active ride identifier and searching state are preserved (not discarded).
- [ ] On confirmed successful cancellation, the confirmation prompt closes, the sheet dismisses, and the map surface returns to the pre-booking state with no residual searching UI.
- [ ] On successful driver match (ride FSM transitions to `matched`), the sheet dismisses cleanly within one animation frame of the state change.

**Dependencies:** R1, R6, `cavekit-ride-booking.md` R3, `cavekit-driver-matching.md` R1.

---

### R8: Retired booking route
**Description:** The previous standalone booking route is retired. The booking surface is the in-map sheet and nothing else. No code path, deep link, or navigation call in the application may attempt to open a dedicated booking route.

**Acceptance Criteria:**
- [ ] A full-codebase search finds zero references that navigate to, push, replace, or declare a standalone booking route.
- [ ] The repository contains no route file corresponding to a standalone booking screen.
- [ ] Entering the booking flow is only possible via the in-map sheet described in R1.

**Dependencies:** R1, R7.

---

### R9: Type-safety of the sheet surface
**Description:** The booking sheet component must compile cleanly under the project's strict TypeScript configuration. All props, state, and values consumed from the ride-booking domain flow through explicit, shared types; there are no `any` types and no untyped network payloads leaking into the sheet.

**Acceptance Criteria:**
- [ ] A strict-mode TypeScript check of the booking sheet component and its direct dependencies reports zero type errors.
- [ ] The sheet does not declare any `any`-typed prop, state, or local variable in its own source.
- [ ] The sheet does not redefine types that already exist in the shared types package (vehicle type, fare estimate response, ride FSM state); it imports them.

**Dependencies:** R1, R4, R6, R7, `cavekit-ride-booking.md` R5.

---

### R10: Unified sheet mode machine
**Description:** The booking sheet is a single, persistent instance that holds two internal content modes: **search mode** (autocomplete input, history list, keyboard-aware layout — the content formerly owned by a standalone location-search overlay) and **booking mode** (vehicle-type carousel, fare estimates, payment row placeholder, "Book Now" control). Mode transitions happen inline within the same sheet instance — the sheet is never unmounted, remounted, or replaced during a mode change. The UI store exposes a single sheet-mode atom (not two independent booleans for a location overlay and a booking sheet) with at least the values `idle`, `search`, `booking`, and `matching`. Opening the app's destination flow for the first time enters search mode; confirming a destination transitions to booking mode; tapping the destination row from booking mode returns to search mode. The animated mode transition itself visually covers the fare estimate resolution so that booking mode appears with a populated fare rather than a loading placeholder.

**Acceptance Criteria:**
- [ ] The sheet renders exactly one of two content modes at a time: search mode or booking mode.
- [ ] A mode transition between search and booking occurs within a single sheet instance; the sheet's root content container is not unmounted, remounted, or replaced during the transition.
- [ ] The mode transition between search and booking is animated (not an instantaneous swap).
- [ ] The UI store exposes a single sheet-mode atom whose value space includes at least `idle`, `search`, `booking`, and `matching`.
- [ ] The UI store does not expose a separate boolean representing a standalone location overlay's open state alongside a separate boolean representing the booking sheet's open state; the sheet-mode atom is the sole source of truth.
- [ ] Entering the app's destination flow for the first time sets the sheet-mode atom to `search` and opens the sheet with search-mode content visible.
- [ ] Confirming a destination from search mode sets the sheet-mode atom to `booking` and renders booking-mode content in the same sheet instance.
- [ ] Tapping the destination row from booking mode sets the sheet-mode atom to `search` and renders search-mode content in the same sheet instance.
- [ ] In search mode, the soft keyboard is presented and the sheet's content layout keeps the search input and the currently focused results list visible above the keyboard with no visible layout jank (no overlap, no clipped input, no flicker during keyboard show/hide).
- [ ] The animated transition from search mode to booking mode completes before any fare estimate loading indicator becomes visible (i.e., booking mode renders with an already-resolved fare, using the transition animation itself as the loading affordance).
- [ ] A full-codebase search finds zero instances of a standalone destination-search modal/overlay being mounted outside of the unified booking sheet's search mode content surface.
- [ ] The sheet-mode atom transitions to `matching` when the in-sheet searching state (R7) becomes active, and back to `idle` on sheet dismissal.

**Dependencies:** R1, R3, R7, `cavekit-location-search.md` R7.

---

## Out of Scope
- Payment method selection, wallet integration, wallet top-up, or any real payment integration (the payment row is placeholder-only; see R5 — unchanged).
- Per-vehicle-type differentiated visual or behavioral treatment beyond the fare value rendered on the card.
- Dark mode and theme switching.
- Accessibility (screen reader labels, focus order, dynamic type, reduced motion) audit.
- Driver-side UI.
- Draggable pickup pin UI and pickup confirmation — see `cavekit-pickup-selection.md`.
- Post-match driver card, ride-tracking banner, and arrival UI — see `cavekit-driver-matching.md`, `cavekit-ride-tracking.md`.
- Post-ride rating, tipping, receipt, or history UI.
- Scheduled / future-dated bookings and multi-stop trips.

## Cross-References
- See also: `cavekit-ride-booking.md` — all data, fare resolution, ride creation, and cancellation actions consumed by the sheet.
- See also: `cavekit-vehicle-catalog.md` — backend source of the vehicle-type cards rendered in R4.
- See also: `cavekit-fare-estimation-api.md` — backend source of the per-card fare amounts rendered in R4.
- See also: `cavekit-location-search.md` — provides the confirmed destination that triggers the sheet (R1) and populates the destination row (R3).
- See also: `cavekit-driver-matching.md` — owns the matched-state UI that appears after the sheet dismisses on successful match (R7).
- See also: `DESIGN.md` — primary action color token used by the selected vehicle card (R4) and the "Book Now" control (R6); neutral card treatment for unselected cards (R4).

## Changelog
- 2026-04-20: Initial draft. Introduces the in-map booking sheet as the sole booking surface, formalises snap-point gesture arbitration against the horizontal carousel, and retires the standalone booking route.
- 2026-04-20: Extended with unified modal mode machine (R10), three snap points (R2 update), interactive destination row (R3 update). LocationModal retired as standalone; search is now a mode of this sheet.
