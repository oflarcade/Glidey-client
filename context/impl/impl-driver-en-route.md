---
Build site: context/plans/build-site-driver-en-route.md
created: "2026-04-22"
last_edited: "2026-04-22"
---

# Impl: Driver En-Route UX

| Task | Title | Status | Notes |
|------|-------|--------|-------|
| T-001 | Add pickup_en_route state branch to booking sheet | DONE | isEnRoute + transition selectors, auto-snap effect, enRoute state vars added to BookingSheet |
| T-002 | Demo-mode trigger | DONE | setTimeout 3s after hasArrived && isMatched → transition('pickup_en_route') |
| T-003 | Render en-route route polyline on map | DONE | Existing selectedDestination && routeLineCoords condition persists naturally |
| T-004 | Camera bounds-fit on pickup_en_route entry | DONE | animateToDestination effect in index.tsx on rideState === 'pickup_en_route' |
| T-005 | ETA countdown for pickup_en_route state | DONE | enRouteEtaS countdown seeded from durationS prop |
| T-006 | Polyline removal when leaving pickup_en_route | DONE | Existing condition clears naturally; enRoute state reset on !isEnRoute |
| T-007 | Mini strip — avatar, name, ETA display | DONE | enRouteMiniWrap render branch with avatar initials, name, ETA text |
| T-008 | Peek/full — driver card + large ETA block | DONE | Peek/full branch with matchedDriverRow + matchedEtaBlock |
| T-009 | Mini strip — progress bar with map-pin anchor | DONE | enRouteProgressRow: fill width = (durationS - enRouteEtaS)/durationS * 95%, map-pin Icon at end |
| T-010 | Peek/full — cancel control with two-step fee warning | DONE | Reuses cancelFeeWarningOpen → confirmCancelOpen two-step overlay |
