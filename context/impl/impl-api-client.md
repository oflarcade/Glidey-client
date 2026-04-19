---
created: "2026-04-19"
last_edited: "2026-04-19"
---
# Implementation Tracking: api-client

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-001 | DONE | packages/api/ skeleton; ApiError type stub, API_BASE_URL const; wired metro/tsconfig/package.json; .env.example |
| T-002 | DONE | apiFetch GET/POST/PATCH + AbortController 10s timeout in packages/api/src/client.ts |
| T-003 | DONE | packages/api/src/auth.ts: setTokenProvider/resolveToken; throws UNAUTHORIZED if no provider/user |
| T-004 | DONE | ApiError type + normalizeError helper in packages/api/src/errors.ts |
| T-005 | DONE | authedFetch in client.ts: token injection via resolveToken, all errors as ApiError |
| T-006 | DONE | packages/api/src/refresh.ts: setRefreshProvider + single-flight _inflight Promise |
| T-007 | DONE | authedFetch 401 retry-once path using refreshToken() in client.ts |
| T-008 | DONE | IS_DEMO sentinel + DEMO_MODE_ERROR in apiFetch; throws before any HTTP |
| T-009 | DONE | app.config.js: HTTPS migration removal comments added to ATS/cleartext blocks |
| T-010 | DONE | app.config.js: scoped ATS exception for 34.140.138.4 + usesCleartextTraffic via expo-build-properties |
