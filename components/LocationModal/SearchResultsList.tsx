/**
 * SearchResultsList Component
 * Client App - Location Selection Modal
 *
 * Displays search results with compact styling.
 * Shows loading skeleton and empty state.
 *
 * @acceptance AC-SRL-001: List displays search results compactly
 * @acceptance AC-SRL-002: Loading state shows skeleton
 * @acceptance AC-SRL-003: Empty state shows when no results
 * @acceptance AC-SRL-004: Selecting location calls onSelect handler
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { Icon } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import type { Location } from '@rentascooter/shared';
import { LocationRow } from './LocationRow';

export interface SearchResultsListProps {
  /** Search results to display */
  results: Location[];
  /** Loading state */
  isLoading?: boolean;
  /** Search query */
  query: string;
  /** Selection handler */
  onSelect: (location: Location) => void;
  /** Optional callback when user starts scrolling (e.g., to blur input) */
  onScrollStart?: () => void;
  /** Test ID */
  testID?: string;
}

export const SearchResultsList = memo(function SearchResultsList({
  results,
  isLoading = false,
  query,
  onSelect,
  onScrollStart,
  testID = 'search-results-list',
}: SearchResultsListProps) {
  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer} testID={`${testID}-loading`}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Searching...</Text>
      </View>
    );
  }

  // Empty state
  if (results.length === 0 && query.length > 0) {
    return (
      <View style={styles.emptyContainer} testID={`${testID}-empty`}>
        <Icon name="search" size={48} color={colors.icon.default} />
        <Text style={styles.emptyTitle}>No Results Found</Text>
        <Text style={styles.emptyText}>
          Try searching for a different location
        </Text>
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
        <Text style={styles.headerText}>
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </Text>
      </View>

      {/* Search result rows */}
      {results.map((location, index) => (
        <LocationRow
          key={`${location.latitude}-${location.longitude}-${index}`}
          location={location}
          variant="search"
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  headerText: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },

  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
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
