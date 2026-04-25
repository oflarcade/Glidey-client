# Assumptions — Phase 1: API Client Foundation + Critical Fixes

**Feature:** Replace Firebase Cloud Functions protocol with Fastify 5 REST API client  
**Date:** 2026-04-19  
**Analyst:** PM Assumption Analyst (Claude Code)  
**Scope:** `services/apiClient.ts` creation, address search → Google Places, nearby drivers → REST, route directions → REST, location history → REST, TypeScript type updates

---

## Summary of Key Risk

The single highest-risk assumption in this phase is **A-04** (driver map pins require lat/lng which the new `/drivers/nearby` response omits). Every other item is either a straightforward protocol swap or a well-understood migration pattern. A-04 is a blocking architectural gap that can silently degrade the core product experience — the map — without a compile-time error.

---

## Assumption Table

| # | Category | Assumption | Confidence | Fast Test / Experiment |
|---|----------|------------|------------|------------------------|
| **A-01** | Feasibility | Firebase `getAuth().currentUser.getIdToken()` will reliably return a fresh JWT before every REST call, without adding perceptible latency to the user's first tap after cold start. | MEDIUM | Instrument `apiClient.ts` with timestamps. Measure token-fetch time on a cold Firebase session on a mid-range Android device in Senegal (poor-latency 3G). Gate on p95 < 400 ms. |
| **A-02** | Feasibility | The Fastify 5 server at `http://34.140.138.4` (plain HTTP, no TLS) will be acceptable to both iOS ATS and Android network security policy without requiring per-app exception config in `Info.plist` and `network_security_config.xml`. | LOW | Run `yarn ios` against a real device pointed at the production IP. If ATS blocks it, the app will throw `NSURLErrorDomain -1022` immediately — no user testing required. Fix path: add `NSExceptionDomains` entry or enforce HTTPS on the server before any integration work. |
| **A-03** | Feasibility | Google Places `/locations/search?q=` will return results that are geocoded precisely enough for Dakar, Senegal (addresses, landmarks, neighborhoods in Wolof/French transliterations) to match or exceed the Mapbox Search Box coverage the app previously relied on. | MEDIUM | Run 20 representative Dakar search strings (mix of French street names, Wolof neighborhood names, landmark names) through both APIs side-by-side and score result relevance and coordinate accuracy. Target: ≥ 85 % of queries return a usable first result. |
| **A-04** | Feasibility | **BLOCKING — MAP PINS WILL NOT RENDER.** The new `/drivers/nearby` response shape `{id, name, vehicleType, vehiclePlate, rating, distanceM}` contains no `lat`/`lng` fields. `DriverMarkers.tsx` reads `driver.location.latitude` / `driver.location.longitude` to place `MarkerView` and build GeoJSON coordinates. With the new type, every driver will be filtered out by the `driver.location` guard on line 72 of `DriverMarkers.tsx`, and the map will show zero drivers even when drivers exist. The current `NearbyDriver` type in `packages/shared/src/types/index.ts` includes `location: GeoPoint` — the new backend response breaks this contract. | LOW (confidence that current plan is safe) | Immediate action required before any other Phase 1 work: (1) Confirm with backend team whether `/drivers/nearby` will add `lat`/`lng` to the response. (2) If not: design a WebSocket or SSE channel for real-time driver positions, or add a separate `/drivers/{id}/location` endpoint. Do not ship Phase 1 without resolving this — the map is the primary screen. |
| **A-05** | Feasibility | Removing the Mapbox Search Box `sessionToken` / `mapboxId` two-step (suggest → retrieve) and replacing it with a single Google Places `placeId` lookup will not break the session-based billing model or introduce extra cost surprises. The `useAutocompleteLocation` hook passes a `sessionToken` into `suggestLocation`; Google Places charges per request differently. | MEDIUM | Calculate expected daily Google Places API cost at projected MAU (e.g. 500 users × 10 searches/day × 2 calls each). Compare to Mapbox Search Box pricing. Validate with a 1-week pilot budget before full rollout. |
| **A-06** | Feasibility | The `routeDirectionsService` migration to `GET /directions?originLat=&originLng=&destLat=&destLng=` (no auth required per spec) is safe to make unauthenticated. Exposing a public directions endpoint on a GCE IP without rate limiting or API key will not result in quota abuse or unexpected cost from the underlying mapping provider (presumably Google Maps Directions). | LOW | Verify with backend team whether `/directions` has rate limiting (IP-based or otherwise). If not, add it before launch. Test with a trivial script making 1000 requests to confirm the server does not pass cost to Glidey's billing account uncapped. |
| **A-07** | Viability | Migrating all five service functions in a single phase without a feature flag or parallel-run period is safe because the old Firebase callable endpoints will be decomissioned simultaneously, leaving no rollback path if the Fastify server has an outage. | LOW | Add a runtime feature flag (`EXPO_PUBLIC_USE_LEGACY_API=true`) that routes calls to Firebase callables. Keep Firebase functions deployed for 2 weeks post-launch. This gives a same-day rollback option without an app store release. |
| **A-08** | Usability | Users will not notice any change in address-search UX when switching from Mapbox Search Box (2-call suggest/retrieve) to Google Places (1-call search + 1-call details). Latency, suggestion quality, and result ordering are assumed equivalent. | MEDIUM | A/B test with 20 Dakar-resident beta testers: 10 on Mapbox flow, 10 on Google Places flow. Measure task completion time (find a destination and confirm) and subjective satisfaction (1–5 scale). Require p < 0.1 on completion time before shipping. |
| **A-09** | Strategy | The `apiClient.ts` Bearer token injection pattern (get Firebase ID token on every request) is a long-term viable auth strategy and will not need to be replaced when Firebase Auth is potentially migrated away from in a later phase. | MEDIUM | Document the auth contract in `services/apiClient.ts` as an interface (`AuthTokenProvider`) rather than a hard Firebase import. This decouples the token source from the HTTP layer at near-zero cost now and avoids a large refactor later. Validate the interface covers JWT refresh, anonymous auth, and token expiry within the current sprint. |
| **A-10** | Team | The development team has enough familiarity with the new Fastify 5 REST API contract (endpoint paths, query param names, response shapes) to implement all five service rewrites without waiting for backend API documentation. The feature context states the spec but does not reference a Swagger/OpenAPI file or Postman collection. | LOW | Before writing any client code: request an OpenAPI spec or Postman collection from the backend team. Run `curl` smoke tests against the live GCE IP for each endpoint. Block Phase 1 kickoff until at least one successful response is confirmed per endpoint. |
| **A-11** | Ethics / Privacy | Switching location history from Firebase (Firestore, EU or US region) to a self-managed Fastify + GCE backend in `europe-west1` does not change the data residency or GDPR/SENEGAL data protection obligations. The new backend is assumed to handle user location data with equivalent security controls (encryption at rest, access logging). | LOW | Conduct a 30-minute data protection impact assessment with the backend team before Phase 1 ships. Confirm: (1) GCE disk encryption enabled, (2) VPC firewall restricts DB access, (3) location history is purged on account deletion. Senegal's data protection law (loi n° 2008-12) requires this documentation. |
| **A-12** | Go-to-Market | The Phase 1 migration is invisible to end users (no new features, no UI changes) and therefore requires no app store release notes, no user communication, and no support team briefing. | MEDIUM | Confirm with QA that the demo mode (`EXPO_PUBLIC_USE_DEMO=true`) still works after migration — the demo mock path in `driversService` currently bypasses the Firebase callable; verify the new `apiClient.ts` mock path is equally bypassed. If demo breaks, field testers and the sales team lose their testing environment at the worst time. |

---

## Assumption Priority Stack (highest risk first)

1. **A-04** — No lat/lng in driver response = map pins don't render. Blocking.
2. **A-02** — Plain HTTP blocked by iOS ATS. Will fail on first device test.
3. **A-07** — No rollback path. Outage = no recovery without app store release.
4. **A-10** — No confirmed API contract. Team may build against wrong spec.
5. **A-06** — Unauthenticated directions endpoint = potential cost abuse.
6. **A-11** — Data residency / privacy obligations unverified for new backend.
7. **A-01** — Token latency on cold start on low-end devices in Senegal.
8. **A-03** — Google Places coverage gap for Dakar addresses.
9. **A-05** — Google Places billing model mismatch.
10. **A-09** — Auth abstraction debt if Firebase is replaced later.
11. **A-08** — UX regression in autocomplete quality.
12. **A-12** — Demo mode breakage affects internal testers.

---

## Code References

The following source locations are directly load-bearing for the risks above:

- `services/driversService.ts` — `getNearbyDriversForMap` / `getAvailableDrivers` (Firebase callable, to be replaced)
- `services/addressSearchService.ts` — `suggestLocation` / `retrieveLocation` / `getLocationHistory` / `saveLocationToHistory` (Mapbox + Firebase callables, all to be replaced)
- `services/routeDirectionsService.ts` — `getRouteDirections` (Firebase callable, to be replaced)
- `components/DriverMarkers.tsx` lines 67–91 — `driversToGeoJSON` reads `driver.location.latitude/longitude`; line 72 guard will silently drop all drivers if `location` is absent
- `hooks/useNearbyDrivers.ts` lines 205–222 — `nearestDriverDistance` falls back to `driver.location` for Haversine; also broken without coordinates
- `packages/shared/src/types/index.ts` lines 215–235 — `NearbyDriver` and `NearbyDriversResponse` type definitions that must be updated to match new backend response shape
- `packages/shared/src/types/index.ts` lines 156–187 — `Suggestion.mapboxId`, `SuggestLocationRequest`, `RetrieveLocationRequest` all tied to Mapbox session model; must be replaced with `placeId` equivalents
