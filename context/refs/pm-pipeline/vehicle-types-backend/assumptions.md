# Assumption Register — Vehicle Type Catalog & Per-Type Fare Estimation

**Feature:** Backend API changes to expose vehicle type catalog (`GET /vehicle-types`) and per-vehicleType fare breakdowns on `/rides/estimate` and `/rides/create`.
**Codebase inspected:** `RentAScooter-Backend/monolith/src/` + `RentAScooter-Client-Standalone/`
**Date:** 2026-04-20

---

## Codebase Context (grounding)

Before the table, key facts discovered from the actual code:

- **Fare logic is hardcoded constants** in `rides.service.ts`: `FARE_BASE = 500`, `FARE_PER_KM = 150`, `FARE_PER_MIN = 25`. No vehicle-type multipliers exist anywhere.
- **`vehicleType` on drivers is a free-text `varchar(50)`** — values like `"scooter"` are driver-entered at registration, no catalog backs it. No `vehicle_types` table exists in the schema.
- **`/rides/estimate` does not exist** as a real backend route. The `rides.routes.ts` has no estimate endpoint; `bookingService.ts` calls `GET /rides/estimate` but only the demo fallback works today.
- **`CreateRideV2Request`** on mobile has no `vehicleType` field. The backend `createRideBodySchema` also has no `vehicleType`.
- **The booking screen** (`booking.tsx`) renders a single fare row (`fareEstimate.fareEstimate`) — no carousel or multi-type selection UI exists yet.
- **The mobile `NearbyDriver` type** hardcodes `vehicleType: 'scooter'` as a literal union — multi-type is not modelled in shared types.
- **No migration SQL** references a `vehicle_types` table. Adding one requires a new Drizzle migration + Cloud SQL deploy.

---

## Assumption Register

| # | Category | Assumption | Confidence | Fast Test / Experiment |
|---|----------|-----------|------------|------------------------|
| 1 | **Value** | Users in Dakar will meaningfully differentiate and choose between vehicle types (e.g. scooter vs. tuk-tuk vs. car) rather than just picking the cheapest option every time. The carousel adds decision value, not decision fatigue. | LOW | Ship a fake carousel with 2–3 static types and mock prices to 20 beta users; measure which type is selected and how often they change selection before booking. If >80% always pick the cheapest, the carousel is a navigation cost with no value return. |
| 2 | **Value** | Per-type fare transparency (showing price before booking per vehicle class) increases conversion from the booking bottom sheet to confirmed ride creation. | MEDIUM | A/B test: half of users see current single-fare screen, half see per-type breakdown. Compare booking completion rate and time-to-book. Current `/rides/estimate` demo shows `500 + 300/km + 25/min` — use this as the control variant. |
| 3 | **Feasibility** | Adding a `vehicle_types` catalog table with a Drizzle migration and wiring `vehicleType` FK onto both `drivers` and `rides` tables can be done without breaking the live `drivers.vehicleType varchar(50)` free-text column before a data migration is run. | LOW | Spike the migration: write the SQL for `vehicle_types` table + `driver.vehicle_type_id` nullable FK + backfill query from existing free-text values. Time-box to 2 hours. Evaluate data quality of existing `vehicle_type` strings before committing to the FK approach. |
| 4 | **Feasibility** | Making `/rides/estimate` backward-compatible (returning a single `fareEstimate` when no `vehicleType` param is given, and a per-type array when it is) will not break the existing mobile client. | HIGH | The existing `bookingService.ts` calls `GET /rides/estimate?distanceM=X&durationS=Y` with no vehicleType and reads `data.fareEstimate`. A new optional param + a response shape that still includes `fareEstimate` at the top level is safe. Validate with a contract test against the current demo fixture in `bookingService.ts`. |
| 5 | **Feasibility** | The fleet actually has multiple vehicle types deployed or imminently deployable in Dakar. The backend/catalog work is meaningless if all registered drivers are currently `"scooter"`. | LOW | Query the production `drivers` table: `SELECT vehicle_type, COUNT(*) FROM drivers GROUP BY vehicle_type`. If only one value exists, delay the catalog feature until a second vehicle type has active drivers. |
| 6 | **Usability** | The `iconKey` field on the vehicle type catalog (returned by `GET /vehicle-types`) will map cleanly to icons available in `@rentascooter/ui/src/assets/icons/` without needing new SVG assets or a native rebuild. | LOW | Audit existing SVG icon files in `packages/ui/src/assets/icons/`. If scooter is the only vehicle icon, new types require new SVGs, a new EAS build, and App Store review — not just a backend deploy. Icon mismatches silently degrade the carousel UX. |
| 7 | **Viability** | Pricing per vehicle type (different `fareBase`/`farePerKm`/`farePerMin` multipliers) can be configured and updated by ops without a code deploy — i.e. the catalog is DB-driven, not hardcoded constants. | LOW | Current state: all fares are hardcoded in `rides.service.ts` as TypeScript constants. A DB-driven config table (or admin endpoint) must be built as part of this feature, or pricing changes require re-deploys. Validate the ops team's ability and willingness to manage a fare config table vs. requesting an admin UI. |
| 8 | **Viability** | The single GCE `e2-medium` backend (PM2 cluster, `europe-west1`) can absorb the additional per-request DB lookups for vehicle type catalog and per-type fare calculation without degrading P95 latency on `/rides/estimate`. | MEDIUM | Load test with k6: fire 50 concurrent `/rides/estimate` requests with vehicleType param; baseline against current (demo-only) latency. The DB hit for a vehicle_types catalog read is small, but it adds a round-trip on every booking screen open — high-frequency path. |
| 9 | **Strategy** | Exposing vehicle types as a first-class catalog (not just driver free-text) is the right abstraction now, rather than waiting until the driver app also enforces type selection at onboarding. Doing it only on the client booking side creates an inconsistency that will need to be reconciled later. | MEDIUM | Map the full data flow: driver registers with `vehicleType` free-text → driver appears on map → client books → ride matched. If the driver app doesn't validate against the catalog at registration, the catalog is decorative. Decide: is this feature blocked on driver app changes, or can it ship with a reconciliation TODO? |
| 10 | **Go-to-Market** | Dakar riders already understand vehicle type categories (scooter, tuk-tuk, etc.) as distinct fare tiers — the mental model of "choose your vehicle class for a price" exists in the market, analogous to Uber/Bolt tiers. | MEDIUM | 5 in-person user interviews in Dakar. Show a paper prototype of the carousel with 3 vehicle types and prices. Ask: "What would you do here?" If users are confused about the difference between types, the feature ships as friction, not value. |
| 11 | **Ethics** | Showing per-type price breakdowns will not create discriminatory access patterns where lower-income users are systematically shown or defaulted to lower-quality vehicle types based on their ride history or location. | MEDIUM | Define the default sort order and default-selected type in the carousel before launch. Confirm the carousel does not auto-select based on any user demographic signal. Audit the fare multipliers to ensure no type is priced punitively relative to local income norms. |
| 12 | **Team** | The backend engineer can implement the new `vehicle_types` module (table, migration, Drizzle schema, route, controller) following the existing module pattern (`rides/`, `drivers/`, `locations/`) without architectural guidance — the pattern is sufficiently clear from existing code. | HIGH | The existing module structure is clean and consistent: schema → service → routes → module registration in `app.ts`. A `vehicle-types` module following the same pattern is low-ambiguity. Risk is low here, but verify: does the engineer own the Cloud SQL migration deploy process on the GCE VM, or does it require a separate ops step? |

---

## Priority Order for Validation

1. **#5 (Fleet reality)** — If only one vehicle type exists in production, the entire feature is premature. Cheapest validation: one SQL query.
2. **#1 (User value of choice)** — The carousel UX is the entire user-facing rationale. Test with a fake carousel before building real backend.
3. **#3 (Migration feasibility)** — The FK migration is the highest-risk technical change. Spike before committing to the schema design.
4. **#6 (Icon availability)** — Icon gaps trigger an EAS build + App Store review cycle. Surface this early to unblock design.
5. **#7 (Fare config operability)** — Hardcoded constants are a viability trap. Resolve the ops model before writing the service layer.
