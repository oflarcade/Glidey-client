import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { TripReceipt } from '@/components/TripReceipt';
import { RatingModal } from '@/components/RatingModal';
import { useRideHistory } from '@/hooks/useRideHistory';
import { useRideStore } from '@rentascooter/shared';
import { submitRating } from '@/services/ratingsService';
import { useTranslation } from '@rentascooter/i18n';
import type { Ride, MatchedDriver, JourneyData } from '@rentascooter/shared';

type EntryPoint = 'completion' | 'history';

const RATING_MODAL_DELAY_MS = 5000;
const BRAND_BG = colors.primary.main; // golden yellow #FFC629
const HEADER_SPACER_WIDTH = 32;

// Synthesize a Ride from rideStore journey data for demo/completion mode when
// backend history hasn't synced yet. Uses all data captured at booking time.
function buildDemoRide(rideId: string, driver: MatchedDriver | null, journey: JourneyData | null): Ride {
  const nameParts = driver?.name?.split(' ') ?? [];
  const fareTotal = journey?.fareTotal ?? 0;
  return {
    id: rideId,
    clientId: '',
    pickup: journey?.pickup ?? { latitude: 0, longitude: 0, address: '—' },
    destination: journey?.destination ?? { latitude: 0, longitude: 0, address: '—' },
    status: 'completed',
    fare: { baseFare: fareTotal, distanceFare: 0, timeFare: 0, total: fareTotal, currency: 'XOF' },
    discountXof: journey?.discountXof ?? null,
    route: journey?.distanceM ? { distanceM: journey.distanceM, durationS: 0, polyline: '' } : undefined,
    timestamps: { requestedAt: new Date() },
    createdAt: new Date(),
    updatedAt: new Date(),
    driverInfo: driver
      ? {
          firstName: nameParts[0] ?? driver.name,
          lastName: nameParts.slice(1).join(' '),
          profilePicture: driver.profilePhoto ?? null,
          rating: driver.rating,
          vehicleInfo: { licensePlate: driver.vehiclePlate },
        }
      : undefined,
  };
}

export default function TripReceiptScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { rideId, entryPoint } = useLocalSearchParams<{
    rideId: string;
    entryPoint?: EntryPoint;
  }>();

  const source: EntryPoint = entryPoint === 'history' ? 'history' : 'completion';
  const resetRideStore = useRideStore((s) => s.reset);
  const matchedDriver = useRideStore((s) => s.matchedDriver);
  const journey = useRideStore((s) => s.journey);

  const { rides, isLoading } = useRideHistory({ limit: 50 });
  const rideFromHistory = rides.find((r) => r.id === rideId);

  // Completion flow: always show something — use real ride when history syncs, demo fallback otherwise.
  // History flow: wait for real ride or show "not found".
  const ride: Ride | undefined =
    rideFromHistory ??
    (source === 'completion' && rideId ? buildDemoRide(rideId, matchedDriver, journey) : undefined);

  const [modalVisible, setModalVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Auto-show rating modal 5 s after arrival — only on completion flow
  useEffect(() => {
    if (source !== 'completion') return;
    const id = setTimeout(() => setModalVisible(true), RATING_MODAL_DELAY_MS);
    return () => clearTimeout(id);
  }, [source]);

  const navigateToMap = useCallback(() => {
    router.replace('/');
  }, [router]);

  // Dismiss without rating → just close the modal; user stays on the receipt to review it.
  // Store reset happens in handleBack when they actually leave.
  const handleDismiss = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleSubmit = useCallback(
    async (rating: number, comment?: string) => {
      if (!rideId) return;
      setSubmitLoading(true);
      try {
        await submitRating({ rideId, rating, comment });
        setModalVisible(false);
        resetRideStore();
        navigateToMap();
      } catch {
        Alert.alert(
          t('common.error'),
          t('errors.rating_submit_failed'),
          [{ text: 'OK' }]
        );
      } finally {
        setSubmitLoading(false);
      }
    },
    [rideId, resetRideStore, navigateToMap, t]
  );

  const handleBack = useCallback(() => {
    if (source === 'completion') resetRideStore();
    router.back();
  }, [router, source, resetRideStore]);

  // Only check real history for already-rated state (demo ride has no rating)
  const isAlreadyRated = Boolean(rideFromHistory?.rating?.clientToDriver);

  // Show loading spinner only for history flow — completion always has a fallback
  if (isLoading && source === 'history') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header onBack={handleBack} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.text.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header onBack={handleBack} />
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>{t('errors.ride_not_found')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header onBack={handleBack} />

      <TripReceipt ride={ride} hostBackgroundColor={BRAND_BG} discountAmount={ride.discountXof ?? undefined} />

      {source === 'completion' && !isAlreadyRated ? (
        <RatingModal
          visible={modalVisible}
          onSubmit={handleSubmit}
          onDismiss={handleDismiss}
          loading={submitLoading}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const backLabel = t('common.back');

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        accessibilityLabel={backLabel}
        accessibilityRole="button"
      >
        <Icon name="chevron-left" size="md" color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{t('client.trip_receipt')}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'transparent', // floats on brand-colored background
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
  },
  headerSpacer: {
    width: HEADER_SPACER_WIDTH,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    ...typography.body,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
