import { authedFetch, API_BASE_URL } from '@rentascooter/api';
import type { TrackingPositionUpdate } from '@rentascooter/shared';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_MS = 5_000;
const WS_BASE = API_BASE_URL.replace(/^https?/, 'ws');
const KEEP_AWAKE_TAG = 'glidey-tracking';

export type TrackingCleanup = () => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidTrackingUpdate(value: unknown): value is TrackingPositionUpdate {
  if (!isRecord(value)) return false;
  if (typeof value['rideId'] !== 'string' || value['rideId'].length === 0) return false;
  if (!isRecord(value['driverLocation'])) return false;
  if (
    typeof value['driverLocation']['latitude'] !== 'number' ||
    !Number.isFinite(value['driverLocation']['latitude']) ||
    typeof value['driverLocation']['longitude'] !== 'number' ||
    !Number.isFinite(value['driverLocation']['longitude'])
  ) {
    return false;
  }
  if (typeof value['etaSeconds'] !== 'number' || !Number.isFinite(value['etaSeconds'])) return false;
  if (typeof value['timestamp'] !== 'number' || !Number.isFinite(value['timestamp'])) return false;
  return true;
}

// ─── subscribeToTracking ──────────────────────────────────────────────────────

export function subscribeToTracking(
  rideId: string,
  onUpdate: (update: TrackingPositionUpdate) => void,
): TrackingCleanup {
  // Keep screen awake for duration of tracking (T-096, R4)
  activateKeepAwake(KEEP_AWAKE_TAG);

  // Demo path (T-099) — scripted position stream + ETA decrement, no HTTP/WS
  if (process.env['EXPO_PUBLIC_USE_DEMO'] === 'true') {
    let etaSeconds = 300;
    const interval = setInterval(() => {
      etaSeconds = Math.max(0, etaSeconds - POLL_MS / 1_000);
      onUpdate({
        rideId,
        driverLocation: {
          latitude: 14.695 + (Math.random() - 0.5) * 0.002,
          longitude: -17.444 + (Math.random() - 0.5) * 0.002,
        },
        etaSeconds,
        timestamp: Date.now(),
      });
    }, POLL_MS);
    return () => {
      clearInterval(interval);
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
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
        const data = await authedFetch('GET', `/rides/${rideId}/position`);
        if (!isValidTrackingUpdate(data)) return;
        onUpdate(data);
      } catch {
        // Polling failure is non-terminal (T-119): surface via ApiError but keep tracking alive
      }
    }, POLL_MS);
  }

  function connectWS() {
    ws = new WebSocket(`${WS_BASE}/rides/${rideId}/tracking`);

    ws.onopen = () => stopPolling();

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(String(ev.data)) as unknown;
        if (!isValidTrackingUpdate(data)) return;
        onUpdate(data);
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

  connectWS();

  return () => {
    tearingDown = true;
    stopPolling();
    ws?.close();
    ws = null;
    deactivateKeepAwake(KEEP_AWAKE_TAG);
  };
}
