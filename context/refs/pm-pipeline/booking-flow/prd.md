# PRD — Glidey Phase 2: Booking Flow

**Feature:** Scooter Ride Booking Flow
**Phase:** 2
**Status:** Draft
**Date:** 2026-04-19
**Author:** PM (Glidey)

---

## 1. Summary

Phase 2 adds the end-to-end booking flow that lets a Glidey user go from destination confirmed (Phase 1) to a scooter driver en route to their pickup point. It covers ride creation, driver matching, pickup pin selection, and live driver tracking on the map. This is the core transactional loop — nothing in the app works commercially without it.

---

## 2. Problem

Users in Dakar currently hail motos informally: they stand on the street, wave down a driver, negotiate a fare verbally, and have zero visibility into wait time or driver identity. There is no receipt, no safety record, and no predictable pricing in XOF. The Glidey app after Phase 1 can show nearby scooters and let users search a destination — but it dead-ends there. There is no way to actually book a ride.

---

## 3. Objective

Enable a user to complete a fully booked scooter ride — from tapping "Book Now" through driver arrival — entirely within the Glidey app, with real-time driver location visible throughout the wait. Success means the ride request reaches a driver, the driver accepts, and the user sees the driver moving toward them on the map.

**How we measure it:** See Section 7.

---

## 4. Target Users

**Primary:** Urban Senegalese riders in Dakar, aged 18–40, commuting or running errands. Smartphone-comfortable but not necessarily app-power-users. They are accustomed to moto-taxis and price-sensitive (XOF market). Connectivity may be inconsistent (2G/3G fallback areas in peri-urban zones). They value speed of booking and knowing who is coming — trust is a barrier with informal transport.

**Secondary:** Glidey drivers (out of scope for this PRD but booking flow produces the driver-side event stream).

---

## 5. User Stories

1. **As a rider**, I want to tap "Book Now" after selecting my destination so that a ride request is sent to nearby drivers without any extra steps.

2. **As a rider**, I want to see a "Looking for drivers…" state with a visual indicator so that I know the app is actively searching and I am not left wondering if my request went through.

3. **As a rider**, I want to see the accepting driver's name, photo, and license plate once they accept so that I know who to expect and can trust the person arriving.

4. **As a rider**, I want to drop a pin on the map for my exact pickup location (distinct from my destination) so that the driver comes to the right spot, not just an approximate address.

5. **As a rider**, I want to see the driver's live position on the map while I wait, plus an estimated arrival time, so that I can decide whether to stay put or adjust my pickup pin.

6. **As a rider**, I want a progress bar indicating how far the driver is from arriving so that I can plan the last few minutes before the ride starts without repeatedly checking the map.

---

## 6. Scope

### In Scope
- POST /rides/create call with pickup + destination coordinates
- "Looking for drivers" modal (polling or WebSocket, TBD in open questions)
- Driver acceptance event triggers driver card display: name, photo, license plate
- Pickup pin selection screen (separate map interaction, distinct from destination)
- Driver-notified event when user confirms pickup pin
- Live driver GPS position rendered on Mapbox map (real-time updates)
- Arrival time banner (bottom of screen) with progress bar
- XOF fare display on the booking confirmation view

### Out of Scope
- Push notifications (planned, deferred to late dev cycle)
- In-app chat between rider and driver
- Ride rating / feedback screen (Phase 3)
- Payment flow / fare collection (Phase 3)
- Driver-side app changes (separate workstream)
- Cancellation flow beyond basic "cancel request" during matching phase
- Scheduled / future rides

---

## 7. Success Metrics

1. **Booking completion rate:** >= 70% of sessions where a user taps "Book Now" result in a confirmed driver match within 3 minutes (measured server-side via ride state transitions).

2. **Map tracking engagement:** >= 80% of matched rides show the user keeping the tracking screen open until driver arrival (session active on map screen vs. backgrounding the app).

3. **Pickup pin adoption:** >= 60% of rides have a user-adjusted pickup pin (i.e., the pin was moved from the default GPS position), indicating the feature is discovered and used — not just a dead UI element.

---

## 8. Open Questions

1. **Matching mechanism — polling vs. WebSocket:** The backend is Fastify on GCP VM. Is a persistent WebSocket connection reliable enough for the target connectivity profile in Dakar (intermittent 3G), or do we fall back to polling with exponential backoff? This affects both UX (how snappy the driver card appears) and infra cost.

2. **Driver GPS update frequency:** How frequently does the driver app push location updates, and over what protocol? The live map is only useful if the dot moves plausibly — if updates are every 30 seconds the "live tracking" promise breaks. We need a defined SLA from the driver-side team before committing to the arrival time banner.

3. **Timeout and no-driver fallback:** What is the maximum time we show "Looking for drivers" before surfacing a failure state, and what do we tell the user? Dakar driver density varies sharply by neighborhood and time of day. We need a defined timeout threshold and a UX copy decision (try again, expand radius, no drivers available) before engineering builds the matching screen.
