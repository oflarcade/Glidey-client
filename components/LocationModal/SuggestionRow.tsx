/**
 * SuggestionRow Component
 * Client App - Location Selection Modal
 *
 * Row for a single autocomplete suggestion (no coordinates until retrieved).
 */

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Icon } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import type { Suggestion } from '@rentascooter/shared';

export interface SuggestionRowProps {
  suggestion: Suggestion;
  onPress: (suggestion: Suggestion) => void;
  testID?: string;
}

export const SuggestionRow = memo(function SuggestionRow({
  suggestion,
  onPress,
  testID = 'suggestion-row',
}: SuggestionRowProps) {
  const handlePress = () => {
    onPress(suggestion);
  };

  const primaryLine = suggestion.name ?? suggestion.fullAddress ?? 'Location';
  const secondaryLine =
    suggestion.fullAddress && suggestion.fullAddress !== primaryLine
      ? suggestion.fullAddress
      : suggestion.address ?? '';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
      testID={testID}
    >
      <View style={styles.iconContainer}>
        <Icon
          name="map-pin"
          size={20}
          color={colors.icon.default}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {primaryLine}
        </Text>
        {secondaryLine ? (
          <Text style={styles.address} numberOfLines={1}>
            {secondaryLine}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: colors.background.primary,
  },
  pressed: {
    backgroundColor: colors.background.secondary,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  address: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
