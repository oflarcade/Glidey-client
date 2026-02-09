import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors as colors } from '../../theme';
import type { SidebarMenuProps } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_WIDTH_PERCENT = 0.75;
const DEFAULT_ANIMATION_DURATION = 300;
const DEFAULT_BACKDROP_OPACITY = 0.5;

/**
 * SidebarMenu Component
 *
 * A shared drawer/sidebar menu that slides in from the left edge.
 * Features smooth animations, backdrop dismiss, and safe area support.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <SidebarMenu
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * >
 *   <MenuItem title="Home" onPress={() => navigate('Home')} />
 *   <MenuItem title="Profile" onPress={() => navigate('Profile')} />
 * </SidebarMenu>
 * ```
 */
function SidebarMenuComponent({
  isOpen,
  onClose,
  children,
  width,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  backdropOpacity = DEFAULT_BACKDROP_OPACITY,
  testID,
}: SidebarMenuProps) {
  const insets = useSafeAreaInsets();

  // Calculate sidebar width
  const sidebarWidth = calculateWidth(width);

  // Animation progress (0 = closed, 1 = open)
  const progress = useSharedValue(0);

  // Track if component should render (updated via worklet callback)
  // This avoids reading progress.value during render
  const [shouldRender, setShouldRender] = useState(isOpen);

  // Handle open/close state changes
  useEffect(() => {
    if (isOpen) {
      // When opening, ensure we render before animation starts
      setShouldRender(true);
    }
    progress.value = withTiming(isOpen ? 1 : 0, {
      duration: animationDuration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isOpen, animationDuration, progress]);

  // Track when animation completes to unmount when fully closed
  useAnimatedReaction(
    () => progress.value,
    (currentValue, previousValue) => {
      // When animation completes closing (reaches 0)
      if (currentValue === 0 && previousValue !== 0) {
        runOnJS(setShouldRender)(false);
      }
    },
    [progress]
  );

  // Animated styles for the sidebar panel
  const sidebarAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [-sidebarWidth, 0]
    );

    return {
      transform: [{ translateX }],
    };
  });

  // Animated styles for the backdrop
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [0, 1], [0, backdropOpacity]),
      pointerEvents: progress.value > 0 ? 'auto' : 'none',
    };
  });

  // Handle backdrop press
  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  // Don't render anything if completely closed (optimization)
  if (!shouldRender) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none" testID={testID}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
        <Pressable
          style={styles.backdropPressable}
          onPress={handleBackdropPress}
          testID={testID ? `${testID}-backdrop` : undefined}
        />
      </Animated.View>

      {/* Sidebar Panel */}
      <Animated.View
        style={[
          styles.sidebar,
          sidebarAnimatedStyle,
          {
            width: sidebarWidth,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
        testID={testID ? `${testID}-panel` : undefined}
      >
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  );
}

/**
 * Calculate the sidebar width based on prop value
 */
function calculateWidth(width?: number | `${number}%`): number {
  if (width === undefined) {
    return SCREEN_WIDTH * DEFAULT_WIDTH_PERCENT;
  }

  if (typeof width === 'number') {
    return width;
  }

  // Handle percentage string (e.g., '75%')
  const percentValue = parseFloat(width) / 100;
  return SCREEN_WIDTH * percentValue;
}

/**
 * Memoized SidebarMenu to prevent unnecessary re-renders
 */
export const SidebarMenu = memo(SidebarMenuComponent);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },

  backdropPressable: {
    flex: 1,
  },

  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.surface.background,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 16,
      },
    }),
  },

  content: {
    flex: 1,
  },
});
