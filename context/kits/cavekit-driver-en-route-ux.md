---
created: "2026-04-22"
last_edited: "2026-04-22"
---

# Cavekit: Driver En-Route UX

## Scope
Covers the user-experience behaviour rendered while the ride lifecycle is in
the `pickup_en_route` state: the user has been picked up by the driver and
the pair is travelling together from the user's pickup position toward the
booking destination. This kit owns the route polyline shown on the map, the
sheet snap behaviour on state entry, the mini-strip content (driver avatar,
name, live ETA to destination, progress indicator), the peek/full-sheet
content (full driver card, ETA, cancel control), the live ETA countdown and
its latched "arrived" condition, and the demo-mode trigger that enters this
state.

Boundary: this kit picks up where `cavekit-matched-arrival-ux.md` R3 leaves
off (after the driver-arrived sub-state in `matched`). It is strictly about
presentation and interaction while `rideState === 'pickup_en_route'`. It
does not own the ride-state machine, the driver data shape, the route
geometry service, or any UI presented after arrival at the destination.

## Requirements

### R1: Route polyline to destination
**Description:** While `rideState === 'pickup_en_route'`, the map renders a
route polyline whose start endpoint is the user's pickup position and whose
end endpoint is the booking destination. The polyline is drawn from the
route geometry already available from the existing route directions
surface — entering this state does not trigger a new network call to fetch
route geometry. On state entry, the map camera animates to frame both
endpoints (the pickup position and the destination) simultaneously.

**Acceptance Criteria:**
- [ ] While `rideState === 'pickup_en_route'`, a polyline is rendered on
      the map whose visible start endpoint coincides with the user's
      pickup position.
- [ ] While `rideState === 'pickup_en_route'`, the polyline's visible end
      endpoint coincides with the booking destination.
- [ ] The polyline geometry shown is the geometry already available from
      the existing route directions surface (no new network request to
      fetch route geometry is issued as a result of entering this state).
- [ ] When the transition into `pickup_en_route` occurs, the map camera
      animates to a framing that includes both the pickup position and
      the destination within the visible viewport.
- [ ] The camera framing move is animated (not an instantaneous jump).
- [ ] The camera framing is triggered exactly once per entry into
      `pickup_en_route` (re-entering the state triggers it again).
- [ ] While `rideState !== 'pickup_en_route'`, the en-route polyline is
      not rendered on the map.

**Dependencies:** cavekit-route-directions.md, cavekit-pickup-selection.md,
cavekit-ride-tracking.md

### R2: Sheet auto-snaps to mini on state entry
**Description:** When the ride state transitions into `pickup_en_route`,
the booking modal sheet programmatically snaps to its mini snap level so
the mini-strip content defined in R3 becomes the visible surface. The
sheet remains non-dismissible for the entire duration of the
`pickup_en_route` state and reuses the same gesture-lock behaviour already
applied to the matched state. No new sheet-mode value is introduced — the
existing sheet mode used for the matched state is reused for
`pickup_en_route`.

**Acceptance Criteria:**
- [ ] When `rideState` transitions into `pickup_en_route`, the booking
      modal sheet is programmatically snapped to the mini snap level.
- [ ] While `rideState === 'pickup_en_route'`, no drag distance, velocity,
      or direction causes the booking modal sheet to be dismissed.
- [ ] While `rideState === 'pickup_en_route'`, no programmatic path
      inside this kit causes the booking modal sheet to be dismissed.
- [ ] While `rideState === 'pickup_en_route'`, the sheet responds to the
      same drag gesture used in booking mode and can be dragged between
      the mini, peek, and full snap levels.
- [ ] No new sheet-mode enum value is introduced for this state; the
      sheet mode value used in the `matched` state is reused while
      `rideState === 'pickup_en_route'`.

**Dependencies:** cavekit-booking-sheet-ux.md,
cavekit-matched-arrival-ux.md (R1)

### R3: Mini strip content (avatar, name, ETA, progress bar)
**Description:** While `rideState === 'pickup_en_route'` and the sheet is
at the mini snap level, the visible strip renders the driver's avatar
(with an initials fallback when the avatar image is unavailable), the
driver's name, the live ETA countdown to the destination (formatted per
R5), and a horizontal progress bar. The progress bar advances linearly
from 0% at state entry toward 95% as the ETA countdown decreases, and only
reaches 100% when the arrived condition in R5 latches. A map-pin icon is
rendered at the end of the progress bar as a visual anchor. The mini
strip does not render the booking destination text while
`rideState === 'pickup_en_route'`.

**Acceptance Criteria:**
- [ ] In the mini snap level while `rideState === 'pickup_en_route'`, the
      strip renders a driver avatar; when no avatar image is available or
      it fails to load, initials derived from the driver's name are
      rendered in its place.
- [ ] In the mini snap level while `rideState === 'pickup_en_route'`, the
      strip renders the driver's name as a visible text node.
- [ ] In the mini snap level while `rideState === 'pickup_en_route'`, the
      strip renders the live ETA value as a visible text node using the
      format defined in R5.
- [ ] In the mini snap level while `rideState === 'pickup_en_route'`, the
      strip renders a horizontal progress bar.
- [ ] At state entry into `pickup_en_route`, the progress bar's filled
      portion is 0% of its total width.
- [ ] While the ETA countdown is decreasing and the arrived condition in
      R5 has not yet latched, the progress bar's filled portion increases
      linearly with elapsed time and does not exceed 95% of its total
      width.
- [ ] The progress bar's filled portion reaches 100% of its total width
      only when the arrived condition in R5 has latched.
- [ ] A map-pin icon is rendered at the end of the progress bar as a
      visual anchor.
- [ ] In the mini snap level while `rideState === 'pickup_en_route'`, the
      booking destination text is not rendered in the strip.
- [ ] Tapping the mini strip while `rideState === 'pickup_en_route'`
      expands the booking modal sheet to its peek snap level.

**Dependencies:** R2, R5

### R4: Peek/full sheet content
**Description:** While `rideState === 'pickup_en_route'` and the sheet is
at the peek or full snap level, the body renders a full driver card
(driver name, vehicle type, vehicle plate, driver star rating), a large
ETA block showing the live ETA value formatted per R5, and a cancel
control. Pressing the cancel control triggers the same two-step
fee-warning flow defined in `cavekit-matched-arrival-ux.md` R2 — a warning
step with the exact copy "Votre conducteur est en route — des frais
d'annulation peuvent s'appliquer.", followed by the standard cancel
confirmation step — and the cancel action is only committed after both
steps are confirmed.

**Acceptance Criteria:**
- [ ] In the peek or full snap level while `rideState === 'pickup_en_route'`,
      the body renders the driver's name as a visible text node.
- [ ] In the peek or full snap level while `rideState === 'pickup_en_route'`,
      the body renders the vehicle type as a visible text node.
- [ ] In the peek or full snap level while `rideState === 'pickup_en_route'`,
      the body renders the vehicle plate as a visible text node.
- [ ] In the peek or full snap level while `rideState === 'pickup_en_route'`,
      the body renders the driver's star rating as a visible numeric or
      iconographic value.
- [ ] In the peek or full snap level while `rideState === 'pickup_en_route'`,
      the body renders the live ETA value in a large-format text block
      using the format defined in R5.
- [ ] In the peek or full snap level while `rideState === 'pickup_en_route'`,
      the body renders a cancel control.
- [ ] Pressing the cancel control while `rideState === 'pickup_en_route'`
      and before the arrived condition in R5 has latched presents a
      warning step.
- [ ] The warning step displays the exact string "Votre conducteur est en
      route — des frais d'annulation peuvent s'appliquer."
- [ ] The warning step does not display any numeric fee amount or
      currency value.
- [ ] After the user confirms the warning step, the standard cancel
      confirmation step is presented.
- [ ] The cancel action is only committed after the user confirms the
      second (standard) step.
- [ ] Dismissing the warning step without confirming does not commit the
      cancel action.
- [ ] Dismissing the standard confirmation step without confirming does
      not commit the cancel action.
- [ ] All user-facing strings rendered by this requirement are in French.

**Dependencies:** R3, cavekit-matched-arrival-ux.md (R2)

### R5: ETA countdown and arrived latch
**Description:** On entering `pickup_en_route`, the ETA display is seeded
from the en-route ETA value in seconds provided at state entry. The
displayed ETA decreases over real time at a one-second cadence until it
reaches zero. When the countdown reaches zero, an arrived condition
latches for the remainder of the `pickup_en_route` state — once latched,
subsequent changes to the ETA value (including non-zero values) do not
cause the arrived condition to revert. The arrived condition is the only
trigger that allows the progress bar in R3 to reach 100%. Formatting
rules mirror those used for the matched ETA: "X min" for values greater
than or equal to 60 seconds, and "Arrivée imminente" below 60 seconds
(and at zero).

**Acceptance Criteria:**
- [ ] On entering `pickup_en_route`, the ETA display is initialised from
      the en-route ETA value in seconds provided at state entry.
- [ ] The displayed ETA decreases over real time without requiring user
      interaction.
- [ ] When the remaining ETA is greater than or equal to 60 seconds, the
      value is rendered as "X min" where X is the remaining minutes
      (integer).
- [ ] When the remaining ETA is strictly less than 60 seconds and greater
      than zero, the rendered text is "Arrivée imminente".
- [ ] When the remaining ETA reaches zero, the rendered text is
      "Arrivée imminente" and does not render a negative value.
- [ ] When the ETA countdown reaches zero, an arrived condition latches.
- [ ] Once the arrived condition has latched, subsequent changes to the
      ETA value do not cause the arrived condition to revert while
      `rideState === 'pickup_en_route'`.
- [ ] The countdown stops updating when `rideState` is no longer
      `pickup_en_route`.

**Dependencies:** R2

### R6: Demo-mode entry trigger
**Description:** When demo mode is enabled, the `pickup_en_route` state
is entered automatically approximately three seconds after the arrived
condition defined in `cavekit-matched-arrival-ux.md` R3 has latched. No
user interaction is required to advance from the matched-arrived
sub-state into `pickup_en_route` in demo mode. A production trigger that
enters `pickup_en_route` in response to an authoritative server-side
signal (e.g. a WebSocket event from the backend indicating the user has
been picked up) is an explicit GAP — this kit does not define any
production-side event wiring.

**Acceptance Criteria:**
- [ ] When demo mode is enabled and the matched-arrived sub-state
      defined in `cavekit-matched-arrival-ux.md` R3 has latched,
      `rideState` transitions to `pickup_en_route` approximately three
      seconds later without any user interaction.
- [ ] When demo mode is disabled, this kit does not cause any automatic
      transition into `pickup_en_route`.
- [ ] A WebSocket or other server-originated trigger for entering
      `pickup_en_route` in production is not defined by this kit and is
      marked as a GAP for future work.

**Dependencies:** cavekit-matched-arrival-ux.md (R3)

## Out of Scope
- Real-time streaming of the driver's GPS position while
  `rideState === 'pickup_en_route'`. The user and driver are co-located;
  this kit does not animate a separate driver marker along the polyline.
- Introducing a new `sheetMode` enum value for this state. R2 explicitly
  reuses the existing matched-state sheet mode.
- Any backend change, new API endpoint, new Cloud Function, or schema
  change. The route geometry and the en-route ETA are consumed from
  surfaces already owned by other kits.
- Push notifications: no system notification is emitted or rendered when
  entering, progressing through, or leaving `pickup_en_route`.
- Production server-originated trigger (WebSocket, polling, push) for
  entering `pickup_en_route`. This is a GAP called out in R6.
- Post-pickup trip-view surfaces presented after arrival at the
  destination (receipt, rating, ride-complete screen, fare finalisation).
- Backend cancellation-fee calculation, fee amount, or fee display. Copy
  in R4 is intentionally fee-amount-free.
- Changes to the `rideState` finite-state machine or to the set of sheet
  modes.
- Matched-state behaviour (driver reveal, matched-state haptic, matched
  ETA countdown, matched camera move, driver-arrived sub-state) — owned
  by `cavekit-driver-reveal-ui.md` and `cavekit-matched-arrival-ux.md`.
- The route directions service, its caching, and its network contract —
  owned by `cavekit-route-directions.md`.
- Localisation of surfaces outside the `pickup_en_route` state.

## Cross-References
- See also: cavekit-overview.md
- See also: cavekit-driver-reveal-ui.md
- See also: cavekit-matched-arrival-ux.md
- See also: cavekit-booking-sheet-ux.md
- See also: cavekit-route-directions.md
- See also: cavekit-ride-tracking.md
- See also: cavekit-pickup-selection.md
