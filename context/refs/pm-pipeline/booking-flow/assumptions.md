# Booking Flow — PM Assumption Analysis

**Feature:** Phase 2 Booking Flow
**Market:** Senegal (primary: Dakar)
**Date:** 2026-04-19
**Scope:** Book Now → driver match → pickup selection → live map tracking

---

## Assumption Register

| # | Category | Assumption | Confidence | Fast Test / Experiment |
|---|----------|-----------|------------|------------------------|
| 1 | **Value** | Riders will tolerate a polling/wait screen ("Looking for drivers") without abandoning the booking, assuming wait times stay under 3–5 minutes. | LOW | A/B test a progress bar with estimated wait time vs. no indicator during a pilot week; measure drop-off rate on the waiting screen. |
| 2 | **Value** | Showing the driver's name, photo, and license plate before the ride begins meaningfully increases rider trust and reduces cancellations. | MEDIUM | Survey 20 pilot riders after first ride; ask them to rank which info piece (name / photo / plate) they relied on most and whether they would have cancelled without it. |
| 3 | **Usability** | Riders in Dakar will understand the map-based pickup-pin interaction (drag to confirm location) without in-app onboarding instructions. | LOW | Unmoderated usability test with 5 non-tech-savvy riders in Dakar — record screen + think-aloud; count how many complete pickup selection in under 60 s without help. |
| 4 | **Usability** | The live driver GPS map screen communicates arrival time clearly enough that riders know when to move to the pickup spot — without a separate notification or voice cue. | MEDIUM | In pilot, measure average time between driver arrival and rider appearance at pickup; if >2 min regularly, add a proximity push alert as a fast fix. |
| 5 | **Viability** | The Fastify backend can sustain WebSocket (or polling) connections for concurrent ride sessions at launch scale (est. 50–200 simultaneous rides) on the single GCP VM without degrading response time. | LOW | Load-test with k6 or Artillery: simulate 200 concurrent WebSocket sessions and 100 simultaneous POST /rides/create calls; measure p95 latency and CPU headroom. |
| 6 | **Viability** | Mapbox's data plan cost for live GPS streaming during rides stays within the product's unit economics (i.e., does not erode per-ride margin). | MEDIUM | Calculate tiles + direction API calls per average ride (est. 10 min, 1 req/5 s = 120 calls); model monthly Mapbox bill at 500/1 000/5 000 daily rides and compare to projected revenue. |
| 7 | **Feasibility** | The existing backend WebSocket or polling endpoint returns driver GPS positions with low enough latency (<3 s) and frequency (every 3–5 s) to give a "live" feel on the map. | MEDIUM | Instrument the current WebSocket/polling route in staging; log round-trip from driver location update to client render; check against 3 s threshold under normal GCP VM load. |
| 8 | **Feasibility** | The React Native/Expo Mapbox integration can smoothly animate a moving driver marker (re-rendering every 3–5 s) on low-to-mid-range Android devices common in Senegal without noticeable jank or battery drain. | LOW | Test on a Tecno Spark or Infinix Hot device (common Senegal mid-rangers); profile JS thread frame rate and battery draw over a 10-minute simulated ride. |
| 9 | **Ethics** | Collecting and transmitting real-time rider pickup location is compliant with Senegal's data protection law (Loi n° 2008-12 sur la Protection des Données Personnelles) and riders understand what location data is collected. | LOW | Legal review with a Senegalese data-protection advisor; add explicit consent prompt before first location access; document data retention and deletion policy before public launch. |
| 10 | **Go-to-Market** | Launch-day supply (driver count) will be sufficient to keep median match time under 5 minutes in target Dakar zones, making the booking flow feel reliable rather than broken. | LOW | Define a minimum viable supply threshold (e.g., 15 active drivers in Plateau/Médina zones during peak hours); run a 2-week driver onboarding sprint before soft launch and instrument average match time daily. |
| 11 | **Strategy** | The booking flow differentiates Glidey enough from WhatsApp-based informal moto-taxi booking (the real competitor) that riders will switch and stay loyal rather than reverting to their existing method. | LOW | Intercept 30 existing moto-taxi riders in Dakar; present the app flow prototype; ask "would you use this instead of calling your usual driver?" and why/why not — extract the 2–3 core switching blockers. |
| 12 | **Team** | The current team (Expo/RN frontend + Fastify backend) has the bandwidth and WebSocket/real-time experience needed to implement, stabilize, and maintain the full live-tracking stack within the Phase 2 timeline without external hires. | MEDIUM | Time-box a 1-week spike: build the minimal driver-marker live-update loop (WebSocket → Mapbox marker animation) end-to-end; use actual velocity to re-forecast Phase 2 completion date against the roadmap. |

---

## Risk Heat Map (quick read)

| Confidence \ Impact | High Impact | Medium Impact |
|---------------------|-------------|---------------|
| **LOW confidence** | #1 Wait-screen abandonment, #3 Map UX onboarding, #5 VM scale, #8 Device performance, #9 Data-protection compliance, #10 Driver supply, #11 vs. informal competitors | — |
| **MEDIUM confidence** | #6 Mapbox cost, #7 GPS latency, #12 Team bandwidth | #2 Driver info trust, #4 Arrival-time clarity |

Assumptions marked LOW confidence + HIGH impact should be tested before any significant engineering investment in those areas.

---

## Recommended Test Priority (first 4 weeks)

1. **#10 Driver supply** — hard gate; no booking flow matters if there are no drivers.
2. **#3 Map UX usability test** — cheap, fast, high signal; book 5 Dakar users this week.
3. **#5 Backend load test** — run k6 in staging before the WebSocket route goes to production.
4. **#9 Legal/compliance review** — longest lead time; start immediately to avoid launch blocker.
