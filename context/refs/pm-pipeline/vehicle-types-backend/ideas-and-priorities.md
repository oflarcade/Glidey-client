# Vehicle Types Backend — Ideation & ICE Prioritization

**Feature scope:** Expose a vehicle type catalog and per-type fare estimation so the booking bottom sheet carousel can show real prices per vehicle type.

**Current state (from codebase audit):**
- `FARE_BASE=500 XOF`, `FARE_PER_KM=150 XOF/km`, `FARE_PER_MIN=25 XOF/min` are hardcoded constants in `rides.service.ts` — no per-type differentiation.
- `drivers.vehicleType` is a free-text `varchar(50)` with no catalog backing it.
- No `/rides/estimate` endpoint exists — fare calculation only happens at ride completion inside `completeRide()`.
- `createRideBodySchema` has no `vehicleType` field.
- No `vehicle_types` table exists in the schema.

---

## Part 1 — Brainstorm: 3 Perspectives × 5 Ideas

### Product Manager — Market Fit, Value Creation, Competitive Edge

**PM-1: Per-type fare transparency before booking**
Show the rider exactly what each vehicle type costs (moto-taxi vs. car vs. tuk-tuk) before they commit. In the Dakar market, price sensitivity is extremely high and riders frequently negotiate fares verbally with moto-taxi drivers. Locking in a price upfront per type removes negotiation friction and builds trust in the platform as the fair-price authority.

**PM-2: Vehicle type as a demand segmentation lever**
Premium vehicle types (climatisé car) can carry 2–3x the fare multiplier. This lets Glidey expand revenue per ride without increasing volume, targeting business travelers and expat users in Dakar's Plateau and Almadies neighborhoods. The catalog endpoint is the prerequisite for any future pricing tier experimentation.

**PM-3: Fleet type expansion runway**
Adding a first-class vehicle type catalog (with `iconKey`) gives ops and business teams a self-service tool to onboard new vehicle categories (electric scooters, minivans for groups, cargo moto) without any code change on mobile or backend. This is table-stakes infrastructure for the market expansion planned in Phase 5.

**PM-4: Dynamic surge pricing per vehicle type**
Dakar traffic patterns vary drastically by hour and neighborhood (rush hour on the VDN vs. Médina backstreets). A per-type estimate API is the foundation for a surge multiplier applied selectively — e.g., surge only on cars during peak hours while motos remain flat, keeping an affordable option always visible to price-sensitive riders.

**PM-5: Driver supply signal per vehicle type**
The `/rides/estimate` response could include `availableDriversNearby` per type (reusing the existing PostGIS nearby query on drivers). Showing "3 motos available" vs. "1 car — 8 min wait" gives riders a real-time supply signal that influences type selection and reduces cancellation from unmet wait expectations.

---

### Product Designer — UX, Onboarding, Engagement Loops

**PD-1: Carousel-native price anchoring**
The booking bottom sheet carousel already exists on mobile. When each card renders a real `fareEstimate` from the API rather than a placeholder, users can swipe and compare costs with zero cognitive load. The icon (`iconKey`) + name + price trio on each card is the minimum viable scannable unit for vehicle selection.

**PD-2: "Best value" badge on cheapest type**
Once the API returns multiple fare estimates, the mobile client can badge the lowest-cost option as "Best value" and the fastest ETA option as "Fastest." These micro-labels reduce decision paralysis and increase booking conversion, particularly for first-time users who don't yet have a mental model of Dakar ride-hailing pricing.

**PD-3: Estimate refresh on pickup/destination change**
The estimate endpoint can be called reactively as users adjust their pickup pin or select a different destination. Visual fare updates in the carousel (with a subtle shimmer/loading state per card) create a perception of precision pricing that increases trust and time-on-screen for the booking sheet.

**PD-4: Vehicle type persistence as a preference**
After a user books a ride, store their selected `vehicleType` locally and pre-select it on the next booking. The API catalog + typed estimate is the prerequisite. Users who feel the app "remembers" their preference show higher repeat booking rates — a lightweight engagement loop with near-zero implementation cost once the backend is in place.

**PD-5: Onboarding walk-through tied to vehicle types**
New user onboarding (first launch) can use the catalog endpoint to show an animated carousel of "What can you book on Glidey?" — one card per vehicle type with its icon and starting-from price. This sets fare expectations before the first booking, reducing post-ride price disputes which are the top source of 1-star driver ratings in similar Francophone West Africa markets.

---

### Engineer — Technical Innovation, Integrations, Platform Leverage

**ENG-1: Static catalog seeded via admin + cached in Redis**
Vehicle types change infrequently (weeks/months). A `vehicle_types` table seeded via the existing admin module, with a short-TTL Redis cache (e.g., 5-minute TTL using `app.redis.get/set`), means zero DB hits on the hot path while keeping the catalog instantly updatable without a deploy. The existing Redis infrastructure (`shared/redis/`) and admin module make this trivial to wire.

**ENG-2: Fare formula extracted to a pure utility + per-type multiplier**
Currently fare logic is duplicated: constants in `rides.service.ts` and the actual calculation in `completeRide()`. Extracting a `calculateFare(distanceM, durationS, fareConfig)` pure function and adding a `fareMultiplier` column to `vehicle_types` gives a single source of truth for all fare math. The `/rides/estimate` endpoint calls the same function, guaranteeing estimate == actual fare (no surprises for the rider).

**ENG-3: Backward-compatible `vehicleType` on CreateRideV2**
The `createRideBodySchema` uses Zod. Adding `vehicleType: z.string().optional()` is a non-breaking schema change. The service layer can fall back to `'moto'` (or the cheapest type) when `vehicleType` is omitted, preserving all existing client behavior. No migration needed for existing ride rows — the column can be nullable with a sensible default.

**ENG-4: `/rides/estimate` as a pure stateless endpoint (no auth required)**
Fare estimation is deterministic given `(distanceM, durationS, vehicleType)`. Making it a public endpoint (no Firebase JWT preHandler) removes the need for riders to be authenticated before they see prices — matching behavior of Uber/InDrive where prices are visible before login. This also enables future SEO/marketing pages with live price examples.

**ENG-5: `vehicleType` filter on `/drivers/nearby`**
The PostGIS nearby query already exists. Adding an optional `vehicleType` query param lets the mobile client show only drivers matching the selected carousel card — "3 motos near you" — without an additional roundtrip. The `drivers.vehicleType` varchar column is already in the schema; it just needs to be surfaced in the query filter.

---

## Part 2 — ICE Scoring & Prioritization

**Scoring scale: 1–10 each. ICE = (Impact × Confidence × Ease) / 100**

| # | Idea | Impact | Confidence | Ease | ICE Score |
|---|------|--------|------------|------|-----------|
| 1 | ENG-2: Extract fare util + per-type multiplier | 9 | 9 | 8 | **6.48** |
| 2 | ENG-1: Static catalog table + Redis cache | 8 | 9 | 9 | **6.48** |
| 3 | ENG-3: Backward-compat `vehicleType` on CreateRide | 8 | 10 | 9 | **7.20** |
| 4 | PM-1: Per-type fare transparency (estimate endpoint) | 10 | 8 | 7 | **5.60** |
| 5 | PD-1: Carousel-native price anchoring | 9 | 9 | 7 | **5.67** |
| 6 | ENG-4: Public `/rides/estimate` (no auth) | 7 | 8 | 8 | **4.48** |
| 7 | ENG-5: `vehicleType` filter on `/drivers/nearby` | 7 | 9 | 8 | **5.04** |
| 8 | PM-5: Driver supply signal per type in estimate | 7 | 7 | 6 | **2.94** |
| 9 | PD-2: "Best value" badge (mobile client, not backend) | 6 | 8 | 9 | **4.32** |
| 10 | PM-4: Dynamic surge pricing per type | 8 | 5 | 3 | **1.20** |
| 11 | PD-4: Vehicle type preference persistence | 5 | 8 | 8 | **3.20** |
| 12 | PD-3: Estimate refresh on map change | 6 | 7 | 6 | **2.52** |
| 13 | PM-2: Premium tier revenue segmentation | 7 | 6 | 5 | **2.10** |
| 14 | PM-3: Fleet expansion catalog self-service | 7 | 7 | 7 | **3.43** |
| 15 | PD-5: Onboarding walk-through via catalog | 5 | 6 | 5 | **1.50** |

---

## Top 5 Features — Ranked by ICE Score

### 1. ENG-3: Backward-Compatible `vehicleType` on CreateRideV2 — ICE 7.20

**What:** Add `vehicleType: z.string().optional()` to `createRideBodySchema` and store the selected type on the `rides` row (add nullable `vehicle_type` column). Default to `'moto'` when omitted.

**Why top-ranked:** Maximum impact on the stated requirement (rides carry vehicle type), absolute zero risk of regression (optional Zod field + nullable DB column), and Ease is near-perfect because the entire change is 3 files: `rides.schemas.ts`, `rides.service.ts`, and one Drizzle migration. No new infrastructure. Confidence is 10 because the Zod `.optional()` pattern is already used in the codebase (`route: z.record(z.unknown()).optional()`).

---

### 2. ENG-1 + ENG-2 (tied at 6.48): Static Vehicle Type Catalog + Redis Cache AND Fare Utility Extraction

These two are implementation siblings and ship together as one PR.

**ENG-1 — What:** Create `vehicle_types` table (`id uuid pk`, `name varchar`, `icon_key varchar`, `fare_base int`, `fare_per_km int`, `fare_per_min int`, `is_active boolean`). Seed via admin module. Cache the full list in Redis with a 5-minute TTL. Expose as `GET /vehicle-types` (public, no auth).

**ENG-2 — What:** Extract `calculateFare(distanceM, durationS, { fareBase, farePerKm, farePerMin })` as a pure function in `rides.service.ts` (or a `fare.utils.ts`). Replace the inline math in `completeRide()` with this function. The estimate endpoint calls the same function — guaranteeing estimate accuracy.

**Why:** ENG-1 is the catalog that unblocks everything downstream (mobile carousel, driver onboarding, fare config). ENG-2 removes the only source of "estimate vs. actual" divergence before it becomes a rider complaint. Together they are the infrastructure layer for all subsequent features. Redis is already wired (`app.redis`), Drizzle migrations are already structured, and the admin module already has a seed pattern to follow.

---

### 3. PM-1 / PD-1: `/rides/estimate` Endpoint with Per-Type Breakdown — ICE 5.60–5.67

**What:** `GET /rides/estimate?distanceM=3500&durationS=480` returns an array of `{ vehicleTypeId, vehicleTypeName, iconKey, fareEstimate }` for all active vehicle types. Uses the extracted `calculateFare()` utility with each type's config from the Redis-cached catalog.

**Why:** This is the direct unlock for the mobile booking carousel. Without it, the carousel cards have no real prices. The endpoint is stateless (pure calculation), making it trivially testable and deployable. Impact is 10 because it is the explicit product requirement. Confidence drops slightly to 8 only because the catalog (ENG-1) must ship first — ordering dependency, not a technical risk. Ease is 7 because it requires the new module/route registration pattern already established for `directions/`, `locations/`, etc.

**Note on auth:** Recommend making this endpoint public (no Firebase JWT) per ENG-4 rationale. Riders should see prices before they are logged in — matches all competitor UX conventions.

---

### 4. ENG-5: `vehicleType` Filter on `GET /drivers/nearby` — ICE 5.04

**What:** Add optional `vehicleType` query param to `nearbyQuerySchema`. When provided, add a `WHERE vehicle_type = $1` clause to the PostGIS proximity query in `drivers.service.ts`.

**Why:** Once the booking carousel shows per-type fares, the mobile client needs to know if drivers of that type are actually nearby before the user books. Without this, a rider selects "car" in the carousel, books, and waits indefinitely because no cars are available. The column already exists on `drivers` — this is a pure query-layer addition. The PostGIS query pattern is already established. This feature directly reduces booking abandonment and cancellation from unmatched supply expectations.

---

### 5. PM-5: `availableNearby` Count in Estimate Response — ICE 2.94 (promoted for UX criticality)

**What:** Augment the `/rides/estimate` response with `availableNearby: number` per vehicle type by running a lightweight PostGIS count query (reusing the `drivers/nearby` infrastructure) scoped to the rider's pickup coordinates.

**Why promoted despite lower ICE score:** The score reflects higher implementation complexity (estimate endpoint must accept `pickupLat/Lng` in addition to `distanceM/durationS`), but the UX payoff is disproportionately high for Dakar specifically. InDrive and Yango both show availability counts in their vehicle selection UI. Riders who see "0 cars available" self-select to motos rather than booking and cancelling — this has a direct measurable impact on driver rating averages and platform reliability perception. Schedule for the sprint after the core catalog + estimate endpoint is live.

---

## Deprioritized — And Why

| Idea | Reason for deferral |
|------|---------------------|
| PM-4: Surge pricing per type | Requires pricing governance, ops tooling, rider communication strategy, and legal review for Senegal consumer protection. Technical complexity (surge multiplier stored where? Updated how?) is high. Ease=3 kills ICE. Revisit in Phase 6. |
| PD-2: "Best value" / "Fastest" badges | Pure mobile client logic once the estimate API returns data. Zero backend work needed. Belongs in the mobile booking-bottom-sheet ticket, not this backend ticket. |
| PD-3: Estimate refresh on map change | Mobile UX behavior (debounced API calls on drag). Not a backend feature — backend estimate endpoint is already stateless and handles this naturally. Move to mobile ticket. |
| PD-4: Vehicle type preference persistence | AsyncStorage/MMKV concern on mobile. Backend has no role here. Wrong ticket. |
| PD-5: Onboarding walk-through | Product marketing scope, not Phase 4 infrastructure. Requires design resources and app store update. Defer to Phase 5 growth sprint. |
| PM-2: Premium tier revenue segmentation | Valid but requires pricing research in the Dakar market before baking fare multipliers into the schema. Premature to implement without data. Defer until post-launch analytics exist. |
| PM-3: Fleet expansion self-service (admin UI) | The catalog table (ENG-1) already gives ops the DB-level tool. A full admin UI for vehicle type management is a separate admin product feature. Out of scope for this backend API ticket. |
| ENG-4: Public estimate endpoint | Included as a recommendation inside the estimate endpoint feature (Top 5 #3) rather than as a separate feature. Not a distinct deliverable. |

---

## Recommended Implementation Order

```
Sprint 1 (this ticket):
  1. vehicle_types table + Drizzle migration + seed data (3 types: moto, jakarta, voiture)
  2. calculateFare() pure utility extracted from rides.service.ts
  3. GET /vehicle-types (public, Redis-cached 5min TTL)
  4. GET /rides/estimate?distanceM=&durationS= → per-type array (public, no auth)
  5. vehicleType optional field on POST /rides + nullable DB column

Sprint 2 (follow-on):
  6. vehicleType filter on GET /drivers/nearby
  7. availableNearby count in estimate response (requires pickup coords)
```

**Seed data for Sprint 1 (matching Dakar fleet reality):**

| id | name | iconKey | fareBase | farePerKm | farePerMin |
|----|------|---------|----------|-----------|------------|
| uuid | Moto-taxi | `moto` | 300 XOF | 100 XOF | 15 XOF |
| uuid | Jakarta (3-roues) | `jakarta` | 400 XOF | 120 XOF | 18 XOF |
| uuid | Voiture | `car` | 700 XOF | 200 XOF | 35 XOF |

*Current hardcoded constants (FARE_BASE=500, FARE_PER_KM=150, FARE_PER_MIN=25) should be mapped to the "jakarta" type as the closest approximation, to maintain continuity for rides created before the migration.*
