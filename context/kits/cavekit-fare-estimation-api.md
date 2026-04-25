---
created: "2026-04-20T00:00:00Z"
last_edited: "2026-04-20T00:00:00Z"
---

# Cavekit: Fare Estimation API

## Scope
Backend-owned public endpoint that returns, for a proposed trip (distance and duration), a fare estimate for every currently selectable vehicle type. Powers the rider's pre-booking vehicle picker with transparent per-type pricing. Covers request validation, response shape, per-type fare computation, and public accessibility.

## Requirements

### R1: Fare Estimate Request Contract
**Description:** The estimate endpoint accepts a trip distance and trip duration as query inputs and validates them before computing fares.
**Acceptance Criteria:**
- [ ] Requests accept `distanceM` (trip distance in metres) and `durationS` (trip duration in seconds) as numeric inputs.
- [ ] Requests with non-numeric, negative, or missing `distanceM` or `durationS` return HTTP 400 with a structured error payload.
- [ ] Requests with `distanceM = 0` and `durationS = 0` are treated as valid and produce a response (see R2).
- [ ] Validation errors are surfaced without requiring the rest of the handler to execute.
**Dependencies:** none

### R2: Per-Vehicle-Type Fare Estimates
**Description:** A successful request returns one fare estimate per active vehicle type in the catalog.
**Acceptance Criteria:**
- [ ] The response is HTTP 200 with a JSON body shaped as `{ estimates: [...] }`.
- [ ] `estimates` contains exactly one entry per active vehicle type in the catalog.
- [ ] Each entry contains at minimum `vehicleTypeId`, `vehicleTypeName`, `iconKey`, and `fareEstimate`.
- [ ] `fareEstimate` is a non-negative integer XOF amount.
- [ ] `fareEstimate` equals the value produced by the shared fare calculation utility using the entry's `fareBase`, `farePerKm`, `farePerMin` and the request's `distanceM` and `durationS`.
- [ ] When the catalog currently has zero active entries, `estimates` is an empty array and the response is still HTTP 200.
- [ ] Two requests with identical inputs against the same catalog state return identical `fareEstimate` values for every entry.
**Dependencies:** R1, cavekit-vehicle-catalog R1, cavekit-vehicle-catalog R4

### R3: Public Accessibility
**Description:** The estimate endpoint is reachable without rider authentication so the picker can display prices before sign-in is required.
**Acceptance Criteria:**
- [ ] Requests without an Authorization header succeed when inputs are valid.
- [ ] Requests with an invalid or expired Firebase JWT are not rejected on auth grounds; they are evaluated solely on input validity.
- [ ] The endpoint does not read or write per-user state.
**Dependencies:** none

### R4: Formula Parity With Ride Completion
**Description:** The fare estimate for any vehicle type matches the fare that will be charged when a ride of the same distance and duration is completed with that vehicle type.
**Acceptance Criteria:**
- [ ] For any triple `(distanceM, durationS, vehicleTypeId)` where the vehicle type is active, the `fareEstimate` returned by this endpoint equals the final fare produced by the existing ride-completion fare calculation when it uses the same vehicle type's parameters.
- [ ] Both paths invoke the same shared fare calculation utility (see cavekit-vehicle-catalog R4); neither path duplicates the formula locally.
**Dependencies:** cavekit-vehicle-catalog R4

## Out of Scope
- Surge pricing, dynamic pricing, or promotional discounts.
- Currency other than XOF.
- Driver ETA, pickup fees, or minimum-fare floors beyond the configured fare base.
- Persisting the estimate on the server.
- Any client-side rendering or ordering of the estimate list.
- Rate limiting or abuse protection (handled by general infrastructure, not this domain).

## Cross-References
- See also: cavekit-vehicle-catalog.md (source of active vehicle types and the shared fare utility)
- See also: cavekit-ride-vehicle-type.md (uses the same catalog and utility when persisting a ride's fare parameters)

## Changelog
- 2026-04-20: Initial draft.
