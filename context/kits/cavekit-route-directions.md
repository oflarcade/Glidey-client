---
created: "2026-04-19"
last_edited: "2026-04-19"
---

# Cavekit: Route Directions

## Scope
Fetching a route between an origin and a destination from the new REST directions endpoint and rendering that route on the map. Covers the updated response type field names, the unauthenticated nature of the endpoint, demo-mode mock behavior, and the map-rendering contract.

## Requirements

### R1: Route directions fetch
**Description:** Given an origin (latitude, longitude) and a destination (latitude, longitude), the system returns a route object containing an encoded polyline, a distance in meters, and a duration in seconds. Unlike other REST operations, this endpoint does NOT require a signed-in user.

**Acceptance Criteria:**
- [ ] A fetch with valid origin and destination coordinates returns a route object with a non-empty encoded polyline string, a numeric `distanceM`, and a numeric `durationS`.
- [ ] The call does NOT require the user to be signed in; an anonymous call succeeds when the backend is reachable.
- [ ] The call still goes through the shared API client so that errors (network, timeout, non-2xx) are normalized into the typed `ApiError` shape.
- [ ] An invalid pair of coordinates (e.g. identical origin and destination, or malformed input) is surfaced as a typed `ApiError` rather than returning a malformed route.

**Dependencies:** `cavekit-api-client.md` R1, R3.

---

### R2: Updated response type
**Description:** The shared TypeScript `RouteDirectionsResponse` type uses the new backend's field names. Any previous callers that read `distanceMeters` or `durationSeconds` must be updated to the new names.

**Acceptance Criteria:**
- [ ] The `RouteDirectionsResponse` type exposes a field named `distanceM` for distance in meters.
- [ ] The `RouteDirectionsResponse` type exposes a field named `durationS` for duration in seconds.
- [ ] The type exposes an encoded polyline field usable for map rendering (see R3).
- [ ] The project compiles in strict TypeScript mode with the updated type; no remaining consumer references `distanceMeters` or `durationSeconds`.

**Dependencies:** R1.

---

### R3: Route rendering on the map
**Description:** The encoded polyline returned by R1 must be drawable as a route line on the Mapbox map used by the rider app, without additional server-side transformation.

**Acceptance Criteria:**
- [ ] The polyline string from the response can be passed to the app's map layer and produces a visible line connecting the origin and destination.
- [ ] The rendered line follows real road geometry (i.e. it is not a straight-line fallback), when the backend returns a real route.
- [ ] When the response lacks a polyline (empty or missing), no route line is drawn and the failure is surfaced to the caller as a typed `ApiError`.

**Dependencies:** R1, R2.

---

### R4: Demo mode
**Description:** When the app runs in demo mode, the directions fetch returns a hardcoded mock route (a sample Dakar-area polyline with plausible distance and duration) and no HTTP request is issued.

**Acceptance Criteria:**
- [ ] In demo mode, the fetch returns a route object that fully satisfies the R2 type shape.
- [ ] In demo mode, the returned polyline is non-empty and renders a visible line on the map via R3.
- [ ] In demo mode, `distanceM` and `durationS` are positive numeric values.
- [ ] No outgoing HTTP request is dispatched by the fetch in demo mode.

**Dependencies:** R1, R2, R3, `cavekit-api-client.md` R4.

---

## Out of Scope
- Turn-by-turn navigation (textual or voice).
- Traffic-aware or time-dependent routing.
- Multi-stop routes, waypoints, or alternative-route selection.
- Any client-side caching strategy for route results (implementation detail).
- Route recalculation triggered by driver or user movement (handled elsewhere).
- ETA updates during an in-progress trip.

## Cross-References
- See also: `cavekit-api-client.md` — the fetch uses the shared client for error normalization and demo-mode bypass even though the endpoint itself is unauthenticated.
- See also: `cavekit-location-search.md` — destination coordinates typically come from place-detail resolution and feed into this fetch as the route destination.
- See also: `cavekit-nearby-drivers.md` — shares the latitude/longitude coordinate convention used for origin and destination.

## Changelog
