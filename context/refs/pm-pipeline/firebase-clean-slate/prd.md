# PRD: Firebase Clean-Slate Migration — Glidey Client App

**Status:** Draft | **Date:** 2026-04-21 | **Phase:** Pre-launch infra

---

## 1. Summary

Glidey's client app and backend monolith currently reference a legacy Firebase project (original GCP project) that was never properly integrated with the PostgreSQL backend. This migration re-points the mobile app and backend to a new Firebase project co-located in the same GCP project as the VM, establishing a clean, functional auth layer from scratch. No user data migration is required — there are no real end-users yet.

---

## 2. Problem

The legacy Firebase project is orphaned: its Auth tokens cannot be verified by the backend monolith, which now runs on a separate GCP project. The client app's `config/firebase.ts`, `google-services.json`, and `GoogleService-Info.plist` all point to the wrong project. The backend's `FIREBASE_PROJECT_ID` env var and service account are stale. As a result, **no auth flow works end-to-end** — phone OTP, email/password, and Google OAuth all fail at token verification. The current workaround is to bypass auth entirely during dev, which is not viable for beta launch.

---

## 3. Objective

Establish a fully functional Firebase Auth layer tied to the correct GCP project so that:
- A user can authenticate via phone OTP, email/password, or Google OAuth
- The backend monolith can verify the resulting ID token
- On first successful login, `POST /client` is called and the client profile is bootstrapped in PostgreSQL

Success means a new device can complete the full auth-to-profile flow with zero manual workarounds.

---

## 4. Target Users

**Primary:** Glidey engineering team (internal, pre-launch). They are the only users exercising auth flows right now. Context: running Expo dev builds on physical devices in Senegal (Android primary, iOS secondary), testing phone OTP with +221 numbers.

**Secondary:** First beta riders in Dakar — Senegalese users with local phone numbers who will onboard once the auth layer is stable.

---

## 5. User Stories

1. As a **first-time rider**, I want to enter my Senegalese phone number and receive an OTP so that I can create an account without needing an email address.

2. As a **returning rider**, I want my session to persist across app restarts so that I do not have to re-authenticate every time I open Glidey.

3. As a **rider using Google sign-in**, I want to authenticate with my Google account so that I can skip OTP and use an auth method I already trust.

4. As a **backend service**, I want to verify Firebase ID tokens against the correct project so that only authenticated Glidey users can access protected API endpoints.

5. As a **new authenticated user**, I want my client profile to be created automatically on first login so that I can start booking without an extra registration step.

6. As a **developer**, I want the Firebase config files (`google-services.json`, `GoogleService-Info.plist`, `config/firebase.ts`) to reference the new project so that local and CI builds work without manual patching.

---

## 6. Scope

### In
- Create and configure Firebase project in the new GCP project (same project as VM at 34.140.138.4)
- Enable auth providers: Phone (with +221 test numbers for dev), Email/Password, Google OAuth
- Update client app: `config/firebase.ts`, `google-services.json`, `GoogleService-Info.plist`
- Update backend monolith: `FIREBASE_PROJECT_ID` env var + new service account JSON on VM; PM2 restart with `--update-env`
- Verify `ensureClientProfile` (calls `POST /client`) triggers correctly on first login and is idempotent
- Smoke-test all three auth providers on a physical device

### Out
- Migration of any existing Firebase Auth users or Firestore data
- Firestore usage of any kind (backend is PostgreSQL only)
- Firebase Cloud Messaging, Remote Config, Analytics, or any other Firebase product
- Changes to booking, ride, or payment flows
- App Store / Play Store release — this is a dev/beta-infra change only
- Multi-tenant or multi-region Firebase setup

---

## 7. Success Metrics

1. **Auth success rate:** 100% of phone OTP, email/password, and Google OAuth sign-in attempts succeed end-to-end (token issued → backend verifies → client profile exists in PostgreSQL) in smoke testing across Android and iOS dev builds.

2. **Backend token verification latency:** `POST /client` completes within 2 seconds of successful Firebase sign-in on a device connected to a Dakar mobile network (median over 10 test runs).

3. **Zero stale-config incidents:** No engineer hits a "wrong project" Firebase error after the config files are merged — confirmed by a clean run of the Expo dev build on a fresh clone.

---

## 8. Open Questions

1. **SHA-1 / App Check:** Do we need to register Android SHA-1 fingerprints in the new Firebase project for phone auth to work on physical devices, and do we enforce App Check before beta — or defer App Check to post-launch?

2. **Google OAuth redirect URI:** Which OAuth 2.0 client ID and redirect scheme need to be registered in the new Firebase project's Google Cloud credentials for the Expo-managed Google sign-in flow to work on both platforms without a custom scheme conflict?

3. **Service account scope on VM:** Should the new Firebase Admin service account be a dedicated, least-privilege account (Token Verifier role only), or can it reuse the existing VM service account — and who owns rotating the key if it is separate?
