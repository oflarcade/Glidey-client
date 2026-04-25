---
created: "2026-04-21"
last_edited: "2026-04-21"
---

# Cavekit: Firebase Project Infrastructure

## Scope
Covers the creation and provisioning of a new Firebase project hosted in the same GCP project as the production backend VM. This domain is strictly infrastructure and console-level configuration: auth provider enablement, platform registration, identity credentials, and native config artifact generation. No mobile application code or backend runtime code is in scope here — those changes are handled by downstream domains that consume the artifacts produced here.

## Requirements

### R1: Firebase Project Co-Located With Backend VM
**Description:** A new Firebase project exists and is hosted inside the same GCP project that runs the backend monolith VM (reachable at the production VM IP). Co-location ensures a single identity surface across mobile client, backend token verification, and future GCP-native integrations.
**Acceptance Criteria:**
- [ ] A Firebase project exists that was not previously associated with the Glidey mobile app
- [ ] The Firebase project's parent GCP project ID matches the GCP project that owns the backend VM
- [ ] The Firebase project has a unique project ID distinct from the legacy (orphaned) Firebase project
- [ ] The project is visible in the Firebase console and is not in a deletion-pending state
**Dependencies:** None

### R2: Auth Providers Enabled With Development Test Credentials
**Description:** All three auth providers required by the mobile app are enabled in the new Firebase project's Authentication configuration. A deterministic test phone number and OTP are registered so QA and CI can exercise phone auth without consuming real SMS.
**Acceptance Criteria:**
- [ ] Phone sign-in provider is enabled
- [ ] Email/Password sign-in provider is enabled
- [ ] Google sign-in provider is enabled
- [ ] A test phone number with Senegalese (+221) country code is registered and returns a fixed OTP for dev/QA
- [ ] The test phone number and its fixed OTP are retrievable by an engineer with console access and documented in a location reachable by the QA team
- [ ] Authenticating against the new project with the test number and fixed OTP returns a valid ID token
**Dependencies:** R1

### R3: Android SHA-1 Fingerprint Registered
**Description:** The Android app's signing SHA-1 fingerprint is registered against the Android app entry in the new Firebase project. Without this, phone auth silently fails on physical Android devices because SafetyNet/Play Integrity cannot attest the app.
**Acceptance Criteria:**
- [ ] An Android app entry exists in the new Firebase project whose package name matches the app's production package name
- [ ] At least one SHA-1 fingerprint is registered against that Android app entry
- [ ] The registered SHA-1 matches the fingerprint of the signing key used by development and preview builds
- [ ] Triggering phone auth on a physical Android device built with the corresponding signing key produces an SMS (or resolves to the test OTP) with no reCAPTCHA/integrity error in the device logs
**Dependencies:** R1, R2

### R4: Backend Service Account With Minimum Required Permissions
**Description:** A service account scoped to Firebase Auth token verification is provisioned in the new project and its private key is available as a JSON credential file for the backend runtime. The account must follow least-privilege: it can verify tokens but cannot write user records, read unrelated GCP resources, or assume elevated roles.
**Acceptance Criteria:**
- [ ] A dedicated service account exists in the new project distinct from any default or pre-existing service account
- [ ] The service account has exactly the role(s) required to verify Firebase Auth ID tokens and no broader role (no owner, editor, or project-wide admin role)
- [ ] A JSON private key for the service account has been generated and is retrievable by the engineer deploying the backend
- [ ] Using the downloaded JSON key, a token issued by the new Firebase project can be verified successfully in an out-of-band test
- [ ] Using the downloaded JSON key, a token issued by the legacy (orphaned) Firebase project is rejected as invalid
**Dependencies:** R1, R2

### R5: Native Config Artifacts Generated and Available
**Description:** The Android and iOS native configuration files required by the Firebase SDK are generated for the new project and made available to the build pipeline. These artifacts embed the new project identifiers and API keys that downstream mobile builds must consume.
**Acceptance Criteria:**
- [ ] An Android native config artifact has been generated for the Android app entry registered in R3 and contains the new project ID
- [ ] An iOS native config artifact has been generated for a registered iOS app entry whose bundle ID matches the app's production bundle ID, and contains the new project ID
- [ ] Both artifacts are retrievable by the engineer preparing the mobile build (e.g., downloaded from the console, stored in a secret manager)
- [ ] Neither artifact references the legacy Firebase project ID, API key, or app ID
- [ ] Both artifacts contain valid, non-empty OAuth client identifiers consistent with the Google sign-in provider enabled in R2
**Dependencies:** R1, R2, R3

## Out of Scope
- Firestore database creation or index configuration
- Cloud Functions deployment or scheduling
- Firebase Cloud Messaging (FCM) setup or APNs key upload
- App Check registration or attestation provider configuration
- Firebase Analytics, Crashlytics, Performance Monitoring, or Remote Config enablement
- Multi-environment project separation (staging vs production Firebase projects)
- Migration of users, auth records, or any data from the legacy Firebase project
- Any mobile application code changes (see cavekit-client-config-migration.md)
- Any backend runtime changes (see cavekit-backend-auth-wiring.md)
- App Store / Play Store listing or release configuration
- Custom email templates or SMS sender branding

## Cross-References
- See also: cavekit-client-config-migration.md (consumes R5 native config artifacts)
- See also: cavekit-backend-auth-wiring.md (consumes R4 service account credential)
