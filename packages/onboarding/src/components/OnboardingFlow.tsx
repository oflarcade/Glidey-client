import React, { useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingConfig } from '../context/OnboardingContext';
import { useOnboardingFlow } from '../hooks/useOnboardingFlow';
import { OnboardingSlide } from './OnboardingSlide';
import { PaginationDots } from './PaginationDots';
import type { ButtonType } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { config, theme, labels } = useOnboardingConfig();
  const {
    currentIndex,
    totalSlides,
    isLastSlide,
    goToSlide,
    complete,
    skip,
  } = useOnboardingFlow();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        goToSlide(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const currentSlide = config.slides[currentIndex];
  
  // Determine button type based on slide config or default by index
  const getButtonType = useCallback((): ButtonType => {
    if (currentSlide?.buttonConfig?.type) {
      return currentSlide.buttonConfig.type;
    }
    // Default behavior based on slide index
    if (isLastSlide) return 'action';
    if (currentIndex === totalSlides - 2) return 'skipAndGetStarted'; // Second to last slide
    return 'skip';
  }, [currentSlide, currentIndex, totalSlides, isLastSlide]);

  const buttonType = getButtonType();

  const handleSkip = useCallback(() => {
    skip().then(onComplete);
  }, [skip, onComplete]);

  const handleGetStarted = useCallback(() => {
    // Navigate to the last slide
    flatListRef.current?.scrollToIndex({
      index: totalSlides - 1,
      animated: true,
    });
  }, [totalSlides]);

  const handleActionButton = useCallback(async () => {
    // Check for custom action handler on the slide
    if (currentSlide?.buttonConfig?.onAction) {
      await currentSlide.buttonConfig.onAction();
    } else if (config.onLocationPermission) {
      // Default to location permission handler
      await config.onLocationPermission();
    }
    // Complete onboarding after action
    await complete();
    onComplete();
  }, [currentSlide, config, complete, onComplete]);

  // Get action button label
  const getActionButtonLabel = useCallback((): string => {
    if (currentSlide?.buttonConfig?.actionLabel) {
      return currentSlide.buttonConfig.actionLabel;
    }
    return labels.useLocation || 'USE MY LOCATION';
  }, [currentSlide, labels]);

  // Render buttons based on type
  const renderButtons = () => {
    switch (buttonType) {
      case 'skip':
        return (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.skipOnlyButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
                {labels.skip}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'skipAndGetStarted':
        return (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.skipButtonInRow}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
                {labels.skip}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.getStartedButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.large,
                },
              ]}
              onPress={handleGetStarted}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { fontSize: theme.typography.buttonSize }]}>
                {labels.getStarted}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'action':
        return (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.large,
                  paddingVertical: theme.spacing.medium,
                },
              ]}
              onPress={handleActionButton}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { fontSize: theme.typography.buttonSize }]}>
                {getActionButtonLabel()}
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={config.slides}
        renderItem={({ item }) => <OnboardingSlide slide={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Bottom section - Dots + Buttons */}
      <View
        style={[
          styles.bottomSection,
          {
            paddingBottom: insets.bottom + theme.spacing.large,
            paddingHorizontal: theme.spacing.large,
          },
        ]}
      >
        {/* Pagination dots - below description */}
        <View style={styles.dotsContainer}>
          <PaginationDots total={totalSlides} current={currentIndex} />
        </View>

        {/* Dynamic buttons based on slide */}
        {renderButtons()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  dotsContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipOnlyButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  skipButtonInRow: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  getStartedButton: {
    flex: 1,
    marginLeft: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
});
