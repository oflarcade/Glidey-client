import { memo, useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { RetryTimeline } from '@rentascooter/ui';
import { ScooterCarousel } from '@/components/ScooterCarousel/ScooterCarousel';
import { DriverReveal } from '@/components/DriverReveal/DriverReveal';
import { useMatching } from '@/hooks/useMatching';
import { useUIStore, selectSheetMode } from '@rentascooter/shared';
import type { FareEstimateItem, Location } from '@rentascooter/shared';
import type { IconName } from '@rentascooter/ui';
import type { ScooterTypeOption } from '@/components/ScooterCarousel/ScooterCarousel';

// ─── Constants ────────────────────────────────────────────────────────────────

const MINI_HEIGHT = 155;  // compact summary + CTA
const PEEK_HEIGHT = 330;  // vehicle carousel visible
const FULL_HEIGHT = 580;  // full form
const SPRING = { damping: 14, stiffness: 280, mass: 0.8 };

type SnapLevel = 'mini' | 'peek' | 'full';

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

function truncate(str: string | undefined | null, max: number): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// ─── BookingModeContent ───────────────────────────────────────────────────────

interface BookingModeContentProps {
  destination: Location | null;
  distanceM: number;
  isFareLoading: boolean;
  fareError: string | null;
  carouselOptions: ScooterTypeOption[];
  selectedVehicleTypeId: string | null;
  onSelectVehicleType: (id: string) => void;
  canBook: boolean;
  isBusy: boolean;
  onBookRide: () => void;
}

function BookingModeContent({
  destination,
  distanceM,
  isFareLoading,
  fareError,
  carouselOptions,
  selectedVehicleTypeId,
  onSelectVehicleType,
  canBook,
  isBusy,
  onBookRide,
}: BookingModeContentProps) {
  return (
    <View style={styles.body}>
      {/* Destination row */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Destination</Text>
        <View style={styles.rowValueCol}>
          {destination?.name ? (
            <Text style={styles.rowValue} numberOfLines={1}>{destination.name}</Text>
          ) : null}
          {destination?.address ? (
            <Text style={styles.rowSubValue} numberOfLines={1}>{destination.address}</Text>
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

      {/* Vehicle-type carousel */}
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

      {/* Payment row placeholder */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Paiement</Text>
        <Text style={styles.rowValue}>Espèces</Text>
      </View>

      {/* Book Now */}
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
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BookingSheetProps {
  visible: boolean;
  pickup: Location | null;
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
  onDismiss: () => void;
  onDismissToSearch: () => void;
}

// ─── BookingSheet ─────────────────────────────────────────────────────────────

export const BookingSheet = memo(function BookingSheet({
  visible,
  pickup,
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
  onDismissToSearch,
}: BookingSheetProps) {
  const insets = useSafeAreaInsets();
  const sheetMode = useUIStore(selectSheetMode);

  // JS-side snap state drives which content is shown
  const [snap, setSnap] = useState<SnapLevel>('peek');

  // translateY: FULL_HEIGHT = hidden, FULL_HEIGHT-MINI_HEIGHT = mini, etc.
  const translateY = useSharedValue(FULL_HEIGHT);
  const gestureStart = useSharedValue(0);
  const snapLevel = useSharedValue(1); // 0=mini, 1=peek, 2=full

  const snapToMini = useCallback(() => setSnap('mini'), []);
  const snapToPeek = useCallback(() => setSnap('peek'), []);
  const snapToFull = useCallback(() => setSnap('full'), []);
  const triggerDismiss = useCallback(() => {
    onDismissToSearch();
  }, [onDismissToSearch]);

  useEffect(() => {
    if (visible) {
      snapLevel.value = 1;
      translateY.value = withSpring(FULL_HEIGHT - PEEK_HEIGHT, SPRING);
      setSnap('peek');
    } else {
      translateY.value = withSpring(FULL_HEIGHT, SPRING);
    }
  }, [visible, translateY, snapLevel]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      gestureStart.value = translateY.value;
    })
    .onUpdate((e) => {
      const next = gestureStart.value + e.translationY;
      translateY.value = Math.max(0, Math.min(FULL_HEIGHT, next));
    })
    .onEnd((e) => {
      const goingDown = e.velocityY > 150 || e.translationY > 60;
      const goingUp = e.velocityY < -150 || e.translationY < -60;
      const fastFlickDown = e.velocityY > 800;

      if (goingDown) {
        if (snapLevel.value === 2) {
          // full → peek
          snapLevel.value = 1;
          translateY.value = withSpring(FULL_HEIGHT - PEEK_HEIGHT, SPRING);
          runOnJS(snapToPeek)();
        } else if (snapLevel.value === 1) {
          // peek → mini
          snapLevel.value = 0;
          translateY.value = withSpring(FULL_HEIGHT - MINI_HEIGHT, SPRING);
          runOnJS(snapToMini)();
        } else if (fastFlickDown) {
          // mini + fast flick → dismiss
          translateY.value = withSpring(FULL_HEIGHT, SPRING);
          runOnJS(triggerDismiss)();
        } else {
          // mini + slow → stay mini
          translateY.value = withSpring(FULL_HEIGHT - MINI_HEIGHT, SPRING);
        }
      } else if (goingUp) {
        if (snapLevel.value === 0) {
          // mini → peek
          snapLevel.value = 1;
          translateY.value = withSpring(FULL_HEIGHT - PEEK_HEIGHT, SPRING);
          runOnJS(snapToPeek)();
        } else if (snapLevel.value === 1) {
          // peek → full
          snapLevel.value = 2;
          translateY.value = withSpring(0, SPRING);
          runOnJS(snapToFull)();
        }
        // already full → stay
      } else {
        // no clear direction → snap back to current level
        if (snapLevel.value === 0) translateY.value = withSpring(FULL_HEIGHT - MINI_HEIGHT, SPRING);
        else if (snapLevel.value === 1) translateY.value = withSpring(FULL_HEIGHT - PEEK_HEIGHT, SPRING);
        else translateY.value = withSpring(0, SPRING);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const isSearching = rideState === 'searching';
  const isMatched = rideState === 'matched';

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

  const pickupLabel = truncate(pickup?.name ?? pickup?.address ?? 'Ma position', 20);
  const destLabel = truncate(destination?.name ?? destination?.address ?? '—', 22);

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
          {/* Handle + header row — visible in all modes */}
          <View style={styles.handleZone}>
            <View style={styles.handle} />
            <TouchableOpacity style={styles.xBtn} onPress={onDismissToSearch} hitSlop={12}>
              <Text style={styles.xBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {sheetMode === 'search' ? (
            /* ── Search mode content — wired in T-126 ── */
            null
          ) : isSearching ? (
            /* ── Searching state ── */
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
          ) : isMatched ? null : snap === 'mini' ? (
            /* ── Mini state: summary + CTA ── */
            <View style={styles.miniBody}>
              <View style={styles.miniSummary}>
                <Text style={styles.miniFrom} numberOfLines={1}>
                  {pickupLabel}
                </Text>
                <Text style={styles.miniArrow}>→</Text>
                <Text style={styles.miniTo} numberOfLines={1}>
                  {destLabel}
                </Text>
              </View>
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
          ) : (
            /* ── Peek / Full: BookingModeContent ── */
            <BookingModeContent
              destination={destination}
              distanceM={distanceM}
              isFareLoading={isFareLoading}
              fareError={fareError}
              carouselOptions={carouselOptions}
              selectedVehicleTypeId={selectedVehicleTypeId}
              onSelectVehicleType={onSelectVehicleType}
              canBook={canBook}
              isBusy={isBusy}
              onBookRide={onBookRide}
            />
          )}
        </Animated.View>
      </GestureDetector>

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
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.light,
  },
  xBtn: {
    position: 'absolute',
    right: spacing.lg,
    top: 6,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xBtnText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },

  // ── Mini state ──
  miniBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  miniSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  miniFrom: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  miniArrow: {
    ...typography.body,
    color: colors.text.tertiary,
    marginHorizontal: spacing.xs,
  },
  miniTo: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1.5,
  },

  // ── Peek / Full body ──
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
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

  // ── Searching ──
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
