/**
 * DestinationPinTip Component
 * RentAScooter Client App
 *
 * Floating tooltip that appears above destination pin on map.
 * Shows destination name and address with auto-dismiss.
 *
 * @acceptance AC-DPT-001: Floats above destination pin
 * @acceptance AC-DPT-002: Shows destination name and address
 * @acceptance AC-DPT-003: Arrow pointing down to pin
 * @acceptance AC-DPT-004: Auto-dismisses after 3 seconds
 * @acceptance AC-DPT-005: Dismisses on tap
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '@rentascooter/ui';
import { colors, spacing, typography, borderRadius } from '@rentascooter/ui/theme';

export interface DestinationPinTipProps {
  /** Location name */
  name: string;
  /** Location address */
  address: string;
  /** Whether tip is visible */
  visible: boolean;
  /** Dismiss handler */
  onDismiss: () => void;
  /** Position on screen */
  position: { x: number; y: number };
  /** Auto-dismiss timeout in ms (default: 3000) */
  autoDismissTimeout?: number;
  /** Test ID */
  testID?: string;
}

export function DestinationPinTip({
  name,
  address,
  visible,
  onDismiss,
  position,
  autoDismissTimeout = 3000,
  testID,
}: DestinationPinTipProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Animate in/out based on visible prop
  useEffect(() => {
    if (visible) {
      Animated.spring(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  // Auto-dismiss after timeout
  useEffect(() => {
    if (visible && autoDismissTimeout > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissTimeout);

      return () => clearTimeout(timer);
    }
  }, [visible, autoDismissTimeout, onDismiss]);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: position.y - 80, // Position above pin
          left: position.x - 100, // Center horizontally (assuming 200px width)
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
      testID={testID}
    >
      <Pressable onPress={handlePress} style={styles.pressable}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="user-silhouette" size={16} color={colors.text.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.address} numberOfLines={1}>
              {address}
            </Text>
          </View>
        </View>
        
        {/* Arrow pointing down */}
        <View style={styles.arrow} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 200,
    zIndex: 1000,
  },
  pressable: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  address: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary.main,
    alignSelf: 'center',
    marginTop: -1,
  },
});
