# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GLIDEY — a scooter ride-booking mobile app (client/rider side) for Senegal. Built with Expo 54, React Native 0.81, React 19, TypeScript strict mode. Backend is Firebase Cloud Functions (callable). Maps powered by Mapbox.

## Commands

```bash
# Development
yarn dev                      # Start Expo dev server
yarn dev:client               # Start with custom dev client
yarn ios                      # Run on iOS simulator
yarn ios:device               # Run on physical iOS device
yarn android                  # Run on Android
yarn android:clean            # Clean prebuild + run Android

# Building
yarn build:dev:ios            # EAS development build (iOS)
yarn build:dev:android        # EAS development build (Android)
yarn build:preview:ios        # EAS preview build (iOS)
yarn build:preview:android    # EAS preview APK (Android)

# Other
yarn lint                     # ESLint
yarn prebuild:clean           # Clean native dirs and regenerate
yarn clean                    # Remove .expo, ios, android, node_modules
```

No test runner is currently configured.

## Architecture

### Monorepo with Local Packages

Five `@rentascooter/*` packages in `packages/`, linked via `file:` in package.json and resolved in `metro.config.js` + `tsconfig.json` paths:

- **`@rentascooter/auth`** — Firebase Auth (email, phone OTP, Google OAuth), `useAuthStore` (Zustand, persisted), `useAuth`/`usePhoneAuth`/`useGoogleAuth` hooks, `UserProvider` context, `initializeFirebase()`
- **`@rentascooter/shared`** — Shared TypeScript types (`Ride`, `Location`, `Driver`, `NearbyDriver`, `GeoPoint`, etc.), Zustand stores (`useUIStore`, `useAppStore`, `useLocationStore`)
- **`@rentascooter/ui`** — Reusable component library (Button, Input, Card, map pins, OTP input, SplashScreen, etc.), theme system (`colors`, `spacing`, `typography`, `shadows`), font loading (`useFonts`)
- **`@rentascooter/i18n`** — French/English translations via `i18n-js`, `useTranslation()` hook, device locale detection with AsyncStorage persistence
- **`@rentascooter/onboarding`** — 4-slide onboarding flow component

### Routing (Expo Router, file-based)

```
app/
├── _layout.tsx          # Root: Firebase init, Mapbox init, providers (QueryClient, GestureHandler, SafeArea)
├── index.tsx            # Entry redirect → (splash)
├── (splash)/            # Animated custom splash screen
├── (onboarding)/        # 4-slide tutorial (shown once)
├── (auth)/              # login, register, verify-phone, verify-sms
└── (main)/
    ├── _layout.tsx      # UserProvider wrapper, sidebar at layout level
    ├── index.tsx        # Full-screen Mapbox map (primary screen)
    ├── rides.tsx        # Ride history (modal)
    ├── profile.tsx      # User profile (modal)
    ├── notifications.tsx # Push notifications (modal)
    └── settings.tsx     # App settings (modal)
```

Flow: Launch → Splash → Onboarding (if first time) → Auth (if not logged in) → Main map. Secondary screens are presented as modals from the main stack.

### State Management

- **Zustand** for client state with `persist` middleware (AsyncStorage):
  - `useAuthStore` — user, profile, auth status, phone OTP state
  - `useUIStore` — sidebar open, location modal open, active bottom sheet (NOT persisted)
  - `useAppStore` — onboarding seen, app ready, splash complete
  - `useLocationStore` — permission status, current/last-known location
- **React Query** (`@tanstack/react-query`) for server state — nearby drivers, ride history, location search

### Services Layer (`services/`)

All services call Firebase Cloud Functions via `httpsCallable()`. Auth is implicit via Firebase token.

- `driversService` — `getNearbyDriversForMap()` (max 20 drivers, configurable radius)
- `ridesService` — `getRideHistory(limit)`
- `routeDirectionsService` — route polylines between two locations
- `addressSearchService` — Mapbox Search Box autocomplete, location history (AsyncStorage)

### Custom Hooks (`hooks/`)

React Query wrappers: `useNearbyDrivers`, `useRideHistory`, `useRouteDirections`, `useAddressSearch`, `useAutocompleteLocation`, `useLocationHistory`

### App-Level Components (`components/`)

- `LocationModal/` — Bottom sheet for destination search with autocomplete, history, suggestions
- `Sidebar/` — Drawer menu controlled by `useUIStore().isSidebarOpen`
- `DriverMarkers` — Map markers for nearby drivers
- `LanguagePicker/` — Language selection component

## Language Policy

All code comments, commit messages, and technical documentation must be in **English**. This is a board-level directive (OFL-49).

The only exceptions are content that must be in another language for business reasons:
- User-facing strings localized for the Senegalese market (French/Wolof) via `@rentascooter/i18n`
- Geographic proper nouns in demo/mock data (e.g. Dakar place names)

## Key Conventions

- **Imports**: Use `@rentascooter/*` for package imports, `@/*` for app-root imports. Barrel exports via `index.ts`.
- **SVGs**: Imported as React components via `react-native-svg-transformer` (configured in metro.config.js). SVG assets live in `packages/ui/src/assets/icons/`.
- **i18n**: All user-facing strings use translation keys from `@rentascooter/i18n`. Supported locales: `fr`, `en`.
- **Currency**: XOF (West African CFA franc). Target market: Senegal only.
- **Demo mode**: `EXPO_PUBLIC_USE_DEMO=true` enables mock drivers and test auth. Test phone: `+221775551234`, OTP: `123456`. Dev/preview EAS builds use demo; production does not.
- **Theme**: Use `colors`, `spacing`, `typography`, `shadows` from `@rentascooter/ui/theme`. Legacy `colors` export still widely used; prefer `lightColors`/`darkColors` for new code.
- **Firebase config**: `config/firebase.ts`. Mapbox token via `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` env var or in config file.
- **Reanimated**: `react-native-reanimated/plugin` must be listed **last** in babel.config.js plugins.
- **Push notifications**: Currently disabled (entitlement stripped via `plugins/withoutPushEntitlement.js`, expo-notifications plugin commented out in app.config.js).

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Glidey-client** (3845 symbols, 5475 relationships, 205 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Glidey-client/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Glidey-client/clusters` | All functional areas |
| `gitnexus://repo/Glidey-client/processes` | All execution flows |
| `gitnexus://repo/Glidey-client/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
