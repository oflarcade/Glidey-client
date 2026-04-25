# Firebase Clean-Slate Migration — Ideas & Priorities

**Feature:** Move Glidey client from legacy Firebase project (`auth-bf4f5`) to new GCP-hosted Firebase project.
**Date:** 2026-04-21
**Scope:** Firebase Auth (phone OTP, email/password, Google OAuth) + mobile config swap + backend service account update.
**Constraint:** Clean slate — no user data migration. All users re-register.

---

## Part 1 — Brainstorm

### Product Manager Perspective

**PM-1. Proactive in-app sunset notice (pre-migration)**
Push a banner or modal inside the current app build 7–10 days before the new build ships: "We're upgrading Glidey — you'll need to re-register once. Your ride history will reset." Sets expectations before the forced re-registration moment.

**PM-2. Post-migration welcome screen with re-registration incentive**
On first launch after the swap, show a dedicated "Fresh start" screen that briefly explains the upgrade and offers a small incentive (e.g., first ride discount code) to complete re-registration. Reduces drop-off at the new auth wall.

**PM-3. Frictionless phone-first re-registration (no password)**
Since phone OTP is the primary auth method for Senegalese users, make it the first and most prominent option on the new registration screen. Email/Google are secondary. Reduces cognitive load for the majority of users.

**PM-4. Social proof on re-registration screen**
Display a brief message like "Join 2,000+ riders already on the new Glidey." (use realistic number). Normalises the fresh start and signals the platform is healthy and growing.

**PM-5. Ride history soft-preservation notice**
Even though backend rides data stays in PostgreSQL, users don't lose historical data at the DB level — only the auth UID changes. Once re-registered, link new UID to old ride records server-side via phone number as the stable identifier. Communicate this: "Your rides history will be restored once you log in with the same phone number." Reduces the perceived loss of re-registration.

---

### Product Designer Perspective

**DES-1. "New chapter" narrative — not an error state**
Frame the re-registration visually as a product upgrade, not a logout/error. Use fresh branding copy ("Glidey just got better"), a progress-feel illustration, and the same colour palette — not a generic error/timeout screen. Make the forced re-register feel intentional.

**DES-2. Pre-fill phone number from device (if previously stored)**
If the user's phone number is stored in AsyncStorage from the old session, pre-populate the phone field on the new login screen. One-tap to trigger OTP — near-zero additional friction beyond what they already experienced at first registration.

**DES-3. Biometric fast-path after re-registration**
Immediately after completing re-registration, prompt to enable Face ID / fingerprint for future logins. Converts a frustrating moment into a UX upgrade — users end up with a faster login than they had before.

**DES-4. Animated OTP auto-advance**
On the SMS OTP screen (already in `(auth)/verify-sms`), implement auto-read of the incoming SMS on Android (SMS Retriever API) and auto-advance between digit inputs. Reduces manual OTP entry friction which is particularly painful on Senegalese carrier networks with variable SMS delivery speed.

**DES-5. Persistent loading state with network-aware retry**
During Firebase Auth initialisation on app launch (post-migration), show a branded loading screen (already exists as `SplashScreen` in `@rentascooter/ui`) rather than a blank or error screen if the Firebase project is momentarily unreachable. Add a retry button with a clear "Check connection" message in French (primary locale). Prevents users from assuming the app is broken during the transition window.

---

### Engineer Perspective

**ENG-1. Feature-flagged Firebase config swap**
Introduce a remote-config or env-flag approach: `EXPO_PUBLIC_FIREBASE_ENV=new` that switches `config/firebase.ts` between the old and new project config objects. Allows a staged rollout — QA and internal users on new Firebase, public users on old until confidence is high. Zero code duplication; a single build can target either project.

**ENG-2. Phone number as stable cross-UID identity anchor**
On re-registration, the backend `ensureClientProfile` function should check if a `users` row already exists with the incoming verified phone number (sourced from Firebase Auth's `phone_number` claim). If yes, re-link the existing PostgreSQL row to the new Firebase UID rather than creating a duplicate. Preserves ride history, preferences, and driver-facing profile data silently without any user-facing migration UX.

**ENG-3. Parallel backend service account rollout (zero-downtime)**
Before cutting over the mobile app, add the new GCP project's service account credentials to the VM alongside the old ones. Update `FIREBASE_PROJECT_ID` in the PM2 env, then `pm2 restart --update-env`. Keep the old service account credentials available for a 48-hour window in case rollback is needed. Only remove old credentials after the new mobile build has cleared QA.

**ENG-4. `google-services.json` + `GoogleService-Info.plist` via EAS secrets**
Instead of committing the new project's native Firebase config files to the repo, inject them at EAS build time via `eas secret`. This avoids leaking the new project's API key and prevents the old config files from accidentally remaining in git. Requires adding `eas-build-pre-install` hook to copy the secret-injected files into the correct paths before the native build.

**ENG-5. Auth state hydration guard on app launch**
Add an explicit `auth.currentUser` readiness check in `app/_layout.tsx` before the router redirect fires. Firebase Auth v11 is async — if the app redirects to `(main)/` before the new project's auth SDK has resolved the current user (null on clean slate), users see a flicker into main and then get ejected to auth. A simple `authReady` boolean gate in `useAuthStore` (already partially present) prevents this race condition on the new project where no persisted session exists.

---

## Part 2 — ICE Scoring & Prioritisation

ICE = (Impact + Confidence + Ease) / 3, each scored 1–10.

| # | Idea | Impact | Confidence | Ease | ICE Score |
|---|------|--------|------------|------|-----------|
| 1 | ENG-2: Phone as stable identity anchor | 9 | 9 | 7 | **8.3** |
| 2 | ENG-5: Auth state hydration guard | 8 | 10 | 9 | **9.0** |
| 3 | ENG-3: Parallel service account rollout | 8 | 10 | 8 | **8.7** |
| 4 | DES-2: Pre-fill phone from AsyncStorage | 7 | 8 | 8 | **7.7** |
| 5 | PM-5: Ride history restoration via phone | 8 | 7 | 6 | **7.0** |

### Top 5 Ranked by ICE

---

**Rank 1 — ENG-5: Auth state hydration guard (ICE 9.0)**

Impact 8 | Confidence 10 | Ease 9

The single highest-risk UX bug in the migration. On a clean-slate Firebase project, every existing device launches with no persisted auth session. If `_layout.tsx` redirects before Firebase resolves `auth.currentUser`, users flicker into main and get ejected. This is a one-line boolean guard that is trivially easy to implement and near-certain to prevent a very visible regression. Must ship before the new build goes to any users.

Implementation note: Gate the Expo Router redirect on `authStore.authReady === true`. Set `authReady = true` inside the `onAuthStateChanged` callback regardless of whether `user` is null or populated.

---

**Rank 2 — ENG-3: Parallel service account rollout / zero-downtime backend cut-over (ICE 8.7)**

Impact 8 | Confidence 10 | Ease 8

The backend VM token verification must be live on the new Firebase project before any mobile user can successfully make an authenticated API call. Staging the service account update in parallel (new credentials added, old preserved for 48 hours) eliminates the hard dependency between "mobile app ships" and "backend is reconfigured." Engineers can validate backend auth independently of the mobile release, then coordinate the cut-over. High confidence because it is entirely within the team's control on the VM.

Implementation note: On the VM at `/opt/EMIN/glidey/RentAScooter-Backend-Monolith/`, add the new `GOOGLE_APPLICATION_CREDENTIALS` path and `FIREBASE_PROJECT_ID` to the PM2 ecosystem config. Run `pm2 restart --update-env`. Test token verification with a curl call using a test Firebase ID token from the new project before shipping the mobile build.

---

**Rank 3 — ENG-2: Phone number as stable cross-UID identity anchor (ICE 8.3)**

Impact 9 | Confidence 9 | Ease 7

The most impactful single technical decision in the migration. If `ensureClientProfile` creates a new PostgreSQL row for every new Firebase UID without checking for an existing phone number, every user loses their ride history, saved addresses, and driver reputation data. Since Firebase Auth returns a verified `phone_number` claim after phone OTP, the backend can use this as a stable key to re-link the existing row to the new UID. This makes the clean-slate auth migration invisible to the user from a data perspective.

Implementation note: In `ensureClientProfile` (backend), before `INSERT`, run `SELECT id FROM users WHERE phone = $1` using the verified phone claim. If found, `UPDATE users SET firebase_uid = $newUid WHERE phone = $1`. If not found, `INSERT`. Confidence is 9 because phone numbers are verified by Firebase — they cannot be spoofed. Ease is 7 because it requires a backend code change and careful handling of users who registered with email-only (no phone claim).

---

**Rank 4 — DES-2: Pre-fill phone number from AsyncStorage (ICE 7.7)**

Impact 7 | Confidence 8 | Ease 8

The old auth session stores the user's phone number in the persisted `useAuthStore` (via AsyncStorage). Even after the Firebase project swap clears the auth token, the Zustand store's persisted state may still contain `user.phoneNumber`. Reading this on the new login screen and pre-filling the phone input collapses re-registration to: see pre-filled number → tap "Send OTP" → enter 6 digits → done. For Senegalese users on SONATEL/Free data with variable SMS latency, removing any extra taps matters. Confidence is 8 not 10 because AsyncStorage state may be cleared by OS on app update depending on build configuration.

Implementation note: In `(auth)/login.tsx`, on mount, read `useAuthStore.getState().user?.phoneNumber` and pass as `defaultValue` to the phone input. No network call required.

---

**Rank 5 — PM-5 + ENG-2 composite: Communicate ride history restoration (ICE 7.0)**

Impact 8 | Confidence 7 | Ease 6

Once ENG-2 (phone as identity anchor) is implemented, the user's ride history is actually preserved. But users do not know this — they will assume everything is gone. A simple in-app message on the post-OTP "welcome back" screen ("Your ride history has been restored.") converts a moment of anxiety into a moment of delight. Confidence is 7 (not higher) because it depends on ENG-2 shipping correctly and the phone-match logic covering all edge cases. Ease is 6 because it requires coordinating the backend behaviour with a specific in-app copy change.

Implementation note: After `ensureClientProfile` resolves, the API response can include a boolean `isReturningUser: true`. The app can use this flag to show a one-time "Welcome back" toast or banner rather than the generic "Account created" message.

---

## Deprioritised Ideas & Rationale

| Idea | Why Deprioritised |
|------|-------------------|
| PM-1: Proactive in-app sunset notice | Requires shipping an intermediate build to the old Firebase project just to display a banner. Given small Senegal user base and clean-slate approach, coordination cost exceeds benefit. Users will see the new onboarding regardless. |
| PM-2: Re-registration incentive / discount | No discount/promo code system exists in the backend. Building it for this migration creates scope creep. Can be revisited post-launch as a retention feature. |
| PM-3: Phone-first registration ordering | Already the default in the existing `(auth)/login.tsx` UI. No new work needed; this is the status quo. Not deprioritised as wrong — just already done. |
| PM-4: Social proof on re-registration screen | Low confidence on the right number to display, and displaying an inaccurate number creates trust risk. Beneficial in a growth phase but premature for a migration moment. |
| DES-1: "New chapter" narrative branding | Good UX intent but requires design asset production (illustration, copy review in French). High Ease cost relative to the marginal impact given most users will move through re-registration quickly. Can ship in a subsequent sprint. |
| DES-3: Biometric fast-path post re-registration | Expo's `expo-local-authentication` is not currently integrated. Adding a new native module during a migration window increases risk. Good backlog item for post-migration polish. |
| DES-4: SMS auto-read (Android SMS Retriever) | Requires `react-native-sms-retriever` or equivalent native module, plus backend hash computation for the app signature in the OTP SMS. High engineering cost, and Senegalese carriers have inconsistent support for the SMS Retriever protocol. High value long-term, but wrong sprint. |
| DES-5: Persistent loading with network-aware retry | Partially covered by existing `SplashScreen` component. A full network-aware retry with branded UI is valuable but lower priority than auth correctness (ENG-5 covers the race condition this addresses partially). |
| ENG-1: Feature-flagged Firebase config swap | Valuable for large user bases doing staged rollouts. For Glidey's current scale and clean-slate constraint, the added complexity of a remote config system introduces more moving parts than it eliminates. A single coordinated build cut-over is simpler and sufficient. |
| ENG-4: `google-services.json` via EAS secrets | Correct long-term security practice, but the migration is already the right moment to set this up. Deprioritised only in the sense that it is a parallel infrastructure task, not a top-5 product/UX priority. Should be done as part of the migration without needing to rank it as a feature. |

---

## Summary for Next Steps

The migration's critical path in order:

1. **ENG-3** — Update backend VM service account + `FIREBASE_PROJECT_ID` first, validate with a test token.
2. **ENG-5** — Add `authReady` guard to `app/_layout.tsx` before any mobile build ships.
3. **ENG-2** — Update `ensureClientProfile` to use phone as the stable re-link key.
4. **DES-2** — Pre-fill phone from AsyncStorage on the login screen.
5. **PM-5 composite** — Add `isReturningUser` flag to the profile bootstrap response and display "ride history restored" copy.

All five can be sequenced within a single sprint. The mobile config swap (`config/firebase.ts`, `google-services.json`, `GoogleService-Info.plist`) is a prerequisite for all of the above and should be treated as a blocking infrastructure ticket separate from these feature priorities.
