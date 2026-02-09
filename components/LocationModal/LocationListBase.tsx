/**
 * LocationListBase Component
 * Client App - Location Selection Modal
 *
 * Shared list renderer for search results and previous locations.
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
import type { Location } from '@rentascooter/shared';
import { LocationRow } from './LocationRow';

export type LocationListVariant = 'search' | 'previous';
type HeaderConfig = { type: 'count' } | { type: 'static'; text: string };

export interface LocationListBaseProps {
  items: Location[];
  variant: LocationListVariant;
  header: HeaderConfig;
  emptyState?: {
    iconName: 'search' | 'history';
    title: string;
    message: string;
  };
  isLoading?: boolean;
  /** Shown when isLoading is true (e.g. "Searching..." or "Loading recent destinations...") */
  loadingText?: string;
  onSelect: (location: Location) => void;
  onScrollStart?: () => void;
  onScrollEnd?: () => void;
  testID?: string;
}

export const LocationListBase = memo(function LocationListBase({
  items,
  variant,
  header,
  emptyState,
  isLoading = false,
  loadingText = 'Searching...',
  onSelect,
  onScrollStart,
  onScrollEnd,
  testID = 'location-list',
}: LocationListBaseProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer} testID={`${testID}-loading`}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>{loadingText}</Text>
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
    header.type === 'count'
      ? `${items.length} ${items.length === 1 ? 'result' : 'results'}`
      : header.text;

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
      onScrollEndDrag={onScrollEnd}
      testID={testID}
    >
      <View style={[styles.headerBase, headerStyles[variant].container]}>
        <Text style={[styles.headerTextBase, headerStyles[variant].text]}>
          {headerText}
        </Text>
      </View>

      {items.map((location, index) => (
        <LocationRow
          key={`${location.latitude}-${location.longitude}-${index}`}
          location={location}
          variant={variant}
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
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
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

const headerStyles = {
  search: StyleSheet.create({
    container: {
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    text: {
      ...typography.caption,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      fontWeight: '600',
      letterSpacing: 0.5,
    },
  }),
  previous: StyleSheet.create({
    container: {
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    text: {
      ...typography.h3,
      color: colors.text.primary,
      fontWeight: '600',
    },
  }),
};
