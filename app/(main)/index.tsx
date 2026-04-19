import { useCallback, useState, useRef, useMemo } from 'react';
import { useRouter } from 'expo-router';
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
import { useUIStore } from '@rentascooter/shared';
import type { Location } from '@rentascooter/shared';
import Constants from 'expo-constants';
import { useNearbyDrivers, type NearbyDriver } from '@/hooks/useNearbyDrivers';
import { useRouteDirections } from '@/hooks/useRouteDirections';
import { getRouteLineCoordinates } from '@/utils/routeLineCoordinates';
import { DriverMarkers } from '@/components/DriverMarkers';
import { LocationModal, DestinationTip } from '@/components/LocationModal';
import { animateToLocation } from '@/utils/mapAnimations';
import { getMockDriversNear } from '@/utils/mockDrivers';
import { useUser } from '@rentascooter/auth';

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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const { t } = useTranslation();

  // UI store for location modal state (sidebar toggle is in SidebarToggleButton)
  const { isLocationModalOpen, closeLocationModal } = useUIStore();

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
   * Navigate to BookingScreen with pickup + route data from the current map state.
   */
  const handleBookNow = useCallback(() => {
    if (!location || !selectedDestination) return;
    router.push({
      pathname: '/(main)/booking',
      params: {
        pickupLat: String(location.latitude),
        pickupLng: String(location.longitude),
        destLat: String(selectedDestination.latitude),
        destLng: String(selectedDestination.longitude),
        destAddress: selectedDestination.address ?? '',
        destName: selectedDestination.name ?? '',
        distanceM: String(directions?.distanceM ?? 0),
        durationS: String(directions?.durationS ?? 0),
      },
    });
  }, [location, selectedDestination, directions, router]);

  /**
   * Handle location modal close
   */
  const handleCloseLocationModal = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeLocationModal();
  }, [closeLocationModal]);

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
   * Handle destination selection
   */
  const handleDestinationSelect = useCallback(
    async (destination: Location) => {
      // Haptic feedback for selection
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Update state
      setSelectedDestination(destination);

      // Zoom map on destination only (fixed zoom level)
      if (cameraRef.current) {
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
    [location]
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
  const destinationTipOffset = isLocationModalOpen ? topBarOffset + 80 : topBarOffset;

  // UserPositionButton offset (reposition when modal opens)
  const userPositionButtonBottom = isLocationModalOpen
    ? insets.bottom + spacing.xl + 200 // Offset by modal height
    : insets.bottom + spacing.xl;

  // Convert user location to Location type for modal
  const userLocationForModal: Location | undefined = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        address: 'Current Location',
        name: userName,
      }
    : undefined;

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

        {/* Destination pin marker */}
        {selectedDestination && (
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
      {selectedDestination && (
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

      {/* Location Selection Modal (BottomSheet). Rendered before LocationServicePrompt so that when both could be visible, the prompt appears on top. */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={handleCloseLocationModal}
        selectedDestination={selectedDestination}
        onDestinationSelect={handleDestinationSelect}
        onClearDestination={handleClearDestination}
        userLocation={userLocationForModal}
        userName={userName}
        onBookNow={handleBookNow}
        testID="location-modal"
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
