---
created: "2026-04-21"
last_edited: "2026-04-22"
---

# Cavekit Overview

## Project
GLIDEY — Scooter ride-booking mobile app (client/rider side) for Senegal

## Domain Index — Firebase Clean-Slate Migration

| Domain | File | Summary | Status |
|--------|------|---------|--------|
| Firebase Project Infrastructure | cavekit-firebase-project-infra.md | Create and configure the new Firebase project (providers, SHA-1, service account, native config artifacts) in the same GCP project as the backend VM | Drafted |
| Client Config Migration | cavekit-client-config-migration.md | Re-point the mobile client at the new Firebase project; add auth hydration guard, stale-session fallback, phone pre-fill; excise dead Firestore/Cloud Functions code | Drafted |
| Backend Auth Wiring | cavekit-backend-auth-wiring.md | Configure the backend VM with the new service account, verify tokens from the new project, anchor client-profile bootstrap on verified phone number with isReturningUser response | Drafted |

## Domain Index — Client UI Completion

| Domain | File | Summary | Status |
|--------|------|---------|--------|
| Driver Reveal UI | cavekit-driver-reveal-ui.md | Matched-state content inside the booking modal: driver info card, ETA countdown, camera fly-to pickup, haptic feedback. GAP: push notifications. | Drafted |
| Matched Arrival UX | cavekit-matched-arrival-ux.md | Mini snap for matched modal, cancellation fee warning (two-step), driver arrived state (ETA=0 latch, no cancel). | Drafted |
| Driver En-Route UX | cavekit-driver-en-route-ux.md | pickup_en_route state: route polyline (pickup→destination), sheet auto-snaps to mini, progress bar with map-pin anchor, ETA countdown to destination, cancel (fee warning). GAP: production WS trigger. | Drafted |
| Trip Receipt Component | cavekit-trip-receipt.md | Standalone, shareable receipt component: torn-edge paper visual, driver header, pickup/drop-off/noted sections, trip fare breakdown, "Download PDF" stub. Props-driven from `Ride`, no navigation or network. | Drafted |
| Post-Ride Rating Flow | cavekit-post-ride-rating.md | Auto-navigation to receipt screen on `completed`, 5 s delayed rating modal (dismissible), 1–5 star + optional comment (≤280 chars), submission with retry on failure, ride history entry point (read-only), rideStore reset back to idle/search. | Drafted |

## Cross-Reference Map

| Domain A | Interacts With | Interaction Type |
|----------|---------------|------------------|
| cavekit-firebase-project-infra.md | cavekit-client-config-migration.md | Produces native config artifacts (R5) and project identifiers consumed by client config (R1, R2) |
| cavekit-firebase-project-infra.md | cavekit-backend-auth-wiring.md | Produces service account credential (R4) consumed by backend runtime (R1) |
| cavekit-client-config-migration.md | cavekit-backend-auth-wiring.md | Client tokens (R1 audience) must match the project the backend verifies against (R2); end-to-end smoke (backend R5) requires mobile shipping the new config |
| cavekit-trip-receipt.md | cavekit-post-ride-rating.md | Trip receipt component (R1–R4) is rendered by the receipt screen owned by the post-ride flow (R1, R6) |
| cavekit-post-ride-rating.md | cavekit-trip-receipt.md | Post-ride flow depends on the trip receipt component being a standalone props-driven unit (R2) so the same screen serves both completion and history entry points |

## Dependency Graph

```
cavekit-firebase-project-infra
         |
         |--------------------------------.
         v                                v
cavekit-client-config-migration   cavekit-backend-auth-wiring
         \                                /
          \______________________________/
                         |
                         v
               end-to-end smoke test
              (backend R5 consumes both)
```

- `firebase-project-infra` has no upstream dependencies and must be completed first.
- `client-config-migration` and `backend-auth-wiring` can proceed in parallel once `firebase-project-infra` R4 and R5 are satisfied.
- Final verification (backend R5) requires both downstream domains to be complete.

## Coverage Summary

- Total domains: 3
- Total requirements: 16 (infra 5, client 6, backend 5)
- Total acceptance criteria: 82 (infra 24, client 31, backend 27)

## Scope Boundaries (Migration-Wide)

Explicitly excluded across the entire migration:
- Firestore, Cloud Functions, FCM, App Check, Analytics, Crashlytics, Remote Config, Performance Monitoring
- User or data migration from the legacy Firebase project
- Multi-environment (staging/prod) Firebase project separation
- App Store / Play Store release activities
- Any backend endpoints beyond client-profile bootstrap
- Visual redesign of auth screens
