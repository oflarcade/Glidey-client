import { authedFetch, isApiError, DEMO_MODE_ERROR } from '@rentascooter/api';
import type {
  FareEstimateRequest,
  FareEstimateResponse,
  CreateRideV2Request,
  CreateRideV2Response,
  CancelRideRequest,
  CancelRideResponse,
} from '@rentascooter/shared';

// ─── Demo fixtures (T-091) ────────────────────────────────────────────────────

const DEMO_FARE: FareEstimateResponse = { fareEstimate: 1250 };

function demoRide(): CreateRideV2Response {
  return { id: `demo-ride-${Date.now()}`, state: 'searching' };
}

const DEMO_CANCEL: CancelRideResponse = { success: true };

// ─── estimateFare ─────────────────────────────────────────────────────────────

export async function estimateFare(req: FareEstimateRequest): Promise<FareEstimateResponse> {
  try {
    const data = await authedFetch(
      'GET',
      `/rides/estimate?distanceM=${req.distanceM}&durationS=${req.durationS}`,
    );
    return data as FareEstimateResponse;
  } catch (e) {
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) return DEMO_FARE;
    throw e;
  }
}

// ─── createRide ───────────────────────────────────────────────────────────────

export async function createRide(req: CreateRideV2Request): Promise<CreateRideV2Response> {
  try {
    const data = await authedFetch('POST', '/rides/create', req);
    return data as CreateRideV2Response;
  } catch (e) {
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) return demoRide();
    throw e;
  }
}

// ─── cancelRide ───────────────────────────────────────────────────────────────

export async function cancelRide(req: CancelRideRequest): Promise<CancelRideResponse> {
  try {
    const data = await authedFetch('POST', `/rides/${req.rideId}/cancel`);
    return (data as CancelRideResponse) ?? DEMO_CANCEL;
  } catch (e) {
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) return DEMO_CANCEL;
    throw e;
  }
}
