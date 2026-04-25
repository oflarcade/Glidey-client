# PRD — Driver Arrival Flow (BookingSheet)

**Feature:** Driver arrival UX — minimisable matched modal, late-cancel warning, arrived state
**Status:** Draft | **Date:** 2026-04-22 | **Author:** PM (generated)
**Stack:** Expo 54 · RN 0.81 · TypeScript strict · BookingSheet (mini/peek/full snaps) · rideStore FSM

---

## 1. Summary

Once a driver accepts a ride, the booking modal must stay persistent (never dismissable) but allow the rider to minimise it to a peek strip. Cancelling after match triggers a fee warning. When the driver arrives, the modal body switches to a dedicated "arrived" state that removes the cancel affordance.

---

## 2. Problem

The current BookingSheet has no differentiated behaviour across FSM states after matching:

- Riders can accidentally dismiss the modal during an active ride (data loss risk).
- No friction exists before a late cancellation, exposing the platform to margin loss.
- The driver-arrived state is visually indistinguishable from pickup-en-route, causing rider confusion and missed departures.

---

## 3. Objective

Deliver a polished, state-aware modal experience from driver match through vehicle pickup that protects revenue, reduces confusion, and matches the gesture ergonomics riders already know.

---

## 4. Target Users

| Segment | Context |
|---|---|
| Primary | Riders in an active booking (FSM: matched → pickup_en_route) |
| Secondary | QA / demo mode testers (EXPO_PUBLIC_USE_DEMO=true) |

---

## 5. User Stories

**US-1 — Minimisable matched modal**
As a rider whose driver has accepted, I want to collapse the modal to a peek strip so I can view the map, knowing the booking is still active.
- Acceptance: swipe-down collapses to mini snap; swipe-up restores to full; no dismiss gesture available; back-button does not close.

**US-2 — Late-cancellation warning**
As a rider who wants to cancel after driver acceptance, I want to see a clear warning that a cancellation fee will apply before I confirm, so I can make an informed decision.
- Acceptance: tapping "Cancel ride" shows an inline or bottom sheet confirmation with the string "Vous serez facturé des frais d'annulation" and requires a second explicit confirm tap; dismissing the warning leaves the booking intact.

**US-3 — Driver-arrived state**
As a rider whose driver has arrived, I want the modal to show a clear "arrived" indicator and hide the cancel button, so I know to board and cannot accidentally cancel.
- Acceptance: FSM transition to `pickup_en_route` (arrived sub-state) swaps modal body to "Conducteur arrivé — en attente" copy; cancel CTA is unmounted (not hidden via opacity); snap level stays at peek or full, never mini-only.

---

## 6. Scope

### In
- BookingSheet snap-level logic: lock dismiss for states `matched` and `pickup_en_route`.
- Minimise gesture (mini snap) enabled for `matched` state.
- Late-cancel confirmation dialog/sheet with fee warning copy (FR).
- Arrived modal body component with no cancel button.
- Demo mode compatibility: all states reachable via EXPO_PUBLIC_USE_DEMO=true fake driver.
- rideStore FSM guard: cancel action blocked once FSM reaches arrived sub-state.

### Out
- Actual fee calculation or backend charge logic.
- Push notification for driver arrival (separate epic).
- English copy / i18n infrastructure (FR only for now).
- Android back-gesture overrides (deferred to nav hardening epic).
- Cancellation policy settings screen.

---

## 7. Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Modal accidental-dismiss rate (matched state) | 0% | Sentry event `booking_sheet_dismissed_while_active` |
| Late-cancel confirmation completion rate | >90% see warning before cancelling | Analytics: `cancel_warning_shown` vs `cancel_confirmed` |
| Driver-arrived state render correctness | Cancel CTA absent in 100% of arrived-state renders | Detox assertion in CI |
| Demo mode: all 3 states reachable without crash | Pass | CI smoke test |

---

## 8. Open Questions

1. **Fee amount display** — Should the warning show the actual fee value (requires backend call) or generic copy? If dynamic, what is the latency budget?
2. **Arrived sub-state signal** — Does the FSM receive a WebSocket event or poll? Confirm contract with backend team before implementation.
3. **Timeout on arrived state** — If rider does not board within N minutes, does the booking auto-cancel? If so, does the cancel fee still apply?
4. **Mini snap label** — What copy appears in the peek strip when minimised (driver name + ETA, or generic "Ride active")?
5. **Haptic feedback** — Should the arrived state transition trigger a haptic pulse? Confirm with design.
