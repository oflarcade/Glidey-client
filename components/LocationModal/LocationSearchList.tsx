/**
 * LocationSearchList Component
 * Client App - Location Selection Modal
 *
 * Displays search results (locations or autocomplete suggestions).
 * mode='location': direct search results (Location[]).
 * mode='suggestion': Mapbox Search Box suggestions (Suggestion[]); select triggers retrieve.
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Icon } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import type { Location, Suggestion } from '@rentascooter/shared';
import { LocationListBase } from './LocationListBase';
import { SuggestionRow } from './SuggestionRow';

const searchHeaderStyles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  text: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export interface LocationSearchListLocationProps {
  mode: 'location';
  results: Location[];
  onSelect: (location: Location) => void;
}

export interface LocationSearchListSuggestionProps {
  mode: 'suggestion';
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
}

const MIN_QUERY_LENGTH_FOR_LOADING = 3;

type LocationSearchListProps = (
  | LocationSearchListLocationProps
  | LocationSearchListSuggestionProps
) & {
  isLoading?: boolean;
  query: string;
  error?: string | null;
  onScrollStart?: () => void;
  onScrollEnd?: () => void;
  testID?: string;
};

export const LocationSearchList = memo(function LocationSearchList(
  props: LocationSearchListProps
) {
  const {
    query,
    isLoading = false,
    error = null,
    onScrollStart,
    onScrollEnd,
    testID = 'location-search-list',
  } = props;

  const trimmedQuery = query.trim();
  // Show loading when: explicitly loading OR (suggestion mode, query long enough, no results yet, no error)
  const showLoadingSuggestion =
    props.mode === 'suggestion' &&
    trimmedQuery.length >= MIN_QUERY_LENGTH_FOR_LOADING &&
    props.suggestions.length === 0 &&
    !error;
  const showLoading = isLoading || showLoadingSuggestion;

  const showEmpty =
    (props.mode === 'location'
      ? props.results.length === 0
      : props.suggestions.length === 0) &&
    trimmedQuery.length > 0 &&
    !showLoading;

  const emptyState = showEmpty
    ? {
        iconName: 'search' as const,
        title: 'No Results Found',
        message: error?.trim() ?? 'Try searching for a different location',
      }
    : undefined;

  if (props.mode === 'location') {
    return (
      <LocationListBase
        items={props.results}
        variant="search"
        header={{ type: 'count' }}
        isLoading={showLoading}
        emptyState={emptyState}
        onSelect={props.onSelect}
        onScrollStart={onScrollStart}
        onScrollEnd={onScrollEnd}
        testID={testID}
      />
    );
  }

  // mode === 'suggestion'
  const { suggestions, onSelect } = props;
  if (showLoading) {
    return (
      <View style={styles.loadingContainer} testID={`${testID}-loading`}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Searching...</Text>
      </View>
    );
  }
  if (emptyState) {
    return (
      <View style={styles.emptyContainer} testID={`${testID}-empty`}>
        <Icon name={emptyState.iconName} size={32} color={colors.icon.default} />
        <Text style={styles.emptyTitle}>{emptyState.title}</Text>
        <Text style={styles.emptyText}>{emptyState.message}</Text>
      </View>
    );
  }

  const headerText =
    `${suggestions.length} ${suggestions.length === 1 ? 'result' : 'results'}`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScrollBeginDrag={() => {
        onScrollStart?.();
        Keyboard.dismiss();
      }}
      onScrollEndDrag={() => {
        onScrollEnd?.();
      }}
      testID={testID}
    >
      <View style={[styles.headerBase, searchHeaderStyles.container]}>
        <Text style={[styles.headerTextBase, searchHeaderStyles.text]}>
          {headerText}
        </Text>
      </View>
      {suggestions.map((suggestion, index) => (
        <SuggestionRow
          key={suggestion.mapboxId}
          suggestion={suggestion}
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
  headerBase: {
    paddingHorizontal: spacing.lg,
  },
  headerTextBase: {
    color: colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    minHeight: 120,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
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
