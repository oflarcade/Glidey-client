import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useOnboardingConfig } from '../context/OnboardingContext';

interface PaginationDotsProps {
  total: number;
  current: number;
}

export function PaginationDots({ total, current }: PaginationDotsProps) {
  const { theme } = useOnboardingConfig();

  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <PaginationDot
          key={index}
          isActive={index === current}
          activeColor={theme.colors.dotActive}
          inactiveColor={theme.colors.dot}
        />
      ))}
    </View>
  );
}

interface PaginationDotProps {
  isActive: boolean;
  activeColor: string;
  inactiveColor: string;
}

function PaginationDot({ isActive, activeColor, inactiveColor }: PaginationDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const width = withSpring(isActive ? 24 : 8, {
      damping: 15,
      stiffness: 150,
    });

    const opacity = withSpring(isActive ? 1 : 0.5, {
      damping: 15,
      stiffness: 150,
    });

    return {
      width,
      opacity,
      backgroundColor: isActive ? activeColor : inactiveColor,
    };
  }, [isActive, activeColor, inactiveColor]);

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
