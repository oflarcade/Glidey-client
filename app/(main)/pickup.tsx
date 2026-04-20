import { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useRideStore } from '@rentascooter/shared';
import { PickupPinSheet } from '@rentascooter/ui';
import { usePickup } from '@/hooks/usePickup';
import { confirmPickup } from '@/services/pickupService';
import type { GeoPoint } from '@rentascooter/shared';

// ─── PickupScreen (T-108, T-110, T-118) ──────────────────────────────────────

export default function PickupScreen() {
  const router = useRouter();
  const rideState = useRideStore((s) => s.rideState);
  const rideId = useRideStore((s) => s.rideId);
  const transition = useRideStore((s) => s.transition);

  // T-110: gate — only reachable from matched state
  useEffect(() => {
    if (rideState !== 'matched') router.back();
  }, [rideState, router]);

  const { pickupPoint, pickupAddress, isGeocoding, showTooltip, onDragEnd, dismissTooltip } =
    usePickup();

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleConfirm = useCallback(
    async (point: GeoPoint) => {
      if (!rideId || isConfirming) return;
      setIsConfirming(true);
      setConfirmError(null);
      try {
        await confirmPickup(rideId, point);
        transition('pickup_en_route');
        router.replace('/(main)/tracking');
      } catch (e) {
        // T-118: remain on surface, show error, allow retry
        setConfirmError(
          (e as { message?: string })?.message ?? 'Impossible de confirmer. Réessayez.',
        );
      } finally {
        setIsConfirming(false);
      }
    },
    [rideId, isConfirming, transition, router],
  );

  if (!pickupPoint) return null;

  return (
    <View style={styles.root}>
      <PickupPinSheet
        position={pickupPoint}
        onDragEnd={onDragEnd}
        onConfirm={handleConfirm}
        addressLabel={pickupAddress ?? undefined}
        isGeocoding={isGeocoding}
        showTooltip={showTooltip}
        onTooltipDismiss={dismissTooltip}
        isConfirming={isConfirming}
        confirmError={confirmError ?? undefined}
        style={styles.sheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sheet: { flex: 1 },
});
