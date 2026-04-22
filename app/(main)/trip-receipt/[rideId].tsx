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

type EntryPoint = 'completion' | 'history';

const RATING_MODAL_DELAY_MS = 5000;

export default function TripReceiptScreen() {
  const router = useRouter();
  const { rideId, entryPoint } = useLocalSearchParams<{
    rideId: string;
    entryPoint?: EntryPoint;
  }>();

  const source: EntryPoint = entryPoint === 'history' ? 'history' : 'completion';
  const resetRideStore = useRideStore((s) => s.reset);

  const { rides, isLoading } = useRideHistory({ limit: 50 });
  const ride = rides.find((r) => r.id === rideId);

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

  // Dismiss without submitting → back to map + reset ride state
  const handleDismiss = useCallback(() => {
    setModalVisible(false);
    resetRideStore();
    navigateToMap();
  }, [navigateToMap, resetRideStore]);

  // Submit rating → backend → back to map + reset
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
          'Erreur / Error',
          'Impossible d\'envoyer la note. Réessayez.\n\nFailed to submit rating. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setSubmitLoading(false);
      }
    },
    [rideId, resetRideStore, navigateToMap]
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const isAlreadyRated = Boolean(ride?.rating?.clientToDriver);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header onBack={handleBack} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header onBack={handleBack} />
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Trajet introuvable / Ride not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header onBack={handleBack} />

      <TripReceipt
        ride={ride}
        hostBackgroundColor={colors.background.secondary}
      />

      {/* Rating modal — auto-shows 5 s after completion flow arrival; not shown for history flow or already-rated rides */}
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
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel="Back">
        <Icon name="chevron-left" size="md" color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Reçu / Receipt</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
  },
  headerSpacer: {
    width: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
