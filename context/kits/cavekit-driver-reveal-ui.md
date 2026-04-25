---
created: "2026-04-22"
last_edited: "2026-04-22"
---

# Cavekit: Driver Reveal UI

## Scope
Covers the matched-state presentation rendered inside the existing booking
modal sheet when the ride lifecycle transitions to `matched`. This includes
driver identity content, live ETA countdown, map camera behaviour on match,
haptic feedback on match entry, and French localisation of all strings in
this surface.

Boundary: this kit is strictly about what the user sees and feels when a
driver is successfully matched and the matched content replaces the
searching content inside the same sheet. It does not own the match decision
itself, driver data shape, or ongoing ride tracking after reveal.

## Requirements

### R1: Matched-state modal content
**Description:** When the ride state becomes `matched`, the body of the
booking modal sheet transitions from its searching content to a matched
content layout within the same sheet instance (no separate screen, no
separate overlay). The matched content displays the driver's name, the
vehicle type, an avatar image with an initials fallback when the image is
unavailable, the driver's star rating, and the current ETA value.

**Acceptance Criteria:**
- [ ] When `rideState` becomes `matched`, the booking modal sheet remains
      mounted and its body content changes to the matched layout.
- [ ] No new modal, screen, or full-screen overlay is presented when
      entering the matched state.
- [ ] The matched layout renders the driver's name as a visible text node.
- [ ] The matched layout renders the vehicle type as a visible text node.
- [ ] The matched layout renders a driver avatar; when no avatar image is
      available or it fails to load, initials derived from the driver's
      name are rendered in its place.
- [ ] The matched layout renders the driver's star rating as a visible
      numeric or iconographic value.
- [ ] The matched layout renders the ETA value in a visible text node
      formatted per R2.
- [ ] While `rideState === 'matched'`, the previous searching content
      (e.g. searching indicator, searching copy) is not rendered.

**Dependencies:** cavekit-booking-sheet-ux.md, cavekit-driver-matching.md

### R2: ETA countdown
**Description:** The ETA display in the matched layout counts down live
from the initial ETA value provided at match time (expressed in seconds)
until it reaches zero. The formatting switches based on the remaining
value.

**Acceptance Criteria:**
- [ ] On entering the matched state, the ETA display is initialised from
      the provided ETA value in seconds.
- [ ] The displayed ETA decreases over real time without requiring user
      interaction.
- [ ] When the remaining ETA is greater than or equal to 60 seconds, the
      value is rendered as "X min" where X is the remaining minutes
      (integer).
- [ ] When the remaining ETA is strictly less than 60 seconds and greater
      than zero, the rendered text is "Arrivée imminente".
- [ ] When the remaining ETA reaches zero, the rendered text is
      "Arrivée imminente" and does not render a negative value.
- [ ] The countdown stops updating when the ride state is no longer
      `matched`.

**Dependencies:** R1

### R3: Map camera on match
**Description:** On entering the matched state, the map camera animates
to center on the user's pickup position, not on the driver's position.

**Acceptance Criteria:**
- [ ] When the transition into `matched` occurs, the map camera's target
      coordinate becomes the user's pickup position.
- [ ] The camera movement is animated (not an instantaneous jump).
- [ ] The camera does not center on the driver's reported position as a
      result of entering the matched state.
- [ ] Entering the matched state triggers the camera move exactly once per
      entry (re-entering the state triggers it again).

**Dependencies:** cavekit-pickup-selection.md, cavekit-ride-tracking.md

### R4: Haptic feedback on match
**Description:** A single haptic impulse fires at the moment the matched
state is first entered.

**Acceptance Criteria:**
- [ ] Exactly one haptic impulse is triggered when `rideState`
      transitions into `matched`.
- [ ] No additional haptic impulses are triggered while `rideState`
      remains `matched` as a result of this kit's behaviour (e.g. ETA
      countdown ticks do not produce haptics).
- [ ] If the transition into `matched` occurs again after leaving the
      state, the haptic impulse fires again (once per entry).

**Dependencies:** R1

### R5: French strings
**Description:** All user-facing strings rendered by this domain are in
French.

**Acceptance Criteria:**
- [ ] Every visible text node rendered by the matched layout is in
      French.
- [ ] The ETA format strings defined in R2 ("X min", "Arrivée
      imminente") are the exact strings displayed.
- [ ] No English fallback strings are displayed in the matched layout
      under any locale.

**Dependencies:** R1, R2

## Out of Scope
- Push notifications: displaying driver identity, match confirmation, or
  ETA inside a system push notification when the app is backgrounded or
  killed. This is an explicit GAP — no notification is sent or displayed
  outside the app when a match occurs.
- The mock/demo matching behaviour itself: timing, triggers, and driver
  data generation remain owned by the existing demo mode toggle and are
  not modified by this kit.
- Post-reveal ride tracking UI (driver position updates on map, route
  polyline, pickup confirmation, cancellation flows).
- The driver matching decision, driver data shape, and matching API
  contract.
- Booking sheet open/close behaviour, snap points, and searching-state
  content.
- Ratings submission after the ride, driver profile deep-view, or any
  interaction with the driver beyond displaying the reveal content.
- Localisation of other surfaces outside the matched modal content.

## Cross-References
- See also: cavekit-overview.md
- See also: cavekit-booking-sheet-ux.md
- See also: cavekit-driver-matching.md
- See also: cavekit-ride-tracking.md
- See also: cavekit-pickup-selection.md
- See also: cavekit-matched-arrival-ux.md
