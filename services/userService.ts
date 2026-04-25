import { authedFetch, isApiError } from '@rentascooter/api';

export async function ensureClientProfile(params: {
  phone: string;
  name: string;
  email?: string;
}): Promise<void> {
  try {
    await authedFetch('POST', '/users/client', params);
  } catch (e) {
    if (isApiError(e) && e.status === 409) return;
    throw e;
  }
}
