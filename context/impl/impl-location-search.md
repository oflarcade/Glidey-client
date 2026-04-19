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
| T-025 | TODO | |
| T-026 | TODO | |
| T-027 | TODO | |
| T-028 | TODO | |
| T-029 | TODO | |
| T-030 | TODO | |
| T-031 | TODO | |
