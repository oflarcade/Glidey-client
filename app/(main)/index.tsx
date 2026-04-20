import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import MapboxGL from '@rnmapbox/maps';
import {
  FullScreenMap,
  MapTopBar,
  AppBrandHeader,
  LocationServicePrompt,
  LocationDeniedBanner,
  useLocationService,
  UserPositionButton,
  DestinationPin,
} from '@rentascooter/ui';
import { colors, spacing } from '@rentascooter/ui/theme';
import { SidebarToggleButton } from '@/components/Sidebar';
import { useTranslation } from '@rentascooter/i18n';
import { useUIStore, selectSheetMode } from '@rentascooter/shared';
import type { Location } from '@rentascooter/shared';
import Constants from 'expo-constants';
import { useNearbyDrivers, type NearbyDriver } from '@/hooks/useNearbyDrivers';
import { useRouteDirections } from '@/hooks/useRouteDirections';
import { useBooking } from '@/hooks/useBooking';
import { getRouteLineCoordinates } from '@/utils/routeLineCoordinates';
import { DriverMarkers } from '@/components/DriverMarkers';
import { DestinationTip } from '@/components/LocationModal';
import { BookingSheet } from '@/components/BookingSheet';
import { animateToLocation } from '@/utils/mapAnimations';
import { getMockDriversNear } from '@/utils/mockDrivers';
import { useUser } from '@rentascooter/auth';
import { useRideStore } from '@rentascooter/shared';
import type { GeoPoint } from '@rentascooter/shared';

/**
 * Client Main Screen
 *
 * Full-screen map-based interface for clients/riders.
 * Features:
 * - Full-screen map background with location tracking
 * - Floating top bar with menu and GLIDEY branding
 * - Locate FAB for centering on user location
 * - Location permission and services handling
 * - Bottom booking sheet (to be added)
 * - Side menu access for rides and profile
 *
 * Location Flow:
 * 1. Check if device location services enabled (GPS)
 * 2. If disabled → Show LocationServicePrompt modal
 * 3. If enabled → Check app permission
 * 4. If permission granted → Get location → Zoom map to user
 * 5. If permission undetermined → Request permission (OS dialog)
 * 6. If permission denied → Show LocationDeniedBanner
 *
 * @acceptance AC-CMS-001: Map fills entire screen behind all UI elements
 * @acceptance AC-CMS-002: Top bar floats over map with GLIDEY branding
 * @acceptance AC-CMS-003: Locate FAB centers map on user location
 * @acceptance AC-CMS-004: Menu button opens side drawer
 * @acceptance AC-CMS-005: Bottom sheet for booking (future)
 * @acceptance AC-CMS-006: Location services prompt when GPS disabled
 * @acceptance AC-CMS-007: Permission denied banner with re-request option
 */

export default function ClientMainScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const { t } = useTranslation();

  // UI store: single sheetMode atom drives all sheet/modal visibility
  const sheetMode = useUIStore(selectSheetMode);
  const setSheetMode = useUIStore((s) => s.setSheetMode);

  // Ride store state for BookingSheet
  const rideState = useRideStore((s) => s.rideState);
  const rideId = useRideStore((s) => s.rideId);

  // Sync sheetMode with rideState transitions
  useEffect(() => {
    if (rideState === 'searching' || rideState === 'matched') {
      setSheetMode('matching');
    }
  }, [rideState, setSheetMode]);

  // Camera ref for programmatic map control
  const cameraRef = useRef<MapboxGL.Camera>(null);

  // Location service hook - handles all location logic
  const {
    location,
    isServiceEnabled,
    permissionStatus,
    centerOnUser,
    requestPermission,
    openSettings,
  } = useLocationService({
    cameraRef,
    autoCenter: true, // Auto-center on first location fix
  });

  // Nearby drivers hook - fetches available drivers for map display
  const isLocationReady = permissionStatus === 'granted' && isServiceEnabled === true;
  const {
    drivers: nearbyDrivers,
  } = useNearbyDrivers({
    userLocation: location,
    isLocationEnabled: isLocationReady,
  });

  // In dev or EAS preview (useDemo), show mock drivers when API returns none so pins are visible
  const useDemo =
    __DEV__ ||
    (Constants.expoConfig?.extra as { useDemo?: boolean } | undefined)?.useDemo === true;
  const driversToShow =
    nearbyDrivers.length > 0
      ? nearbyDrivers
      : useDemo && location
        ? getMockDriversNear(location.latitude, location.longitude)
        : [];

  // Location service prompt visibility (can be dismissed)
  const [showServicePrompt, setShowServicePrompt] = useState(true);

  // Destination state
  const [selectedDestination, setSelectedDestination] = useState<Location | null>(null);

  // Route directions when a destination is selected
  const { directions } = useRouteDirections({
    userLocation: location,
    destination: selectedDestination,
  });

  // Sheet is visible whenever sheetMode is not idle (driven by sheetMode atom, not destination)
  const showBookingSheet = sheetMode !== 'idle';

  const pickup: GeoPoint | null = location
    ? { latitude: location.latitude, longitude: location.longitude }
    : null;

  const {
    fareEstimates,
    selectedVehicleTypeId,
    setSelectedVehicleTypeId,
    isFareLoading,
    fareError,
    isBusy,
    bookRide,
    cancel: cancelBooking,
  } = useBooking({
    pickup,
    destination: selectedDestination,
    distanceM: directions?.distanceM ?? 0,
    durationS: directions?.durationS ?? 0,
  });

  const routeLineCoords = useMemo(
    () => getRouteLineCoordinates(directions ?? null, location, selectedDestination),
    [directions, location, selectedDestination]
  );

  const routeGeoJSON = useMemo(() => ({
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'LineString' as const, coordinates: routeLineCoords },
  }), [routeLineCoords]);

  /**
   * Handle locate button press - centers map on user location
   */
  const handleLocatePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If services disabled, show prompt
    if (isServiceEnabled === false) {
      setShowServicePrompt(true);
      return;
    }

    // If permission not granted, request it
    if (permissionStatus === 'undetermined') {
      await requestPermission();
      return;
    }

    // If permission denied, open settings
    if (permissionStatus === 'denied') {
      await openSettings();
      return;
    }

    // Permission granted - center on user
    centerOnUser(cameraRef);
  }, [
    isServiceEnabled,
    permissionStatus,
    requestPermission,
    openSettings,
    centerOnUser,
  ]);

  /**
   * Handle location denied banner press
   */
  const handleDeniedBannerPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await openSettings();
  }, [openSettings]);

  /**
   * Handle enable location from prompt
   */
  const handleEnableLocation = useCallback(async () => {
    setShowServicePrompt(false);
    await openSettings();
  }, [openSettings]);

  /**
   * Handle dismiss location prompt
   */
  const handleDismissPrompt = useCallback(() => {
    setShowServicePrompt(false);
  }, []);

  /**
   * Handle driver marker press - could open driver details or start booking
   */
  const handleDriverPress = useCallback((driver: NearbyDriver) => {
    // Future: Open driver details sheet or start booking flow
    console.log('Driver selected:', driver.id);
  }, []);

  /**
   * Handle booking sheet cancel — cancels an in-flight ride or clears destination.
   */
  const handleBookingCancel = useCallback(async () => {
    await cancelBooking();
    setSelectedDestination(null);
    setSheetMode('search');
  }, [cancelBooking, setSheetMode]);

  /**
   * Dismiss the booking sheet and return to search mode.
   */
  const handleBookingDismissToSearch = useCallback(() => {
    setSelectedDestination(null);
    setSheetMode('search');
  }, [setSheetMode]);

  /**
   * Handle clearing destination
   */
  const handleClearDestination = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDestination(null);

    // Reset camera to user location
    if (location && cameraRef.current) {
      try {
        const { resetCameraToUser } = await import('@/utils/mapAnimations');
        await resetCameraToUser(cameraRef, {
          latitude: location.latitude,
          longitude: location.longitude,
        });
      } catch (error) {
        console.error('[ClientMainScreen] Failed to reset camera:', error);
      }
    }
  }, [location]);

  /**
   * Handle destination confirmation — transitions sheet to booking mode.
   */
  const handleDestinationSelect = useCallback(
    async (destination: Location) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setSelectedDestination(destination);
      setSheetMode('booking');

      const lat = Number(destination.latitude);
      const lng = Number(destination.longitude);
      const hasValidCoords = isFinite(lat) && isFinite(lng) && !(lat === 0 && lng === 0);

      if (cameraRef.current && hasValidCoords) {
        try {
          await animateToLocation(
            cameraRef,
            { latitude: destination.latitude, longitude: destination.longitude },
            16,
            1000
          );
        } catch (error) {
          console.error('[ClientMainScreen] Failed to animate camera:', error);
        }
      }
    },
    [setSheetMode]
  );

  /**
   * Get user display name from profile
   */
  const userName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName ||
        profile?.email?.split('@')[0] ||
        t('common.welcome') ||
        'User';

  // Should show location services prompt
  const shouldShowServicePrompt =
    isServiceEnabled === false && showServicePrompt;

  // Should show permission denied banner
  const shouldShowDeniedBanner =
    isServiceEnabled !== false && permissionStatus === 'denied';

  // Top bar height for banner positioning
  const topBarOffset = insets.top + 56 + spacing.sm;

  // Destination tip offset (below modal when open)
  const destinationTipOffset = sheetMode === 'search' ? topBarOffset + 80 : topBarOffset;

  // UserPositionButton offset (reposition when sheet is in search mode)
  const userPositionButtonBottom = sheetMode === 'search'
    ? insets.bottom + spacing.xl + 200
    : insets.bottom + spacing.xl;

  return (
    <View style={styles.container}>
      {/* Full screen map with camera ref, custom user position pin, and driver markers */}
      <FullScreenMap
        cameraRef={cameraRef}
        showUserLocation={permissionStatus === 'granted'}
        useCustomUserMarker
        autoSizeUserMarker
        userMarkerZoomThreshold={14}
        externalUserLocation={location}
      >
        {/* Nearby driver markers (real or mock in dev when API returns none) */}
        <DriverMarkers
          drivers={driversToShow}
          onDriverPress={handleDriverPress}
          visible={isLocationReady && driversToShow.length > 0}
        />

        {/* Route line — rendered when destination selected and coords available */}
        {selectedDestination && routeLineCoords.length > 1 && (
          <MapboxGL.ShapeSource id="route-line-source" shape={routeGeoJSON}>
            <MapboxGL.LineLayer
              id="route-line-layer"
              style={{
                lineColor: '#4A90E2',
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Destination pin marker — only render when coords are valid numbers */}
        {selectedDestination &&
          isFinite(selectedDestination.latitude) &&
          isFinite(selectedDestination.longitude) &&
          selectedDestination.latitude !== 0 && (
          <MapboxGL.MarkerView
            id="destination-marker"
            key={`destination-${selectedDestination.latitude}-${selectedDestination.longitude}`}
            coordinate={[selectedDestination.longitude, selectedDestination.latitude]}
          >
            <DestinationPin
              size={40}
              animated={true}
              label={selectedDestination.name ?? selectedDestination.address ?? undefined}
            />
          </MapboxGL.MarkerView>
        )}
      </FullScreenMap>

      {/* Top bar with sidebar toggle button (icon toggles sidebar open/close) */}
      <MapTopBar
        leftIcon={<SidebarToggleButton testID="client-map-top-bar-menu" />}
        centerContent={<AppBrandHeader appName="GLIDEY" color="#000000" />}
        testID="client-map-top-bar"
      />

      {/* Location Denied Banner */}
      <LocationDeniedBanner
        visible={shouldShowDeniedBanner}
        onPress={handleDeniedBannerPress}
        text={t('location.disabled') || 'Location disabled'}
        actionText={t('location.tap_to_enable') || 'Tap to enable'}
        topOffset={topBarOffset}
        testID="location-denied-banner"
      />

      {/* Destination Tip - Shows selected destination */}
      {selectedDestination && !showBookingSheet && (
        <DestinationTip
          destination={selectedDestination}
          topOffset={destinationTipOffset}
          onClose={handleClearDestination}
          testID="destination-tip"
        />
      )}

      {/* Center on location FAB */}
      <UserPositionButton
        onPress={handleLocatePress}
        isGpsEnabled={isServiceEnabled === true && permissionStatus === 'granted'}
        style={[styles.fab, { bottom: userPositionButtonBottom }]}
        testID="locate-fab"
      />

      {/* In-map booking sheet — auto-presents on destination confirmation (R1) */}
      <BookingSheet
        visible={showBookingSheet}
        pickup={location ? { latitude: location.latitude, longitude: location.longitude, address: 'Ma position' } : null}
        destination={selectedDestination}
        distanceM={directions?.distanceM ?? 0}
        durationS={directions?.durationS ?? 0}
        fareEstimates={fareEstimates}
        selectedVehicleTypeId={selectedVehicleTypeId}
        onSelectVehicleType={setSelectedVehicleTypeId}
        isFareLoading={isFareLoading}
        fareError={fareError}
        isBusy={isBusy}
        rideState={rideState}
        rideId={rideId}
        onBookRide={bookRide}
        onCancel={handleBookingCancel}
        onDismiss={handleClearDestination}
        onDismissToSearch={handleBookingDismissToSearch}
        userName={userName}
        onConfirmDestination={handleDestinationSelect}
      />

      {/* Location Services Prompt Modal (centered dialog) */}
      <LocationServicePrompt
        visible={shouldShowServicePrompt}
        onEnable={handleEnableLocation}
        onDismiss={handleDismissPrompt}
        title={t('location.enable_services') || 'Enable Location Services'}
        description={
          t('location.services_description') ||
          'Location services are turned off. Enable them in your device settings to use map features and find nearby rides.'
        }
        enableButtonText={t('location.open_settings') || 'Open Settings'}
        cancelButtonText={t('common.not_now') || 'Not Now'}
        testID="location-service-prompt"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
