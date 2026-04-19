import { normalizeError, type ApiError } from './errors';
import { resolveToken } from './auth';

export const API_BASE_URL: string =
  process.env['EXPO_PUBLIC_API_URL'] ?? 'http://34.140.138.4';

const TIMEOUT_MS = 10_000;

function joinUrl(base: string, path: string): string {
  return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH';

/**
 * Low-level fetch primitive. Bearer injection added by T-003 wrapper.
 * Throws ApiError on timeout, network failure, or non-2xx response.
 */
export async function apiFetch(
  method: HttpMethod,
  path: string,
  options: {
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const url = joinUrl(API_BASE_URL, path);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let response: Response | undefined;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    throw await normalizeError(e);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw await normalizeError(undefined, response);
  }

  // 204 No Content
  if (response.status === 204) return undefined;

  return response.json() as Promise<unknown>;
}

/**
 * Authenticated fetch — resolves Firebase ID token and injects Bearer header.
 * Use this for all endpoints that require a signed-in user.
 * Throws UNAUTHORIZED ApiError (without making a request) when no user is signed in.
 */
export async function authedFetch(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const token = await resolveToken();
  return apiFetch(method, path, {
    body,
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type { ApiError };
