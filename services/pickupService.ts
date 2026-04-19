import { authedFetch, isApiError, DEMO_MODE_ERROR } from '@rentascooter/api';
import type { GeoPoint, ConfirmPickupRequest, ConfirmPickupResponse } from '@rentascooter/shared';

// ─── Reverse geocoding ────────────────────────────────────────────────────────

const MAPBOX_TOKEN = process.env['EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN'] ?? '';

export async function reverseGeocode(point: GeoPoint): Promise<string> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${point.longitude},${point.latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1&language=fr`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocode HTTP ${res.status}`);
  const data = (await res.json()) as { features?: { place_name?: string }[] };
  const name = data.features?.[0]?.place_name;
  if (!name) throw new Error('Address not found');
  return name;
}

// ─── Confirm pickup (T-098 demo path co-located) ──────────────────────────────

export async function confirmPickup(
  rideId: string,
  pickup: GeoPoint,
): Promise<ConfirmPickupResponse> {
  const body: ConfirmPickupRequest = { rideId, pickup };
  try {
    const data = await authedFetch('POST', `/rides/${rideId}/confirm-pickup`, body);
    return (data as ConfirmPickupResponse) ?? { state: 'pickup_en_route' };
  } catch (e) {
    // Demo path (T-098) — bypass transmit, advance FSM locally
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) {
      return { state: 'pickup_en_route' };
    }
    throw e;
  }
}
