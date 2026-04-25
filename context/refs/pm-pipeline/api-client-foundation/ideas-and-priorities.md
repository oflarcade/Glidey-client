# GLIDEY — Phase 1 API Client Foundation: Ideas & Priorities

**Feature scope:** Replace Firebase Cloud Functions (httpsCallable) with a Fastify 5 REST API at `http://34.140.138.4`. Manual Firebase JWT injection. Fix all four service layers + TypeScript types.

**Date:** 2026-04-19
**Audience:** Engineering lead, product, design

---

## Part 1 — Brainstorm (3 Perspectives × 5 Ideas)

---

### Perspective 1: Product Manager
*Focus: market fit, value creation, competitive edge*

**PM-1. Offline-resilient ride request queuing**
The new REST API introduces a direct HTTP dependency that did not exist under Firebase's managed SDK. In Dakar, connectivity can be inconsistent (3G, hand-offs between towers). Add a client-side request queue that holds a ride request when the device is offline and fires it automatically when connectivity resumes. This preserves conversion that would otherwise be lost to network drops, which is a direct competitive differentiator against Yango and InDriver in Senegal.

**PM-2. Driver availability confidence indicator**
The new `/drivers/nearby` response lacks `lat/lng` for map pins — a critical gap noted in the Phase 1 spec. Until that field is added server-side, surface a "drivers nearby" count badge on the booking CTA with a distance bucket label ("less than 500 m", "1–3 km") derived from the returned `distanceM`. This turns the missing map-pin data into a legible availability signal and reduces booking abandonment by letting users make an informed decision without seeing pins.

**PM-3. Transparent fare preview before booking**
The REST migration makes it safe to call `/directions` (no auth) immediately after destination selection, because the old Firebase callable required an authenticated session. Capitalize on this: compute a live fare preview from `distanceMeters` and `durationSeconds` immediately after a destination is chosen, before the user taps "Book". XOF amounts are a primary conversion lever in a price-sensitive market.

**PM-4. Server-driven API version gating**
Embed the API base URL and a minimum client version in the app's remote config (or a lightweight `/config` endpoint). When the Fastify backend is upgraded, the server returns a `"client_outdated"` error code and the client shows a soft upgrade prompt, not a hard crash. This protects the backend team's ability to iterate without coordinating forced app updates.

**PM-5. Ride receipt shareable via WhatsApp**
Senegalese users heavily rely on WhatsApp for financial proof. After a ride completes, generate a simple text-format receipt (addresses, fare in XOF, timestamp) and add a native share sheet entry pre-targeted at WhatsApp. This requires no new backend endpoint — it uses data already in the `Ride` object returned by the rides service. High value, near-zero engineering cost.

---

### Perspective 2: Product Designer
*Focus: UX, onboarding, engagement loops*

**UX-1. Skeleton loading states tied to API response phases**
The migration from Firebase's optimistically-resolved callables to raw HTTP introduces perceptible latency differences. Each service call now has a distinct loading phase. Design per-service skeletons: a shimmering driver-count area for the map, a shimmer list for autocomplete suggestions, and a pulsing route line for direction draws. This makes latency feel intentional, not broken, and sets correct expectations during Phase 1 instability.

**UX-2. Destination search recovery flow**
With `addressSearchService` moving from Mapbox Search Box (session tokens, `mapboxId`) to Google Places (`placeId`, no session token), the suggestion contract changes. Users who previously typed partial queries that resolved via Mapbox might see zero results briefly during the cutover. Design a graceful no-results state: "Try a landmark, neighbourhood, or full street name" with 3 recent history items pre-populated below. This uses the existing `getLocationHistory()` and costs no additional API calls.

**UX-3. Progressive location permission re-engagement**
The `LocationStore` already distinguishes `undetermined`, `denied`, `granted`, and `restricted`. The current app shows a generic OS prompt. Design a pre-permission rationale screen (shown before the OS dialog) explaining "We need your location to show nearby scooters" with a map thumbnail of Dakar. For `denied` state, add a non-blocking banner that deeplinks to iOS/Android settings — not a blocking modal. This reduces hard refusals and improves the funnel without code changes to the permission flow itself.

**UX-4. Contextual error messaging per service**
Today all HTTP errors surface as generic toast messages. Map the four new REST error categories (network timeout, 401 token expired, 422 validation, 5xx server) to distinct, user-readable messages in French first, then English. "Votre session a expiré, reconnectez-vous" for 401; "Vérifiez votre connexion" for network failures. This requires a thin error-mapping layer on top of the new `apiClient.ts` and uses the existing `@rentascooter/i18n` translation system.

**UX-5. Ride status micro-animations**
The `RideStatus` union (`pending` → `accepted` → `arriving` → `arrived` → `in_progress` → `completed`) maps directly to a timeline. Build a sticky bottom-sheet progress bar that animates between states using Reanimated shared values. This gives riders a sense of forward momentum during wait times and reduces support contacts asking "where is my driver?" — a known friction point in emerging-market ride apps.

---

### Perspective 3: Engineer
*Focus: technical innovation, integrations, platform leverage*

**ENG-1. Typed API client with compile-time route safety**
The new `apiClient.ts` is a blank slate. Implement it as a generic typed client where each endpoint is declared as a route definition object (path, method, request shape, response shape). Downstream service files call `apiClient.get<NearbyDriversResponse>('/drivers/nearby', params)` instead of ad-hoc `fetch`. TypeScript narrows the response at the call site, eliminating a whole class of runtime shape mismatches — especially important given the `distanceM` vs `distanceMeters` naming inconsistency already identified in the spec.

**ENG-2. Automatic token refresh with a request queue**
Firebase `idToken` expires every hour. The new manual injection pattern means a token can expire mid-session and every subsequent API call will 401 until the user restarts. Implement a `tokenRefreshInterceptor` in `apiClient.ts`: on 401, call `getIdToken(user, true)` to force-refresh, then replay the original request once. All concurrent in-flight requests during the refresh are queued and replayed together — not each triggering its own refresh. This is invisible to the user and eliminates session-expiry crashes.

**ENG-3. Client-side map-pin coordinate fallback for NearbyDriver**
The spec flags a critical gap: `/drivers/nearby` returns no `lat/lng`. Until the backend is fixed, generate synthetic jitter coordinates on the client: take the `searchCenter` GeoPoint from the response and distribute drivers at `distanceM` radius using a deterministic angle based on `driver.id` hash. Drivers appear on the map plausibly distributed without real coordinates. This is a deliberate, documented stopgap — not a permanent solution — that unblocks the UX without blocking the backend team.

**ENG-4. Request deduplication and stale-while-revalidate for driver polling**
`useNearbyDrivers` polls at ~5s intervals. With the new REST API, every tick is a raw HTTP call. Add a deduplication key in `apiClient.ts` so that if two identical requests (same path + params) are in-flight simultaneously, the second subscriber waits for the first. Combine with the existing React Query stale time so that a cached response is returned immediately while a background refresh fires. This halves effective API load during active sessions.

**ENG-5. Environment-aware base URL with cert pinning readiness**
`EXPO_PUBLIC_API_BASE_URL` should drive the base URL in `apiClient.ts`. Add a dev/preview/prod ternary that selects the correct URL even if the env var is absent, matching the existing `EXPO_PUBLIC_USE_DEMO` pattern. Stub out a `certPinningConfig` object (empty in Phase 1, filled in Phase 2) so the architecture is ready for certificate pinning on the production IP without a second refactor. Comment the stub clearly so it is not silently bypassed.

---

## Part 2 — ICE Scoring & Prioritization

**Scoring rubric (1–10 each):**
- **Impact**: How much does it move the needle on the desired outcome (stable, correct, user-trusted REST API)?
- **Confidence**: How certain are we this approach works given current codebase knowledge?
- **Ease**: Inverse of effort (10 = trivially easy, 1 = massive effort).

**ICE Score = Impact × Confidence × Ease**

| # | Idea | Impact | Confidence | Ease | ICE | Notes |
|---|------|--------|------------|------|-----|-------|
| ENG-2 | Automatic token refresh with request queue | 9 | 9 | 7 | **567** | 401 loop is a hard session-breaking bug. Pattern is well-understood. Contained to apiClient.ts. |
| ENG-1 | Typed API client with compile-time route safety | 8 | 9 | 7 | **504** | Eliminates shape mismatch bugs across all four services at once. One-time architectural investment in apiClient.ts. |
| ENG-3 | Client-side coordinate fallback for NearbyDriver | 9 | 8 | 6 | **432** | Unblocks the map UI (the app's primary screen) from a server gap. Deterministic jitter is predictable and testable. |
| UX-4 | Contextual per-service error messages | 7 | 9 | 7 | **441** | Reuses existing i18n infra. Low effort, high trust signal for French-speaking Dakar users. Sits on top of apiClient.ts. |
| PM-3 | Live fare preview before booking | 8 | 8 | 6 | **384** | `/directions` is now auth-free — this capability is new compared to the Firebase era. Direct conversion lever in a price-sensitive market. |

---

### Top 5 Ranked by ICE Score

**1. ENG-2 — Automatic token refresh with request queue (ICE: 567)**
*Why first:* A one-hour Firebase token expiry is a guaranteed session-breaking crash under the new manual injection model. Every user who stays in-app for over an hour will be silently 401'd. The fix is a well-understood interceptor pattern, entirely contained in `apiClient.ts`, and has zero UX surface area. It must ship with Phase 1 or the app is unreliable in production.

**2. ENG-1 — Typed API client with compile-time route safety (ICE: 504)**
*Why second:* All four service migrations depend on `apiClient.ts`. If it is built as an untyped `fetch` wrapper, every subsequent service fix inherits the same fragility. Building it typed from the start costs maybe two extra hours but saves multiple debugging cycles when the `distanceM` / `distanceMeters` naming divergence (already in the spec) causes a silent runtime bug.

**3. UX-4 — Contextual per-service error messages (ICE: 441)**
*Why third:* Trust is the product in a new market. Generic "Something went wrong" destroys trust faster than a slow response. The `@rentascooter/i18n` system is already in place; this is mapping HTTP status codes to translation keys. Deliverable in a single focused PR on top of `apiClient.ts`.

**4. ENG-3 — Client-side coordinate fallback for NearbyDriver (ICE: 432)**
*Why fourth:* The main screen (`(main)/index.tsx`) is a full-screen Mapbox map. If the driver pins cannot render because the API returns no coordinates, the app's primary value proposition is invisible. The jitter approach is a documented, reversible stopgap — it is removed the moment the backend team adds `lat/lng` to the response.

**5. PM-3 — Live fare preview before booking (ICE: 384)**
*Why fifth:* This is the first feature that is newly possible because of the migration (the old Firebase `/directions` callable required auth). It directly reduces booking abandonment in a price-sensitive market and requires no new backend work — only consuming the already-fixed `routeDirectionsService`.

---

### Deprioritized — Rationale

**PM-1 (Offline ride queuing — ICE est. ~280):** High eventual impact but complex to implement correctly without risking duplicate rides. Depends on a stable ride-creation endpoint that does not exist yet in Phase 1. Deferred to Phase 2.

**PM-2 (Driver availability badge — ICE est. ~270):** Good UX hedge but partly addressed by ENG-3's coordinate fallback. If map pins render (even with jitter), the badge is redundant. Revisit only if backend coordinate gap extends past Phase 1.

**PM-4 (Server-driven version gating — ICE est. ~240):** Important for backend agility long-term but adds a new infrastructure dependency (remote config or `/config` endpoint) that is out of scope for Phase 1. Schedule for Phase 2 before the first breaking API change.

**PM-5 (WhatsApp ride receipt — ICE est. ~320):** Genuinely high value and low effort, but depends on a working ride completion flow that has not yet been migrated. Blocked until `ridesService` and ride-creation endpoints are stable. Fast-track in Phase 2.

**UX-1 (Skeleton loading states — ICE est. ~252):** Correct UX decision but purely cosmetic during a phase where correctness is the goal. Implement in the first design-polish sprint after Phase 1 stabilizes.

**UX-2 (Destination search recovery — ICE est. ~280):** Depends on the `addressSearchService` Google Places cutover being complete and validated. Build this immediately after the service migration is confirmed working in staging.

**UX-3 (Progressive location permission — ICE est. ~210):** High UX quality but no dependency on the API migration. The `LocationStore` is already correct. Ship this in any sprint, independently of Phase 1.

**UX-5 (Ride status micro-animations — ICE est. ~160):** Pure delight layer. Reanimated is already installed and the `RideStatus` union is defined. Zero technical risk, but it requires a stable ride lifecycle first. Phase 2+.

**ENG-4 (Request deduplication / stale-while-revalidate — ICE est. ~315):** React Query already handles most of this via its built-in deduplication. The marginal gain over configuring `staleTime` correctly is small. Tune React Query config first; add custom dedup only if profiling shows it is needed.

**ENG-5 (Environment-aware base URL + cert pinning stub — ICE est. ~360):** The env-aware URL selection is already captured in ENG-1's typed client design. The cert-pinning stub is a good architectural pattern but adds no Phase 1 value. Add the stub as a comment in `apiClient.ts` during ENG-1 implementation; no separate ticket needed.
