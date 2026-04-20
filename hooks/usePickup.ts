import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocationStore, selectBestLocation } from '@rentascooter/shared';
import { reverseGeocode } from '@/services/pickupService';
import type { GeoPoint } from '@rentascooter/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UsePickupResult {
  pickupPoint: GeoPoint | null;
  pickupAddress: string | null;
  isGeocoding: boolean;
  showTooltip: boolean;
  onDragEnd: (point: GeoPoint) => void;
  dismissTooltip: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOOLTIP_KEY = '@glidey/pickup-tooltip-seen';

// ─── usePickup ────────────────────────────────────────────────────────────────

export function usePickup(): UsePickupResult {
  const bestLocation = useLocationStore(selectBestLocation);

  const [pickupPoint, setPickupPoint] = useState<GeoPoint | null>(null);
  const [pickupAddress, setPickupAddress] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Load tooltip persistence
  useEffect(() => {
    AsyncStorage.getItem(TOOLTIP_KEY)
      .then((val) => { if (val !== 'true') setShowTooltip(true); })
      .catch(() => {});
  }, []);

  // Seed pickup point from GPS on first mount; geocode address
  useEffect(() => {
    if (!bestLocation || pickupPoint) return;
    const point: GeoPoint = { latitude: bestLocation.latitude, longitude: bestLocation.longitude };
    setPickupPoint(point);
    setIsGeocoding(true);
    reverseGeocode(point)
      .then(setPickupAddress)
      .catch(() => setPickupAddress(null))
      .finally(() => setIsGeocoding(false));
  // Only re-run if GPS coordinates change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bestLocation?.latitude, bestLocation?.longitude]);

  const onDragEnd = useCallback(async (point: GeoPoint) => {
    setPickupPoint(point);
    setPickupAddress(null);
    setIsGeocoding(true);
    try {
      const addr = await reverseGeocode(point);
      setPickupAddress(addr);
    } catch {
      setPickupAddress(null);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const dismissTooltip = useCallback(() => {
    setShowTooltip(false);
    AsyncStorage.setItem(TOOLTIP_KEY, 'true').catch(() => {});
  }, []);

  return { pickupPoint, pickupAddress, isGeocoding, showTooltip, onDragEnd, dismissTooltip };
}
