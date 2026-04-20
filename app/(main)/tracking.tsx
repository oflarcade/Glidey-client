import { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapboxGL from '@rnmapbox/maps';
import { FullScreenMap, ArrivalBanner } from '@rentascooter/ui';
import { colors, spacing } from '@rentascooter/ui/theme';
import { useRideStore, selectMatchedDriver, selectRideId } from '@rentascooter/shared';
import { useRideTracking } from '@/hooks/useRideTracking';

// ─── TrackingScreen (T-109, T-111, T-113, T-115) ─────────────────────────────

export default function TrackingScreen() {
  const rideId = useRideStore(selectRideId);
  const matchedDriver = useRideStore(selectMatchedDriver);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  // T-109: subscribe; keep-awake engaged by trackingService (T-113)
  // T-107: stale flag + ETA-reset origin are in useRideTracking
  const { driverPosition, currentEta, stale, progress } = useRideTracking(rideId);

  const etaMinutes = currentEta / 60;
  const driverName = matchedDriver?.name ?? '';

  return (
    <View style={styles.root}>
      <FullScreenMap cameraRef={cameraRef} showUserLocation>
        {/* Driver marker — opacity fades on stale (T-115) */}
        {driverPosition && (
          <MapboxGL.MarkerView
            id="driver-marker"
            coordinate={[driverPosition.longitude, driverPosition.latitude]}
          >
            <View style={[styles.driverDot, stale && styles.driverDotStale]} />
          </MapboxGL.MarkerView>
        )}
      </FullScreenMap>

      {/* Stale connectivity banner (T-115) */}
      {stale && (
        <SafeAreaView edges={['top']} style={styles.staleBanner} pointerEvents="none">
          <Text style={styles.staleText}>Signal perdu — localisation en attente…</Text>
        </SafeAreaView>
      )}

      {/* ArrivalBanner — re-renders on each tracking update (T-111) */}
      <ArrivalBanner
        driverName={driverName}
        etaMinutes={etaMinutes}
        progress={progress}
        style={styles.banner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Driver marker
  driverDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary.main,
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  driverDotStale: { opacity: 0.35 },

  // Stale banner
  staleBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 193, 7, 0.92)',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  staleText: { fontSize: 13, fontWeight: '600', color: '#3D2B00' },

  // ArrivalBanner pinned to bottom (T-111)
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
