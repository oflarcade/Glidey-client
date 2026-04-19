import { authedFetch, isApiError, DEMO_MODE_ERROR, API_BASE_URL } from '@rentascooter/api';
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
      const t = setTimeout(
        () => {
          attempt += 1;
          if (attempt < 3) {
            scheduleAttempt();
          } else {
            onEvent({ state: 'matched', driver: DEMO_DRIVER });
          }
        },
        3_000,
      );
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
        const data = (await authedFetch('GET', `/rides/${rideId}/status`)) as MatchingEvent;
        handleEvent(data);
      } catch {
        // non-terminal; continue polling
      }
    }, POLL_MS);
  }

  function handleEvent(event: MatchingEvent) {
    const terminal = event.state === 'matched' || event.state === 'cancelled' || event.state === 'failed';
    onEvent(event);
    if (terminal) cleanup();
  }

  function connectWS() {
    const url = `${WS_BASE}/rides/${rideId}/events`;
    ws = new WebSocket(url);

    ws.onopen = () => stopPolling();

    ws.onmessage = (ev) => {
      try {
        const event = JSON.parse(String(ev.data)) as MatchingEvent;
        handleEvent(event);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => startPolling();

    ws.onclose = () => {
      if (!tearingDown) {
        startPolling();
        setTimeout(connectWS, POLL_MS);
      }
    };
  }

  function cleanup() {
    tearingDown = true;
    stopPolling();
    ws?.close();
    ws = null;
  }

  connectWS();
  return cleanup;
}

// ─── getMatchingStatus ────────────────────────────────────────────────────────

export async function getMatchingStatus(rideId: string): Promise<MatchingEvent> {
  try {
    const data = await authedFetch('GET', `/rides/${rideId}/status`);
    return data as MatchingEvent;
  } catch (e) {
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) {
      return { state: 'matched', driver: DEMO_DRIVER };
    }
    throw e;
  }
}
