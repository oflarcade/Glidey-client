---
created: "2026-04-20T00:00:00Z"
last_edited: "2026-04-20T00:00:00Z"
---

# Cavekit: Ride Vehicle Type

## Scope
Associates a ride with a specific vehicle type at creation time and uses that vehicle type's fare parameters as the ride's authoritative pricing inputs. Replaces the existing hardcoded fare constants in the rides service with per-ride values sourced from the catalog. Covers the ride-creation request contract, the ride record's vehicle-type link, default behavior when the client omits a vehicle type, removal of the hardcoded constants, and preservation of the existing ride-completion behavior.

## Requirements

### R1: Optional Vehicle Type on Ride Creation
**Description:** The ride creation endpoint accepts an optional vehicle type identifier selected by the rider.
**Acceptance Criteria:**
- [ ] The ride creation request body accepts an optional `vehicleType` field containing a vehicle-type UUID.
- [ ] A request that omits `vehicleType` is accepted and produces HTTP 201.
- [ ] A request with a `vehicleType` that is a syntactically invalid UUID is rejected with HTTP 400.
- [ ] A request with a `vehicleType` that is syntactically valid but does not match any active catalog entry is rejected with a 4xx error that names the unknown vehicle type.
- [ ] A request with a `vehicleType` matching an active catalog entry is accepted and produces HTTP 201.
**Dependencies:** cavekit-vehicle-catalog R1

### R2: Ride Record Links To Vehicle Type
**Description:** A ride record persistently references the vehicle type chosen when it was created.
**Acceptance Criteria:**
- [ ] The ride record has a nullable vehicle-type reference that points to a catalog entry.
- [ ] When ride creation succeeds with a chosen vehicle type, the ride's vehicle-type reference resolves to that catalog entry.
- [ ] When ride creation succeeds without a chosen vehicle type, the ride's vehicle-type reference resolves to the default entry identified by the catalog (see cavekit-vehicle-catalog R1).
- [ ] The schema change that introduces the reference is applied through a migration that is idempotent and reversible.
- [ ] Existing ride rows created before this change remain readable after the migration (the reference is nullable for legacy rows).
**Dependencies:** R1, cavekit-vehicle-catalog R1

### R3: Per-Ride Fare Parameters From Catalog
**Description:** A newly created ride stores the fare parameters from the resolved vehicle type so ride completion can compute the final fare without re-reading the catalog.
**Acceptance Criteria:**
- [ ] On successful ride creation, the ride record's `fareBase`, `farePerKm`, and `farePerMin` equal the corresponding values from the resolved vehicle-type catalog entry at the moment of creation.
- [ ] When `vehicleType` is omitted, the persisted fare parameters equal those of the default catalog entry.
- [ ] When `vehicleType` is provided, the persisted fare parameters equal those of the selected catalog entry and not those of the default entry.
- [ ] The persisted fare parameters are non-negative integers in XOF.
- [ ] A subsequent update to the catalog entry's fare parameters does not retroactively change the fare parameters stored on previously created rides.
**Dependencies:** R2, cavekit-vehicle-catalog R1

### R4: Removal of Hardcoded Fare Constants
**Description:** The rides service no longer carries hardcoded fare constants.
**Acceptance Criteria:**
- [ ] No constant named `FARE_BASE`, `FARE_PER_KM`, or `FARE_PER_MIN` (or any equivalently hardcoded per-ride fare value) remains in the rides service module.
- [ ] The rides service derives per-ride fare parameters exclusively from the resolved vehicle-type catalog entry at ride-creation time.
- [ ] A static text search of the rides service source for `FARE_BASE`, `FARE_PER_KM`, and `FARE_PER_MIN` returns zero matches.
**Dependencies:** R3

### R5: Ride Completion Behavior Preserved
**Description:** The ride-completion path continues to compute the final fare from the ride record's stored fare parameters without modification to its logic.
**Acceptance Criteria:**
- [ ] Ride completion reads `fareBase`, `farePerKm`, and `farePerMin` from the ride record and not from any hardcoded constant or live catalog lookup.
- [ ] The final fare computed at completion for a given `(distanceM, durationS)` and ride record equals the value produced by the shared fare calculation utility (see cavekit-vehicle-catalog R4) using that record's fare parameters.
- [ ] Existing rides-service unit tests that cover ride creation and ride completion continue to pass after the schema change, once updated only to account for the new `vehicle_type_id` column and the per-ride fare parameter source.
**Dependencies:** R3, cavekit-vehicle-catalog R4

## Out of Scope
- Changes to ride-completion business logic beyond sourcing fare parameters from the ride record (the completion path is not otherwise modified).
- Changing the driver vehicle type field or normalizing it against the catalog.
- Filtering driver matching or dispatch by vehicle type.
- Surge pricing, time-of-day pricing, or promotional modifiers.
- Displaying the chosen vehicle type in ride history or admin tooling.
- Mobile client changes to the ride creation flow.

## Cross-References
- See also: cavekit-vehicle-catalog.md (source of the vehicle-type entries, default entry, and fare calculation utility)
- See also: cavekit-fare-estimation-api.md (shares the catalog and the fare utility so estimate and final fare agree for the same inputs)

## Changelog
- 2026-04-20: Initial draft.
