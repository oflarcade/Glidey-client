# Synthesis: Firebase Clean-Slate Migration

**Date:** 2026-04-21
**Slug:** firebase-clean-slate

---

## Recommended Features (top 3)

1. **Auth state hydration guard (ENG-5, ICE 9.0)** — Gate the Expo Router redirect in `app/_layout.tsx` on `authReady === true`, set inside `onAuthStateChanged` regardless of null/user. Prevents the flicker-and-eject bug that will hit every device on day one. One boolean, highest ROI change in the migration.

2. **Parallel backend service account rollout (ENG-3, ICE 8.7)** — Add new Firebase project service account to VM alongside old credentials, update `FIREBASE_PROJECT_ID` in PM2 ecosystem config, `pm2 restart --update-env`, validate with a curl test token — before any mobile build ships. Decouples backend cut-over from mobile release; enables independent validation.

3. **Phone as stable identity anchor (ENG-2, ICE 8.3)** — In `ensureClientProfile` (backend), before INSERT check `SELECT id FROM clients WHERE phone = $verified_phone`. If found, UPDATE `firebase_uid` to the new UID. Users re-register but silently retain ride history, saved addresses, and preferences. Makes the auth reset invisible from the user's perspective.

---

## Key Risks to Address in Spec

| Risk | Confidence | Must Become |
|------|-----------|-------------|
| `GoogleService-Info.plist` does not exist in repo — iOS build will crash | LOW | AC: plist present and `reversedClientId` resolves correctly at build time |
| Legacy Cloud Functions OTP path (`verificationId === 'legacy'`) still active in `usePhoneAuth.ts` — fires when no appVerifier, breaks after old project abandoned | LOW | AC: legacy branch deleted or stubbed; OTP works without Cloud Functions |
| Backend VM accepts tokens from new project before mobile build ships | MEDIUM | AC: `curl POST /client` with new-project JWT returns 201/409 before mobile cut-over |
| Stale AsyncStorage auth session from old project causes silent redirect to main then ejection | MEDIUM | AC: old session → graceful redirect to login screen, no unhandled error |

---

## Constraints

- Firebase Auth only — no Firestore, no Cloud Functions, no FCM, no App Check (deferred)
- No migration of existing Firebase Auth users or Firestore collections
- Backend change limited to VM env vars + service account; no monolith code changes beyond `ensureClientProfile` phone-anchor logic
- iOS plist cannot be committed to git — must be injected via EAS secret or added to `.gitignore`d `ios/` directory after `prebuild:clean`
- Android SHA-1 fingerprint must be registered in new Firebase project for phone auth on physical devices

---

## Suggested Domain Decomposition

**Domain A: firebase-project-infra** — Console + infra checklist: create Firebase project in new GCP project, enable Phone/Email/Google providers, register Android SHA-1, configure test phone numbers (+221775551234 → 123456), create service account with Token Verifier role, download `google-services.json` + `GoogleService-Info.plist` + service account JSON.

**Domain B: client-config-migration** — All mobile code changes: swap `config/firebase.ts` to new project credentials, update `google-services.json`, wire `GoogleService-Info.plist` into `app.config.js`, remove dead Firestore + Cloud Functions initialisation from `packages/auth/src/firebase.ts`, delete/isolate legacy OTP Cloud Functions path in `usePhoneAuth.ts`, add `authReady` hydration guard, pre-fill phone from AsyncStorage on login screen, stale session graceful fallback.

**Domain C: backend-auth-wiring** — VM-side changes: deploy new service account JSON, update `FIREBASE_PROJECT_ID` in PM2 ecosystem, `pm2 restart --update-env`, smoke-test token verification, update `ensureClientProfile` to use phone as re-link key (SELECT → UPDATE vs INSERT), add `isReturningUser` boolean to profile bootstrap response.

---

## Success Criteria Candidates

- 100% of smoke tests pass: phone OTP → token issued → `POST /client` → 201/409 → map screen loads (Android + iOS physical devices)
- `POST /client` completes < 2s on Dakar mobile network (median over 10 runs)
- Zero stale-config Firebase errors after config files are merged (clean clone → `yarn dev` → no project-ID mismatch)
- Old session → login screen redirect is clean (no unhandled error, no flicker into main)
- `isReturningUser: true` returned when re-registering with a previously used phone number
