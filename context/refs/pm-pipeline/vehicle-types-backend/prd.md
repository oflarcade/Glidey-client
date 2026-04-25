# PRD: Vehicle Type Catalog + Per-Type Fare Estimation

**Status:** Draft  
**Date:** 2026-04-20  
**Author:** Product (Glidey)

---

## 1. Summary

The Glidey backend today has no vehicle-type catalog endpoint and collapses all fare logic into a single set of hardcoded constants (`FARE_BASE = 500 XOF`, `FARE_PER_KM = 150 XOF`, `FARE_PER_MIN = 25 XOF`) applied uniformly regardless of vehicle type. This feature adds a `GET /vehicle-types` catalog endpoint, extends `POST /rides/estimate` to return per-type fare breakdowns, and adds an optional `vehicleType` field to `POST /rides` — enabling the mobile booking bottom sheet to show real per-type prices in its carousel before the rider commits to a booking.

---

## 2. Problem

**Pain:** The booking bottom sheet carousel on mobile needs to show price estimates per vehicle type (e.g., moto-taxi vs. car). The backend cannot support this today:

- There is no `/rides/estimate` endpoint at all — fare is only calculated at ride completion inside `completeRide()` using `distanceM` and `durationS` already stored on the ride row.
- `createRideBodySchema` (in `rides.schemas.ts`) has no `vehicleType` field; the `rides` table has no `vehicle_type` column.
- The `drivers` table stores `vehicle_type` as a free-text `varchar(50)` with no enforced catalog — values like `"moto"`, `"Moto"`, `"motorcycle"` could all exist.

**Current workaround:** Mobile shows no price before booking. The rider sees a fare total only after the ride completes.

---

## 3. Objective

Enable the mobile client to fetch a structured vehicle-type list and a per-type fare estimate before the rider taps "Book", so the booking bottom sheet carousel can display accurate prices per vehicle category.

**Measure of success:**
- `GET /vehicle-types` returns a stable, seeded list of vehicle types within 50 ms (Redis-cached).
- `POST /rides/estimate` returns per-type fare breakdowns, matching the formula already used at completion: `fareBase + round(distanceKm * farePerKm) + round(durationMin * farePerMin)`.
- `POST /rides` accepts an optional `vehicleType` field and persists it to the ride row without breaking existing clients that omit the field.

---

## 4. Target Users

**Primary — Riders (clients) in Dakar:**  
Using the Glidey mobile app to book a ride. They reach the booking bottom sheet after selecting pickup and destination. They want to compare prices across vehicle types (moto-taxi is cheapest, car costs more) before confirming. Today they have zero price information at booking time.

**Secondary — Backend / Mobile engineers:**  
Need a stable, typed API contract to build against. The mobile `NearbyDriver` shape already returns `vehicleType` as a free string from `drivers.service.ts`; this feature makes that string resolve to a catalog entry.

---

## 5. User Stories

1. As a rider, I want to see the available vehicle types and their estimated fares before I confirm a booking, so I can choose based on price and vehicle category.
2. As a rider, I want fare estimates shown in XOF (whole numbers), so I can make sense of the price in the local currency without conversion.
3. As a mobile engineer, I want a `GET /vehicle-types` endpoint that returns `[{id, name, iconKey}]`, so the booking carousel can render vehicle options without hardcoding them in the app.
4. As a mobile engineer, I want `POST /rides/estimate` to accept `distanceM`, `durationS`, and an optional `vehicleType`, and return per-type fare estimates when no type is specified, so the carousel can show all options in a single request.
5. As a mobile engineer, I want `POST /rides` to accept an optional `vehicleType` field without breaking existing clients that omit it, so the booking flow can persist the selected type when present.
6. As a product analyst, I want `vehicleType` stored on the ride row, so I can segment ride volume and revenue by vehicle type in future reporting.

---

## 6. Scope

**IN:**

- New `GET /vehicle-types` endpoint (unauthenticated or authenticated — TBD) returning `[{id: string, name: string, iconKey: string}]`. Vehicle type data seeded via the existing `admin` module seed infrastructure.
- New `POST /rides/estimate` endpoint accepting `{distanceM, durationS, vehicleType?}`. Returns `{estimates: [{vehicleTypeId, vehicleTypeName, fareEstimate}]}`. Uses the existing fare formula from `rides.service.ts` (`FARE_BASE + round(distanceKm * FARE_PER_KM) + round(durationMin * FARE_PER_MIN)`), parameterized per vehicle type. In scope: different `fareBase`/`farePerKm`/`farePerMin` constants per vehicle type stored in the catalog. Not a live driver-availability query — purely fare math.
- Schema change: add `vehicle_type_id uuid REFERENCES vehicle_types(id)` (nullable) to the `rides` table via a new Drizzle migration.
- Update `createRideBodySchema` in `rides.schemas.ts` to accept optional `vehicleType: z.string().uuid().optional()`.
- Persist `vehicleTypeId` on ride insert in `rides.service.ts::createRide()`.
- `fareBase`, `farePerKm`, `farePerMin` constants on the ride row already store per-ride fare params — these should be populated from the selected vehicle type at create time, replacing the current hardcoded constants.

**OUT:**

- No change to `completeRide()` fare calculation logic — it already uses the stored `fareBase`/`farePerKm`/`farePerMin` from the ride row, so it will benefit automatically.
- No driver-side enforcement of vehicle type at ride matching — a driver with `vehicleType = "moto"` can still accept a ride booked as "car". That is a dispatch matching problem, out of scope here.
- No pricing admin UI or dynamic pricing rules engine.
- No changes to the `drivers` table `vehicle_type varchar(50)` column — normalizing that to a FK is a separate migration.
- No surge pricing or time-of-day pricing.
- No changes to the realtime/WebSocket layer.

---

## 7. Success Metrics

1. **Pre-booking fare visibility rate:** % of ride creation requests that include a `vehicleType` field reaches >80% within 2 weeks of mobile feature shipping — indicating riders are using the carousel.
2. **Estimate endpoint latency:** P95 response time for `POST /rides/estimate` under 100 ms (can be fully computed in-process; no DB read needed once vehicle type fare params are cached in memory or Redis).
3. **Zero regression on ride creation:** `POST /rides` 2xx rate remains stable (>99.5%) before and after the schema change, confirmed via existing test suite in `rides.service.test.ts`.

---

## 8. Open Questions

1. **Fare differentiation:** Should moto-taxi and car have different `fareBase`/`farePerKm`/`farePerMin` values from day one, or launch with all types sharing the current constants (`500 / 150 / 25 XOF`) and differentiate later? The answer determines whether the estimate endpoint is meaningful at launch or cosmetic.

2. **Vehicle type catalog ownership:** Should vehicle types be hardcoded seed data (managed via the `admin` module's existing seed infrastructure) or a DB table editable at runtime? A DB table is more flexible but adds operational complexity; seed data is simpler but requires a redeploy to add new types.

3. **Authentication on `GET /vehicle-types`:** Should this endpoint require a Firebase JWT (consistent with all other non-admin routes) or be public (simpler for unauthenticated pre-login screens)? Current pattern in `app.ts` suggests all user-facing routes use the `authenticate` preHandler — making this public would be the only exception.
