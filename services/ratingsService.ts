/**
 * Ratings Service
 *
 * Firebase callable wrapper for submitting ride ratings.
 * Auth is implicit via Firebase token (context.auth.uid on backend).
 */

import { httpsCallable, FunctionsError } from 'firebase/functions';
import { getFirebaseFunctions } from '@rentascooter/auth';
import type { ApiResponse } from '@rentascooter/shared';

export interface SubmitRatingRequest {
  rideId: string;
  rating: number;
  comment?: string;
}

export async function submitRating(payload: SubmitRatingRequest): Promise<void> {
  const functions = getFirebaseFunctions();
  const callable = httpsCallable<SubmitRatingRequest, ApiResponse<null>>(
    functions,
    'submitRideRating'
  );

  let result;
  try {
    result = await callable(payload);
  } catch (err) {
    // Gracefully handle the case where the Cloud Function is not yet deployed.
    if (
      err instanceof FunctionsError &&
      (err.code === 'functions/not-found' || err.code === 'functions/unimplemented')
    ) {
      // Treat a missing callable as a no-op so the flow is not blocked during development.
      return;
    }
    throw err;
  }

  if (!result.data.success) {
    throw new Error(result.data.error?.message ?? 'Failed to submit rating');
  }
}
