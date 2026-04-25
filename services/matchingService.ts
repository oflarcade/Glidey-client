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

function placeholderDriver(driverId: string): MatchedDriver {
  return {
    id: driverId,
    name: 'Conducteur assigné',
    vehiclePlate: '—',
    vehicleType: 'Moto',
    rating: 5,
    completedRides: 0,
    profilePhoto: undefined,
    location: { latitude: 0, longitude: 0 },
  };
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
        const event: MatchingEvent =
          state === 'matched'
            ? { state, driver: placeholderDriver(data.driverId ?? '') }
            : { state };
        handleEvent(event);
      } catch {
        // non-terminal; next interval fires normally
      }
    }, POLL_MS);
  }

  function handleEvent(event: MatchingEvent) {
    const terminal =
      event.state === 'matched' ||
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
      try {
        const raw = JSON.parse(String(ev.data)) as Record<string, unknown>;
        const event = raw['event'] as string | undefined;
        if (!event) return;

        // Filter to this ride's events only
        const evRideId = raw['rideId'] as string | undefined;
        if (evRideId && evRideId !== rideId) return;

        if (event === 'ride:accepted') {
          handleEvent({
            state: 'matched',
            driver: placeholderDriver((raw['driverId'] as string | undefined) ?? ''),
          });
        } else if (event === 'ride:cancelled') {
          handleEvent({ state: 'cancelled' });
        } else if (event === 'ride:started') {
          handleEvent({ state: 'pickup_en_route' });
        } else if (event === 'ride:completed') {
          handleEvent({ state: 'completed' });
        }
      } catch {
        // ignore malformed frames
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
      return { state, driver: placeholderDriver(data.driverId ?? '') };
    }
    return { state };
  } catch (e) {
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) {
      return { state: 'matched', driver: DEMO_DRIVER };
    }
    throw e;
  }
}
