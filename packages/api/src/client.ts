// HTTP client — implemented in T-002 (fetch verbs) and T-003 (Bearer injection)

export const API_BASE_URL: string =
  process.env['EXPO_PUBLIC_API_URL'] ?? 'http://34.140.138.4';
