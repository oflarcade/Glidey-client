import { useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRideStore } from '@rentascooter/shared';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { useBooking } from '@/hooks/useBooking';
import { MatchingModal } from '@/components/MatchingModal/MatchingModal';
import { DriverReveal } from '@/components/DriverReveal/DriverReveal';
import type { GeoPoint, Location } from '@rentascooter/shared';

// ─── XOF formatter ────────────────────────────────────────────────────────────

function formatXOF(amount: number): string {
  return (
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(amount)) +
    ' XOF'
  );
}

// ─── BookingScreen ────────────────────────────────────────────────────────────

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    pickupLat: string;
    pickupLng: string;
    destLat: string;
    destLng: string;
    destAddress: string;
    destName: string;
    distanceM: string;
    durationS: string;
  }>();

  const pickup: GeoPoint = {
    latitude: parseFloat(params.pickupLat ?? '0'),
    longitude: parseFloat(params.pickupLng ?? '0'),
  };

  const destination: Location = {
    latitude: parseFloat(params.destLat ?? '0'),
    longitude: parseFloat(params.destLng ?? '0'),
    address: params.destAddress ?? '',
    name: params.destName ?? '',
  };

  const distanceM = parseFloat(params.distanceM ?? '0');
  const durationS = parseFloat(params.durationS ?? '0');

  const rideState = useRideStore((s) => s.rideState);
  const rideId = useRideStore((s) => s.rideId);

  const { fareEstimates, selectedVehicleTypeId, isFareLoading, fareError, isBusy, bookRide, cancel } = useBooking({
    pickup,
    destination,
    distanceM,
    durationS,
  });

  const selectedEstimate = fareEstimates?.find((e) => e.vehicleTypeId === selectedVehicleTypeId) ?? fareEstimates?.[0] ?? null;
  const canBook = !isFareLoading && !fareError && selectedEstimate !== null && !isBusy;
  const isSearching = rideState === 'searching';
  const isMatched = rideState === 'matched';

  const handleCancel = useCallback(async () => {
    await cancel();
    if (rideState === 'idle' || rideState === 'cancelled') {
      router.back();
    }
  }, [cancel, rideState, router]);

  const handleMatchingCancel = useCallback(async () => {
    await cancel();
    router.back();
  }, [cancel, router]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Votre course</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Destination row */}
        <View style={styles.row}>
          <Text style={styles.label}>Destination</Text>
          <Text style={styles.value} numberOfLines={1}>
            {destination.name || destination.address || '—'}
          </Text>
        </View>

        {/* Distance row */}
        <View style={styles.row}>
          <Text style={styles.label}>Distance</Text>
          <Text style={styles.value}>
            {distanceM > 0 ? `${(distanceM / 1000).toFixed(1)} km` : '—'}
          </Text>
        </View>

        {/* Fare row */}
        <View style={[styles.row, styles.fareRow]}>
          <Text style={styles.label}>Tarif estimé</Text>
          {isFareLoading ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : fareError ? (
            <Text style={styles.errorText}>Indisponible</Text>
          ) : selectedEstimate ? (
            <Text style={styles.fareText}>{formatXOF(selectedEstimate.fareEstimate)}</Text>
          ) : (
            <Text style={styles.value}>—</Text>
          )}
        </View>

        {fareError && (
          <Text style={styles.errorBanner}>{fareError}</Text>
        )}
      </View>

      {/* Book Now */}
      <View style={styles.footer}>
        {/* Cancel — visible only while searching (T-101) */}
        {isSearching && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={isBusy}>
            <Text style={styles.cancelBtnText}>Annuler la recherche</Text>
          </TouchableOpacity>
        )}

        {!isSearching && !isMatched && (
          <TouchableOpacity
            style={[styles.bookBtn, !canBook && styles.bookBtnDisabled]}
            onPress={bookRide}
            disabled={!canBook}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.bookBtnText}>Réserver maintenant</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Matching overlay — shown during search (T-102, T-103) */}
      <MatchingModal
        visible={isSearching}
        rideId={rideId}
        onCancel={handleMatchingCancel}
      />

      {/* Driver reveal — shown on match (T-104) */}
      <DriverReveal visible={isMatched} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: { ...typography.h2, color: colors.text.primary },
  closeBtn: { padding: spacing.sm },
  closeBtnText: { fontSize: 18, color: colors.text.secondary },

  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  fareRow: { marginTop: spacing.sm },
  label: { ...typography.body, color: colors.text.secondary },
  value: { ...typography.body, color: colors.text.primary, flex: 1, textAlign: 'right' },
  fareText: { fontSize: 20, fontWeight: '700', color: colors.text.primary },
  errorText: { ...typography.body, color: '#E53E3E' },
  errorBanner: {
    marginTop: spacing.sm,
    color: '#E53E3E',
    ...typography.caption,
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  bookBtn: {
    backgroundColor: colors.primary.main,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  bookBtnDisabled: { opacity: 0.45 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.text.secondary, fontSize: 15 },
});
