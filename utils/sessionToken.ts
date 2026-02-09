/**
 * Session token for Mapbox Search Box API (autocomplete).
 * One token per search session; same token used for suggest + retrieve.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a new session token (UUID v4).
 * Call when user focuses the search input; reuse for all suggest/retrieve in that session.
 */
export function generateSessionToken(): string {
  return uuidv4();
}
