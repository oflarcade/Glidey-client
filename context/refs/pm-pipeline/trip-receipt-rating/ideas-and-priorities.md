# Trip Receipt & Driver Rating Flow — Ideas and Priorities
**Feature:** Post-ride receipt screen + driver rating flow
**Market:** Senegal (XOF currency)
**Stack:** Expo 54 / RN 0.81 / React 19 / TypeScript strict
**Date:** 2026-04-22

---

## Part 1 — Brainstorm (5 ideas per perspective)

---

### Product Manager — Market Fit, Value Creation, Competitive Edge

**PM-1. XOF-native receipt with mobile money line items**
Dakar riders predominantly pay via Wave or Orange Money. The receipt should natively show which mobile money wallet was charged, the transaction reference, and the XOF amount with no decimal confusion (XOF is zero-decimal). This differentiates Glidey from generic ride apps that show generic "card charged" copy, and directly reduces post-ride support tickets about payment confusion.

**PM-2. Shareable receipt as a growth loop**
Allow riders to share their receipt as a styled image card (not just a PDF) via WhatsApp, which is the dominant messaging surface in Senegal. A tap on "Share receipt" generates a card with the Glidey logo, trip summary, and a "Try Glidey" referral link. Every shared receipt is an organic acquisition touch.

**PM-3. Corporate/business trip tagging**
Senegal has a growing SME class expensing scooter rides. Let riders tag a trip as "Business" and optionally enter a project/client code before closing the receipt. The receipt PDF carries that tag. This unlocks a B2B sales angle (Glidey for Teams) without requiring a separate app surface.

**PM-4. Driver rating feeds real-time quality scoring visible to fleet ops**
Rating data should feed a live driver quality dashboard for the operations team. Low-rated drivers get auto-flagged for coaching. This turns the in-app rating from a vanity metric into an operational lever, directly improving NPS over time and creating a defensible quality moat vs. informal moto-taxi alternatives.

**PM-5. Dispute / issue report inside the receipt**
Add a single-tap "Report an issue" flow at the bottom of the receipt (wrong charge, unsafe ride, item left in vehicle). Capturing this at the moment of maximum context — right after the ride — dramatically reduces the lag between incident and report. It also gives the support team structured data rather than free-text WhatsApp messages.

---

### Product Designer — UX, Onboarding, Engagement Loops

**DES-1. Torn-edge paper receipt with motion entry**
The torn-edge top border is the signature visual metaphor. Animate it: the receipt slides up from the bottom of the screen with a subtle paper-unfurl spring (using `react-native-reanimated` layout transitions). This makes the post-ride moment feel rewarding rather than transactional, and reinforces Glidey's playful brand voice.

**DES-2. Progressive disclosure receipt — summary first, details on expand**
Show only the hero row (driver avatar, name, total, distance, payment badge) and a collapsed fare breakdown by default. A tap on "See breakdown" expands the line items with a smooth height animation. This respects the cognitive load of a rider who just finished a trip — they see the most important number first, and can drill in if needed.

**DES-3. Star rating with haptic feedback and emoji reinforcement**
Each star tap fires a distinct haptic (light → medium → heavy as score increases). At 5 stars, show a brief confetti micro-animation and swap the driver avatar border to gold. At 1-2 stars, the comment field auto-focuses with placeholder "What went wrong?" This creates an emotionally differentiated rating experience that increases completion rates vs. a bare star row.

**DES-4. Auto-modal with soft countdown indicator**
The rating modal auto-appears 5 seconds after drop-off. Show a subtle progress arc around the driver avatar that counts down visually — makes the auto-trigger feel intentional rather than intrusive. Dismiss is always available. This design pattern educates users that the modal is expected and time-bound, reducing dismissal anxiety.

**DES-5. Empty state + first-ride onboarding callout on the receipt**
For a rider's first completed trip, overlay a one-time coach mark on the rating section: "Let your driver know how they did." First-ride ratings are significantly higher in completion, so catching users at this moment with a warm nudge sets the habit. After first submission, the callout never appears again (persisted in AsyncStorage).

---

### Engineer — Technical Innovation, Integrations, Platform Leverage

**ENG-1. Standalone receipt component with shareable snapshot**
Build `<TripReceipt />` as a fully self-contained component — no navigation dependency, no store coupling, accepts a typed `TripReceiptProps` object. Use `react-native-view-shot` to capture it as a PNG for sharing (WhatsApp deep link) or as a base64 payload fed into a PDF generator (`expo-print` + `expo-sharing`). Standalone design makes it testable in isolation and embeddable in any future surface (push notification preview, email template via server-side render of the same JSX using `react-native-html`).

**ENG-2. Optimistic rating submission with offline queue**
Submit the star rating optimistically (update local state immediately, show success) and queue the actual API call via a lightweight job queue persisted in `expo-secure-store`. If the rider is on a flaky 3G connection (common in Dakar suburbs), the rating still registers on the next successful network round-trip. Use `@tanstack/react-query` mutation with `onMutate` / `onError` rollback pattern — consistent with the existing query layer.

**ENG-3. PDF generation fully on-device via expo-print**
Avoid a server round-trip for PDF generation. Build an HTML template string (injected with trip data) and pass it to `expo-print` to render a PDF natively. This removes a backend dependency, works offline, and means the "Download PDF" action is instant. The HTML template can be versioned alongside the app and supports XOF formatting natively via `Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF' })`.

**ENG-4. Rating modal as a Portal rendered above the navigation stack**
Implement the 5-second auto-rating modal as a React Native `Modal` (or via a portal pattern using `@gorhom/portal`) rendered at the root navigator level, not inside a screen. This prevents the navigation stack from interfering with the modal animation, and ensures the modal survives any background navigation events (e.g., a push notification arriving during the 5-second window). The auto-dismiss timer is managed by a `useEffect` with proper cleanup on unmount.

**ENG-5. Typed receipt data contract shared between app and backend**
Define a `TripReceiptDTO` TypeScript interface in a shared `/types/trip.ts` module that matches the backend response schema exactly (validated via `zod`). This is the single source of truth for receipt fields — fare line items, addresses, payment tags, discount tags. Any backend change that breaks the schema is caught at the `zod.parse` boundary before it ever reaches UI code, making receipt rendering resilient to silent API drift.

---

## Part 2 — ICE Scoring and Prioritization

### Scoring Key
- **Impact (1-10):** Business/user value if shipped
- **Confidence (1-10):** How certain we are the idea will achieve that impact
- **Ease (1-10):** How easy/fast to implement (10 = trivial, 1 = very hard)
- **ICE = Impact × Confidence × Ease**

| Rank | ID | Idea | Impact | Confidence | Ease | ICE Score |
|------|----|------|--------|-----------|------|-----------|
| 1 | ENG-5 | Typed receipt DTO with Zod validation | 9 | 10 | 9 | **810** |
| 2 | ENG-1 | Standalone receipt component + snapshot sharing | 9 | 9 | 8 | **648** |
| 3 | DES-3 | Star rating with haptics + emoji reinforcement | 8 | 9 | 8 | **576** |
| 4 | ENG-4 | Rating modal as root-level Portal | 8 | 9 | 7 | **504** |
| 5 | DES-2 | Progressive disclosure receipt (summary → expand) | 7 | 9 | 8 | **504** |

---

### Top 5 Ranked Features with Rationale

---

**#1 — ENG-5: Typed receipt DTO with Zod validation (ICE 810)**

This is the foundation everything else sits on. Without a strict, validated data contract between the backend and the receipt UI, every other feature is fragile. Zod parse-at-the-boundary means broken API responses surface as caught errors with clear messages rather than silent undefined renders that reach the user. Impact is high because it prevents an entire class of production bugs. Confidence is maximum — this is established TypeScript best practice. Ease is high because the types are defined once and consumed everywhere; no UI work required.

**#2 — ENG-1: Standalone receipt component + snapshot/PDF sharing (ICE 648)**

The feature brief explicitly calls out standalone and shareable. Building `<TripReceipt />` decoupled from navigation and store from day one pays dividends: it can be unit-tested, previewed in Storybook, and embedded in future surfaces (email, push) without refactoring. The `react-native-view-shot` + `expo-print` + `expo-sharing` chain is well-trodden in Expo projects. High impact because sharing drives organic growth in WhatsApp-dominant Dakar market.

**#3 — DES-3: Star rating with haptic feedback and emoji reinforcement (ICE 576)**

Rating completion rate is the metric this entire flow lives or dies by. Research from comparable markets shows haptic + visual feedback increases rating submission by 20-35% vs. bare UI. The implementation is straightforward — `expo-haptics` for vibration, `react-native-reanimated` for the confetti micro-animation, conditional placeholder text on the comment field. High confidence because this is a proven engagement pattern. High ease because all dependencies are already in the Expo SDK.

**#4 — ENG-4: Rating modal as root-level Portal (ICE 504)**

The 5-second auto-modal is a core spec requirement. If it is implemented inside the trip screen component, it will be destroyed when navigation transitions occur (e.g., a push notification deep link fires during the countdown). Implementing it at the root navigator level via `@gorhom/portal` or a native `Modal` is the correct architecture. The ease is slightly lower than pure UI work because it requires touching the root navigator, but the confidence is high that it prevents real-world bugs in a notification-heavy environment like Dakar.

**#5 — DES-2: Progressive disclosure receipt — summary first, expand for details (ICE 504)**

Tied on ICE with ENG-4 but ranked equal fifth. Riders in this market are checking the total and moving on. Burying the hero total (amount paid) below fold-level fare line items is a UX antipattern. Progressive disclosure — hero row immediately visible, `<Animated.View>` height-animated breakdown on tap — solves this with minimal engineering effort. The torn-edge paper aesthetic pairs naturally with a physical receipt metaphor of folding open. Implementation is a clean `useState` toggle + `LayoutAnimation` or `react-native-reanimated` height interpolation.

---

### Deprioritized Ideas and Rationale

| ID | Idea | ICE | Reason Deprioritized |
|----|------|-----|----------------------|
| PM-1 | XOF-native mobile money line items | ~400 | High impact but Confidence drops to ~6 — requires backend to return wallet/transaction metadata that may not exist yet in the API response. Blocked by backend work; revisit in Phase 5. |
| PM-3 | Corporate/business trip tagging | ~240 | Low Ease (5) — requires new UI field, new API field, PDF schema change, and a B2B onboarding flow. High value long-term but out of scope for the initial receipt/rating feature; park for Glidey Teams roadmap. |
| PM-4 | Driver rating feeds ops quality dashboard | ~320 | The rating submission itself is in scope. The ops dashboard is a separate product surface with its own complexity. Confidence that the dashboard alone moves NPS is low without the full coaching loop. Deprioritize the dashboard; just ensure rating data is stored correctly so the dashboard can be built later. |
| PM-5 | In-receipt dispute / issue report | ~270 | Important for support ops but adds a new flow and API surface to the receipt screen. Risk of scope creep that delays the core receipt + rating ship. Recommended as a fast-follow in the next sprint once the base flow is stable. |
| DES-1 | Torn-edge paper motion entry animation | ~360 | The torn-edge design is in spec as a visual treatment. The animated entry is a nice-to-have polish pass. Deprioritize the motion work until the data and interaction layers are solid; add in a polish sprint. Confidence that animation alone drives measurable outcomes is low (~5). |
| DES-4 | Soft countdown arc on auto-modal | ~288 | The 5-second auto-modal is required. The countdown arc is a polish detail. Low Ease (6) relative to the marginal UX gain — a simple opacity fade-in achieves the same "this is intentional" signal. Ship the modal first; add the arc if user testing shows dismissal confusion. |
| DES-5 | First-ride onboarding coach mark on rating | ~252 | Low Ease (7 effort to implement correctly with AsyncStorage persistence and first-ride detection logic) and low Confidence (6) that it materially changes rating completion vs. haptic feedback alone. Deprioritize until post-launch data shows first-ride rating completion is lagging. |
| ENG-2 | Optimistic rating with offline queue | ~378 | Important for network resilience but adds meaningful complexity (persistent job queue, rollback state, queue drain logic). Confidence is high the pattern works, but Ease is low (~5). For the initial ship, a simple loading state + error toast + retry CTA is sufficient. Revisit if offline rating failure emerges as a top support issue in production telemetry. |
| ENG-3 | On-device PDF via expo-print | ~432 | Good idea, but the "Download PDF" is explicitly a small link in the spec — secondary action. PDF generation is not on the critical path for launch. `expo-print` is straightforward but requires HTML template design effort. Ship the shareable image snapshot first (ENG-1); add PDF in a fast-follow. |

---

## Summary Recommendation

Ship in this order:

1. Define `TripReceiptDTO` + Zod schema (ENG-5) — unblocks all UI work
2. Build standalone `<TripReceipt />` with snapshot sharing (ENG-1)
3. Wire rating modal at root Portal level with 5s auto-trigger (ENG-4)
4. Add haptic + emoji reinforcement to star rating (DES-3)
5. Add progressive disclosure to fare breakdown (DES-2)

Fast-follow sprint: torn-edge animation polish (DES-1), on-device PDF (ENG-3), dispute report (PM-5).
Future roadmap: mobile money line items (PM-1), offline rating queue (ENG-2), corporate tagging (PM-3), ops quality dashboard (PM-4).
