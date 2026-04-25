---
created: "2026-04-22"
last_edited: "2026-04-22"
---

# Cavekit: Post-Ride Rating Flow

## Scope
The end-to-end flow that takes a rider from ride completion to rating submission and back to the map. Covers automatic navigation into the receipt screen, the delayed rating modal overlay, the star and comment inputs, submission and error handling, the ride history entry point into the same screen, and reset of ride state after the flow ends. Does not cover the visual receipt itself (owned by `cavekit-trip-receipt.md`).

## Requirements

### R1: Auto-Navigation to Receipt Screen on Completion
**Description:** When the ride lifecycle enters the completed state, the app automatically takes the rider to a dedicated receipt screen that renders the trip receipt component for the completed ride.
**Acceptance Criteria:**
- [ ] When the ride lifecycle transitions into the `completed` state, the rider is navigated to the receipt screen without any manual action.
- [ ] The receipt screen receives the ride identifier for the completed ride.
- [ ] The receipt screen renders the trip receipt component (as defined in `cavekit-trip-receipt.md`) populated with the completed ride's data.
- [ ] The auto-navigation fires exactly once per completion event (re-entering the completed state in the same session does not re-trigger navigation if the receipt screen is already shown).
- [ ] The navigation is a forward transition, not a replacement that breaks back navigation semantics for the history-entry flow (see R6).

**Dependencies:** Ride lifecycle `completed` state; consumes the `Ride` identifier and data.

### R2: Rating Modal Auto-Show
**Description:** Five seconds after the rider arrives on the receipt screen via the completion flow, a rating modal overlays the screen; it can be dismissed at any time, and dismissal returns the rider to the map home screen.
**Acceptance Criteria:**
- [ ] The rating modal appears over the receipt screen approximately five seconds after the rider arrives on the screen via the completion auto-navigation.
- [ ] The rating modal does not appear when the receipt screen is opened from the ride history entry point (see R6).
- [ ] The modal is dismissible by the rider at any time via an explicit dismiss affordance.
- [ ] The modal never blocks navigation: the rider can leave the receipt screen before, during, or after the modal is shown.
- [ ] Dismissing the modal without submitting a rating navigates the rider back to the map home screen.
- [ ] If the rider leaves the receipt screen before the five-second delay elapses, the modal does not appear afterwards on whatever screen the rider has navigated to.

**Dependencies:** R1.

### R3: Star Rating Input
**Description:** The modal contains an interactive 1-to-5 star input that must be filled before the rating can be submitted.
**Acceptance Criteria:**
- [ ] The modal displays five stars that the rider can tap to select a rating from 1 to 5.
- [ ] The currently selected rating is visually distinguishable from the unselected stars.
- [ ] The rider can change the rating by tapping a different star before submitting.
- [ ] The submit action is disabled (or equivalently prevented) until a star rating has been selected.
- [ ] The star input reuses the shared interactive star rating component from the UI package (no duplicate component is introduced).

**Dependencies:** Existing `StarRating` component with `interactive` and `onRatingChange` support.

### R4: Optional Comment Input
**Description:** The modal contains an optional free-text field for the rider to add a short comment about the driver, with a maximum length of 280 characters.
**Acceptance Criteria:**
- [ ] A text input is visible within the modal alongside the star rating.
- [ ] The text input is optional: the rider can submit a rating with no comment.
- [ ] The text input enforces a hard maximum of 280 characters — additional characters cannot be entered beyond this limit.
- [ ] The remaining characters (or current length relative to 280) is visible to the rider while they type.
- [ ] The comment value, when non-empty, is included in the submission payload described in R5; when empty, it is omitted from the payload or sent as undefined (not as an empty string that would be stored).

**Dependencies:** R3.

### R5: Rating Submission
**Description:** Submitting the rating sends the rating and optional comment to the backend; on success the rider is returned to the map and the rating is stored on the ride; on failure the rider is given a clear error with a retry affordance.
**Acceptance Criteria:**
- [ ] Submitting the modal calls the backend rating callable with a payload containing the ride identifier, the selected star rating as an integer in the range 1–5, and the optional comment.
- [ ] On a successful response, the rider is navigated to the map home screen.
- [ ] On a successful response, the rating value is persisted as `clientToDriver` on the ride's rating data so that it is retrievable when the ride is viewed again in history.
- [ ] On a failed response, an error message is shown to the rider and the rider is offered an explicit retry affordance from within the modal.
- [ ] On a failed response, the modal does not dismiss automatically; the rider keeps their star selection and comment for retry.
- [ ] While submission is in flight, the submit affordance is in a loading/disabled state so the rider cannot double-submit.

**Dependencies:** R3, R4; shared `RideRating` type (`clientToDriver`, `comment?`); backend rating callable.

### R6: Ride History Entry Point
**Description:** Tapping a past trip in the ride history opens the same receipt screen used for the completion flow, but without the auto-showing rating modal.
**Acceptance Criteria:**
- [ ] Tapping a ride card in the ride history screen opens the receipt screen for that ride.
- [ ] The receipt screen opened via ride history renders the same trip receipt component, populated with the selected ride's data.
- [ ] The rating modal does NOT auto-appear on the receipt screen when it is opened via the ride history entry point.
- [ ] The rider can navigate back from the receipt screen to the ride history screen using standard back navigation.
- [ ] If a past ride already has a `clientToDriver` rating stored, no submission affordance is offered in this flow (this flow is read-only).

**Dependencies:** R1; existing ride history screen.

### R7: Ride State Reset After Flow Completion
**Description:** After the post-ride flow concludes — either through rating submission or through dismissal of the rating modal — the ride lifecycle state is reset to idle and the booking bottom sheet returns to its initial search mode, so the rider can immediately start a new trip.
**Acceptance Criteria:**
- [ ] Submitting a rating successfully resets the ride lifecycle state to `idle`.
- [ ] Dismissing the rating modal without submitting also resets the ride lifecycle state to `idle`.
- [ ] After the reset, the booking bottom sheet is back to its search mode (the initial mode used before a ride is requested).
- [ ] After the reset, no lingering data from the completed ride is exposed to the new-ride entry UI (no stale driver info, no stale fare, no stale route).
- [ ] Resets triggered by the ride history entry point (R6) do not occur — that flow is read-only and must not alter ride lifecycle state.

**Dependencies:** R2, R5.

## Out of Scope
- Backend endpoint implementation of the rating callable (assumed to exist or to be scaffolded separately).
- Push notification when the receipt is ready.
- Dispute or refund flows.
- Tipping.
- Driver-to-client rating (the reverse direction of R3/R5).
- Dark mode theming.
- The visual receipt layout and torn-edge treatment itself (see `cavekit-trip-receipt.md`).
- Rating edits after submission.
- Aggregated driver rating displays or driver profile screens.

## Cross-References
- See also: `cavekit-trip-receipt.md` — Provides the standalone receipt component rendered by the screen in R1 and R6.
