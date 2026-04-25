# PRD — Phase 1: API Client Foundation + Critical Fixes
**Product:** GLIDEY (scooter ride-booking, Dakar/Senegal)
**Date:** 2026-04-19
**Status:** Draft

---

## 1. Summary

GLIDEY's backend has migrated from Firebase Cloud Functions to a Fastify 5 REST API (GCE europe-west1, PostgreSQL + PostGIS + Redis). The client still calls the old Firebase callables, causing address search to be completely broken, route directions unreliable, and driver-location data structurally mismatched with the new API contract. Phase 1 replaces every service layer call with authenticated REST calls while resolving a critical blocking issue: the new `/drivers/nearby` endpoint returns no coordinates per driver, making map pins impossible to render.

---

## 2. Problem

| Surface | Current State | Impact |
|---|---|---|
| Address / location search | Calls `suggestLocation` + `retrieveLocation` Firebase callables with Mapbox Search Box session-token flow; new API uses Google Places `placeId` — **completely broken** | Riders cannot search for a destination |
| Route directions | Calls `getRouteDirections` Firebase callable | Route line and ETA unavailable after callable is decommissioned |
| Location history | Calls `getLocationHistory` / `saveLocationToHistory` callables | Recent destinations lost on next session |
| Nearby drivers | Calls `getNearbyDriversForMap` callable; new REST endpoint exists but returns no `lat`/`lng` per driver | Map shows no scooter pins; blocking for core ride flow |
| Auth profile / OTP | Calls Firebase callables for `getUserProfile`, `createClientProfile`, `sendPhoneOTP`, `verifyPhoneOTP` | Profile fetch and phone verification fail after callable removal |

No shared REST client exists; each service would need to independently handle token injection, timeout, and error normalisation.

---

## 3. Objective

Deliver a working Fastify REST integration layer so that Dakar riders can open the app, see nearby scooters on the map, search for a destination, and view their ride history — with zero dependency remaining on the decommissioned Firebase Cloud Functions.

---

## 4. Target Users

- **Primary:** GLIDEY mobile app engineering team — they consume the services and hooks directly.
- **Secondary:** Dakar riders on Android and iOS — they experience the outcome (functional map, search, booking flow).

---

## 5. User Stories

1. **As a rider**, I open the app and immediately see scooter pins on the Mapbox map around my current location, so I know rides are available near me.

2. **As a rider**, I tap the search bar, type a Dakar neighbourhood name, and see autocomplete suggestions within 1 second, so I can quickly set my destination.

3. **As a rider**, I select a suggestion and see a route line drawn on the map with an estimated fare and ETA, so I can decide whether to book.

4. **As a rider**, my recently searched destinations appear at the top of the search modal without re-typing, so repeat trips are faster.

5. **As a rider**, I can log in with my phone number via OTP; the app fetches or creates my profile against the new REST API, so my account data is current.

6. **As an engineer**, any HTTP error (4xx, 5xx, timeout) from the REST API surfaces as a typed `ApiError` with an HTTP status code and message, so I can write consistent error-handling UI without inspecting raw responses.

---

## 6. Scope

### IN

- `services/apiClient.ts` — shared Axios/fetch client: Firebase ID token injection (`getIdToken()`), base URL from `EXPO_PUBLIC_API_URL`, typed `ApiError` (status + message), 10 s timeout.
- `services/addressSearchService.ts` rewrite — `GET /locations/search?q=` (autocomplete, drop sessionToken), `GET /locations/details?placeId=` (replace `mapboxId`/retrieve flow), `GET /locations/history`, `POST /locations/history`.
- `services/driversService.ts` rewrite — `GET /drivers/nearby?lat=&lng=&radiusM=3000` (max 20 drivers, auth required).
- `services/routeDirectionsService.ts` rewrite — `GET /directions?...` (no auth required).
- `hooks/useAutocompleteLocation.ts` — remove sessionToken generation; adopt `placeId` selection flow.
- `components/LocationModal/` — remove sessionToken state, wire to `placeId` callbacks.
- TypeScript type updates — `Suggestion`: replace `mapboxId` with `placeId`; `NearbyDriver`: add `distanceM`, confirm coordinate fields present (or absent — see Open Questions).
- `packages/auth/` hook rewrites — `getUserProfile` → `GET /users/client/me`; `createClientProfile` → `POST /users/client`; `sendPhoneOTPPublic` → `POST /users/phone/send-otp`; `verifyPhoneOTPPublic` → `POST /users/phone/verify-otp` (returns `{ customToken }`).

### OUT

- WebSocket / realtime driver tracking (`/realtime`) — evaluation only in Phase 1 if used to unblock coordinates (see Open Questions); full implementation is Phase 2.
- Ride booking flow (POST /rides) — Phase 2.
- Push notifications — already disabled; remains out of scope.
- Fare engine / pricing UI changes — Phase 2.
- Driver-side app — separate codebase, not in scope.
- Backend API changes — client team can raise requirements; backend team owns implementation.

---

## 7. Success Metrics

1. **Address search functional rate:** ≥ 95% of `GET /locations/search` calls return ≥ 1 result for queries of 3+ characters in Dakar (measured in dev/preview builds with demo mode off).

2. **Map driver pin render rate:** ≥ 1 driver pin visible on map within 5 s of app foreground, on a device with location permission granted, when at least one driver is active (requires coordinate blocker resolved).

3. **Firebase callable dependency count:** 0 remaining `httpsCallable` references in `services/` and `packages/auth/` after Phase 1 merge (verifiable via `grep -r httpsCallable services/ packages/auth/`).

---

## 8. Open Questions

1. **Driver coordinates blocker (P0):** `GET /drivers/nearby` returns no `lat`/`lng` per driver. Map pins cannot be placed without coordinates. Decision needed: (a) backend adds `latitude`/`longitude` to the response, (b) client falls back to the WebSocket `/realtime` feed for positions, or (c) a hybrid where REST gives the driver list and WebSocket patches coordinates. **This must be resolved before `driversService.ts` can be finalised.**

2. **`EXPO_PUBLIC_API_URL` environment values:** What are the correct base URLs for dev, preview, and production EAS build profiles? The demo mode flag (`EXPO_PUBLIC_USE_DEMO=true`) currently bypasses real API calls — does the REST migration keep mock data for demo mode, or does demo mode point to a staging API instance?

3. **Token refresh on 401:** The `apiClient` will inject the Firebase ID token at request time. If a token expires mid-session and the API returns 401, should the client auto-retry once after a silent `getIdToken(true)` refresh, or surface an auth error immediately and redirect to the login screen?
