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

### Wave 5 — 2026-04-19
- T-025: useAutocompleteLocation rewrite — DONE. Files: hooks/useAutocompleteLocation.ts. Build P.
- T-026: LocationModal placeDetail wiring — DONE. Files: components/LocationModal/LocationModal.tsx. Build P.
- T-027: useLocationHistory React Query — DONE. Files: hooks/useLocationHistory.ts. Build P.
- T-028: LocationModal saveHistory wiring — DONE. Files: components/LocationModal/LocationModal.tsx. Build P.
- T-029: useAddressSearch rewrite — DONE. Files: hooks/useAddressSearch.ts. Build P.
- T-030: addressSearchService demo fallbacks — DONE. Files: services/addressSearchService.ts. Build P.
- T-031: services/index.ts new API surface exports — DONE. Files: services/index.ts. Build P.
- T-044: applyCoordFallback jitter synthesis — DONE. Files: services/driversService.ts. Build P.
- T-045: useNearbyDrivers applies applyCoordFallback — DONE. Files: hooks/useNearbyDrivers.ts. Build P.
- T-048: driversService DEMO_DRIVERS Dakar fixtures — DONE. Files: services/driversService.ts. Build P.
- T-064: index.tsx route polyline rendering — DONE. Files: app/(main)/index.tsx. Build P.
- T-065: routeDirectionsService DEMO_ROUTE — DONE. Files: services/routeDirectionsService.ts. Build P.
- T-081: useNearbyDrivers wired to getNearby+fallback — DONE. Files: hooks/useNearbyDrivers.ts. Build P.
- T-082: useRouteDirections wired to getRoute — DONE. Files: hooks/useRouteDirections.ts. Build P.
- T-080: TS strict sweep — DONE. Files: SuggestionRow.tsx, routeLineCoordinates.ts, mapCamera.ts, _layout.tsx. Build P.
- T-083: On-device smoke test — BLOCKED (manual, requires physical device). Next: manual QA.

---
# Loop Log — build-site-unified-booking-modal.md

### Wave 1 (Tier 0) — 2026-04-20
- T-120: sheetMode atom — DONE. Files: uiStore.ts, stores/index.ts. Build P. Next: T-122, T-124
- T-121: SearchModeContent extract — DONE. Files: BookingSheet/SearchModeContent.tsx, BookingSheet/index.ts. Build P, 0 sessionToken hits. Next: T-123

### Wave 2 (Tier 1) — 2026-04-20
- T-122: BookingModeContent wrap — DONE. Files: BookingSheet.tsx. Build P. Next: T-123
- T-123: Animated crossfade — DONE. Files: BookingSheet.tsx. modeProgress 260ms cubic, transitionComplete gates fare spinner. Build P. Next: T-125, T-126
- T-124: Caller migration — DONE. Files: app/(main)/index.tsx. Old API removed, sheetMode sole source. Build P. Next: T-125, T-126, T-127

### Wave 3 (Tier 2–4) — 2026-04-21
- T-125: Mini-snap body redesign — DONE. MINI_HEIGHT=100, condensed destination row (map-pin + name + chevron-right). Co-located in BookingSheet.tsx.
- T-126: Wire SearchModeContent — DONE. SearchModeContent rendered in search surface, onConfirmDestination prop lifted through BookingSheet; handleDestinationSelect in index.tsx calls setSheetMode('booking').
- T-127: Interactive destination row — DONE. Mini body is Pressable→setSheetMode('search'). BookingModeContent has onTapDestination→setSheetMode('search').
- T-128: Delete standalone LocationModal — DONE. LocationModal.tsx deleted; components/index.ts + LocationModal/index.ts updated to remove LocationModal export. DestinationTip, SearchInput, LocationHistoryList, LocationSearchList child components retained.
- T-129: Keyboard focus + layout — DONE. SearchModeContent has requestAnimationFrame focus on sheetMode→'search'. BookingSheet uses keyboardOffset Reanimated shared value (keyboard listeners + translateY offset).
- T-130: Gesture refinements — DONE (existing nearest-snap + velocity-dismiss logic already covers R2.1/R2.8/R2.9).
- T-131: sheetMode matching transition — DONE (fixed). index.tsx: rideState=searching+sheetMode=booking→matching; rideState=matched|idle+sheetMode=matching→idle. Also added mount auto-open in search mode.
- T-132: Integration audit — DONE. Grep for old API (isLocationModalOpen/openLocationModal/closeLocationModal/activeBottomSheet/BottomSheetType/<LocationModal) returns 0 hits in source files.
- T-133: Type-level enforcement — DONE. Removed unused pickupLabel/destLabel/truncate from BookingSheet. Pre-existing TS errors in auth+UI packages and old LocationModal child components not introduced by this refactor.

---
# Loop Log — build-site-trip-receipt-rating.md

Build site: context/plans/build-site-trip-receipt-rating.md

### Wave 1 — 2026-04-22
- T-001: TripReceipt component — DONE. Files: components/TripReceipt/TripReceipt.tsx, components/TripReceipt/index.ts, components/index.ts. Build P, Tests N/A. Next: T-002, T-003, T-004

### Wave 2 — 2026-04-22
- T-002: TripReceipt torn-edge SVG — DONE. Files: components/TripReceipt/TripReceipt.tsx. Build P.
- T-003: PDF stub link + Alert — DONE. Files: components/TripReceipt/TripReceipt.tsx. Build P.
- T-004: Receipt screen + rides history wiring — DONE. Files: app/(main)/trip-receipt/[rideId].tsx, app/(main)/rides.tsx, app/(main)/_layout.tsx. Build P. Next: T-005, T-006, T-007

### Wave 3 — 2026-04-22
- T-005: Auto-nav to receipt on completed — DONE. Files: app/(main)/index.tsx. Build P.
- T-006: History entry point — DONE (verified from T-004). No new files.
- T-007: RatingModal component — DONE. Files: components/RatingModal/RatingModal.tsx, index.ts. Build P. Next: T-008, T-009

### Wave 4 — 2026-04-22
- T-008: Rating modal auto-show logic — DONE. Files: app/(main)/trip-receipt/[rideId].tsx. Build P. 5 s timeout, clearTimeout on unmount, handleDismiss/handleSubmit with resetRideStore+navigate.
- T-009: Rating submission service — DONE. Files: services/ratingsService.ts, services/index.ts. Build P. Firebase callable stub with graceful not-found handling.
- T-010: Ride state reset — DONE. Files: (no new files). Verified: resetRideStore() called in handleDismiss/handleSubmit (completion flow only); index.tsx idle branch resets sheetMode→search.
