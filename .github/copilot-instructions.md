# Copilot Instructions

This file provides guidance to GitHub Copilot when working with this repository.

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

## Key Conventions

### Import Paths

- Use `@rentascooter/*` for package imports (e.g., `@rentascooter/ui`, `@rentascooter/auth`)
- Use `@/*` for app-root imports (e.g., `@/components`, `@/services`)
- All packages export via barrel exports (`index.ts`)

### SVG Assets

- SVGs imported as React components via `react-native-svg-transformer`
- SVG assets live in `packages/ui/src/assets/icons/`
- Configured in `metro.config.js` to treat `.svg` as source files, not static assets

### Internationalization

- All user-facing strings must use translation keys from `@rentascooter/i18n`
- Supported locales: `fr` (French), `en` (English)
- Use `useTranslation()` hook to access translations

### Styling & Theming

- Import `colors`, `spacing`, `typography`, `shadows` from `@rentascooter/ui/theme`
- Legacy `colors` export still widely used; prefer `lightColors`/`darkColors` for new code
- Currency: XOF (West African CFA franc). Target market: Senegal only.

### Configuration

- **Firebase**: Config in `config/firebase.ts`
- **Mapbox**: Token via `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` env var
- **Demo mode**: `EXPO_PUBLIC_USE_DEMO=true` enables mock drivers and test auth. Test phone: `+221775551234`, OTP: `123456`. Dev/preview EAS builds use demo; production does not.

### Build Configuration

- **Babel**: `react-native-reanimated/plugin` must be listed **last** in `babel.config.js` plugins
- **Push notifications**: Currently disabled (entitlement stripped via `plugins/withoutPushEntitlement.js`, expo-notifications plugin commented out in `app.config.js`)
- **Native dependencies**: Changes to native packages require `yarn prebuild:clean` to regenerate native directories

## Project-Specific Notes

- TypeScript strict mode is enabled
- No test runner currently configured
- Target platform: iOS and Android (Senegal market)
- Backend: Firebase Cloud Functions (callable functions, not REST)
