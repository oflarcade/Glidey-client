/**
 * Rides Service
 *
 * REST wrappers for ride history.
 * Auth is sent via Bearer token by authedFetch.
 */

import { authedFetch } from '@rentascooter/api';
import type { Ride } from '@rentascooter/shared';

const RIDE_HISTORY_LIMIT_MIN = 1;
const RIDE_HISTORY_LIMIT_MAX = 50;
const RIDE_HISTORY_LIMIT_DEFAULT = 20;

function clampLimit(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface GetRideHistoryRequest {
  limit?: number;
}

export interface GetRideHistoryResponse {
  rides: Ride[];
}

/**
 * Get the current user's ride history.
 *
 * @param limit - Optional limit 1–50, default 20
 * @returns List of rides for the authenticated client (newest first)
 */
export async function getRideHistory(
  limit: number = RIDE_HISTORY_LIMIT_DEFAULT
): Promise<Ride[]> {
  const safeLimit = clampLimit(limit, RIDE_HISTORY_LIMIT_MIN, RIDE_HISTORY_LIMIT_MAX);
  const result = await authedFetch('GET', `/rides/history?limit=${safeLimit}`);

  if (Array.isArray(result)) {
    return result as Ride[];
  }

  if (result && typeof result === 'object' && Array.isArray((result as GetRideHistoryResponse).rides)) {
    return (result as GetRideHistoryResponse).rides;
  }

  throw new Error('Failed to get ride history');
}
