import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { useRideStore, selectMatchedDriver } from '@rentascooter/shared';
import { DriverCard } from '@rentascooter/ui';
import { colors, spacing } from '@rentascooter/ui/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriverRevealProps {
  visible: boolean;
}

// ─── DriverReveal (T-104) ─────────────────────────────────────────────────────

export function DriverReveal({ visible }: DriverRevealProps) {
  const matchedDriver = useRideStore(selectMatchedDriver);
  const slideAnim = useRef(new Animated.Value(200)).current;

  useEffect(() => {
    if (visible && matchedDriver) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 200,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, matchedDriver, slideAnim]);

  if (!visible || !matchedDriver) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <View style={styles.handle} />
      <DriverCard
        name={matchedDriver.name}
        vehiclePlate={matchedDriver.vehiclePlate}
        vehicleType={matchedDriver.vehicleType}
        rating={matchedDriver.rating}
        completedRides={matchedDriver.completedRides}
        profilePhoto={matchedDriver.profilePhoto}
      />
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.light,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
});
