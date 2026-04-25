# Unified Search+Booking Modal — PM Assumption Analysis

**Feature:** Replace separate LocationModal + BookingSheet overlays with a single persistent modal that transitions between "search" and "booking" modes internally.

**Date:** 2026-04-20
**Market:** Senegal (Dakar) ride-booking, Expo/React Native client

---

## Assumption Table

| # | Category | Assumption | Confidence | Fast Test / Experiment |
|---|----------|------------|------------|------------------------|
| 1 | **Value** | Users find the current two-modal handoff (X → LocationModal → BookingSheet) jarring enough to notice and care about the friction. | LOW | Run 3–5 guerrilla usability sessions in Dakar with think-aloud protocol. Count how many users pause, backtrack, or verbally express confusion at the transition point. |
| 2 | **Value** | Reducing modal-stack depth will measurably improve booking completion rate (funnel drop-off at destination-change step is significant). | LOW | Instrument current funnel with analytics events: `destination_change_initiated`, `booking_sheet_abandoned_after_change`. If < 10% of sessions trigger destination-change, the value signal is weak. |
| 3 | **Usability** | Users will intuitively understand that tapping the destination row in mini/peek state opens inline search within the same sheet — without any explicit affordance or tooltip. | LOW | Prototype the peek-state destination row (even a Figma clickthrough) and run 5-user task test: "Change your destination." Measure discovery rate without prompting. |
| 4 | **Usability** | The animated state transition between search mode and booking mode will be legible at low-end Android performance levels common in Senegal (entry-tier devices, throttled JS thread). | MEDIUM | Build a minimal Expo prototype of the animation (Reanimated 2 or LayoutAnimation). Profile on a Tecno or Itel device at 3G. If frame drops > 3 per transition, the animation degrades trust rather than builds it. |
| 5 | **Usability** | Users who arrive at booking mode (fare carousel) will not accidentally trigger the search mode by misinterpreting the destination row as an input field, causing unintended state resets. | MEDIUM | Add a misfire-click counter in the prototype session. If > 30% of users accidentally open search when they intended to scroll the carousel, the tap target design needs rethinking. |
| 6 | **Feasibility** | The BookingSheet's three snap points (mini / peek / full) can coexist with inline search mode without layout conflicts — particularly keyboard avoidance when the soft keyboard appears over a bottom sheet at mini snap. | MEDIUM | Spike: implement keyboard-avoidance behavior on a branch using `@gorhom/bottom-sheet` with `keyboardBehavior="interactive"`. Verify on both iOS and Android that the sheet repositions correctly and the search input is not obscured. |
| 7 | **Feasibility** | A single modal component can cleanly encapsulate both LocationModal state (autocomplete queries, history list, Places API calls) and BookingSheet state (selected vehicle type, fare estimate, booking mutation) without creating an unmaintainable God component. | MEDIUM | Architecture spike: draft the component interface and state machine (XState or `useReducer`) in isolation. If the state graph exceeds ~12 nodes or requires more than 3 context providers, the design likely needs sub-component decomposition before build. |
| 8 | **Feasibility** | The Google Places autocomplete integration (currently in LocationModal) can be migrated into the unified sheet without re-triggering policy or billing changes, and without increasing latency visible to users on Senegal mobile networks. | HIGH | Review current Places API usage mode (session tokens vs. per-keystroke). Confirm the unified sheet preserves session-token grouping so billing does not increase. Run a latency test from a Dakar IP via VPN baseline. |
| 9 | **Strategy** | Unifying the modals aligns with the longer-term product vision — e.g., it does not block planned features like multi-stop trips, scheduled rides, or promo-code entry that may need their own sheet states. | MEDIUM | Map all roadmap features (Phase 4+) against the unified modal's state machine. Identify any planned feature that would require a third modal mode. If multi-stop is on the near horizon, validate the state model supports it before committing to this architecture. |
| 10 | **Strategy** | The effort to build and QA this unified modal (estimated non-trivial refactor) is higher-leverage than shipping other queued features (e.g., payment method selection, ride history) that may drive more user retention in the current growth phase. | LOW | Run a quick opportunity-cost scoring exercise with the team: rank top 5 queued features by estimated impact × confidence ÷ effort. If unified modal ranks below the median, defer and ship a lighter fix (e.g., reduce LocationModal open animation delay instead). |
| 11 | **Team** | The current mobile team has sufficient depth in `@gorhom/bottom-sheet`, Reanimated 2, and gesture handling to implement the snap-point + inline-search interaction without requiring a dedicated specialist or extended research spike. | MEDIUM | Check: has anyone on the team shipped a bottom sheet with dynamic content height changes driven by soft keyboard state on both platforms? If not, budget a 2-day feasibility spike before committing to a sprint. |
| 12 | **Team** | The Expo/React Native toolchain in this repo (current SDK version, any Expo Go vs. dev-client constraints) supports the animation and gesture primitives required without requiring a bare workflow ejection or native module addition. | HIGH | Run `expo doctor` and confirm `@gorhom/bottom-sheet` and `react-native-reanimated` are already installed and at compatible versions. If not installed, assess whether adding them triggers a dev-client rebuild requirement that would slow the team. |

---

## Top Risk

**Assumption #3** is the highest-risk assumption: there is no validated evidence that Glidey users in Dakar will discover that tapping the destination row in a minimized bottom sheet opens inline search — this interaction pattern is uncommon in the local app ecosystem, and a failed affordance here breaks the entire unified-modal concept before it delivers any value.

---

## Recommended Validation Sequence

1. **Before any code:** Run guerrilla usability test (Assumptions 1, 3) — 3 sessions, 2 days.
2. **Parallel to design:** Architecture spike on state machine + snap-point keyboard interaction (Assumptions 6, 7) — 2-day timebox.
3. **Before sprint commit:** Opportunity-cost scoring (Assumption 10) — 1 workshop, 2 hours.
4. **During build:** Device performance profiling on low-end Android (Assumption 4) — continuous, gate on frame-rate threshold.
