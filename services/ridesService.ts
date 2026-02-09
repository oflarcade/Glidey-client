/**
 * Rides Service
 *
 * Firebase callable wrappers for ride history.
 * Auth is implicit via Firebase token (context.auth.uid on backend).
 */

import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '@rentascooter/auth';
import type { ApiResponse, Ride } from '@rentascooter/shared';

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
  results: Ride[];
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
  const functions = getFirebaseFunctions();
  const callable = httpsCallable<
    GetRideHistoryRequest,
    ApiResponse<GetRideHistoryResponse>
  >(functions, 'getRideHistory');

  const result = await callable({ limit: safeLimit });

  if (!result.data.success || !result.data.data) {
    throw new Error(
      result.data.error?.message ?? 'Failed to get ride history'
    );
  }

  return result.data.data.results ?? [];
}
