---
created: "2026-04-20"
last_edited: "2026-04-20"
---
# Implementation Tracking: vehicle-catalog

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-002 | DONE | src/shared/db/schema/vehicle-types.ts + drizzle/0002_add_vehicle_types.sql |
| T-003 | DONE | drizzle/0003_seed_vehicle_types.sql — Moto-taxi/Jakarta/Voiture fixed UUIDs |
| T-004 | DONE | src/shared/fare/calculateFare.ts — pure function, 5 vitest tests pass |
| T-010 | DONE | services/bookingService.ts:getVehicleTypes — GET /vehicle-types, returns VehicleType[]; demo fallback: DEMO_VEHICLE_TYPES (3 entries) |
| T-011 | DONE | hooks/useVehicleTypes.ts — React Query wrapper around getVehicleTypes(); vehicleTypesKeys cache key; exported from hooks/index.ts |
| T-072 | DONE | bookingService.ts:15-19 — DEMO_VEHICLE_TYPES satisfies VehicleType[] shape (id/name/iconKey); getVehicleTypes demo path returns it on DEMO_MODE_ERROR |
| T-073 | DONE | packages/shared/src/types/index.ts:317-325 — VehicleType and VehicleTypesResponse defined; consumed by bookingService.ts and useVehicleTypes.ts |
