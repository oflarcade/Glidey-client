import { useState, useEffect, useRef, useCallback } from 'react';
import { useRideStore } from '@rentascooter/shared';
import { estimateFare, createRide, cancelRide } from '@/services/bookingService';
import type { GeoPoint, Location, FareEstimateResponse } from '@rentascooter/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseBookingParams {
  pickup: GeoPoint | null;
  destination: Location | null;
  distanceM: number;
  durationS: number;
}

export interface UseBookingResult {
  fareEstimate: FareEstimateResponse | null;
  isFareLoading: boolean;
  fareError: string | null;
  isBusy: boolean;
  bookRide: () => Promise<void>;
  cancel: () => Promise<void>;
}

// ─── useBooking ───────────────────────────────────────────────────────────────

export function useBooking({
  pickup,
  destination,
  distanceM,
  durationS,
}: UseBookingParams): UseBookingResult {
  const transition = useRideStore((s) => s.transition);
  const rideId = useRideStore((s) => s.rideId);

  const [fareEstimate, setFareEstimate] = useState<FareEstimateResponse | null>(null);
  const [isFareLoading, setIsFareLoading] = useState(false);
  const [fareError, setFareError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const busyRef = useRef(false);

  // Auto-fetch fare estimate when route metrics are available
  useEffect(() => {
    if (!distanceM || !durationS) {
      setFareEstimate(null);
      setFareError(null);
      return;
    }

    let cancelled = false;
    setIsFareLoading(true);
    setFareError(null);
    setFareEstimate(null);

    estimateFare({ distanceM, durationS })
      .then((data) => {
        if (!cancelled) setFareEstimate(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setFareError((err as { message?: string })?.message ?? 'Failed to estimate fare');
      })
      .finally(() => {
        if (!cancelled) setIsFareLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [distanceM, durationS]);

  const bookRide = useCallback(async () => {
    if (busyRef.current || !pickup || !destination) return;
    busyRef.current = true;
    setIsBusy(true);
    try {
      const res = await createRide({ pickup, destination, distanceM, durationS });
      transition('searching', { rideId: res.id });
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }, [pickup, destination, distanceM, durationS, transition]);

  const cancel = useCallback(async () => {
    if (busyRef.current || !rideId) return;
    busyRef.current = true;
    setIsBusy(true);
    try {
      await cancelRide({ rideId });
      transition('cancelled');
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }, [rideId, transition]);

  return { fareEstimate, isFareLoading, fareError, isBusy, bookRide, cancel };
}
