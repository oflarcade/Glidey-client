---
created: "2026-04-21"
last_edited: "2026-04-21"
---

# Cavekit: Backend Auth Wiring

## Scope
Covers VM-side configuration and backend behavioural changes required so that the monolith accepts ID tokens issued by the new Firebase project and correctly bootstraps a client profile on first authenticated request. The only backend logic change in scope is the phone-anchored re-link rule inside the client-profile bootstrap path; no other endpoints are modified. No infrastructure provisioning (service account creation, provider enablement) and no mobile changes are in scope — those are handled by upstream domains.

## Requirements

### R1: Backend Runtime Configured With New Project Credentials
**Description:** The running backend process is configured with the new Firebase project ID and a path (or equivalent reference) to the new service account JSON credential. Configuration is applied via the process manager's environment so that a managed restart picks up the change without code changes. The process starts cleanly and stays healthy.
**Acceptance Criteria:**
- [ ] The backend process environment exposes the new project ID and a reachable service-account credential reference
- [ ] The backend process starts without errors related to missing, malformed, or unreadable Firebase credentials
- [ ] The process manager reports the backend as running and healthy after the configuration change is applied
- [ ] No reference to the legacy Firebase project ID or legacy service account path remains in the live process environment
- [ ] A health-check endpoint (or equivalent liveness signal) responds successfully after the configuration change
**Dependencies:** cavekit-firebase-project-infra.md R4

### R2: Token Verification Accepts New Project, Rejects Old Project
**Description:** The backend's authenticated-request middleware verifies ID tokens against the new Firebase project's public keys. Tokens issued by the new project are accepted; tokens issued by the legacy project are rejected with an unambiguous auth error.
**Acceptance Criteria:**
- [ ] A valid ID token issued by the new project is accepted by any authenticated endpoint and the request proceeds
- [ ] A valid ID token issued by the legacy (orphaned) project is rejected by the same endpoint with an authentication error (not a 500 or opaque failure)
- [ ] A token with a tampered signature is rejected with an authentication error
- [ ] An expired token issued by the new project is rejected with an authentication error
- [ ] The rejection in the legacy-project case does not crash or degrade the server process and subsequent valid requests continue to succeed
**Dependencies:** R1

### R3: Client Profile Bootstrap Is Idempotent and Phone-Anchored
**Description:** The client-profile bootstrap operation triggered on first authenticated request treats the verified phone number as the stable identity anchor. If a client record with that verified phone number already exists, the existing record is re-linked to the new Firebase UID; otherwise a new record is created. Duplicate rows for the same verified phone number are never produced.
**Acceptance Criteria:**
- [ ] Given no existing client with the verified phone number, a first authenticated request creates exactly one new client record associated with the new Firebase UID
- [ ] Given an existing client record whose stored phone number equals the verified phone number on the incoming token, a first authenticated request updates that existing record's Firebase UID to the new value and creates no new record
- [ ] After the re-link case completes, the existing client's historical data (rides, profile attributes other than UID) is still readable and associated with the re-linked record
- [ ] Repeating the bootstrap call for the same authenticated session produces no additional rows and no duplicate-key failures
- [ ] Two authenticated users with different verified phone numbers produce two distinct client records
- [ ] The bootstrap operation derives the phone number strictly from the verified token claim, not from a client-supplied request body value
**Dependencies:** R2

### R4: Bootstrap Response Exposes isReturningUser
**Description:** The client-profile bootstrap response includes a boolean field that tells the mobile client whether the backend re-linked an existing record or created a new one. This allows the client to present appropriate welcome-back messaging without an additional round trip.
**Acceptance Criteria:**
- [ ] The bootstrap response body contains a boolean field named `isReturningUser`
- [ ] `isReturningUser` is true when the bootstrap re-linked an existing client record to the new Firebase UID
- [ ] `isReturningUser` is false when the bootstrap created a new client record
- [ ] The field is always present on a successful bootstrap response (never omitted, never null)
- [ ] The field's value is derived from the actual branch taken in R3, not from a heuristic such as account age
**Dependencies:** R3

### R5: End-to-End Smoke Test Passes on a Fresh Device
**Description:** An end-to-end happy-path smoke test covering phone-OTP authentication, client-profile bootstrap, and first main-screen load succeeds against the configured backend, exercised from a physical device. This is the acceptance gate for the full migration slice.
**Acceptance Criteria:**
- [ ] On a freshly installed mobile build configured against the new project, a phone-OTP sign-in produces a valid ID token
- [ ] The mobile client's subsequent client-profile bootstrap request returns a successful response (newly-created or re-linked, both acceptable)
- [ ] After a successful bootstrap, the main application screen loads without any authorization error being raised
- [ ] The smoke test succeeds on a physical Android device
- [ ] The smoke test succeeds on a physical iOS device
- [ ] The smoke test produces no 403 response from any authenticated endpoint invoked as part of the happy path
**Dependencies:** R1, R2, R3, R4, cavekit-client-config-migration.md R1

## Out of Scope
- Firestore usage, migration, or dual-write schemes
- Cloud Functions deployment, invocation, or deprecation
- Migration or import of users, profiles, or auth records from the legacy Firebase project
- Changes to ride, driver, booking, pricing, or any other backend endpoint outside the client-profile bootstrap
- Multi-region deployment, failover, or blue/green rollout tooling
- Rate limiting, abuse prevention, or bot-mitigation changes
- Changes to database schema beyond what is strictly required to anchor on phone number (if the schema already supports phone-based lookup, no schema change is in scope)
- Observability additions (new metrics, new dashboards, new alerts) beyond existing health checks
- Rotation policy for the new service account credential
- Any mobile application changes (see cavekit-client-config-migration.md)
- Any Firebase project-level provisioning (see cavekit-firebase-project-infra.md)

## Cross-References
- See also: cavekit-firebase-project-infra.md (provides the service account and project ID consumed by R1)
- See also: cavekit-client-config-migration.md (the mobile client must be issuing tokens from the new project for R2 and R5 to succeed end-to-end)
