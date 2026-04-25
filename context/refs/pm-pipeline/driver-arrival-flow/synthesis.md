# Synthesis: Driver Arrival Flow

## Scope (3 concerns, 1 domain)
All three concerns live inside the BookingSheet matched body — one kit: **matched-arrival-ux**

1. **Mini state for matched** — gesture already allows mini via `isBookingModeShared=1`; need to confirm mini strip shows driver name + ETA glance (not the booking destination)
2. **Cancel fee warning** — replace flat cancel confirmation with a warning that fees may apply; no actual fee amount (backend has none yet); copy: "Votre conducteur est en route — des frais d'annulation peuvent s'appliquer"
3. **Arrived state** — when ETA reaches 0 (latched, never reverts), modal body switches to "Conducteur arrivé — en attente" with no cancel button

## Key Risks to Address in Spec
- **ETA=0 is unreliable as arrived signal** → use a `hasArrived` boolean latch (never reverts) + only flip on transition, not on oscillation. Server `ride:arrived` event is authoritative when available; ETA=0 is the client-side fallback.
- **No backend fee logic** → cancel fee warning must NOT state an amount. "Des frais peuvent s'appliquer" only.
- **Demo ETA of 300s is too long for QA** → reduce `DEMO_DRIVER.etaSeconds` to 30 for testing; easy 1-line change.

## Constraints
- No new `rideState` FSM values — arrived is a local UI state within `matched`
- No new bottom sheet modes — stays in `matching` sheetMode throughout
- Cancel button absent in arrived state — no confirmation dialog needed either
- All strings French

## Suggested Domain Decomposition
Single domain: **matched-arrival-ux** — extends `cavekit-driver-reveal-ui.md`

## Success Criteria Candidates
- Matched modal mini strip shows driver name + ETA (not destination)
- Swiping down on matched modal → mini; never dismisses
- Cancel dialog after driver accepted shows fee warning copy
- When ETA=0, body switches to arrived state; cancel button gone
- Arrived state never reverts even if ETA component glitches
