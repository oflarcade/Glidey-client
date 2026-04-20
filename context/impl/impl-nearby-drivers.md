---
created: "2026-04-19"
last_edited: "2026-04-19"
---
# Implementation Tracking: nearby-drivers

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-040 | DONE | NearbyDriver type: flat lat/lng, name, vehiclePlate, distanceM; removed location/vehicleColor |
| T-041 | DONE | driversService.getNearby(): GET /drivers/nearby?lat=&lng=&radius=; default 3000m |
| T-042 | DONE | authedFetch surfaces all backend errors as ApiError; no extra wrapper needed |
| T-043 | DONE | cavekit-nearby-drivers.md changelog: R3 gap documented, R4 fallback stopgap, BE fix needed |
| T-044 | DONE | driversService.applyCoordFallback(): jitter from distanceM + driverBearing(id hash); marked TEMP |
| T-045 | DONE | useNearbyDrivers.ts: applies applyCoordFallback per driver after getNearby() |
| T-046 | DONE | DriverMarkers.tsx: hasValidCoords(), __DEV__ warning, flat latitude/longitude |
| T-047 | DONE | useNearbyDrivers.ts: distanceM, flat coords; SidebarContent.tsx: distanceM |
| T-048 | DONE | driversService.ts: DEMO_DRIVERS 6 Dakar fixtures; catch DEMO_MODE_ERROR in getNearby |
| T-081 | DONE | useNearbyDrivers hook wired to getNearby() with applyCoordFallback applied per driver |
