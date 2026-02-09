/**
 * Map Firebase callable (HttpsError) codes to user-facing messages for location search.
 */

const ERROR_MESSAGES: Record<string, string> = {
  unauthenticated: 'Please sign in to search',
  'invalid-argument': 'Please check your search',
  'failed-precondition': 'Search is temporarily unavailable',
  'not-found': 'Location not found. Please search again',
  'resource-exhausted': 'Too many requests. Please wait a moment',
  internal: 'Something went wrong. Please try again',
};

const AUTH_CODE = 'unauthenticated';

function hasCode(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * Map a thrown error (e.g. from suggestLocation/retrieveLocation) to a user-facing message.
 */
export function mapLocationSearchError(error: unknown): string {
  if (hasCode(error) && error.code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[error.code];
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again';
}

/**
 * Whether the error indicates auth failure (redirect to login).
 */
export function isAuthError(error: unknown): boolean {
  return hasCode(error) && error.code === AUTH_CODE;
}
