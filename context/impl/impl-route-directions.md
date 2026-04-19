---
created: "2026-04-19"
last_edited: "2026-04-19"
---
# Implementation Tracking: route-directions

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-060 | DONE | RouteInfo renamed to RouteDirectionsResponse; distanceM/durationS; RouteInfo kept as alias |
| T-061 | DONE | calculateFare: distanceM/durationS; SidebarContent: distanceM |
| T-062 | DONE | routeDirectionsService.getRoute(): GET /directions?originLat=&originLng=&destLat=&destLng= |
| T-063 | DONE | Throws HTTP_ERROR if result.polyline falsy after apiFetch |
| T-064 | TODO | |
| T-065 | TODO | |
