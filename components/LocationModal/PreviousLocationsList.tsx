/**
 * PreviousLocationsList Component
 * Client App - Location Selection Modal
 *
 * Displays user's previous destinations with larger, more prominent styling.
 * Scrollable list with empty state.
 *
 * @acceptance AC-PLL-001: List displays previous locations with larger text
 * @acceptance AC-PLL-002: List is scrollable
 * @acceptance AC-PLL-003: Empty state shows when no history
 * @acceptance AC-PLL-004: Selecting location calls onSelect handler
 */

import React, { memo } from 'react';
import { View, Text, ScrollView, StyleSheet, Keyboard, Platform } from 'react-native';
import { Icon } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { useTranslation } from '@rentascooter/i18n';
import type { Location } from '@rentascooter/shared';
import { LocationRow } from './LocationRow';

export interface PreviousLocationsListProps {
  /** Previous locations to display */
  locations: Location[];
  /** Selection handler */
  onSelect: (location: Location) => void;
  /** Optional callback when user starts scrolling (e.g., to blur input) */
  onScrollStart?: () => void;
  /** Test ID */
  testID?: string;
}

export const PreviousLocationsList = memo(function PreviousLocationsList({
  locations,
  onSelect,
  onScrollStart,
  testID = 'previous-locations-list',
}: PreviousLocationsListProps) {
  const { t } = useTranslation();

  // Empty state
  if (locations.length === 0) {
    return (
      <View style={styles.emptyContainer} testID={`${testID}-empty`}>
        <Icon name="history" size={48} color={colors.icon.default} />
        <Text style={styles.emptyTitle}>{t('search.no_history_title')}</Text>
        <Text style={styles.emptyText}>{t('search.no_history_body')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      onScrollBeginDrag={() => {
        onScrollStart?.();
        Keyboard.dismiss();
      }}
      onTouchStartCapture={() => {
        onScrollStart?.();
        Keyboard.dismiss();
      }}
      onTouchStart={() => {
        onScrollStart?.();
        Keyboard.dismiss();
      }}
      testID={testID}
    >
      {/* Section header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('search.recent_destinations')}</Text>
      </View>

      {/* Location rows */}
      {locations.map((location, index) => (
        <LocationRow
          key={`${location.latitude}-${location.longitude}-${index}`}
          location={location}
          variant="previous"
          onPress={onSelect}
          testID={`${testID}-row-${index}`}
        />
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  contentContainer: {
    paddingBottom: spacing.xl,
  },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  headerText: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },

  emptyTitle: {
    ...typography.h3,
    color: colors.text.secondary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },

  emptyText: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
