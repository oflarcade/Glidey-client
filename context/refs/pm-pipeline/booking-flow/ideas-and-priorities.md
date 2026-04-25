# Glidey Phase 2 — Booking Flow: Ideas & Prioritization

**Feature:** Booking Flow — scooter ride-booking mobile app (Senegal market)
**Date:** 2026-04-19
**Stack:** Expo 54, React Native 0.81, Mapbox, React Query, Zustand, Firebase Auth, TypeScript strict, Fastify REST API

---

## Part 1 — Brainstorm by Perspective

### Product Manager — Market Fit, Value Creation, Competitive Edge

**PM-1: Offline-resilient booking confirmation**
In Senegal, mobile data is intermittent (especially outside Dakar). The app should cache the ride confirmation state locally so that if connectivity drops after `POST /rides/create`, the user does not lose their booking. Show a "Booking confirmed — waiting for driver" screen that survives backgrounding and reconnection, pulling from local state first.

**PM-2: WhatsApp-native driver contact fallback**
WhatsApp penetration in Senegal exceeds 90%. When a driver accepts, surface a "Message driver on WhatsApp" CTA as a fallback to in-app messaging. This reduces ride abandonment when the map-based coordination feels unfamiliar or uncertain to early adopters.

**PM-3: Francs CFA fare estimate before booking**
Display an upfront fare estimate in XOF (West African CFA franc) before the user taps "Book Now." Senegalese riders are price-sensitive and fare transparency is a key trust signal vs. informal moto-taxi (Jakarta) alternatives. Reduces cancellations and support tickets.

**PM-4: Ride-sharing referral loop tied to booking completion**
Trigger a "Share Glidey with a friend — they get 500 XOF off their first ride" prompt immediately after a ride is successfully matched. Attaches referral to a completed positive moment rather than onboarding, maximizing conversion. Low marginal cost in a WhatsApp-first sharing culture.

**PM-5: Zone-based surge indicator on map**
Show a subtle heat overlay on the map indicating high-demand zones and estimated wait time variance. Helps users self-select pickup spots or times, reducing driver assignment failures and improving match quality in dense areas like Plateau, Dakar.

---

### Product Designer — UX, Onboarding, Engagement Loops

**PD-1: Animated "Looking for driver" state with honest wait feedback**
The polling/WebSocket waiting state is the highest-anxiety moment in the flow. Use a pulsing Mapbox annotation showing nearby driver dots converging, plus a live "~X min" ETA estimate updated each poll cycle. Avoids the dead-screen feeling that causes users to cancel prematurely.

**PD-2: Driver card reveal animation with trust signals**
When a driver accepts, animate the driver card up from the bottom sheet — name, photo, license plate, rating, and scooter model. Adding a "X rides completed" count and a 5-star micro-rating from the previous rider builds immediate trust. Mapbox camera should smoothly animate to center on the driver's current position.

**PD-3: Pickup pin placement with address autocomplete**
The "user picks pickup location on map" step should default the pin to the user's GPS location but allow drag-to-adjust. Pair it with reverse geocoding (Mapbox) to show the confirmed address string below the pin. Prevents mis-pickups, which are the top reason for ride cancellations in emerging market ride-hailing.

**PD-4: Progress arc on the live tracking screen**
Replace a generic spinner with a circular progress arc that fills as the driver approaches (derived from arrival time / original ETA). Gives riders a concrete sense of elapsed time, reducing support contacts. Pair with a collapsible bottom sheet showing driver stats so the map stays visible.

**PD-5: One-tap destination reuse ("Go again")**
After a completed ride, store the last 3 destinations in Zustand + AsyncStorage. On the next booking, surface them as chips above the search bar. Reduces friction for repeat commuters (e.g., office workers), boosting D7 retention. Design-cheap; relies on existing destination selection UI.

---

### Engineer — Technical Innovation, Integrations, Platform Leverage

**ENG-1: WebSocket ride-state machine with optimistic local state**
Model ride lifecycle as a finite state machine (`idle → searching → matched → pickup_en_route → in_progress → completed`) in Zustand. The WebSocket pushes state transitions; React Query handles REST fallback polling (every 5 s) when the socket drops. Optimistic local state prevents UI flicker and handles the intermittent-connectivity reality of the Senegal market.

**ENG-2: Mapbox offline tile pack for Dakar**
Pre-download a Mapbox offline tile pack for the Dakar metro area on first app launch (or on Wi-Fi). The tracking map remains functional when 3G drops mid-ride. Integrates with `@rnmapbox/maps` offline region API. Tile pack is ~15 MB for Dakar at zoom 10–16.

**ENG-3: Driver location streaming via server-sent events (SSE)**
Rather than polling `/rides/:id/driver-location` every N seconds, implement an SSE endpoint on the Fastify backend (`GET /rides/:id/driver-location/stream`). The client subscribes with `EventSource`; driver GPS updates are pushed at ~2 s intervals. Reduces backend load vs. polling and improves map animation smoothness.

**ENG-4: Expo Background Fetch for ride state recovery**
Use `expo-background-fetch` + `expo-task-manager` to register a background task that re-syncs ride state if the app is killed mid-booking. Combined with the Zustand state machine (ENG-1), this ensures users returning to the app after a crash or backgrounding see the correct live state rather than a blank booking screen.

**ENG-5: Mapbox NavigationView turn-by-turn for driver ETA accuracy**
Integrate Mapbox Navigation SDK's `RouteController` to compute real road-network ETA (not straight-line distance) from driver GPS to pickup point. Feed ETA into the arrival time banner. This is the same data source as ride-hailing leaders and dramatically improves ETA accuracy in Dakar's grid-irregular road network.

---

## Part 2 — ICE Scoring & Prioritization

### Scoring Rubric
- **Impact (1–10):** How much does it move the needle on ride completion rate, retention, or trust?
- **Confidence (1–10):** How certain are we this will work as intended?
- **Ease (1–10):** How low-effort is implementation? (10 = trivial, 1 = months of work)
- **ICE Score = Impact × Confidence × Ease**

---

### ICE Scoring Table

| # | Feature | Source | Impact | Confidence | Ease | ICE |
|---|---------|--------|--------|------------|------|-----|
| 1 | WebSocket ride-state machine + optimistic local state | ENG-1 | 9 | 9 | 7 | **567** |
| 2 | Animated "Looking for driver" state + live ETA | PD-1 | 8 | 9 | 8 | **576** |
| 3 | Driver card reveal with trust signals | PD-2 | 8 | 9 | 8 | **576** |
| 4 | Pickup pin placement + reverse geocoding | PD-3 | 9 | 10 | 8 | **720** |
| 5 | Francs CFA fare estimate before booking | PM-3 | 8 | 8 | 7 | **448** |
| 6 | Offline-resilient booking confirmation | PM-1 | 7 | 8 | 6 | **336** |
| 7 | SSE driver location streaming | ENG-3 | 7 | 8 | 6 | **336** |
| 8 | Progress arc on live tracking screen | PD-4 | 6 | 9 | 8 | **432** |
| 9 | Mapbox offline tile pack for Dakar | ENG-2 | 7 | 8 | 6 | **336** |
| 10 | Expo Background Fetch for ride state recovery | ENG-4 | 7 | 7 | 5 | **245** |
| 11 | One-tap destination reuse ("Go again") | PD-5 | 6 | 9 | 9 | **486** |
| 12 | WhatsApp driver contact fallback | PM-2 | 6 | 8 | 8 | **384** |
| 13 | Mapbox NavigationView for real-road ETA | ENG-5 | 7 | 7 | 4 | **196** |
| 14 | Zone-based surge indicator | PM-5 | 5 | 6 | 4 | **120** |
| 15 | Referral loop after ride match | PM-4 | 5 | 6 | 5 | **150** |

---

### Top 5 Features (Ranked by ICE)

---

#### #1 — Pickup Pin Placement + Reverse Geocoding (ICE: 720)
**Source:** PD-3
**Rationale:**
Mis-pickups are the single largest cause of ride cancellation in emerging market ride-hailing. Senegal's address infrastructure is informal — most users cannot articulate a street address. A draggable pin with real-time reverse geocoding (Mapbox Geocoding API, already in-stack) solves this with near-zero backend cost. Impact is highest in the flow because it directly prevents failed trips, and confidence is maximum because the same pattern is proven in every major ride-hailing app globally. Ease is high: `@rnmapbox/maps` `UserLocation` + `Camera` + a geocoding API call from the existing Mapbox integration.

---

#### #2 — Animated "Looking for Driver" State + Live ETA (ICE: 576)
**Source:** PD-1
**Rationale:**
The searching state is the highest-anxiety, highest-abandonment moment in the flow. An empty or generic spinner causes premature cancellations. Animating nearby driver dots converging toward the user's pin and displaying a live "~X min" ETA (derived from polling the backend) dramatically reduces anxiety. Confidence is high — this is a proven pattern. Ease is high: React Query polling is already planned; adding a Mapbox annotation animation is a UI-only change with no backend work.

---

#### #3 — Driver Card Reveal with Trust Signals (ICE: 576)
**Source:** PD-2
**Rationale:**
Trust is the primary conversion barrier for first-time users in a new market. When a driver accepts, showing their name, photo, license plate, rating, and ride count — with a smooth bottom-sheet animation — converts a transactional confirmation into a trust-building moment. This is the Phase 2 keystone UX. Confidence is very high. Ease is high: data comes from the existing ride acceptance event; the card is a pure React Native UI component. Mapbox camera re-centering uses the existing `Camera` ref.

---

#### #4 — WebSocket Ride-State Machine + Optimistic Local State (ICE: 567)
**Source:** ENG-1
**Rationale:**
This is the technical backbone of the entire booking flow. Without a robust state machine, every other feature (driver card, live tracking, progress arc) is fragile under connectivity failures. Modelling the ride lifecycle as a Zustand FSM with WebSocket push + React Query polling fallback is the right architecture for the Senegal market. Impact is maximum (foundational); confidence is high (established pattern); ease is good for a senior engineer — ~1.5 days of focused work covers the state machine, WS hook, and fallback polling.

---

#### #5 — Francs CFA Fare Estimate Before Booking (ICE: 448)
**Source:** PM-3
**Rationale:**
Price transparency is a critical trust signal in the Senegalese market, where informal moto-taxis quote fares verbally before trips. Showing an upfront XOF fare estimate (computed from distance × rate table on the backend) before `POST /rides/create` reduces post-booking cancellations driven by sticker shock. Confidence is high — fare transparency is validated across African markets (Bolt, InDrive, Yango all lead with it). Ease is moderate: requires a new backend endpoint (`GET /rides/estimate`) and a fare card UI component, but the logic is straightforward.

---

### Deprioritized Features & Rationale

| Feature | ICE | Why Deprioritized |
|---------|-----|-------------------|
| One-tap destination reuse ("Go again") | 486 | High ease but Phase 2 focus is the booking flow itself. Phase 3 retention feature. |
| WhatsApp driver contact fallback | 384 | Valuable for trust but adds complexity (deep-link construction, phone number exposure). Defer to Phase 3. |
| Progress arc on live tracking screen | 432 | Nice-to-have polish. The live map with arrival banner is sufficient for Phase 2 MVP. Defer to Phase 2.5. |
| Offline-resilient booking confirmation | 336 | Important for reliability but adds significant complexity. Tackle after core flow is stable. |
| SSE driver location streaming | 336 | Requires backend changes. Polling at 5 s is acceptable for Phase 2. SSE is a Phase 3 performance optimization. |
| Mapbox offline tile pack | 336 | Valuable for rural Senegal but Dakar is well-covered. Adds 15 MB to bundle. Defer post-launch. |
| Expo Background Fetch | 245 | Meaningful edge case coverage but adds native complexity. Phase 3 reliability hardening. |
| Mapbox NavigationView real-road ETA | 196 | Highest accuracy but requires NavigationView SDK integration — significant native work. Phase 3. |
| Zone-based surge indicator | 120 | Requires demand data infrastructure not yet in place. Phase 4+. |
| Referral loop after ride match | 150 | Growth mechanic. Premature for Phase 2; need retention baseline first. Phase 3 growth sprint. |

---

## Implementation Order Recommendation

Given the ICE ranking and dependency graph, the recommended build order for Phase 2 is:

1. **ENG-1** (State machine) — foundational; must land first
2. **PD-1** (Looking for driver animation) — hooks into state machine `searching` state
3. **PD-2** (Driver card reveal) — hooks into `matched` state
4. **PD-3** (Pickup pin + geocoding) — standalone UI, can be built in parallel with PD-1/PD-2
5. **PM-3** (Fare estimate) — requires new backend endpoint; coordinate with backend sprint

---

*Generated by PM Ideation Pipeline — Glidey Phase 2 Booking Flow*
