---
created: "2026-04-22"
last_edited: "2026-04-22"
---

# Cavekit: Matched Arrival UX

## Scope
Covers user-experience behaviour that layers onto the matched-state body of
the booking modal sheet after a driver has been matched: the ability to
drag the sheet to a mini snap level (while keeping the matched body
non-dismissible), a two-step cancellation flow that warns about possible
fees once a driver has accepted the ride, and a latched "arrived" sub-state
rendered when the ETA countdown reaches zero.

Boundary: this kit extends `cavekit-driver-reveal-ui.md` with
interaction and lifecycle behaviour around the matched body. It does not
redefine the matched layout content, the ETA formatting, the match
decision, or the ride-state machine itself. The "arrived" condition is a
local UI sub-state within the existing `matched` ride state — it does not
introduce a new ride-state value and does not introduce a new sheet mode.

## Requirements

### R1: Mini state for matched modal
**Description:** While the matched-state body is showing inside the
booking modal sheet, the sheet responds to the same drag gesture used in
booking mode and can be dragged to a "mini" snap level. The matched
sheet must never be dismissed by the drag gesture (or by any other user
action inside this kit). In the mini snap level, the visible strip
displays the matched driver's name together with the current ETA value
(as formatted by `cavekit-driver-reveal-ui.md` R2). The strip must not
display the booking destination while in the matched state. Tapping the
mini strip expands the sheet back to its peek snap level, revealing the
full matched body.

**Acceptance Criteria:**
- [ ] While `rideState === 'matched'`, dragging the booking modal sheet
      downward snaps it to the same mini snap level used in booking
      mode.
- [ ] While `rideState === 'matched'`, no drag distance, velocity, or
      direction causes the booking modal sheet to be dismissed.
- [ ] While `rideState === 'matched'`, no programmatic path inside this
      kit causes the booking modal sheet to be dismissed.
- [ ] In the mini snap level while `rideState === 'matched'`, the strip
      renders the matched driver's name as a visible text node.
- [ ] In the mini snap level while `rideState === 'matched'`, the strip
      renders the current ETA value as a visible text node using the
      format defined in `cavekit-driver-reveal-ui.md` R2.
- [ ] In the mini snap level while `rideState === 'matched'`, the
      booking destination is not rendered in the strip.
- [ ] Tapping the mini strip while `rideState === 'matched'` expands the
      booking modal sheet to its peek snap level.
- [ ] Expanding from mini to peek re-renders the full matched body as
      defined in `cavekit-driver-reveal-ui.md` R1.

**Dependencies:** cavekit-driver-reveal-ui.md (R1, R2),
cavekit-booking-sheet-ux.md

### R2: Cancellation fee warning (two-step)
**Description:** Once a driver has been matched and accepted the ride,
pressing the cancel control in the matched body first shows a warning
step before the standard cancel confirmation step. The warning copy is
"Votre conducteur est en route — des frais d'annulation peuvent
s'appliquer." and does not state any fee amount. The user must progress
through two explicit confirmation steps — the warning step, then the
standard cancel confirmation step — before the cancel action is
committed. This two-step flow only applies in the matched state; it does
not appear in the searching state (before a driver has accepted).

**Acceptance Criteria:**
- [ ] While `rideState === 'matched'` and before the arrived sub-state
      (R3), pressing the cancel control presents a warning step.
- [ ] The warning step displays the exact string "Votre conducteur est
      en route — des frais d'annulation peuvent s'appliquer."
- [ ] The warning step does not display any numeric fee amount or
      currency value.
- [ ] After the user confirms the warning step, the standard cancel
      confirmation step is presented.
- [ ] The cancel action is only committed after the user confirms the
      second (standard) step.
- [ ] Dismissing the warning step without confirming does not commit
      the cancel action.
- [ ] Dismissing the standard confirmation step without confirming does
      not commit the cancel action.
- [ ] While `rideState === 'searching'` (before a driver has accepted
      the ride), pressing the cancel control does not present the
      warning step.
- [ ] All strings in the warning step are in French.

**Dependencies:** cavekit-driver-reveal-ui.md (R1)

### R3: Driver arrived sub-state
**Description:** When the live ETA countdown defined in
`cavekit-driver-reveal-ui.md` R2 reaches zero, the matched-state body
transitions to an "arrived" sub-state rendered inside the same booking
modal sheet. The arrived body displays the strings "Conducteur arrivé"
and "En attente de vous". No cancel control is rendered in the arrived
sub-state. The arrived sub-state is latched: once entered, it never
reverts to the non-arrived matched body for the remainder of the
`matched` ride state, regardless of any subsequent change in the ETA
value. The arrived sub-state is a local UI state within the existing
`matched` ride state — no new `rideState` value and no new sheet-mode
value are introduced. In demo mode, the arrived sub-state is entered as
a result of the local ETA countdown reaching zero.

**Acceptance Criteria:**
- [ ] When the ETA countdown reaches zero while `rideState === 'matched'`,
      the body of the booking modal sheet switches from the matched
      layout defined in `cavekit-driver-reveal-ui.md` R1 to an arrived
      layout.
- [ ] The arrived layout renders the exact string "Conducteur arrivé"
      as a visible text node.
- [ ] The arrived layout renders the exact string "En attente de vous"
      as a visible text node.
- [ ] The arrived layout does not render a cancel control.
- [ ] Once the arrived sub-state has been entered, subsequent changes
      to the ETA value (including non-zero values) do not cause the body
      to revert to the non-arrived matched layout while
      `rideState === 'matched'`.
- [ ] Entering the arrived sub-state does not change the value of
      `rideState` (it remains `matched`).
- [ ] Entering the arrived sub-state does not introduce a new sheet-mode
      value.
- [ ] In demo mode, the arrived sub-state is entered when the local ETA
      countdown reaches zero.
- [ ] All strings in the arrived layout are in French.

**Dependencies:** cavekit-driver-reveal-ui.md (R1, R2)

## Out of Scope
- Any backend cancellation-fee calculation, fee amount, or fee display.
  Copy in R2 is intentionally fee-amount-free.
- Authoritative server-side "arrived" signalling (e.g. a `ride:arrived`
  event). This kit only covers the client-side latched sub-state driven
  by the ETA countdown reaching zero.
- Post-arrival flows: pickup confirmation, ride-start handoff, rating,
  receipt, or any UI after the user has been picked up.
- Changes to the `rideState` finite state machine, the set of sheet
  modes, or the searching-state behaviour.
- The matched layout content itself (driver name, avatar, rating, ETA
  formatting) — defined in `cavekit-driver-reveal-ui.md`.
- Mini-strip rendering or dismissal behaviour of the booking sheet while
  `rideState !== 'matched'`.
- Haptics, map camera behaviour, and other reveal-time behaviour owned by
  `cavekit-driver-reveal-ui.md`.
- Tuning of the demo ETA duration.

## Cross-References
- See also: cavekit-overview.md
- See also: cavekit-driver-reveal-ui.md
- See also: cavekit-booking-sheet-ux.md
- See also: cavekit-driver-en-route-ux.md
