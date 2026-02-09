import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 20,
  showValue = false,
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const handlePress = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const renderStar = (index: number) => {
    const filled = index < Math.floor(rating);
    const halfFilled = index === Math.floor(rating) && rating % 1 >= 0.5;

    const starColor = filled || halfFilled ? colors.secondary.main : colors.background.tertiary;

    const Star = (
      <Text style={[styles.star, { fontSize: size, color: starColor }]}>
        {filled ? '★' : halfFilled ? '★' : '☆'}
      </Text>
    );

    if (interactive) {
      return (
        <Pressable key={index} onPress={() => handlePress(index)}>
          {Star}
        </Pressable>
      );
    }

    return <View key={index}>{Star}</View>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxRating }).map((_, index) => renderStar(index))}
      </View>
      {showValue && (
        <Text style={styles.value}>{rating.toFixed(1)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 2,
  },
  value: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
});
