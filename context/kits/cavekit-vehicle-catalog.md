---
created: "2026-04-20T00:00:00Z"
last_edited: "2026-04-20T00:00:00Z"
---

# Cavekit: Vehicle Catalog

## Scope
Backend-owned catalog of the vehicle types the rider can choose when requesting a ride (for the Dakar market). The catalog stores the display metadata and the fare parameters that drive pricing. Exposes a read endpoint for clients and a reusable fare computation utility for other backend domains. Covers the new persistent vehicle-type collection, its seed data, a cached public read API, and a pure fare-calculation helper extracted from the existing rides service.

## Requirements

### R1: Vehicle Type Catalog Persistence
**Description:** A persistent vehicle-type catalog exists on the backend and represents each selectable vehicle category with display metadata and fare parameters.
**Acceptance Criteria:**
- [ ] Each catalog entry has a stable unique identifier (UUID) that remains valid across deploys.
- [ ] Each entry records a human-readable name, an icon key usable by the client, fare base, fare per kilometre, fare per minute, an active flag, and creation/update timestamps.
- [ ] Fare base, fare per kilometre, and fare per minute are stored as non-negative integer values in XOF (no decimals).
- [ ] The catalog schema change is applied through a migration that is idempotent and reversible.
- [ ] After the migration runs on an empty database, at least three active entries exist: Moto-taxi (base 300, per-km 100, per-min 15), Jakarta (base 400, per-km 120, per-min 18), Voiture (base 700, per-km 200, per-min 35).
- [ ] The Moto-taxi entry is identifiable as the default entry (by name or a documented flag) so other domains can resolve it deterministically.
**Dependencies:** none

### R2: Public Vehicle Types Read Endpoint
**Description:** A public HTTP endpoint returns the currently selectable vehicle types so clients can render the vehicle picker without authentication.
**Acceptance Criteria:**
- [ ] Requesting the endpoint returns HTTP 200 with a JSON array of active catalog entries.
- [ ] Each returned entry includes at minimum `id`, `name`, and `iconKey`.
- [ ] Inactive catalog entries are not returned.
- [ ] The endpoint is reachable without a Firebase JWT; requests without Authorization headers succeed.
- [ ] The response order is stable across consecutive calls with the same catalog state.
- [ ] A successful response is returned in under 50 ms when the result is served from the cache layer (see R3).
**Dependencies:** R1

### R3: Catalog Response Caching
**Description:** The catalog read endpoint serves repeat requests from an in-memory cache to avoid repeated database reads.
**Acceptance Criteria:**
- [ ] The first successful response populates a cache entry keyed to the vehicle-types resource.
- [ ] Subsequent requests within the cache lifetime return the cached payload without issuing a database query.
- [ ] The cache entry expires automatically after 5 minutes.
- [ ] After the cache entry expires, the next request re-reads from the database and repopulates the cache.
- [ ] The cached payload is byte-identical to the fresh payload for the same catalog state.
**Dependencies:** R2

### R4: Fare Calculation Utility
**Description:** A pure, side-effect-free fare calculation utility is available to any backend domain that needs to compute a ride fare from trip distance, trip duration, and the fare parameters of a vehicle type.
**Acceptance Criteria:**
- [ ] Given a distance in metres, a duration in seconds, and a fare-parameter set (fare base, fare per km, fare per minute), the utility returns a single non-negative integer XOF amount.
- [ ] The returned amount equals `fareBase + round(distanceKm * farePerKm) + round(durationMinutes * farePerMin)`, where `distanceKm = distanceM / 1000` and `durationMinutes = durationS / 60`.
- [ ] The distance-cost term and the time-cost term are each rounded to the nearest integer before being summed (never a single final rounding).
- [ ] A distance of 0 m and a duration of 0 s yield exactly `fareBase`.
- [ ] The utility performs no I/O (no database, cache, or network access) and can be invoked synchronously.
- [ ] The utility is importable from the other backend domains that need fare estimates and fare persistence without creating a circular dependency with the rides service.
**Dependencies:** none

## Out of Scope
- Admin UI for managing vehicle types.
- Per-city or regional catalog variants.
- Surge pricing, time-of-day pricing, or promotional modifiers.
- Driver-side vehicle type normalization (the existing free-text driver vehicle field is not changed).
- Matching or dispatch logic that filters available drivers by vehicle type.
- Client-side rendering of icons or translated names.
- Localization of the `name` field (single display name per entry).

## Cross-References
- See also: cavekit-fare-estimation-api.md (consumes the catalog and the fare utility)
- See also: cavekit-ride-vehicle-type.md (consumes the catalog and the fare utility when creating rides)

## Changelog
- 2026-04-20: Initial draft.
