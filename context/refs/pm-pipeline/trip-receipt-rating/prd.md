# PRD — Trip Receipt Screen & Driver Rating Flow
**Product:** Glidey (Client App — Senegal, XOF)
**Status:** Draft
**Date:** 2026-04-22

---

## 1. Summary

After a scooter ride completes, riders currently have no in-app closure — no fare breakdown, no receipt, and no way to rate their driver. This feature introduces a polished trip receipt screen (torn-edge paper aesthetic) shown automatically at ride completion, plus a 5-second-delayed rating modal that lets riders score the driver 1–5 stars with an optional comment. The receipt component is designed as a standalone, shareable unit reusable in ride history and the future driver app.

---

## 2. Problem

Riders leaving a Glidey ride have three unmet needs:

1. **Transparency** — they cannot verify the fare breakdown, distance, or applied discounts without leaving the app.
2. **Closure** — there is no explicit end-of-ride moment; the FSM transitions to `completed` but the UI stays on the booking bottom sheet with no new affordance.
3. **Trust signal** — without a rating mechanism, driver quality cannot be tracked, eroding marketplace reliability and safety.

Absence of a receipt also blocks future features: PDF export, dispute resolution, and loyalty/discount programs.

---

## 3. Objective

Deliver a complete post-ride experience — receipt + rating — that gives riders fare confidence and a low-friction quality signal channel, while laying reusable component groundwork for ride history (already live in `rides.tsx`) and the driver app.

---

## 4. Target Users

- **Primary:** Glidey riders (clients) in Senegal who have just completed a paid scooter trip.
- **Secondary:** Riders reviewing past trips via the ride history screen (`app/(main)/rides.tsx`) who tap into a full receipt.
- **Future / Adjacent:** Driver-app users who will consume the same `TripReceipt` component to display completed ride summaries.

---

## 5. User Stories

1. **Auto-show receipt** — As a rider whose trip just ended, I want the receipt screen to appear automatically when my ride completes (`enRouteHasArrived` latches → FSM transitions to `completed`), so I don't have to navigate to find fare details.

2. **Fare transparency** — As a rider, I want to see a full fare breakdown (base fare, distance charge, discounts, total in XOF) alongside pick-up and drop-off addresses, so I can verify I was charged correctly.

3. **Driver context** — As a rider, I want to see the driver's avatar/initials, name, distance covered, and payment tag at the top of the receipt, so the trip feels personalised and the key facts are immediately visible.

4. **Star rating** — As a rider, I want a 1–5 star rating prompt to appear automatically 5 seconds after drop-off (dismissible), so I can quickly rate my driver without extra navigation, and after submitting I'm returned to the map.

5. **Optional comment** — As a rider who had a notably good or bad trip, I want to add a short text comment alongside my star rating, so the operations team gets actionable feedback.

6. **Receipt in history** — As a rider reviewing past trips in the ride history list, I want to tap a trip card and open the same full receipt screen, so I have consistent fare detail access regardless of entry point.

---

## 6. Scope

### IN

- `TripReceipt` component — standalone, shareable:
  - Torn-edge paper visual treatment (top and bottom SVG mask or border-image)
  - Header row: driver avatar (photo or initials fallback) + name + total price (XOF) + distance + payment tag + discount tag (if applicable)
  - Address rows: PICK UP, DROP OFF, NOTED (optional rider note, shown only if present)
  - TRIP FARE section: line-item breakdown (base, per-km rate × distance, discounts) + "Amount Paid" total
  - Small "Download PDF" text link (placeholder/stub; full PDF gen is out of scope for this release)
- Auto-display of receipt screen on `completed` FSM state (triggered by `enRouteHasArrived` latch)
- Rating modal — auto-shown 5 s after drop-off; dismiss → back to map; submit rating → POST to backend → back to map
- 1–5 interactive star input (re-use existing `StarRating` component from `@rentascooter/ui`)
- Optional comment `TextInput` (max 280 chars) inside rating modal
- Replace booking CTA (cancel button) with rating affordance once in `completed` state
- Expo Router screen/route wiring (`app/(main)/trip-receipt/[rideId].tsx` or modal route) supporting both entry points (post-ride auto and history tap)
- i18n keys for all new strings (fr + en), XOF formatting via `toLocaleString()`
- TypeScript strict compliance; types sourced from `@rentascooter/shared` (`Ride`, `Fare`, `DriverInfo`)

### OUT

- Actual PDF generation / file export (stub link only)
- Push notification for receipt
- Backend rating submission endpoint changes (assumes existing or thin new callable)
- Dispute / refund flow
- Tipping
- Driver-side receipt view (future)
- Dark mode (follow existing app convention)

---

## 7. Success Metrics

| KPI | Baseline | Target (30 days post-launch) |
|---|---|---|
| Rating submission rate (completed trips with a rating) | 0% (no feature) | ≥ 55% |
| Receipt screen open rate (completed trips where receipt renders) | 0% | ≥ 90% (auto-show) |
| Support contacts re fare disputes (weekly avg) | TBD from ops | -30% vs. pre-launch baseline |

---

## 8. Open Questions

1. **Backend rating callable** — Does `submitRating` already exist as a Firebase Cloud Function, or does it need to be scaffolded? If new, which team owns it and what is the SLA for availability before client dev completes?

2. **Fare data availability at completion** — The current `Ride` type exposes `fare.total` and `fare.currency` (confirmed in `rides.tsx`). Are `fare.breakdown` line items (base fare, per-km rate, discount amount) reliably returned by the backend at `completed` state, or will the receipt need a fallback / loading state while they hydrate?

3. **"Download PDF" disposition** — Should the stub link show a "coming soon" toast, open a browser to a server-rendered receipt URL, or be hidden entirely until PDF gen is ready? Product needs to decide before implementation to avoid a dead CTA at launch.
