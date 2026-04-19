export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'HTTP_ERROR'
  | 'DEMO_MODE';

export interface ApiError {
  code: ApiErrorCode;
  status?: number;
  message: string;
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  );
}

export async function normalizeError(
  e: unknown,
  response?: Response,
): Promise<ApiError> {
  if (isApiError(e)) return e;

  if (response) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (typeof body.message === 'string') message = body.message;
    } catch {
      // non-JSON body — use default message
    }
    return {
      code: response.status === 401 ? 'UNAUTHORIZED' : 'HTTP_ERROR',
      status: response.status,
      message,
    };
  }

  if (e instanceof Error) {
    if (e.name === 'AbortError') {
      return { code: 'TIMEOUT', message: 'Request timed out after 10s' };
    }
    return { code: 'NETWORK_ERROR', message: e.message };
  }

  return { code: 'NETWORK_ERROR', message: String(e) };
}
