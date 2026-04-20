import { memo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { RetryTimeline } from '@rentascooter/ui';
import { ScooterCarousel } from '@/components/ScooterCarousel/ScooterCarousel';
import { DriverReveal } from '@/components/DriverReveal/DriverReveal';
import { useMatching } from '@/hooks/useMatching';
import type { FareEstimateItem, Location } from '@rentascooter/shared';
import type { IconName } from '@rentascooter/ui';
import type { ScooterTypeOption } from '@/components/ScooterCarousel/ScooterCarousel';

// ─── Constants ────────────────────────────────────────────────────────────────

const PEEK_HEIGHT = 300;
const FULL_HEIGHT = 560;
const SPRING = { damping: 14, stiffness: 280, mass: 0.8 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function iconKeyToIconName(iconKey: string): IconName {
  const map: Record<string, IconName> = {
    moto: 'scooter',
    jakarta: 'vehicle',
    voiture: 'vehicle',
  };
  return (map[iconKey] ?? 'vehicle') as IconName;
}

function formatXOF(amount: number): string {
  return (
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(amount)) +
    ' XOF'
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BookingSheetProps {
  visible: boolean;
  destination: Location | null;
  distanceM: number;
  durationS: number;
  fareEstimates: FareEstimateItem[] | null;
  selectedVehicleTypeId: string | null;
  onSelectVehicleType: (id: string) => void;
  isFareLoading: boolean;
  fareError: string | null;
  isBusy: boolean;
  rideState: string;
  rideId: string | null;
  onBookRide: () => void;
  onCancel: () => void;
}

// ─── BookingSheet ─────────────────────────────────────────────────────────────

export const BookingSheet = memo(function BookingSheet({
  visible,
  destination,
  distanceM,
  fareEstimates,
  selectedVehicleTypeId,
  onSelectVehicleType,
  isFareLoading,
  fareError,
  isBusy,
  rideState,
  rideId,
  onBookRide,
  onCancel,
}: BookingSheetProps) {
  const insets = useSafeAreaInsets();

  // translateY: FULL_HEIGHT = hidden, FULL_HEIGHT - PEEK_HEIGHT = peek, 0 = fully expanded
  const translateY = useSharedValue(FULL_HEIGHT);
  const gestureStart = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(FULL_HEIGHT - PEEK_HEIGHT, SPRING);
    } else {
      translateY.value = withSpring(FULL_HEIGHT, SPRING);
    }
  }, [visible, translateY]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      gestureStart.value = translateY.value;
    })
    .onUpdate((e) => {
      const next = gestureStart.value + e.translationY;
      translateY.value = Math.max(0, Math.min(FULL_HEIGHT, next));
    })
    .onEnd((e) => {
      const midpoint = (FULL_HEIGHT - PEEK_HEIGHT) / 2;
      if (e.velocityY < -500 || translateY.value < midpoint) {
        // fast upward swipe or past midpoint → expand
        translateY.value = withSpring(0, SPRING);
      } else {
        // snap back to peek
        translateY.value = withSpring(FULL_HEIGHT - PEEK_HEIGHT, SPRING);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const isSearching = rideState === 'searching';
  const isMatched = rideState === 'matched';

  // Matching logic — active only while searching (R7)
  const { activeAttemptIndex, completedAttempts, inFallback } = useMatching(
    isSearching ? rideId : null,
  );

  const carouselOptions: ScooterTypeOption[] = (fareEstimates ?? []).map(
    (item): ScooterTypeOption => ({
      id: item.vehicleTypeId,
      label: item.vehicleTypeName,
      price: formatXOF(item.fareEstimate),
      iconName: iconKeyToIconName(item.iconKey),
    }),
  );

  const selectedEstimate =
    fareEstimates?.find((e) => e.vehicleTypeId === selectedVehicleTypeId) ??
    fareEstimates?.[0] ??
    null;

  const canBook =
    !isFareLoading &&
    !fareError &&
    selectedEstimate !== null &&
    !isBusy &&
    !isSearching &&
    !isMatched;

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + spacing.md, height: FULL_HEIGHT },
            sheetStyle,
          ]}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          {/* Drag handle indicator (R2) */}
          <View style={styles.handleZone}>
            <View style={styles.handle} />
          </View>

        {isSearching ? (
          /* ── Searching state (R7) ── */
          <View style={styles.searchingBody}>
            {inFallback ? (
              <>
                <ActivityIndicator size="large" color={colors.text.secondary} />
                <Text style={styles.searchingTitle}>Aucun conducteur disponible</Text>
                <Text style={styles.searchingSubtitle}>
                  Tous les conducteurs sont occupés. Réessayez dans quelques minutes.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.searchingTitle}>Recherche d'un conducteur…</Text>
                <RetryTimeline
                  activeIndex={activeAttemptIndex}
                  completedCount={completedAttempts}
                />
                <Text style={styles.searchingSubtitle}>
                  {completedAttempts === 0
                    ? 'Tentative 1 sur 3'
                    : completedAttempts === 1
                      ? 'Tentative 2 sur 3'
                      : 'Dernière tentative'}
                </Text>
              </>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isBusy}>
              <Text style={styles.cancelBtnText}>Annuler la recherche</Text>
            </TouchableOpacity>
          </View>
        ) : isMatched ? null : (
          /* ── Booking form ── */
          <View style={styles.body}>
            {/* Destination row (R3) */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Destination</Text>
              <View style={styles.rowValueCol}>
                {destination?.name ? (
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {destination.name}
                  </Text>
                ) : null}
                {destination?.address ? (
                  <Text style={styles.rowSubValue} numberOfLines={1}>
                    {destination.address}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Distance row */}
            {distanceM > 0 && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Distance</Text>
                <Text style={styles.rowValue}>{(distanceM / 1000).toFixed(1)} km</Text>
              </View>
            )}

            {/* Vehicle-type carousel (R4) */}
            <View style={styles.carouselWrap}>
              {isFareLoading ? (
                <View style={styles.fareLoading}>
                  <ActivityIndicator size="small" color={colors.primary.main} />
                  <Text style={styles.fareLoadingText}>Calcul du tarif…</Text>
                </View>
              ) : fareError ? (
                <Text style={styles.errorText}>{fareError}</Text>
              ) : carouselOptions.length > 0 ? (
                <ScooterCarousel
                  options={carouselOptions}
                  selectedId={selectedVehicleTypeId}
                  onSelect={onSelectVehicleType}
                  title="Type de véhicule"
                />
              ) : null}
            </View>

            {/* Payment row placeholder (R5) */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Paiement</Text>
              <Text style={styles.rowValue}>Espèces</Text>
            </View>

            {/* Book Now (R6) */}
            <TouchableOpacity
              style={[styles.bookBtn, !canBook && styles.bookBtnDisabled]}
              onPress={onBookRide}
              disabled={!canBook}
            >
              {isBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.bookBtnText}>Réserver maintenant</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        </Animated.View>
      </GestureDetector>

      {/* Driver reveal slides up from bottom on match */}
      <DriverReveal visible={isMatched} />
    </>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 16,
  },
  handleZone: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border.light,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  rowLabel: {
    ...typography.body,
    color: colors.text.secondary,
    flexShrink: 0,
    marginRight: spacing.md,
  },
  rowValueCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  rowValue: {
    ...typography.body,
    color: colors.text.primary,
    textAlign: 'right',
  },
  rowSubValue: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  carouselWrap: {
    marginVertical: spacing.md,
  },
  fareLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  fareLoadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  errorText: {
    ...typography.body,
    color: '#E53E3E',
    paddingVertical: spacing.sm,
  },
  bookBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  bookBtnDisabled: { opacity: 0.45 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Searching state
  searchingBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  searchingTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  searchingSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  cancelBtn: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.text.secondary,
    fontSize: 15,
  },
});
