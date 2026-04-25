import React, { useEffect } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, shadows, borderRadius } from '../../theme';
import { rem } from '../../utils';

let _headerAnimationPlayed = false;

/**
 * @description Props for the MapTopBar component
 *
 * @acceptance AC-MTB-001: MapTopBar floats over map with absolute positioning
 * @acceptance AC-MTB-002: Background is semi-transparent white (rgba 255,255,255,0.95)
 * @acceptance AC-MTB-003: Has blur effect on iOS, solid background on Android
 * @acceptance AC-MTB-004: Respects safe area insets for notched devices
 * @acceptance AC-MTB-005: Shadow provides depth separation from map
 * @acceptance AC-MTB-006: Height is rem(1) content area (~16px at 390px base width)
 * @acceptance AC-MTB-007: Horizontal padding uses theme spacing.md (16px)
 * @acceptance AC-MTB-008: Left icon slot renders custom content
 * @acceptance AC-MTB-009: Center content slot for status/branding
 * @acceptance AC-MTB-010: Right content slot for toggles/actions
 * @acceptance AC-MTB-011: Left press handler fires when left area tapped
 * @acceptance AC-MTB-012: Border radius on bottom corners for floating effect
 */
export interface MapTopBarProps {
  /** Left icon slot (e.g., menu icon) */
  leftIcon?: React.ReactNode;
  /** Center content slot (e.g., status indicator or branding) */
  centerContent?: React.ReactNode;
  /** Right content slot (e.g., toggle or action buttons) */
  rightContent?: React.ReactNode;
  /** Press handler for left icon area */
  onLeftPress?: () => void;
  /** Optional custom styles for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

export function MapTopBar({
  leftIcon,
  centerContent,
  rightContent,
  onLeftPress,
  style,
  testID,
}: MapTopBarProps) {
  const insets = useSafeAreaInsets();

  const headerY = useSharedValue(
    _headerAnimationPlayed ? 0 : -(rem(1) + insets.top)
  );

  useEffect(() => {
    if (_headerAnimationPlayed) return;
    _headerAnimationPlayed = true;
    headerY.value = withTiming(0, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top },
        animatedStyle,
        style,
      ]}
      testID={testID}
    >
      <View style={styles.content}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {onLeftPress ? (
            <Pressable
              onPress={onLeftPress}
              style={({ pressed }) => [
                styles.leftIconButton,
                pressed && styles.leftIconButtonPressed,
              ]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Menu"
              accessibilityRole="button"
              testID={testID ? `${testID}-left-button` : undefined}
            >
              {leftIcon}
            </Pressable>
          ) : (
            <View style={styles.leftIconButton}>{leftIcon}</View>
          )}
        </View>

        {/* Center Section */}
        <View style={styles.centerSection}>
          {centerContent}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightContent}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    ...(Platform.OS === 'android' && { elevation: 100 }),
    backgroundColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.92)',
      android: 'rgba(255, 255, 255, 0.98)',
    }),
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    ...shadows.medium,
    ...(Platform.OS === 'ios' && {
      backdropFilter: 'blur(20px)',
    }),
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 0,
    minHeight: rem(1.5),
  },

  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  leftIconButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
    paddingVertical: 0,
    paddingRight: spacing.md,
    borderRadius: borderRadius.md,
  },
  leftIconButtonPressed: {
    opacity: 0.7,
  },

  centerSection: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
