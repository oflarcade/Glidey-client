import { normalizeError, isApiError, type ApiError } from './errors';
import { resolveToken } from './auth';
import { refreshToken } from './refresh';

export const API_BASE_URL: string =
  process.env['EXPO_PUBLIC_API_URL'] ?? 'http://34.140.138.4';

const TIMEOUT_MS = 10_000;

const IS_DEMO = process.env['EXPO_PUBLIC_USE_DEMO'] === 'true';

/** Thrown by apiFetch/authedFetch when demo mode is active instead of making a real HTTP request. */
export const DEMO_MODE_ERROR: ApiError = {
  code: 'DEMO_MODE',
  message: 'Demo mode active — no HTTP request dispatched.',
} as const;

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
  if (IS_DEMO) throw DEMO_MODE_ERROR;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const url = joinUrl(API_BASE_URL, path);
  const headers: Record<string, string> = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
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
 * On a server 401, forces a token refresh and replays the request exactly once.
 * A second 401 surfaces as UNAUTHORIZED without another retry.
 * Throws UNAUTHORIZED ApiError (without making a request) when no user is signed in.
 */
export async function authedFetch(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const token = await resolveToken();
  try {
    return await apiFetch(method, path, {
      body,
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    // Server 401 (has status field) → force-refresh then replay once
    if (isApiError(e) && e.code === 'UNAUTHORIZED' && e.status === 401) {
      const freshToken = await refreshToken();
      return await apiFetch(method, path, {
        body,
        headers: { Authorization: `Bearer ${freshToken}` },
      });
    }
    throw e;
  }
}

export type { ApiError };
