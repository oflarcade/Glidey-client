import type { ApiError } from './errors';

type RefreshProvider = () => Promise<string | null>;

let _refreshProvider: RefreshProvider | null = null;

/**
 * Wire up a force-refresh supplier. Call once at app startup:
 *   setRefreshProvider(() => getAuth().currentUser?.getIdToken(true) ?? null)
 * The provider must pass forceRefresh=true to bypass Firebase's token cache.
 */
export function setRefreshProvider(fn: RefreshProvider): void {
  _refreshProvider = fn;
}

// Single in-flight refresh promise shared by all concurrent 401 waiters.
let _inflight: Promise<string> | null = null;

/**
 * Refresh the Firebase ID token, deduplicating concurrent refresh attempts.
 *
 * If a refresh is already in progress every concurrent caller waits on the
 * same Promise rather than issuing multiple token-refresh requests.
 * On success all waiters receive the new token.
 * On failure all waiters receive an UNAUTHORIZED ApiError.
 */
export async function refreshToken(): Promise<string> {
  if (_inflight) return _inflight;

  _inflight = (async (): Promise<string> => {
    if (!_refreshProvider) {
      const err: ApiError = {
        code: 'UNAUTHORIZED',
        message: 'No refresh provider configured. Call setRefreshProvider() at app startup.',
      };
      throw err;
    }

    let token: string | null = null;
    try {
      token = await _refreshProvider();
    } catch {
      const err: ApiError = { code: 'UNAUTHORIZED', message: 'Token refresh failed.' };
      throw err;
    } finally {
      _inflight = null;
    }

    if (!token) {
      const err: ApiError = {
        code: 'UNAUTHORIZED',
        message: 'Token refresh returned no token — user may have signed out.',
      };
      throw err;
    }

    return token;
  })();

  return _inflight;
}
