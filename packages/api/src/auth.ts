import { type ApiError } from './errors';

type TokenProvider = () => Promise<string | null>;

let _tokenProvider: TokenProvider | null = null;

/**
 * Wire up the Firebase token supplier. Call once at app startup:
 *   setTokenProvider(() => getAuth().currentUser?.getIdToken() ?? null)
 */
export function setTokenProvider(fn: TokenProvider): void {
  _tokenProvider = fn;
}

/**
 * Resolve a fresh ID token, or throw UNAUTHORIZED ApiError if no user.
 */
export async function resolveToken(): Promise<string> {
  if (!_tokenProvider) {
    const err: ApiError = {
      code: 'UNAUTHORIZED',
      message: 'No token provider configured. Call setTokenProvider() at app startup.',
    };
    throw err;
  }
  const token = await _tokenProvider();
  if (!token) {
    const err: ApiError = {
      code: 'UNAUTHORIZED',
      message: 'No authenticated user. Please sign in.',
    };
    throw err;
  }
  return token;
}
