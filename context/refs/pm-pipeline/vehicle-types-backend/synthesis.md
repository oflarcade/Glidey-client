# Synthesis: Vehicle Types Backend

**Date:** 2026-04-20
**Slug:** vehicle-types-backend

---

## Recommended Features (top 3)

**1. Backward-compatible `vehicleType` on CreateRideV2 (ENG-3, ICE 7.20)**
Add `vehicleType: z.string().uuid().optional()` to `createRideBodySchema` and a nullable `vehicle_type_id uuid REFERENCES vehicle_types(id)` column to the `rides` table. Fall back to the moto-taxi type when omitted — zero regression risk. At create time, populate `fareBase/farePerKm/farePerMin` from the selected vehicle type's catalog row, so `completeRide()` receives correct per-type fare params with no changes to that function. 3-file change: `rides.schemas.ts`, `rides.service.ts`, one Drizzle migration.

**2. Vehicle type catalog + fare utility (ENG-1 + ENG-2, ICE 6.48 each)**
Create `vehicle_types` table (`id uuid pk`, `name varchar`, `icon_key varchar`, `fare_base int`, `fare_per_km int`, `fare_per_min int`, `is_active boolean`). Seed with 3 Dakar-reality types: Moto-taxi (300/100/15 XOF), Jakarta 3-roues (400/120/18 XOF), Voiture (700/200/35 XOF). Cache full list in Redis with 5-minute TTL via existing `app.redis`. Simultaneously extract `calculateFare(distanceM, durationS, { fareBase, farePerKm, farePerMin })` as a pure utility — replaces the inline math in `completeRide()` and is the single source for the estimate endpoint. These ship as one PR.

**3. `GET /rides/estimate` returning per-type fare array (PM-1/PD-1, ICE 5.60–5.67)**
New stateless endpoint: `GET /rides/estimate?distanceM=&durationS=` returns `{ estimates: [{ vehicleTypeId, vehicleTypeName, iconKey, fareEstimate }] }` for all active vehicle types. Uses `calculateFare()` with each type's config from the Redis-cached catalog. Recommend public (no Firebase JWT) — matches competitor UX where prices are visible pre-login. Blocks on ENG-1+ENG-2.

---

## Key Risks to Address in Spec

| Risk | Confidence | Must-Become Acceptance Criterion |
|------|------------|----------------------------------|
| A5 — Fleet reality (single vehicle type) | **LOW** | `SELECT vehicle_type, COUNT(*) FROM drivers GROUP BY vehicle_type` run before build begins. If only one type exists, seed data still ships (infrastructure ready) but mobile carousel feature-flags to single-type mode. |
| A3 — Migration from free-text vehicleType to FK | **LOW** | `rides.vehicle_type_id` is nullable; no backfill of historical rides required. `drivers.vehicle_type` varchar(50) is NOT touched — driver FK normalization is explicitly out of scope. |
| A6 — iconKey → SVG asset gap | **LOW** | `GET /vehicle-types` returns `iconKey` strings (`moto`, `jakarta`, `car`). Mobile client must have matching SVGs before the carousel can render. Backend spec must document the exact 3 iconKey values so mobile can plan asset work. |
| A7 — Fare config operability | **LOW** | Per-type fare params (`fareBase`, `farePerKm`, `farePerMin`) are stored in the `vehicle_types` DB table — not hardcoded TypeScript constants. Ops can update via direct DB edit or a future admin panel. The existing hardcoded constants (`FARE_BASE=500`, `FARE_PER_KM=150`, `FARE_PER_MIN=25`) are mapped to the Jakarta type for continuity, then removed from `rides.service.ts`. |

---

## Constraints

- **No change to `completeRide()`** — it already reads `fareBase/farePerKm/farePerMin` from the ride row. Per-type fares automatically flow through once those columns are populated at `createRide()` time.
- **No driver `vehicle_type` FK normalization** — `drivers.vehicle_type varchar(50)` stays as-is. Driver onboarding to enforce catalog selection is a separate feature.
- **No matching/dispatch changes** — a driver with `vehicleType = "moto"` can still accept a "voiture" booking. Dispatch filtering by vehicle type is Phase 5.
- **No surge pricing** — flat per-type `farePerKm/farePerMin` multipliers only. No time-of-day logic.
- **Redis already wired** — `app.redis` is available in the monolith. Cache TTL = 5 minutes.
- **Admin seed infrastructure already exists** — vehicle type seed data follows the existing admin module pattern.
- **Integer XOF only** — no floats. `round()` at every multiplication step consistent with existing `FARE_PER_KM=150` pattern.

---

## Suggested Domain Decomposition

**Domain A: `vehicle-catalog` (CREATE NEW)**
Everything needed to define and serve the vehicle type catalog: `vehicle_types` Drizzle schema + migration, `GET /vehicle-types` route + controller, Redis cache layer, seed data (3 Dakar types), `calculateFare()` pure utility extracted from `rides.service.ts`. This domain owns the catalog table and is the prerequisite for all downstream fare and ride features.

**Domain B: `fare-estimation-api` (CREATE NEW)**
`GET /rides/estimate` endpoint — stateless, public (no auth), returns per-type fare array using `calculateFare()` from Domain A. Accepts `distanceM`, `durationS`. Response shape: `{ estimates: [{ vehicleTypeId, vehicleTypeName, iconKey, fareEstimate }] }`. Blocked on Domain A.

**Domain C: `ride-vehicle-type` (CREATE NEW)**
Extend `POST /rides` to accept optional `vehicleType` UUID, add nullable `vehicle_type_id FK` to `rides` table, populate `fareBase/farePerKm/farePerMin` from the selected vehicle type at `createRide()` time. Blocked on Domain A. Enables mobile `CreateRideV2Request.vehicleType` to have real backend meaning.

---

## Success Criteria Candidates

From PRD + metrics — these become cavekit acceptance criteria:

1. `GET /vehicle-types` returns at least 3 active types with `{id, name, iconKey}` within 50 ms (Redis-cached after first request)
2. `GET /rides/estimate?distanceM=3500&durationS=480` returns an array with one entry per active vehicle type, each with a `fareEstimate` computed using that type's `fareBase/farePerKm/farePerMin` values
3. Fare estimate formula matches `completeRide()` exactly: `fareBase + round(distanceKm * farePerKm) + round(durationMin * farePerMin)` — no divergence between pre-booking estimate and post-ride charge
4. `POST /rides` with no `vehicleType` field still succeeds with HTTP 201 and defaults to moto-taxi type — zero regression on existing clients
5. `POST /rides` with a valid `vehicleType` UUID stores `vehicle_type_id` on the ride row and uses that type's fare params for `fareBase/farePerKm/farePerMin`
6. Hardcoded `FARE_BASE`, `FARE_PER_KM`, `FARE_PER_MIN` constants are removed from `rides.service.ts` — no orphaned constants remain
7. `GET /vehicle-types` response serves from Redis on repeat calls (first-call DB hit; subsequent calls cache hit, verifiable via Redis monitor)
8. All existing `rides.service.test.ts` tests pass after the schema change
