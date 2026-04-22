import { memo, useEffect, useRef, useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { View, Text, TouchableOpacity, ActivityIndicator, Pressable, Keyboard, Platform, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { RetryTimeline, Icon, rem } from '@rentascooter/ui';
import { ScooterCarousel } from '@/components/ScooterCarousel/ScooterCarousel';
import { useTranslation } from '@rentascooter/i18n';
import { useMatching } from '@/hooks/useMatching';
import { useUIStore, selectSheetMode, useRideStore } from '@rentascooter/shared';
import type { FareEstimateItem, Location, MatchedDriver } from '@rentascooter/shared';
import { SearchModeContent } from './SearchModeContent';
import type { IconName } from '@rentascooter/ui';
import type { ScooterTypeOption } from '@/components/ScooterCarousel/ScooterCarousel';

// ─── Constants ────────────────────────────────────────────────────────────────

const MINI_HEIGHT = 120;
const PEEK_HEIGHT = 460;
const FULL_HEIGHT = 580;
const SPRING = { damping: 14, stiffness: 280, mass: 0.8 };
const MODE_TRANSITION_DURATION = 260;

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

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2);
}

function formatXOF(amount: number): string {
  return (
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(amount)) +
    ' XOF'
  );
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
  onTapDestination: () => void;
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
  onTapDestination,
}: BookingModeContentProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.body}>
      <Pressable style={styles.row} onPress={onTapDestination}>
        <Text style={styles.rowLabel}>{t('client.destination')}</Text>
        <View style={styles.rowValueCol}>
          {destination?.name ? (
            <Text style={styles.rowValue} numberOfLines={1}>{destination.name}</Text>
          ) : null}
          {destination?.address ? (
            <Text style={styles.rowSubValue} numberOfLines={1}>{destination.address}</Text>
          ) : null}
        </View>
        <Icon name="edit" size={16} color={colors.text.tertiary} />
      </Pressable>

      {distanceM > 0 && (
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('driver.distance')}</Text>
          <Text style={styles.rowValue}>{(distanceM / 1000).toFixed(1)} km</Text>
        </View>
      )}

      <View style={styles.carouselWrap}>
        {isFareLoading ? (
          <View style={styles.fareLoading}>
            <ActivityIndicator size="small" color={colors.primary.main} />
            <Text style={styles.fareLoadingText}>{t('booking.fare_calculating')}</Text>
          </View>
        ) : fareError ? (
          <Text style={styles.errorText}>{fareError}</Text>
        ) : carouselOptions.length > 0 ? (
          <ScooterCarousel
            options={carouselOptions}
            selectedId={selectedVehicleTypeId}
            onSelect={onSelectVehicleType}
            title={t('booking.vehicle_type_title')}
          />
        ) : null}
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>{t('client.payment')}</Text>
        <Text style={styles.rowValue}>{t('client.cash')}</Text>
      </View>

      <TouchableOpacity
        style={[styles.bookBtn, !canBook && !isBusy && styles.bookBtnDisabled]}
        onPress={onBookRide}
        disabled={!canBook}
      >
        {isBusy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.bookBtnText}>{t('booking.book_now')}</Text>
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
  onCancel: () => Promise<void>;
  onDismiss: () => void;
  onDismissToSearch: () => void;
  onCancelFromMini: () => void;
  matchedDriver: MatchedDriver | null;
  userName: string;
  onConfirmDestination: (loc: Location) => void;
}

// ─── BookingSheet ─────────────────────────────────────────────────────────────

export const BookingSheet = memo(function BookingSheet({
  visible,
  destination,
  distanceM,
  durationS,
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
  onCancelFromMini,
  matchedDriver,
  userName,
  onConfirmDestination,
}: BookingSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  // Lowest translateY allowed: sheet top clears header bottom edge + rounded corner buffer
  const minTranslateY = insets.top + rem(1.5) + spacing.lg + FULL_HEIGHT - screenHeight;
  const sheetMode = useUIStore(selectSheetMode);
  const setSheetMode = useUIStore((s) => s.setSheetMode);

  // ── Snap state ──
  const [snap, setSnap] = useState<SnapLevel>('peek');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelFeeWarningOpen, setCancelFeeWarningOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [enRouteEtaS, setEnRouteEtaS] = useState(0);
  const [enRouteTotalS, setEnRouteTotalS] = useState(0);
  const [enRouteHasArrived, setEnRouteHasArrived] = useState(false);
  const enRouteInitialized = useRef(false);
  const translateY = useSharedValue(FULL_HEIGHT);
  const gestureStart = useSharedValue(0);
  const snapLevel = useSharedValue(1);
  // Mirrors booking/matching mode into worklet space to lock gesture to peek
  const isBookingModeShared = useSharedValue(
    sheetMode === 'booking' || sheetMode === 'matching' ? 1 : 0
  );

  // ── Mode transition animation ──
  const isSearchMode = sheetMode === 'search';
  const modeProgress = useSharedValue(isSearchMode ? 0 : 1);

  // Mount flags: both may be true during the crossfade window
  const [showSearchSurface, setShowSearchSurface] = useState(isSearchMode);
  const [showBookingSurface, setShowBookingSurface] = useState(!isSearchMode);

  // Gate fare loading indicator until search→booking transition completes (R10 AC 10)
  const [transitionComplete, setTransitionComplete] = useState(!isSearchMode);

  useEffect(() => {
    if (sheetMode === 'search') {
      setShowSearchSurface(true);
      setTransitionComplete(false);
      modeProgress.value = withTiming(0, {
        duration: MODE_TRANSITION_DURATION,
        easing: Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished) runOnJS(setShowBookingSurface)(false);
      });
    } else if (sheetMode === 'booking' || sheetMode === 'matching') {
      setShowBookingSurface(true);
      modeProgress.value = withTiming(1, {
        duration: MODE_TRANSITION_DURATION,
        easing: Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished) {
          runOnJS(setShowSearchSurface)(false);
          runOnJS(setTransitionComplete)(true);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetMode]);

  const searchSurfaceStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modeProgress.value, [0, 1], [1, 0]),
  }));

  const bookingSurfaceStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modeProgress.value, [0, 1], [0, 1]),
  }));

  // ── Snap callbacks ──
  const snapToMini = useCallback(() => { setSnap('mini'); Keyboard.dismiss(); }, []);
  const snapToPeek = useCallback(() => { setSnap('peek'); Keyboard.dismiss(); }, []);
  const snapToFull = useCallback(() => setSnap('full'), []);

  // ── Cancel confirmation ──
  const handleConfirmCancel = useCallback(async () => {
    setCancelling(true);
    setCancelErr(null);
    try {
      await onCancel();
      setConfirmCancelOpen(false);
    } catch (e: unknown) {
      setCancelErr((e as { message?: string })?.message ?? t('booking.cancel_error'));
    } finally {
      setCancelling(false);
    }
  }, [onCancel]);
  // Use ref so gesture worklet always captures current mode without recreating gesture
  const sheetModeRef = useRef(sheetMode);
  useEffect(() => { sheetModeRef.current = sheetMode; }, [sheetMode]);
  const triggerDismiss = useCallback(() => {
    if (sheetModeRef.current === 'search') {
      setSheetMode('idle');
    } else {
      onDismissToSearch();
    }
  }, [onDismissToSearch, setSheetMode]);

  useEffect(() => {
    if (visible) {
      snapLevel.value = 1;
      translateY.value = withSpring(FULL_HEIGHT - PEEK_HEIGHT, SPRING);
      setSnap('peek');
    } else {
      translateY.value = withSpring(FULL_HEIGHT, SPRING);
    }
  }, [visible, translateY, snapLevel]);

  // Auto-snap to peek on mode change; sync booking flag into worklet space
  useEffect(() => {
    isBookingModeShared.value = sheetMode === 'booking' || sheetMode === 'matching' ? 1 : 0;
    snapLevel.value = 1;
    translateY.value = withSpring(FULL_HEIGHT - PEEK_HEIGHT, SPRING);
    setSnap('peek');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetMode]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      gestureStart.value = translateY.value;
    })
    .onUpdate((e) => {
      const next = gestureStart.value + e.translationY;
      translateY.value = Math.max(0, Math.min(FULL_HEIGHT, next));
    })
    .onEnd((e) => {
      // Booking/matching mode: allow peek ↔ mini but never dismiss
      if (isBookingModeShared.value === 1) {
        const projected = Math.max(0, Math.min(FULL_HEIGHT, translateY.value + e.velocityY * 0.15));
        const snapPeek = FULL_HEIGHT - PEEK_HEIGHT;
        const snapMini = FULL_HEIGHT - MINI_HEIGHT;
        if (Math.abs(projected - snapMini) < Math.abs(projected - snapPeek)) {
          snapLevel.value = 0;
          translateY.value = withSpring(snapMini, SPRING);
          runOnJS(snapToMini)();
        } else {
          snapLevel.value = 1;
          translateY.value = withSpring(snapPeek, SPRING);
          runOnJS(snapToPeek)();
        }
        return;
      }
      // Fast flick down from mini → dismiss
      if (e.velocityY > 800 && snapLevel.value === 0) {
        translateY.value = withSpring(FULL_HEIGHT, SPRING);
        runOnJS(triggerDismiss)();
        return;
      }
      // Project position by velocity to find intended snap
      const projected = Math.max(0, Math.min(FULL_HEIGHT, translateY.value + e.velocityY * 0.15));
      const snapFull = 0;
      const snapPeek = FULL_HEIGHT - PEEK_HEIGHT;
      const snapMini = FULL_HEIGHT - MINI_HEIGHT;
      const dFull = Math.abs(projected - snapFull);
      const dPeek = Math.abs(projected - snapPeek);
      const dMini = Math.abs(projected - snapMini);
      const minDist = Math.min(dFull, dPeek, dMini);
      if (minDist === dFull) {
        snapLevel.value = 2;
        translateY.value = withSpring(snapFull, SPRING);
        runOnJS(snapToFull)();
      } else if (minDist === dPeek) {
        snapLevel.value = 1;
        translateY.value = withSpring(snapPeek, SPRING);
        runOnJS(snapToPeek)();
      } else {
        snapLevel.value = 0;
        translateY.value = withSpring(snapMini, SPRING);
        runOnJS(snapToMini)();
      }
    });

  const keyboardOffset = useSharedValue(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      keyboardOffset.value = withTiming(e.endCoordinates.height, {
        duration: Platform.OS === 'ios' ? e.duration : 250,
        easing: Easing.out(Easing.ease),
      });
    });
    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      keyboardOffset.value = withTiming(0, {
        duration: Platform.OS === 'ios' ? e.duration : 250,
        easing: Easing.in(Easing.ease),
      });
    });
    return () => { showSub.remove(); hideSub.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(minTranslateY, translateY.value - keyboardOffset.value) }],
  }));

  const isSearching = rideState === 'searching';
  const isMatched = rideState === 'matched';
  const isEnRoute = rideState === 'pickup_en_route';
  const transition = useRideStore((s) => s.transition);

  const { activeAttemptIndex, completedAttempts, inFallback } = useMatching(
    isSearching ? rideId : null,
  );

  // ETA countdown — starts from matchedDriver.etaSeconds when matched
  const [etaS, setEtaS] = useState(0);
  const etaInitialized = useRef(false);
  useEffect(() => {
    if (!isMatched || !matchedDriver) {
      setEtaS(0);
      setHasArrived(false);
      etaInitialized.current = false;
      return;
    }
    etaInitialized.current = true;
    setEtaS(matchedDriver.etaSeconds ?? 300);
    const id = setInterval(() => setEtaS((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [isMatched, matchedDriver]);
  // Latch hasArrived when countdown reaches 0 (never reverts)
  useEffect(() => {
    if (etaS === 0 && etaInitialized.current) setHasArrived(true);
  }, [etaS]);

  // Haptic on match entry — fires once per transition into matched
  const prevMatchedRef = useRef(false);
  useEffect(() => {
    if (isMatched && !prevMatchedRef.current) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    prevMatchedRef.current = isMatched;
  }, [isMatched]);

  const [elapsedS, setElapsedS] = useState(0);
  useEffect(() => {
    if (!isSearching) { setElapsedS(0); return; }
    setElapsedS(0);
    const id = setInterval(() => setElapsedS((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isSearching]);
  const elapsedLabel = `${Math.floor(elapsedS / 60).toString().padStart(2, '0')}:${(elapsedS % 60).toString().padStart(2, '0')}`;

  // Demo trigger: ~3s after driver arrives, auto-transition to pickup_en_route
  useEffect(() => {
    if (!hasArrived || !isMatched) return;
    const id = setTimeout(() => transition('pickup_en_route'), 3000);
    return () => clearTimeout(id);
  }, [hasArrived, isMatched, transition]);

  // Show expanded en-route view on entry so the ETA timer is visible; lock gesture to peek↔mini.
  useEffect(() => {
    if (isEnRoute) {
      setSnap('peek');
      snapLevel.value = 1;
      translateY.value = withSpring(FULL_HEIGHT - PEEK_HEIGHT, SPRING);
      isBookingModeShared.value = 1;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnRoute]);

  // En-route ETA countdown seeded from durationS
  useEffect(() => {
    if (!isEnRoute) {
      setEnRouteEtaS(0);
      setEnRouteHasArrived(false);
      enRouteInitialized.current = false;
      return;
    }
    enRouteInitialized.current = true;
    const seedS = durationS > 0 ? durationS : 300;
    const actualSeedS = __DEV__ ? Math.min(seedS, 300) : seedS;
    setEnRouteTotalS(actualSeedS);
    setEnRouteEtaS(actualSeedS);
    const id = setInterval(() => setEnRouteEtaS((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [isEnRoute, durationS]);

  // Latch enRouteHasArrived when en-route countdown reaches 0
  useEffect(() => {
    if (enRouteEtaS === 0 && enRouteInitialized.current) setEnRouteHasArrived(true);
  }, [enRouteEtaS]);

  // Demo/fallback: auto-complete ride 3 s after en-route ETA reaches 0.
  // In production the backend fires ride:completed which reaches index.tsx via
  // the pickup_en_route status poll; this effect is the safety net for demo mode.
  useEffect(() => {
    if (!enRouteHasArrived || !isEnRoute) return;
    const id = setTimeout(() => transition('completed'), 3000);
    return () => clearTimeout(id);
  }, [enRouteHasArrived, isEnRoute, transition]);

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
          {/* Handle — only in booking/matching modes */}
          {sheetMode !== 'search' && (
            <View style={styles.handleZone}>
              <View style={styles.handle} />
            </View>
          )}

          {/* Mode-switching content area: two crossfading surfaces */}
          <View style={styles.contentArea}>
            {/* Search surface */}
            {showSearchSurface && (
              <Animated.View
                style={[StyleSheet.absoluteFill, searchSurfaceStyle]}
                pointerEvents={sheetMode === 'search' ? 'auto' : 'none'}
              >
                <SearchModeContent
                  userName={userName}
                  onConfirmDestination={onConfirmDestination}
                />
              </Animated.View>
            )}

            {/* Booking surface */}
            {showBookingSurface && (
              <Animated.View
                style={[StyleSheet.absoluteFill, bookingSurfaceStyle]}
                pointerEvents={sheetMode !== 'search' ? 'auto' : 'none'}
              >
                {isSearching ? (
                  <View style={[styles.searchingBody, { height: PEEK_HEIGHT - 20 - insets.bottom - spacing.md }]}>
                    {inFallback ? (
                      <>
                        <View style={styles.searchingHeader}>
                          <Text style={styles.searchingTitle}>{t('booking.no_drivers_available')}</Text>
                        </View>
                        <View style={styles.searchingCenter}>
                          <ActivityIndicator size="large" color={colors.text.secondary} />
                          <Text style={styles.searchingSubtitle}>
                            {t('booking.all_drivers_busy')}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.searchingHeader}>
                          <View style={styles.searchingTitleRow}>
                            <Text style={styles.searchingTitle}>{t('booking.searching_for_driver')}</Text>
                            <Text style={styles.searchingTimer}>{elapsedLabel}</Text>
                          </View>
                          <RetryTimeline
                            activeIndex={activeAttemptIndex}
                            completedCount={completedAttempts}
                          />
                        </View>
                        <View style={styles.searchingCenter}>
                          <ActivityIndicator size="large" color={colors.primary.main} />
                          <Text style={styles.searchingSubtitle}>
                            {completedAttempts === 0
                              ? t('booking.attempt_1_of_3')
                              : completedAttempts === 1
                                ? t('booking.attempt_2_of_3')
                                : t('booking.last_attempt')}
                          </Text>
                        </View>
                      </>
                    )}
                    <TouchableOpacity
                      style={[styles.cancelBtn, isBusy && styles.cancelBtnDisabled]}
                      onPress={() => { setCancelErr(null); setConfirmCancelOpen(true); }}
                      disabled={isBusy}
                    >
                      <Text style={styles.cancelBtnText}>{t('booking.cancel_search')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : isEnRoute && matchedDriver ? (
                  snap === 'mini' ? (
                    <View style={styles.enRouteMiniWrap}>
                      {(() => {
                        const pct = Math.min(95, enRouteTotalS > 0 ? ((enRouteTotalS - enRouteEtaS) / enRouteTotalS) * 95 : 0);
                        return (
                          <View style={styles.enRouteProgressContainer}>
                            <View style={styles.enRouteProgressTrack}>
                              <View style={[styles.enRouteProgressFill, { width: `${pct}%` as `${number}%` }]} />
                            </View>
                            <View style={[styles.enRouteMovingPin, { left: `${pct}%` as `${number}%` }]}>
                              <View style={styles.enRouteMovingPinCircle}>
                                <Icon name="user-pin" size={12} color="#000" />
                              </View>
                            </View>
                            <View style={styles.enRouteEndPin}>
                              <Icon name="destination-pin" size={18} color={colors.primary.main} />
                            </View>
                          </View>
                        );
                      })()}
                      <View style={styles.enRouteMiniInfo}>
                        <View style={[styles.avatarCircle, styles.avatarCircleSm]}>
                          <Text style={[styles.avatarText, styles.avatarTextSm]}>
                            {getInitials(matchedDriver.name)}
                          </Text>
                        </View>
                        <View style={styles.enRouteMiniNameCol}>
                          <Text style={styles.miniDestName} numberOfLines={1}>{matchedDriver.name}</Text>
                          <Text style={styles.matchedDriverSub} numberOfLines={1}>
                            {matchedDriver.vehicleType} · {matchedDriver.vehiclePlate}
                          </Text>
                        </View>
                        <View style={styles.enRouteMiniEtaCol}>
                          <Text style={styles.enRouteMiniEtaValue}>
                            {enRouteHasArrived
                              ? t('booking.arrived')
                              : `${Math.floor(enRouteEtaS / 60).toString().padStart(2, '0')}:${(enRouteEtaS % 60).toString().padStart(2, '0')}`}
                          </Text>
                          <Text style={styles.enRouteMiniEtaLabel}>ETA</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.searchingBody, { height: PEEK_HEIGHT - 20 - insets.bottom - spacing.md }]}>
                      <View style={styles.matchedDriverRow}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>{getInitials(matchedDriver.name)}</Text>
                        </View>
                        <View style={styles.matchedDriverInfo}>
                          <Text style={styles.matchedDriverName}>{matchedDriver.name}</Text>
                          <Text style={styles.matchedDriverSub}>
                            {matchedDriver.vehicleType} · {matchedDriver.vehiclePlate}
                          </Text>
                        </View>
                        <Text style={styles.matchedRating}>★ {matchedDriver.rating.toFixed(1)}</Text>
                      </View>
                      {destination && (
                        <View style={styles.enRouteDestRow}>
                          <Icon name="destination-pin" size={14} color={colors.text.secondary} />
                          <Text style={styles.enRouteDestText} numberOfLines={1}>
                            {destination.name ?? destination.address}
                          </Text>
                        </View>
                      )}
                      <View style={styles.matchedEtaBlock}>
                        <Text style={styles.matchedEtaLabel}>{t('booking.eta_destination')}</Text>
                        <Text style={styles.matchedEtaValue}>
                          {enRouteHasArrived
                            ? t('booking.arrived_excl')
                            : `${Math.floor(enRouteEtaS / 60).toString().padStart(2, '0')}:${(enRouteEtaS % 60).toString().padStart(2, '0')}`}
                        </Text>
                        {!enRouteHasArrived && enRouteEtaS >= 60 && (
                          <Text style={styles.matchedEtaSubLabel}>
                            {t('booking.minutes_remaining', { count: Math.floor(enRouteEtaS / 60) })}
                          </Text>
                        )}
                      </View>
                      {(() => {
                        const pct = Math.min(95, enRouteTotalS > 0 ? ((enRouteTotalS - enRouteEtaS) / enRouteTotalS) * 95 : 0);
                        return (
                          <View style={styles.enRouteProgressContainer}>
                            <View style={styles.enRouteProgressTrack}>
                              <View style={[styles.enRouteProgressFill, { width: `${pct}%` as `${number}%` }]} />
                            </View>
                            <View style={[styles.enRouteMovingPin, { left: `${pct}%` as `${number}%` }]}>
                              <View style={styles.enRouteMovingPinCircle}>
                                <Icon name="user-pin" size={12} color="#000" />
                              </View>
                            </View>
                            <View style={styles.enRouteEndPin}>
                              <Icon name="destination-pin" size={18} color={colors.primary.main} />
                            </View>
                          </View>
                        );
                      })()}
                    </View>
                  )
                ) : isMatched && matchedDriver ? (
                  snap === 'mini' ? (
                    <View style={styles.miniBody}>
                      <View style={styles.miniMatchedLeft}>
                        <View style={[styles.avatarCircle, styles.avatarCircleSm]}>
                          <Text style={[styles.avatarText, styles.avatarTextSm]}>
                            {getInitials(matchedDriver.name)}
                          </Text>
                        </View>
                        <View style={styles.miniDestCol}>
                          <Text style={styles.miniDestName} numberOfLines={1}>
                            {matchedDriver.name}
                          </Text>
                          <Text style={styles.matchedDriverSub}>
                            {hasArrived
                              ? t('booking.driver_arrived')
                              : etaS >= 60
                                ? `${Math.floor(etaS / 60)} min`
                                : t('booking.imminent_arrival')}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.matchedRating}>★ {matchedDriver.rating.toFixed(1)}</Text>
                    </View>
                  ) : hasArrived ? (
                    <View style={[styles.searchingBody, { height: PEEK_HEIGHT - 20 - insets.bottom - spacing.md }]}>
                      <View style={styles.matchedDriverRow}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>{getInitials(matchedDriver.name)}</Text>
                        </View>
                        <View style={styles.matchedDriverInfo}>
                          <Text style={styles.matchedDriverName}>{matchedDriver.name}</Text>
                          <Text style={styles.matchedDriverSub}>
                            {matchedDriver.vehicleType} · {matchedDriver.vehiclePlate}
                          </Text>
                        </View>
                        <Text style={styles.matchedRating}>★ {matchedDriver.rating.toFixed(1)}</Text>
                      </View>
                      <View style={styles.arrivedContainer}>
                        <View style={styles.arrivedBadge}>
                          <Text style={styles.arrivedBadgeText}>✓</Text>
                        </View>
                        <Text style={styles.arrivedTitle}>{t('booking.driver_arrived')}</Text>
                        <Text style={styles.arrivedSubtitle}>{t('booking.waiting_for_you')}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.searchingBody, { height: PEEK_HEIGHT - 20 - insets.bottom - spacing.md }]}>
                      <View style={styles.matchedDriverRow}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>{getInitials(matchedDriver.name)}</Text>
                        </View>
                        <View style={styles.matchedDriverInfo}>
                          <Text style={styles.matchedDriverName}>{matchedDriver.name}</Text>
                          <Text style={styles.matchedDriverSub}>
                            {matchedDriver.vehicleType} · {matchedDriver.vehiclePlate}
                          </Text>
                        </View>
                        <Text style={styles.matchedRating}>★ {matchedDriver.rating.toFixed(1)}</Text>
                      </View>
                      <View style={styles.matchedEtaBlock}>
                        <Text style={styles.matchedEtaLabel}>{t('booking.arriving_in')}</Text>
                        <Text style={styles.matchedEtaValue}>
                          {etaS >= 60 ? `${Math.floor(etaS / 60)} min` : t('booking.imminent_arrival')}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.cancelBtn, isBusy && styles.cancelBtnDisabled]}
                        onPress={() => { setCancelErr(null); setCancelFeeWarningOpen(true); }}
                        disabled={isBusy}
                      >
                        <Text style={styles.cancelBtnText}>{t('booking.cancel_trip')}</Text>
                      </TouchableOpacity>
                    </View>
                  )
                ) : snap === 'mini' ? (
                  <View style={styles.miniBody}>
                    <Pressable style={styles.miniDestArea} onPress={() => setSheetMode('search')}>
                      <Icon name="map-pin" size={18} color={colors.primary.main} />
                      <View style={styles.miniDestCol}>
                        <Text style={styles.miniDestName} numberOfLines={1}>
                          {destination?.name ?? destination?.address ?? t('client.where_to')}
                        </Text>
                      </View>
                    </Pressable>
                    <View style={styles.miniActions}>
                      <TouchableOpacity
                        style={[styles.miniBookBtn, !canBook && styles.miniBookBtnDisabled]}
                        onPress={onBookRide}
                        disabled={!canBook || isBusy}
                      >
                        {isBusy ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.miniBookBtnText}>{t('booking.reserve_short')}</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.miniCancelBtn}
                        onPress={onCancelFromMini}
                      >
                        <Text style={styles.miniCancelBtnText}>{t('common.cancel')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <BookingModeContent
                    destination={destination}
                    distanceM={distanceM}
                    isFareLoading={isFareLoading && transitionComplete}
                    fareError={fareError}
                    carouselOptions={carouselOptions}
                    selectedVehicleTypeId={selectedVehicleTypeId}
                    onSelectVehicleType={onSelectVehicleType}
                    canBook={canBook}
                    isBusy={isBusy}
                    onBookRide={onBookRide}
                    onTapDestination={() => setSheetMode('search')}
                  />
                )}
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </GestureDetector>

      {cancelFeeWarningOpen && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{t('booking.cancel_trip_confirm_title')}</Text>
            <Text style={styles.confirmBody}>
              {t('booking.cancel_fee_warning')}
            </Text>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => { setCancelFeeWarningOpen(false); setConfirmCancelOpen(true); }}
            >
              <Text style={styles.confirmBtnText}>{t('booking.continue_cancellation')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtnSecondary}
              onPress={() => setCancelFeeWarningOpen(false)}
            >
              <Text style={styles.confirmBtnSecondaryText}>{t('booking.no_continue_trip')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {confirmCancelOpen && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{t('booking.cancel_this_trip_title')}</Text>
            <Text style={styles.confirmBody}>
              {t('booking.cancel_search_confirm_body')}
            </Text>
            {cancelErr ? (
              <Text style={styles.confirmErr}>{cancelErr}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.confirmBtn, cancelling && styles.confirmBtnDisabled]}
              onPress={() => { void handleConfirmCancel(); }}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>{t('booking.yes_cancel')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtnSecondary}
              onPress={() => { setCancelErr(null); setConfirmCancelOpen(false); }}
              disabled={cancelling}
            >
              <Text style={styles.confirmBtnSecondaryText}>{t('booking.no_continue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
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
    top: spacing.sm,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xBtnText: {
    fontSize: 24,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  contentArea: {
    flex: 1,
    overflow: 'hidden',
  },

  // ── Mini state: condensed destination + action buttons ──
  miniBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  miniDestArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  miniDestCol: {
    flex: 1,
  },
  miniDestName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  miniActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  miniBookBtn: {
    backgroundColor: colors.primary.main,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  miniBookBtnDisabled: {
    opacity: 0.45,
  },
  miniBookBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  miniCancelBtn: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  miniCancelBtnText: {
    color: colors.text.secondary,
    fontSize: 13,
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
    marginBottom: spacing.lg,
    backgroundColor: colors.primary.main,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  bookBtnDisabled: { opacity: 0.45 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // ── Searching ──
  searchingBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  searchingHeader: {
    gap: spacing.md,
  },
  searchingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchingTitle: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
  },
  searchingTimer: {
    ...typography.body,
    color: colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  searchingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  searchingSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cancelBtnText: {
    color: colors.primary.main,
    fontSize: 15,
    fontWeight: '600',
  },
  cancelBtnDisabled: {
    opacity: 0.5,
  },

  // ── Matched state ──
  matchedDriverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  matchedDriverInfo: {
    flex: 1,
    gap: 2,
  },
  matchedDriverName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  matchedDriverSub: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  matchedRating: {
    ...typography.body,
    color: colors.primary.main,
    fontWeight: '700',
    flexShrink: 0,
  },
  matchedEtaBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  matchedEtaLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  matchedEtaValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  matchedEtaSubLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // ── Matched mini strip ──
  miniMatchedLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarCircleSm: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarTextSm: {
    fontSize: 14,
  },

  // ── Arrived state ──
  arrivedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  arrivedBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedBadgeText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
  },
  arrivedTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  arrivedSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // ── En-route mini strip ──
  enRouteMiniWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  enRouteProgressContainer: {
    position: 'relative',
    height: 28,
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  enRouteProgressTrack: {
    position: 'absolute',
    left: 0,
    right: 24,
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  enRouteProgressFill: {
    height: '100%' as const,
    backgroundColor: colors.primary.main,
    borderRadius: 2,
  },
  enRouteMovingPin: {
    position: 'absolute',
    marginLeft: -12,
  },
  enRouteMovingPinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  enRouteEndPin: {
    position: 'absolute',
    right: 0,
    top: 5,
  },
  enRouteMiniInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  enRouteMiniNameCol: {
    flex: 1,
    gap: 2,
  },
  enRouteMiniEtaCol: {
    alignItems: 'center',
    minWidth: 56,
  },
  enRouteMiniEtaValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  enRouteMiniEtaLabel: {
    fontSize: 10,
    color: colors.text.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  enRouteDestRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  enRouteDestText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },

  // ── Cancel confirmation dialog ──
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  confirmCard: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  confirmTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  confirmBody: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  confirmErr: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
  },
  confirmBtn: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '700',
  },
  confirmBtnSecondary: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  confirmBtnSecondaryText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
