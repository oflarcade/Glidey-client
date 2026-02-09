import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { useOnboardingConfig } from '../context/OnboardingContext';
import type { OnboardingSlideData } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlideProps {
  slide: OnboardingSlideData;
}

export function OnboardingSlide({ slide }: OnboardingSlideProps) {
  const { theme } = useOnboardingConfig();

  return (
    <View
      style={[
        styles.container,
        {
          width: SCREEN_WIDTH,
          backgroundColor: slide.backgroundColor || theme.colors.background,
        },
      ]}
    >
      {/* Centered content area - image in middle of available space */}
      <View style={styles.contentArea}>
        {/* Image container - vertically centered */}
        <View style={styles.imageContainer}>
          <Image
            source={slide.image}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Text content - below image */}
        <View
          style={[
            styles.textContainer,
            { paddingHorizontal: theme.spacing.large },
          ]}
        >
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text,
                fontSize: theme.typography.titleSize,
              },
            ]}
          >
            {slide.title}
          </Text>

          <Text
            style={[
              styles.description,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.descriptionSize,
                marginTop: theme.spacing.medium,
              },
            ]}
          >
            {slide.description}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 180, // Space for dots + buttons at bottom
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: SCREEN_HEIGHT * 0.35,
    marginBottom: 24,
  },
  image: {
    width: SCREEN_WIDTH * 0.75,
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
  },
});
