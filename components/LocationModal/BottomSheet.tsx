/**
 * BottomSheet Component
 * A lightweight bottom sheet using a View overlay with Animated APIs.
 * Replaces @gorhom/bottom-sheet to avoid Reanimated v4 compatibility issues.
 *
 * Architecture: Position-based (not height-based)
 * - Sheet always renders at expandedHeight
 * - translateY controls visible portion:
 *   - Minimized: translateY = expandedHeight - minimizedHeight (partially hidden)
 *   - Expanded:  translateY = 0 (fully visible)
 *   - Closed:    translateY = expandedHeight (fully hidden)
 *
 * Features:
 * - Multiple snap points (minimized/expanded)
 * - Drag anywhere on sheet to expand/minimize
 * - Smooth native-driver animations for all transitions
 * - Backdrop with opacity
 * - Keyboard-aware when expanded
 * - Safe area aware (accounts for Android navigation bar)
 */

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  ViewStyle,
  Keyboard,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface BottomSheetRef {
  expand: () => void;
  minimize: () => void;
  close: () => void;
}

export interface BottomSheetProps {
  /** Snap points array - [minimized, expanded] heights (excluding safe area) */
  snapPoints: number[];
  /** Initial snap index (0 = minimized, 1 = expanded) */
  initialSnapIndex?: number;
  /** Enable swipe down to close completely (default: false - just minimizes) */
  enablePanDownToClose?: boolean;
  /** Callback when sheet index changes (-1 = closed, 0 = minimized, 1 = expanded) */
  onChange?: (index: number) => void;
  /** Custom handle indicator style */
  handleIndicatorStyle?: ViewStyle;
  /** Custom background style */
  backgroundStyle?: ViewStyle;
  /** Content */
  children: React.ReactNode;
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  function BottomSheet(
    {
      snapPoints,
      initialSnapIndex = 0,
      enablePanDownToClose = false,
      onChange,
      handleIndicatorStyle,
      backgroundStyle,
      children,
    },
    ref
  ) {
    const insets = useSafeAreaInsets();
    const effectiveBottomInset = insets.bottom || (Platform.OS === 'android' ? 48 : 0);
    const [isVisible, setIsVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(initialSnapIndex);
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    
    // Track the starting translateY value when pan begins
    const panStartY = useRef(0);

    // Get snap point heights [minimized, expanded] - ADD bottom insets for safe area (single source in BottomSheet)
    const minimizedHeight = (snapPoints[0] || 120) + effectiveBottomInset;
    const expandedHeight = (snapPoints[1] || SCREEN_HEIGHT * 0.6) + effectiveBottomInset;
    
    // Position-based architecture: calculate translateY for each snap index
    // Minimized: sheet is partially hidden (translateY = expandedHeight - minimizedHeight)
    // Expanded: sheet is fully visible (translateY = 0)
    // Closed: sheet is fully hidden (translateY = expandedHeight)
    const getTranslateYForIndex = useCallback((index: number) => {
      if (index === 0) return expandedHeight - minimizedHeight; // Minimized
      if (index === 1) return 0; // Expanded
      return expandedHeight; // Closed (index === -1)
    }, [minimizedHeight, expandedHeight]);

    // Track if sheet has been opened (to prevent re-triggering open animation)
    const hasOpenedRef = useRef(false);

    // Animate to a specific snap index using position-based targets
    const animateToIndex = useCallback((index: number, velocity = 0) => {
      const targetY = getTranslateYForIndex(index);
      // Backdrop opacity: 0 for minimized, 0.3 for expanded
      const backdropTarget = index === 1 ? 0.3 : 0;

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: targetY,
          useNativeDriver: true,
          damping: 28,
          stiffness: 280,
          mass: 0.8,
          velocity,
        }),
        Animated.timing(backdropOpacity, {
          toValue: backdropTarget,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentIndex(index);
      onChange?.(index);
    }, [translateY, backdropOpacity, onChange, getTranslateYForIndex]);

    // Close sheet completely
    const closeSheet = useCallback(() => {
      Keyboard.dismiss();
      
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: expandedHeight,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        hasOpenedRef.current = false; // Reset so next open triggers animation
        setIsVisible(false);
        setCurrentIndex(initialSnapIndex);
        onChange?.(-1);
      });
    }, [translateY, backdropOpacity, initialSnapIndex, onChange, expandedHeight]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      expand: () => {
        if (!isVisible) {
          setIsVisible(true);
        } else {
          animateToIndex(1);
        }
      },
      minimize: () => {
        Keyboard.dismiss();
        animateToIndex(0);
      },
      close: () => {
        closeSheet();
      },
    }));

    // Open animation when becoming visible
    // Only runs once when sheet transitions from hidden to visible
    useEffect(() => {
      if (isVisible && !hasOpenedRef.current) {
        hasOpenedRef.current = true;
        // Start off-screen
        translateY.setValue(expandedHeight);
        // Animate to initial snap index position
        setTimeout(() => animateToIndex(initialSnapIndex), 50);
      } else if (!isVisible) {
        // Reset the flag when sheet closes
        hasOpenedRef.current = false;
      }
    }, [isVisible, initialSnapIndex, animateToIndex, translateY, expandedHeight]);

    // Store refs for pan responder (to avoid stale closures)
    const currentIndexRef = useRef(currentIndex);
    const minimizedHeightRef = useRef(minimizedHeight);
    const expandedHeightRef = useRef(expandedHeight);
    const animateToIndexRef = useRef(animateToIndex);
    const closeSheetRef = useRef(closeSheet);
    const getTranslateYForIndexRef = useRef(getTranslateYForIndex);
    
    useEffect(() => {
      currentIndexRef.current = currentIndex;
      minimizedHeightRef.current = minimizedHeight;
      expandedHeightRef.current = expandedHeight;
      animateToIndexRef.current = animateToIndex;
      closeSheetRef.current = closeSheet;
      getTranslateYForIndexRef.current = getTranslateYForIndex;
    }, [currentIndex, minimizedHeight, expandedHeight, animateToIndex, closeSheet, getTranslateYForIndex]);

    // Pan responder for drag gestures - attached to entire sheet
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => 
          Math.abs(gestureState.dy) > 5,
        onPanResponderGrant: () => {
          // Store the current translateY value when pan starts
          translateY.stopAnimation((value) => {
            panStartY.current = value;
          });
        },
        onPanResponderMove: (_, gestureState) => {
          const { dy } = gestureState;
          const index = currentIndexRef.current;
          
          // Calculate new position relative to where the pan started
          const currentStartY = getTranslateYForIndexRef.current(index);
          let newY = currentStartY + dy;
          
          // Clamp: don't go above fully expanded (0) with slight rubber band
          if (newY < 0) {
            // Rubber band effect when trying to drag above expanded
            newY = newY * 0.3;
          }
          
          // Clamp: don't go below closed position
          const maxY = expandedHeightRef.current;
          if (newY > maxY) {
            newY = maxY;
          }
          
          translateY.setValue(newY);
          
          // Adjust backdrop based on position
          // Backdrop should be 0.3 at expanded (y=0), 0 at minimized or below
          const minimizedY = expandedHeightRef.current - minimizedHeightRef.current;
          const backdropProgress = Math.max(0, 1 - (newY / minimizedY));
          backdropOpacity.setValue(0.3 * Math.min(1, backdropProgress));
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dy, vy } = gestureState;
          const index = currentIndexRef.current;
          
          // Threshold for snap decision
          const DRAG_THRESHOLD = 50;
          const VELOCITY_THRESHOLD = 0.5;
          
          // Determine action based on drag direction and magnitude
          const isDraggingDown = dy > DRAG_THRESHOLD || vy > VELOCITY_THRESHOLD;
          const isDraggingUp = dy < -DRAG_THRESHOLD || vy < -VELOCITY_THRESHOLD;
          
          if (isDraggingDown) {
            // Dragging down
            Keyboard.dismiss();
            if (index === 1) {
              // From expanded -> minimize
              animateToIndexRef.current(0, vy);
            } else if (enablePanDownToClose) {
              // From minimized -> close (if enabled)
              closeSheetRef.current();
            } else {
              // Bounce back to minimized
              animateToIndexRef.current(0, vy);
            }
          } else if (isDraggingUp) {
            // Dragging up -> expand
            animateToIndexRef.current(1, vy);
          } else {
            // Small movement - return to current position
            animateToIndexRef.current(index);
          }
        },
      })
    ).current;

    if (!isVisible) {
      return null;
    }

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Backdrop - only visible when expanded */}
        <TouchableWithoutFeedback 
          onPress={() => {
            Keyboard.dismiss();
            animateToIndex(0);
          }}
        >
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: backdropOpacity },
            ]}
            pointerEvents={currentIndex === 1 ? 'auto' : 'none'}
          />
        </TouchableWithoutFeedback>

        {/* Sheet container */}
        <View 
          style={styles.sheetContainer}
          pointerEvents="box-none"
        >
          {/* Sheet - always rendered at expandedHeight, translateY controls visibility */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.sheet,
              backgroundStyle,
              {
                height: expandedHeight,
                paddingBottom: effectiveBottomInset,
                transform: [{ translateY }],
              },
            ]}
          >
            {/* Handle indicator (visual only, entire sheet is draggable) */}
            <View style={styles.handleContainer}>
              <View style={[styles.handle, handleIndicatorStyle]} />
            </View>

            {/* Content */}
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
});
