---
created: "2026-04-19"
last_edited: "2026-04-19"
---

# Cavekit: Nearby Drivers

## Scope
Fetching the set of available drivers around the user's current location from the new REST backend, the shared type shape the rest of the app consumes, and the strategy for placing driver pins on the map while the backend catches up on per-driver coordinates. Covers demo-mode mocks and the compatibility contract with the map-marker component.

## Requirements

### R1: Nearby driver fetch
**Description:** Given the user's latitude, longitude, and an optional radius in meters, the system returns the list of currently available drivers within that radius. The default radius is 3000 meters. The call is authenticated.

**Acceptance Criteria:**
- [ ] A fetch with valid latitude and longitude returns a list of nearby driver objects (possibly empty).
- [ ] When no radius is supplied, the request uses a default radius of 3000 meters.
- [ ] A supplied radius value (in meters) is honored by the backend request.
- [ ] The call is authenticated via the shared API client (see `cavekit-api-client.md` R1).
- [ ] An error from the backend is surfaced to the caller as a typed `ApiError` (no raw exceptions).

**Dependencies:** `cavekit-api-client.md` R1, R3.

---

### R2: Updated `NearbyDriver` type
**Description:** The shared TypeScript `NearbyDriver` type exposed by the app must reflect the new backend response shape and must also include the coordinate fields required by the map-marker component.

**Acceptance Criteria:**
- [ ] The `NearbyDriver` type exposes: `id`, `name`, `vehicleType`, `vehiclePlate`, `rating`, `distanceM`.
- [ ] The `NearbyDriver` type also exposes `latitude` and `longitude` fields used for map placement.
- [ ] The `distanceM` field is expressed in meters.
- [ ] The project compiles in strict TypeScript mode with the updated type; no consumer references a removed or renamed field.
- [ ] No legacy nested `location` object with `lat`/`lng` remains on the type.

**Dependencies:** R1.

---

### R3: Driver coordinates requirement (blocked on backend)
**Description:** For driver pins to be placed correctly on the map, the `/drivers/nearby` response must carry per-driver latitude and longitude. Until the backend provides these coordinates, the map feature that depends on them is a known gap and must be documented as such. The client MUST NOT ship a release that claims map-accurate driver pins while relying solely on fallback coordinates (see R4).

**Acceptance Criteria:**
- [ ] The backend response contract requires `latitude` and `longitude` for every driver entry.
- [ ] When real coordinates are present in the response, driver pins on the map match those coordinates exactly.
- [ ] The status of this requirement (pending backend support) is captured in the kit changelog or an accompanying status note so downstream planners know it is unresolved.
- [ ] A written status entry in this kit's Changelog section declares the coordinate gap as a known limitation and names the expected backend fix (adding `latitude`/`longitude` to the response); this entry is the human-verifiable gate for shipping a release that uses the R4 fallback.

**Dependencies:** R1, R2.

---

### R4: Temporary coordinate fallback (reversible stopgap)
**Description:** Until R3 is satisfied by the backend, the client MAY synthesize approximate driver coordinates from the search center and each driver's reported distance, with a per-driver bearing derived deterministically from the driver's identifier. This fallback is explicitly temporary and must be removed the moment the backend starts returning real coordinates.

**Acceptance Criteria:**
- [ ] When the backend response lacks `latitude` or `longitude` for a driver, the client computes a synthesized position using the search center and that driver's `distanceM`.
- [ ] The bearing used in the synthesis is a deterministic function of the driver's `id` (the same driver always lands in the same direction, so positions do not jitter between fetches).
- [ ] When the backend response contains real `latitude` and `longitude`, those values are used and the fallback is NOT applied.
- [ ] The fallback code path is explicitly marked as temporary in the codebase (via a dedicated comment, flag, or module name) so it is trivially locatable when R3 lands.
- [ ] Removing the fallback does not require changes to the `NearbyDriver` type or to the DriverMarkers component.

**Dependencies:** R2.

---

### R5: DriverMarkers compatibility
**Description:** The map-marker component consumes the updated `NearbyDriver` type and renders one pin per driver using the type's `latitude` and `longitude` fields. It must not silently drop drivers on account of a missing legacy `location` nested object.

**Acceptance Criteria:**
- [ ] Given a list of N drivers that all satisfy the R2 type shape, the component renders exactly N pins.
- [ ] The component reads coordinates from `latitude` and `longitude` on the driver object.
- [ ] The component does not reference a legacy nested `location.lat` / `location.lng` shape.
- [ ] A driver object missing required fields from the R2 type is surfaced as a dev-mode warning rather than silently skipped in a way that hides data issues.

**Dependencies:** R2.

---

### R6: Demo mode
**Description:** When the app runs in demo mode, the nearby-driver fetch returns a hardcoded set of mock drivers with real Dakar-area coordinates and no HTTP request is issued.

**Acceptance Criteria:**
- [ ] In demo mode, the fetch returns a non-empty list of mock drivers.
- [ ] Every mock driver has non-null `latitude` and `longitude` values inside the Dakar metropolitan area.
- [ ] Every mock driver fully satisfies the R2 `NearbyDriver` type (including `id`, `name`, `vehicleType`, `vehiclePlate`, `rating`, `distanceM`).
- [ ] No outgoing HTTP request is dispatched by the fetch in demo mode.
- [ ] The map renders pins for every mock driver via the R5 component without triggering the R4 fallback (because real coordinates are present).

**Dependencies:** R1, R2, R5, `cavekit-api-client.md` R4.

---

## Out of Scope
- WebSocket or streaming real-time driver position updates (deferred to Phase 2).
- A driver-detail bottom sheet or profile view on pin tap.
- A driver-side availability toggle (lives in a separate driver app, not this client).
- Driver filtering by vehicle type, rating threshold, or ETA.
- Any geofencing / service-area enforcement beyond the radius parameter.
- Request deduplication or background polling scheduling (implementation detail).

## Cross-References
- See also: `cavekit-api-client.md` — the fetch uses the shared client for auth, error normalization, and demo-mode bypass.
- See also: `cavekit-location-search.md` — shares the coordinate convention (`latitude`, `longitude` as numbers) used for search centers, destinations, and driver positions.
- See also: `cavekit-route-directions.md` — shares the latitude/longitude coordinate convention used for route origin and driver position.

## Changelog

### 2026-04-19 — R3 coordinate gap (KNOWN LIMITATION — gating entry for R4 fallback)

**Status:** BLOCKED on backend  
**Limitation:** The `/drivers/nearby` endpoint does not yet return `latitude` or `longitude` per driver. The client therefore cannot place driver pins at accurate map positions.  
**Stopgap in use:** R4 jitter fallback (T-044/T-045) — synthesises approximate coordinates from the search centre + `distanceM` + a deterministic bearing derived from driver `id`. Positions are plausible but NOT GPS-accurate.  
**Expected backend fix:** Add `latitude: float` and `longitude: float` fields to every object in the `/drivers/nearby` response array.  
**Release gate:** A release that relies on the R4 fallback (rather than real coordinates) MUST NOT claim "map-accurate driver pins" in release notes or feature flags. This entry is the human-verifiable gate — it must be updated to RESOLVED (with the backend deploy reference) before shipping a release that removes the fallback and uses real coordinates.
