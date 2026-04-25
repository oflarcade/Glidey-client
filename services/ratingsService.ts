/**
 * Ratings Service
 *
 * REST wrapper for submitting ride ratings.
 * Auth is sent via Bearer token by authedFetch.
 */

import { authedFetch, isApiError, DEMO_MODE_ERROR } from '@rentascooter/api';

export interface SubmitRatingRequest {
  rideId: string;
  rating: number;
  comment?: string;
}

export async function submitRating(payload: SubmitRatingRequest): Promise<void> {
  try {
    const body = {
      rating: payload.rating,
      ...(payload.comment ? { comment: payload.comment } : {}),
    };
    await authedFetch('POST', `/rides/${payload.rideId}/rating`, body);
  } catch (err) {
    // Keep completion UX non-blocking in demo mode where no backend request is made.
    if (isApiError(err) && err.code === DEMO_MODE_ERROR.code) return;
    throw err;
  }
}
