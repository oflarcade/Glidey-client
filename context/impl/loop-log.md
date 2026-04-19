---
created: "2026-04-19"
last_edited: "2026-04-19"
---
# Loop Log — build-site.md

Build site: context/plans/build-site.md

### Wave 1 — 2026-04-19
- T-001: @rentascooter/api skeleton + EXPO_PUBLIC_API_URL — DONE. Files: packages/api/{package.json,tsconfig.json,src/*}, package.json, metro.config.js, tsconfig.json, .env.example. Build P. Next: T-002, T-004, T-020, T-040, T-060
- T-010: iOS ATS + Android cleartext for 34.140.138.4 — DONE. Files: app.config.js. Build P. Next: T-009

### Wave 2 — 2026-04-19
- T-002: apiFetch GET/POST/PATCH + 10s AbortController timeout — DONE. Files: packages/api/src/client.ts. Build P. Next: T-003
- T-004: ApiError type + normalizeError — DONE. Files: packages/api/src/errors.ts. Build P. Next: T-005
- T-020: Suggestion type updated (placeId, formattedAddress) — DONE. Files: packages/shared/src/types/index.ts. Build P. Next: T-021
- T-040: NearbyDriver flat lat/lng + distanceM — DONE. Files: packages/shared/src/types/index.ts. Build P. Next: T-041
- T-060: RouteDirectionsResponse distanceM/durationS; RouteInfo alias kept — DONE. Files: packages/shared/src/types/index.ts. Build P. Next: T-061

### Wave 3 — 2026-04-19
- T-003: auth.ts setTokenProvider/resolveToken — DONE. Files: packages/api/src/auth.ts. Build P. Next: T-005
- T-005: authedFetch token injection + ApiError surfacing — DONE. Files: packages/api/src/client.ts. Build P. Next: T-006
- T-006: refresh.ts single-flight coordinator — DONE. Files: packages/api/src/refresh.ts. Build P. Next: T-007
- T-007: 401 retry-once in authedFetch — DONE. Files: packages/api/src/client.ts. Build P. Next: T-008
- T-008: DEMO_MODE_ERROR sentinel in apiFetch — DONE. Files: packages/api/src/client.ts. Build P. Next: T-030,T-031,T-048,T-065
- T-009: HTTPS migration removal notes in app.config.js — DONE. Files: app.config.js. Build P.

### Wave 4 — 2026-04-19
- T-021: autocomplete() query<2 short-circuit; GET /locations/search — DONE. Files: services/addressSearchService.ts. Build P. Next: T-025
- T-022: placeDetail() GET /locations/details — DONE. Files: services/addressSearchService.ts. Build P. Next: T-026
- T-023: getHistory() GET /locations/history — DONE. Files: services/addressSearchService.ts. Build P. Next: T-024,T-027
- T-024: saveHistory() POST /locations/history — DONE. Files: services/addressSearchService.ts. Build P. Next: T-027
- T-041: driversService.getNearby() GET /drivers/nearby — DONE. Files: services/driversService.ts. Build P. Next: T-042,T-044
- T-042: ApiError surfacing via authedFetch — DONE (covered by T-041). Build P.
- T-043: cavekit-nearby-drivers.md R3 gap documented — DONE. Files: context/kits/cavekit-nearby-drivers.md. Build P. Next: T-044
- T-046: DriverMarkers flat lat/lng + hasValidCoords — DONE. Files: components/DriverMarkers.tsx. Build P. Next: T-047
- T-047: useNearbyDrivers distanceM + flat coords; SidebarContent distanceM — DONE. Files: hooks/useNearbyDrivers.ts, components/Sidebar/SidebarContent.tsx. Build P. Next: T-048
- T-061: calculateFare + SidebarContent distanceM/durationS — DONE. Files: packages/shared/src/utils/index.ts, components/Sidebar/SidebarContent.tsx. Build P. Next: T-062
- T-062: getRoute() GET /directions — DONE. Files: services/routeDirectionsService.ts. Build P. Next: T-063
- T-063: polyline validation throws HTTP_ERROR — DONE. Files: services/routeDirectionsService.ts. Build P. Next: T-064
