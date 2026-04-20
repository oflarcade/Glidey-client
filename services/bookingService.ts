import { authedFetch, apiFetch, isApiError, DEMO_MODE_ERROR } from '@rentascooter/api';
import type {
  VehicleType,
  VehicleTypesResponse,
  FareEstimateRequest,
  FareEstimateResponse,
  CreateRideV2Request,
  CreateRideV2Response,
  CancelRideRequest,
  CancelRideResponse,
} from '@rentascooter/shared';

// ─── Demo fixtures (T-091) ────────────────────────────────────────────────────

const DEMO_VEHICLE_TYPES: VehicleType[] = [
  { id: 'demo-moto', name: 'Moto-taxi', iconKey: 'moto' },
  { id: 'demo-jakarta', name: 'Jakarta', iconKey: 'jakarta' },
  { id: 'demo-voiture', name: 'Voiture', iconKey: 'voiture' },
];

function demoFare(req: FareEstimateRequest): FareEstimateResponse {
  const base = (b: number, pk: number, pm: number) =>
    Math.round(b + (req.distanceM / 1_000) * pk + (req.durationS / 60) * pm);
  return {
    estimates: [
      { vehicleTypeId: 'demo-moto', vehicleTypeName: 'Moto-taxi', iconKey: 'moto', fareEstimate: base(300, 100, 15) },
      { vehicleTypeId: 'demo-jakarta', vehicleTypeName: 'Jakarta', iconKey: 'jakarta', fareEstimate: base(400, 120, 18) },
      { vehicleTypeId: 'demo-voiture', vehicleTypeName: 'Voiture', iconKey: 'voiture', fareEstimate: base(700, 200, 35) },
    ],
  };
}

function demoRide(): CreateRideV2Response {
  return { id: `demo-ride-${Date.now()}`, state: 'searching' };
}

const DEMO_CANCEL: CancelRideResponse = { success: true };

// ─── getVehicleTypes ──────────────────────────────────────────────────────────

export async function getVehicleTypes(): Promise<VehicleType[]> {
  try {
    const data = await apiFetch('GET', '/vehicle-types');
    return (data as VehicleTypesResponse).vehicleTypes;
  } catch (e) {
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) return DEMO_VEHICLE_TYPES;
    throw e;
  }
}

// ─── estimateFare ─────────────────────────────────────────────────────────────

export async function estimateFare(req: FareEstimateRequest): Promise<FareEstimateResponse> {
  try {
    const data = await apiFetch(
      'GET',
      `/fare/estimate?distanceM=${req.distanceM}&durationS=${req.durationS}`,
    );
    return data as FareEstimateResponse;
  } catch (e) {
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) return demoFare(req);
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
