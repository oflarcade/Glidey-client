import { authedFetch, resolveToken, isApiError, DEMO_MODE_ERROR, API_BASE_URL } from '@rentascooter/api';
import type { MatchedDriver, RideState } from '@rentascooter/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchingEvent {
  state: RideState;
  driver?: MatchedDriver;
}

export type MatchingCleanup = () => void;

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_MS = 5_000;
const WS_BASE = API_BASE_URL.replace(/^https?/, 'ws');

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface RideStatusResponse {
  id: string;
  status: string;
  driverId?: string | null;
  driver?: MatchedDriver;
}

function mapStatus(status: string): RideState | null {
  const MAP: Record<string, RideState> = {
    pending: 'searching',
    accepted: 'matched',
    active: 'pickup_en_route',
    completed: 'completed',
    cancelled: 'cancelled',
  };
  return MAP[status] ?? null;
}

interface RideDriverProfileResponse {
  rideId: string;
  driverId: string;
  name: string;
  photoUrl: string | null;
  vehicleType: string;
  vehiclePlate: string;
  rating: number | null;
  totalTrips: number;
}

interface TrackingPositionResponse {
  rideId: string;
  driverLocation: { latitude: number; longitude: number };
  etaSeconds: number;
  timestamp: number;
}

interface RawRealtimePayload {
  event?: unknown;
  rideId?: unknown;
  driverId?: unknown;
  driver?: unknown;
  payload?: unknown;
  data?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isMatchedDriver(value: unknown): value is MatchedDriver {
  if (!isRecord(value)) return false;
  if (typeof value['id'] !== 'string' || value['id'].length === 0) return false;
  if (typeof value['name'] !== 'string' || value['name'].length === 0) return false;
  if (typeof value['vehiclePlate'] !== 'string' || value['vehiclePlate'].length === 0) return false;
  if (typeof value['vehicleType'] !== 'string' || value['vehicleType'].length === 0) return false;
  if (!isValidNumber(value['rating'])) return false;
  if (!isValidNumber(value['completedRides'])) return false;
  if (value['profilePhoto'] !== undefined && value['profilePhoto'] !== null && typeof value['profilePhoto'] !== 'string') {
    return false;
  }
  if (!isRecord(value['location'])) return false;
  return isValidNumber(value['location']['latitude']) && isValidNumber(value['location']['longitude']);
}

function mapDriverFromProfile(
  profile: RideDriverProfileResponse,
  tracking: TrackingPositionResponse | null,
): MatchedDriver {
  return {
    id: profile.driverId,
    name: profile.name,
    vehiclePlate: profile.vehiclePlate,
    vehicleType: profile.vehicleType,
    rating: profile.rating ?? 0,
    completedRides: profile.totalTrips,
    profilePhoto: profile.photoUrl ?? undefined,
    location: tracking?.driverLocation ?? { latitude: 0, longitude: 0 },
    etaSeconds: tracking?.etaSeconds,
  };
}

async function resolveMatchedDriver(
  rideId: string,
  eventDriver: unknown,
): Promise<MatchedDriver | undefined> {
  if (isMatchedDriver(eventDriver)) {
    return eventDriver;
  }

  const profile = (await authedFetch('GET', `/rides/${rideId}/driver-profile`)) as RideDriverProfileResponse;
  let tracking: TrackingPositionResponse | null = null;
  try {
    tracking = (await authedFetch('GET', `/rides/${rideId}/position`)) as TrackingPositionResponse;
  } catch {
    tracking = null;
  }
  return mapDriverFromProfile(profile, tracking);
}

function parseRealtimePayload(data: string): RawRealtimePayload | null {
  try {
    const parsed = JSON.parse(data);
    return isRecord(parsed) ? parsed as RawRealtimePayload : null;
  } catch {
    return null;
  }
}

function getNestedRecordCandidate(raw: RawRealtimePayload): Record<string, unknown> | null {
  if (isRecord(raw.payload)) return raw.payload;
  if (isRecord(raw.data)) return raw.data;
  return null;
}

function getRealtimeRideId(raw: RawRealtimePayload): string | undefined {
  if (typeof raw.rideId === 'string') return raw.rideId;
  const nested = getNestedRecordCandidate(raw);
  if (nested && typeof nested['rideId'] === 'string') return nested['rideId'];
  return undefined;
}

function getRealtimeDriver(raw: RawRealtimePayload): unknown {
  if (raw.driver !== undefined) return raw.driver;
  const nested = getNestedRecordCandidate(raw);
  if (nested && nested['driver'] !== undefined) return nested['driver'];
  return undefined;
}

// ─── Demo fixture (T-097) ─────────────────────────────────────────────────────

const DEMO_DRIVER: MatchedDriver = {
  id: 'demo-driver-1',
  name: 'Moussa Diallo',
  vehiclePlate: 'DK-1234-A',
  vehicleType: 'Scooter',
  rating: 4.8,
  completedRides: 142,
  profilePhoto: undefined,
  location: { latitude: 14.6961, longitude: -17.4473 },
  etaSeconds: 30,
};

// ─── subscribeToMatching ──────────────────────────────────────────────────────

export function subscribeToMatching(
  rideId: string,
  onEvent: (event: MatchingEvent) => void,
): MatchingCleanup {
  // Demo path (T-097) — deterministic delay, no HTTP/WS
  if (process.env['EXPO_PUBLIC_USE_DEMO'] === 'true') {
    let attempt = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    function scheduleAttempt() {
      const t = setTimeout(() => {
        attempt += 1;
        if (attempt < 3) {
          scheduleAttempt();
        } else {
          onEvent({ state: 'matched', driver: DEMO_DRIVER });
        }
      }, 3_000);
      timers.push(t);
    }
    scheduleAttempt();
    return () => timers.forEach(clearTimeout);
  }

  // ─── Real path ─────────────────────────────────────────────────────────────

  let ws: WebSocket | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let tearingDown = false;

  function stopPolling() {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function startPolling() {
    if (pollTimer !== null) return;
    pollTimer = setInterval(async () => {
      try {
        const data = (await authedFetch('GET', `/rides/${rideId}`)) as RideStatusResponse;
        const state = mapStatus(data.status);
        if (!state) return;
        const event: MatchingEvent = { state };
        if (state === 'matched') {
          event.driver = data.driver && isMatchedDriver(data.driver)
            ? data.driver
            : await resolveMatchedDriver(rideId, undefined);
          if (!event.driver) return;
        }
        handleEvent(event);
      } catch {
        // non-terminal; next interval fires normally
      }
    }, POLL_MS);
  }

  function handleEvent(event: MatchingEvent) {
    const terminal =
      event.state === 'matched' ||
      event.state === 'completed' ||
      event.state === 'cancelled' ||
      event.state === 'failed';
    onEvent(event);
    if (terminal) cleanup();
  }

  async function connectWS() {
    let token: string;
    try {
      token = await resolveToken();
    } catch {
      startPolling();
      return;
    }

    const url = `${WS_BASE}/realtime?token=${encodeURIComponent(token)}`;
    ws = new WebSocket(url);

    ws.onopen = () => stopPolling();

    ws.onmessage = (ev) => {
      const raw = parseRealtimePayload(String(ev.data));
      if (!raw || typeof raw.event !== 'string') return;

      const eventRideId = getRealtimeRideId(raw);
      if (eventRideId !== rideId) return;

      if (raw.event === 'ride:accepted') {
        void resolveMatchedDriver(rideId, getRealtimeDriver(raw))
          .then((driver) => {
            if (!driver) return;
            handleEvent({ state: 'matched', driver });
          })
          .catch(() => {
            // non-terminal; polling fallback can still recover matched state
          });
      } else if (raw.event === 'ride:cancelled') {
        handleEvent({ state: 'cancelled' });
      } else if (raw.event === 'ride:started') {
        handleEvent({ state: 'pickup_en_route' });
      } else if (raw.event === 'ride:completed') {
        handleEvent({ state: 'completed' });
      }
    };

    ws.onerror = () => startPolling();

    ws.onclose = () => {
      if (!tearingDown) {
        startPolling();
        setTimeout(() => { void connectWS(); }, POLL_MS);
      }
    };
  }

  function cleanup() {
    tearingDown = true;
    stopPolling();
    ws?.close();
    ws = null;
  }

  void connectWS();
  return cleanup;
}

// ─── getMatchingStatus ────────────────────────────────────────────────────────

export async function getMatchingStatus(rideId: string): Promise<MatchingEvent> {
  try {
    const data = (await authedFetch('GET', `/rides/${rideId}`)) as RideStatusResponse;
    const state = mapStatus(data.status) ?? 'searching';
    if (state === 'matched') {
      return {
        state,
        driver: data.driver && isMatchedDriver(data.driver)
          ? data.driver
          : await resolveMatchedDriver(rideId, undefined),
      };
    }
    return { state };
  } catch (e) {
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) {
      return { state: 'matched', driver: DEMO_DRIVER };
    }
    throw e;
  }
}
