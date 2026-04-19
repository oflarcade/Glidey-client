// ApiError shape and normalization helpers — implemented in T-004
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
