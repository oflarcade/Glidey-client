---
created: "2026-04-19"
last_edited: "2026-04-19"
---
# Implementation Tracking: location-search

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-020 | DONE | Suggestion type: placeId replaces mapboxId, remove Mapbox fields, formattedAddress |
| T-021 | DONE | addressSearchService.autocomplete(): query<2 short-circuit; GET /locations/search?q= |
| T-022 | DONE | addressSearchService.placeDetail(): GET /locations/details?placeId= → ResolvedLocation |
| T-023 | DONE | addressSearchService.getHistory(): GET /locations/history → LocationHistoryEntry[] |
| T-024 | DONE | addressSearchService.saveHistory(): POST /locations/history; isDemoModeError helper |
| T-025 | DONE | hooks/useAutocompleteLocation.ts: autocomplete() + minLength=2, removed sessionToken/Mapbox fields |
| T-026 | DONE | LocationModal: suggestion press calls placeDetail(suggestion.placeId) → ResolvedLocation |
| T-027 | DONE | hooks/useLocationHistory.ts: React Query + getHistory(), maps LocationHistoryEntry→Location |
| T-028 | DONE | LocationModal: history entry press calls saveHistory({...location, name: location.name ?? ''}) |
| T-029 | DONE | hooks/useAddressSearch.ts: returns Suggestion[] from autocomplete() |
| T-030 | DONE | addressSearchService.ts: DEMO_SUGGESTIONS/DEMO_PLACES/DEMO_HISTORY Dakar fixtures |
| T-031 | DONE | services/index.ts: re-exports autocomplete, placeDetail, getHistory, saveHistory from addressSearchService |
