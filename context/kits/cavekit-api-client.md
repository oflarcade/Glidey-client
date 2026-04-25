---
created: "2026-04-19"
last_edited: "2026-04-19"
---

# Cavekit: API Client

## Scope
Shared HTTP client layer used by every service that talks to the new REST backend. Responsible for injecting the caller's Firebase identity token, normalizing errors into a typed shape, recovering transparently from expired-token responses, and honoring demo mode so that no real network traffic occurs when the app is running against mock data. Also covers the platform network-policy configuration required for plain HTTP traffic to the current backend host.

This kit defines the contract that every downstream domain kit (location-search, nearby-drivers, route-directions) depends on.

## Requirements

### R1: Authenticated HTTP client
**Description:** The client exposes a small set of HTTP verb methods (`GET`, `POST`, `PATCH`) that every service uses to talk to the backend. Before each outgoing request, the client attaches the current user's Firebase identity token as a bearer credential in the `Authorization` header. The request is sent to a base URL sourced from the `EXPO_PUBLIC_API_URL` environment variable. Requests that do not receive a response within 10 seconds are aborted and surfaced as a timeout.

**Acceptance Criteria:**
- [ ] A `GET`, `POST`, and `PATCH` method are each callable and accept a relative path plus an optional JSON body (for `POST`/`PATCH`).
- [ ] Every outgoing request has an `Authorization` header whose value begins with `Bearer ` followed by the Firebase ID token for the signed-in user.
- [ ] The request URL is composed by joining the value of `EXPO_PUBLIC_API_URL` with the caller-supplied relative path.
- [ ] A request that does not complete within 10 seconds is aborted and surfaced to the caller as a typed error (see R3) with a non-zero status or a network-level sentinel.
- [ ] When no user is signed in, the client surfaces a typed error to the caller rather than making an unauthenticated request with a missing `Authorization` header.

**Dependencies:** None (this is the foundation kit).

---

### R2: Automatic 401 token recovery
**Description:** When the backend rejects a request with a 401 response, the client must attempt to refresh the Firebase identity token once and replay the original request with the new token. Multiple in-flight requests that all receive 401s at roughly the same time must share a single token-refresh operation rather than each performing its own refresh.

**Acceptance Criteria:**
- [ ] A request that receives a 401 response triggers a forced Firebase token refresh before being retried.
- [ ] The original request is replayed at most once after a successful refresh; a second consecutive 401 is surfaced to the caller as a typed error (see R3) without triggering a third attempt.
- [ ] While a refresh is in progress, additional requests that also encounter a 401 wait on the same refresh operation rather than starting their own.
- [ ] All requests that were waiting on an in-flight refresh replay together once the refresh resolves.
- [ ] If the refresh itself fails, every waiting request is surfaced as a typed error and none of them are replayed.

**Dependencies:** R1.

---

### R3: Typed error normalization
**Description:** Callers of the client never see raw platform response objects or raw thrown exceptions. Every failure — HTTP error status, network failure, timeout, missing auth — is converted into a single typed error shape so that services and hooks can handle failures uniformly.

**Acceptance Criteria:**
- [ ] A non-2xx response is surfaced as a typed `ApiError` value carrying at minimum the HTTP status code and a human-readable message.
- [ ] A network failure (host unreachable, DNS failure, connection refused) is surfaced as a typed `ApiError` with a status value of `0` and a human-readable message.
- [ ] A timeout (see R1) is surfaced as a typed `ApiError` distinguishable from a generic network failure by its message or a dedicated field.
- [ ] The caller never receives a raw `Response`, raw `Error`, or framework-specific exception type.
- [ ] The error shape is defined in a single shared type that service code imports.

**Dependencies:** R1.

---

### R4: Demo mode bypass
**Description:** When the app is running in demo mode (`EXPO_PUBLIC_USE_DEMO=true`), the client must never perform real network I/O against the backend. It must instead surface a recognizable signal that service callers can intercept to substitute mock data. This signal must be explicit — it must not silently return empty or `undefined` in a way that would be mistaken for a successful empty response.

**Acceptance Criteria:**
- [ ] When `EXPO_PUBLIC_USE_DEMO` is `true`, no outgoing HTTP request is ever dispatched by the client.
- [ ] Callers invoked in demo mode receive a distinct, documented sentinel value or a dedicated demo-mode typed error that is distinguishable from any real `ApiError`.
- [ ] The demo-mode signal is not the same as a successful 2xx empty response; a caller that forgets to check for demo mode observes a detectable failure rather than silently operating on missing data.
- [ ] The demo-mode bypass applies uniformly to `GET`, `POST`, and `PATCH`.

**Dependencies:** R1, R3.

---

### R5: iOS and Android plain-HTTP compliance
**Description:** Because the current backend is reachable only via plain HTTP, the client must operate without triggering iOS App Transport Security violations or Android cleartext-traffic errors when calling the configured base URL. This is a platform configuration requirement, not a runtime client behavior; the kit requires that the configuration exists and allows traffic to the API host.

**Acceptance Criteria:**
- [ ] An authenticated `GET` against the production backend host completes on a physical iOS device without an ATS block.
- [ ] An authenticated `GET` against the production backend host completes on a physical Android device without a cleartext-traffic block.
- [ ] The allow-list is scoped to the API host rather than globally permitting arbitrary cleartext traffic.
- [ ] The allow-list is documented so it can be removed once the backend moves to HTTPS.

**Dependencies:** R1.

---

## Out of Scope
- WebSocket, Server-Sent Events, or any bidirectional streaming transport.
- File uploads, multipart bodies, or binary request/response payloads.
- Certificate pinning (the hook/stub may exist but is not required to pin anything).
- Request signing, HMAC, or any auth scheme other than Firebase bearer tokens.
- OAuth client-credential flows or any non-Firebase identity provider.
- Client-side response caching beyond whatever callers implement.
- Retries for non-401 failures (e.g. 5xx, network errors).

## Cross-References
- See also: `cavekit-location-search.md` — depends on this client for autocomplete, place detail, and history calls.
- See also: `cavekit-nearby-drivers.md` — depends on this client for the nearby-driver fetch.
- See also: `cavekit-route-directions.md` — depends on this client (note: directions endpoint itself does not require auth, but goes through the shared client for error normalization and demo-mode bypass).

## Changelog
