# Synthesis: API Client Foundation — Phase 1

## Recommended Features (top 3)

1. **Typed API client with auto token refresh + request queue** (ICE #1 & #2 combined)
   Every other fix depends on this. Build `services/apiClient.ts` with: Firebase `getIdToken()` injection, `Authorization: Bearer` header, env-driven base URL (`EXPO_PUBLIC_API_URL`), typed request/response generics, 10s timeout, and automatic 401 → token refresh → retry queue. Without this, all downstream service rewrites are uncoordinated.

2. **Address search rewrite — Mapbox → Google Places** (ICE #3, highest user-visible pain)
   The location modal is completely broken. Replace `suggestLocation`/`retrieveLocation` (Mapbox, mapboxId, sessionToken) with `GET /locations/search?q=` and `GET /locations/details?placeId=`. Update `Suggestion` type, `useAutocompleteLocation` hook, `LocationModal` component, and location history endpoints.

3. **Driver coordinate resolution strategy** (ICE #4 — P0 blocker)
   The new `/drivers/nearby` response omits `lat`/`lng`. `DriverMarkers.tsx` silently drops all drivers (filters on `driver.location`). Three resolution paths: (A) request backend adds coords to response, (B) use WebSocket `/realtime` for live driver positions, (C) client-side coordinate jitter fallback using `distanceM` + last known center as a placeholder. Must choose before implementing.

## Key Risks to Address in Spec

| Risk | Confidence | Must Become |
|------|-----------|-------------|
| NearbyDriver has no lat/lng — map pins silently broken | LOW (confirmed bug) | Acceptance criterion: map renders ≥1 driver pin when backend returns drivers |
| iOS ATS blocks HTTP — `http://34.140.138.4` fails on device | LOW | AC: add NSExceptionDomains or enforce HTTPS before first device build |
| No rollback path if old Firebase Functions decommissioned | MEDIUM | AC: `EXPO_PUBLIC_USE_LEGACY_API` flag or phased cutover |
| Unauthenticated `/directions` endpoint open to abuse | MEDIUM | AC: backend rate limiting confirmed before client ships |

## Constraints

- Backend URL is HTTP only (`http://34.140.138.4`) — HTTPS not yet configured (no SSL cert)
- `EXPO_PUBLIC_API_URL` must be set per EAS build profile (dev/preview/prod)
- Demo mode (`EXPO_PUBLIC_USE_DEMO=true`) must continue to work without hitting real backend
- All changes must preserve Firebase Auth SDK (token source) — only the transport layer changes
- `packages/auth/` hooks must remain in their package (no moving to app-level services)

## Suggested Domain Decomposition

| Domain | Cohesion | Key Files |
|--------|----------|-----------|
| **api-client** | Base HTTP client — token injection, env config, error types, retry | `services/apiClient.ts` (new), `config/api.ts` (new) |
| **location-search** | Google Places autocomplete + history — replaces entire Mapbox flow | `services/addressSearchService.ts`, `hooks/useAutocompleteLocation.ts`, `components/LocationModal/`, shared `Suggestion` type |
| **nearby-drivers** | Drivers REST migration + coordinate gap resolution | `services/driversService.ts`, `hooks/useNearbyDrivers.ts`, `packages/shared` `NearbyDriver` type, `components/DriverMarkers.tsx` |
| **route-directions** | Directions REST migration + type update | `services/routeDirectionsService.ts`, `hooks/useRouteDirections.ts` |

## Success Criteria Candidates

- `GET /locations/search?q=dakar` returns suggestions with `placeId` — user can search and select a destination
- `GET /drivers/nearby` result renders ≥1 map pin within 5s of GPS fix
- `GET /directions` result draws a route polyline on the map
- Zero `httpsCallable` references remain in `services/` (grep-verifiable)
- Address search functional in French locale on Senegal phone number
- Demo mode (`EXPO_PUBLIC_USE_DEMO=true`) works offline without hitting `EXPO_PUBLIC_API_URL`
