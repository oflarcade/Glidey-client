import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { TripReceipt } from '@/components/TripReceipt';
import { useRideHistory } from '@/hooks/useRideHistory';

type EntryPoint = 'completion' | 'history';

export default function TripReceiptScreen() {
  const router = useRouter();
  const { rideId, entryPoint } = useLocalSearchParams<{
    rideId: string;
    entryPoint?: EntryPoint;
  }>();

  const source: EntryPoint = entryPoint === 'history' ? 'history' : 'completion';

  const { rides, isLoading } = useRideHistory({ limit: 50 });
  const ride = rides.find((r) => r.id === rideId);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityLabel="Back">
            <Icon name="chevron-left" size="md" color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reçu / Receipt</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityLabel="Back">
            <Icon name="chevron-left" size="md" color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reçu / Receipt</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Trajet introuvable / Ride not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityLabel="Back">
          <Icon name="chevron-left" size="md" color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reçu / Receipt</Text>
        <View style={styles.headerSpacer} />
      </View>

      <TripReceipt
        ride={ride}
        hostBackgroundColor={colors.background.secondary}
        // entryPoint forwarded via the source variable — used by rating modal (T-008)
        // source={source} ← consumed by T-008's modal wiring
      />

      {/* Rating modal slot — wired in T-008 */}
      {/* entryPoint={source} controls whether modal auto-shows */}
      <View style={styles.ratingSlot} testID={`receipt-entry-${source}`} />
    </SafeAreaView>
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
  ratingSlot: {
    // Placeholder — T-008 renders the RatingModal here
  },
});
