---
created: "2026-04-21"
last_edited: "2026-04-21"
---

# Cavekit: Client Config Migration

## Scope
Covers all mobile application changes required to point the client at the newly provisioned Firebase project and to correct auth-state handling so that a clean-slate migration does not trap users on a broken redirect or reference the abandoned project. This includes credential replacement, native config wiring, dead-code excision of unused Firebase services, and auth lifecycle correctness (hydration, stale-session fallback, phone pre-fill). No infrastructure provisioning and no backend work is in scope.

## Requirements

### R1: Firebase Client Configuration Points to New Project
**Description:** Every Firebase client identifier baked into the mobile app — project ID, API key, app IDs, sender ID, and any auth-domain value — references the new Firebase project. No client-side reference to the legacy project survives.
**Acceptance Criteria:**
- [ ] The client Firebase config values at runtime match the new project's identifiers
- [ ] No occurrence of the legacy project ID, legacy API key, legacy app ID, or legacy sender ID remains anywhere in mobile source, configuration, or native config artifacts
- [ ] A Firebase Auth session initialized from a fresh install of the app issues tokens whose `aud` claim equals the new project ID
- [ ] Launching the app from a clean clone after dependency install produces no startup error related to Firebase project-ID mismatch or missing config
**Dependencies:** cavekit-firebase-project-infra.md R1, R5

### R2: Native Config Files Wired Without Being Committed
**Description:** The Android and iOS native config artifacts produced by the infra domain are injected into the build pipeline such that development, preview, and production builds for both platforms find them at the path/location the Firebase SDK expects — but the artifacts themselves are not checked into version control.
**Acceptance Criteria:**
- [ ] A build for Android completes successfully and Firebase Auth initializes on device without missing-config errors
- [ ] A build for iOS completes successfully and Firebase Auth initializes on device without missing-config errors
- [ ] The repository's version-control ignore rules exclude both native config artifacts
- [ ] Neither native config artifact is present in the committed tree of the default branch
- [ ] A clean clone followed by the documented build procedure produces a working build when the artifacts are supplied via the documented injection mechanism
**Dependencies:** cavekit-firebase-project-infra.md R5

### R3: Dead Firebase Code Removed
**Description:** Firebase features that are explicitly out of scope for this migration (Firestore, Cloud Functions) are no longer initialized or referenced by the auth package, and the legacy OTP code path that routed phone auth through Cloud Functions is deleted from the phone-auth hook. The remaining auth surface uses only the Firebase Auth SDK.
**Acceptance Criteria:**
- [ ] The auth package no longer initializes a Firestore instance at module load
- [ ] The auth package no longer initializes or exports a Cloud Functions client at module load
- [ ] The phone-auth hook contains no branch that sends OTP requests via a Cloud Functions callable (no code path that fires when a native app-verifier is absent)
- [ ] The phone-auth hook contains no reference to a legacy `verificationId` sentinel value that indicated the Cloud Functions path
- [ ] A static scan of the mobile source for Firestore and Cloud Functions API surface returns no active caller sites (imports present only if required by the Firebase SDK itself are acceptable provided no runtime call is made)
- [ ] Phone OTP request and verification succeed end-to-end on a physical device using only the Firebase Auth SDK's native phone verification
**Dependencies:** R1

### R4: Auth Hydration Guard Prevents Flicker-Eject
**Description:** The app's top-level routing does not perform an authenticated-vs-unauthenticated redirect until the Firebase Auth SDK has resolved the current user exactly once (either to a signed-in user object or to null). The resolved state is tracked by an explicit readiness flag.
**Acceptance Criteria:**
- [ ] The root navigation logic reads an explicit `authReady` (or equivalent) boolean that starts false
- [ ] The `authReady` flag becomes true only after the Firebase Auth state-change listener has fired at least once
- [ ] No redirect from the entry/loading screen to the authenticated main screen occurs while `authReady` is false
- [ ] No redirect from the entry/loading screen to the login screen occurs while `authReady` is false
- [ ] On a fresh install, launching the app results in exactly one navigation event (to login) with no intermediate mount of the authenticated main screen
- [ ] On a signed-in install, launching the app results in exactly one navigation event (to main) with no intermediate mount of the login screen
**Dependencies:** R1

### R5: Stale Session Produces Graceful Login Fallback
**Description:** When a device starts with a persisted auth session whose token was issued by the legacy project (or is otherwise invalid against the new project), the app resolves to the login screen without surfacing an unhandled error, without crashing, and without briefly mounting the authenticated main screen.
**Acceptance Criteria:**
- [ ] With a pre-populated persisted auth session whose token cannot be validated against the new project, launching the app terminates at the login screen
- [ ] No uncaught exception is raised during the stale-session resolution
- [ ] No error alert, red-screen, or crash-reporter event is produced during the stale-session resolution
- [ ] The invalid persisted session is cleared from local storage as part of the fallback so subsequent launches start clean
- [ ] The user-visible transition from app launch to login screen contains no frame in which the authenticated main screen is rendered
**Dependencies:** R1, R4

### R6: Phone Number Pre-Filled From Prior Persisted Session
**Description:** If a phone number is recoverable from the persisted auth store at launch (including the stale-session case handled in R5), the login screen's phone-number input is populated with that value before the user interacts with the screen. This minimises friction for users forced to re-register after the clean-slate migration.
**Acceptance Criteria:**
- [ ] When the persisted auth store contains a phone number, the login screen's phone input renders with that number as its initial value
- [ ] When the persisted auth store contains no phone number (or no persisted session at all), the phone input renders empty
- [ ] The pre-filled value is editable by the user without requiring them to first clear it
- [ ] Pre-fill does not bypass or auto-submit the OTP request flow — the user must still take an explicit action to request an OTP
- [ ] Pre-fill behavior is consistent across Android and iOS
**Dependencies:** R5

## Out of Scope
- Provisioning of the new Firebase project or generation of native config artifacts (see cavekit-firebase-project-infra.md)
- Backend token-verification configuration or service account deployment (see cavekit-backend-auth-wiring.md)
- Adding auth providers beyond Phone, Email/Password, and Google
- Visual redesign or copy changes to the login, register, or OTP verification screens
- Biometric authentication (Face ID, Touch ID, fingerprint)
- Automatic SMS/OTP reading or auto-fill from the device
- Session timeout policies or silent token refresh tuning
- Migration of user data from the legacy project
- Push-notification registration changes
- Analytics, Crashlytics, or any other Firebase product beyond Auth

## Cross-References
- See also: cavekit-firebase-project-infra.md (produces the native config artifacts and project identifiers consumed by R1, R2)
- See also: cavekit-backend-auth-wiring.md (backend must accept tokens from the new project before mobile ships; R1's token audience must match the project the backend is configured against)
