# PRD: Unified Search + Booking Modal

**Feature:** Unified Search + Booking Modal
**Status:** Draft
**Date:** 2026-04-20
**Author:** PM Pipeline

---

## 1. Summary

Replace Glidey's two separate overlays — `LocationModal` (destination search) and `BookingSheet` (vehicle carousel + Book Now) — with a single persistent bottom sheet that manages two internal modes: **search** and **booking**. The sheet transitions between modes inline, with no modal stacking, and supports three snap points (mini, peek, full) to keep the map visible during the booking flow.

---

## 2. Problem

Users currently experience a jarring UX gap when moving from destination selection to vehicle booking. `LocationModal` is a full-screen keyboard overlay; `BookingSheet` is an independent bottom sheet. Dismissing one to open the other breaks spatial continuity — the map disappears, context resets, and users lose their place in the flow. There is no smooth handoff between "Where do I want to go?" and "What vehicle do I take?". The current workaround is to close the modal entirely and re-open the sheet, which costs 2–3 extra taps and confuses new users unfamiliar with the two-overlay pattern.

---

## 3. Objective

Deliver a single, stateful bottom sheet that handles the full pre-ride decision loop — destination search through booking confirmation — without ever replacing or stacking modals. The user should feel like they are in one continuous flow from first tap to "Book Now."

**Desired outcome:** Reduce pre-ride friction so that more sessions that start a search result in a completed booking.

---

## 4. Target Users

**Primary:** Commuters in Dakar, Senegal booking a scooter for a short urban trip. They are on Android mid-range devices (low RAM), often on a 4G connection, and may be unfamiliar with multi-step mobile booking flows. They expect the map to remain visible so they can verify the pickup/destination visually while deciding on a vehicle.

**Secondary:** First-time Glidey users exploring vehicle options before committing to a destination.

---

## 5. User Stories

1. As a rider, I want to tap the destination bar from the booking sheet without a new screen appearing, so that I stay oriented on the map while I type.
2. As a rider, I want the sheet to snap to a compact size while I browse the map, so that I can see my surroundings before confirming a pickup.
3. As a rider, I want fare estimates in XOF displayed on the vehicle carousel, so that I can choose a vehicle based on both type and cost without navigating away.
4. As a rider, I want the sheet to animate smoothly between search and booking modes, so that I understand what changed and do not feel lost in the flow.
5. As a rider, I want my recent destination history shown immediately when I open search mode, so that I can re-book a common trip in one tap.
6. As a rider, I want to tap "Book Now" from the peek or mini snap point without expanding the sheet to full height, so that quick bookings feel fast.

---

## 6. Scope

**In scope:**
- Single `UnifiedBookingSheet` component replacing `LocationModal` and `BookingSheet`
- Two internal modes: `search` (autocomplete input, history list, keyboard-aware layout) and `booking` (vehicle carousel, XOF fare estimates, Book Now CTA)
- Three snap points: mini (compact destination summary bar), peek (fare/vehicle selection visible), full (full-height search or booking detail)
- Animated mode transition (search <-> booking) within the same sheet instance — no unmount/remount
- Destination row tap from mini/peek snaps sheet to full and switches to search mode inline
- Recent search history rendered in search mode before any query is typed
- XOF fare estimate per vehicle type displayed on each carousel card
- Keyboard-aware scroll behavior in search mode (sheet rises with keyboard, collapses on dismiss)

**Out of scope:**
- Redesign of the map or pickup pin interaction
- Real-time dynamic pricing logic (estimates can be static/computed client-side for now)
- Driver tracking or post-booking state
- Payment flow changes
- iOS-specific gesture tuning (initial build targets Android)
- Accessibility audit (follow-up ticket)

---

## 7. Success Metrics

1. **Search-to-booking conversion rate:** Percentage of sessions where a destination search is followed by a "Book Now" tap. Target: increase from baseline by 15% within 30 days of release.
2. **Median pre-ride tap count:** Number of taps from opening the app to hitting "Book Now." Target: reduce from current baseline by at least 2 taps.
3. **Modal abandon rate:** Percentage of sessions where the search or booking overlay is opened and then dismissed without completing a booking. Target: reduce by 20% within 30 days.

---

## 8. Open Questions

1. **Snap point conflict with keyboard:** When the keyboard is open in search mode and the user swipes down to dismiss it, should the sheet return to peek or mini? What is the correct default snap on keyboard dismiss?
2. **Fare estimate data source:** Are XOF fare estimates available from the backend per vehicle type per distance, or do we compute them client-side using a fixed rate table? If backend, is the `/booking/estimate` endpoint ready and mobile-compatible?
3. **Search mode entry point:** Should the destination row in mini/peek mode be a pressable that expands to full + search, or should peek itself expand the search input inline without snapping to full? The answer affects whether the keyboard ever appears at peek height, which may cause layout issues on small screens.
