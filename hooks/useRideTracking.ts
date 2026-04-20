import { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeToTracking } from '@/services/trackingService';
import type { GeoPoint } from '@rentascooter/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseRideTrackingResult {
  driverPosition: GeoPoint | null;
  currentEta: number;
  stale: boolean;
  progress: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STALE_MS = 12_000; // 2× poll interval + 2s grace

// ─── useRideTracking ──────────────────────────────────────────────────────────

export function useRideTracking(rideId: string | null): UseRideTrackingResult {
  const [driverPosition, setDriverPosition] = useState<GeoPoint | null>(null);
  const [currentEta, setCurrentEta] = useState(0);
  const [stale, setStale] = useState(false);
  const [progress, setProgress] = useState(0);

  const originalEtaRef = useRef<number | null>(null);
  const staleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetStaleTimer = useCallback(() => {
    if (staleTimer.current) clearTimeout(staleTimer.current);
    setStale(false);
    staleTimer.current = setTimeout(() => setStale(true), STALE_MS);
  }, []);

  useEffect(() => {
    if (!rideId) return;

    originalEtaRef.current = null;

    const cleanup = subscribeToTracking(rideId, (update) => {
      setDriverPosition(update.driverLocation);
      setCurrentEta(update.etaSeconds);

      // Seed or reset original ETA (>20% increase = T-112 reset)
      if (originalEtaRef.current === null) {
        originalEtaRef.current = update.etaSeconds;
      } else if (update.etaSeconds > originalEtaRef.current * 1.2) {
        originalEtaRef.current = update.etaSeconds;
      }

      const orig = originalEtaRef.current;
      if (orig > 0) {
        setProgress(Math.max(0, Math.min(1, 1 - update.etaSeconds / orig)));
      }

      resetStaleTimer();
    });

    return () => {
      cleanup();
      if (staleTimer.current) clearTimeout(staleTimer.current);
    };
  }, [rideId, resetStaleTimer]);

  return { driverPosition, currentEta, stale, progress };
}
