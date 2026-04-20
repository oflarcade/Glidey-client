---
created: "2026-04-20"
last_edited: "2026-04-20"
---
# Implementation Tracking: fare-estimation-api

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-005 | DONE | src/modules/fare/fare.schemas.ts — Zod fareEstimateQuerySchema (distanceM, durationS nonneg int) |
| T-006 | DONE | src/modules/fare/fare.routes.ts + fare.module.ts — GET /fare/estimate public, stub returns {estimates:[]} |
| T-012 | DONE | bookingService.ts:estimateFare — GET /fare/estimate?distanceM=&durationS=, returns FareEstimateResponse; demo path: demoFare() with per-type estimates |
| T-013 | DONE | useBooking.ts:46-79 — useEffect([distanceM, durationS]) auto-fetches fare; clears on 0 values; cancellation pattern with cancelled flag; auto-selects first vehicleTypeId |
| T-074 | DONE | bookingService.ts:21-31 — demoFare(req: FareEstimateRequest): FareEstimateResponse — satisfies FareEstimateResponse type; per-type fare calculated from distanceM/durationS |
