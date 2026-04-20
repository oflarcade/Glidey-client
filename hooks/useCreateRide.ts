import { useState, useRef, useCallback } from 'react';
import { useRideStore } from '@rentascooter/shared';
import { createRide } from '@/services/bookingService';
import type { GeoPoint, Location } from '@rentascooter/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseCreateRideParams {
  pickup: GeoPoint | null;
  destination: Location | null;
  distanceM: number;
  durationS: number;
  vehicleTypeId: string | null;
}

export interface UseCreateRideResult {
  createRide: () => Promise<void>;
  isCreating: boolean;
  error: string | null;
  rideId: string | null;
}

// ─── useCreateRide ────────────────────────────────────────────────────────────

export function useCreateRide({
  pickup,
  destination,
  distanceM,
  durationS,
  vehicleTypeId,
}: UseCreateRideParams): UseCreateRideResult {
  const transition = useRideStore((s) => s.transition);
  const storeRideId = useRideStore((s) => s.rideId);

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busyRef = useRef(false);

  const handleCreateRide = useCallback(async () => {
    if (busyRef.current || !pickup || !destination) return;
    busyRef.current = true;
    setIsCreating(true);
    setError(null);
    try {
      const res = await createRide({
        pickup,
        destination,
        distanceM,
        durationS,
        ...(vehicleTypeId ? { vehicleTypeId } : {}),
      });
      transition('searching', { rideId: res.id });
    } catch (e) {
      // Preserve ride state on failure — do NOT silently discard
      setError((e as { message?: string })?.message ?? 'Failed to create ride');
    } finally {
      busyRef.current = false;
      setIsCreating(false);
    }
  }, [pickup, destination, distanceM, durationS, vehicleTypeId, transition]);

  return {
    createRide: handleCreateRide,
    isCreating,
    error,
    rideId: storeRideId,
  };
}
