/**
 * LocationHistoryList Component
 * Client App - Location Selection Modal
 *
 * Displays user's previous destinations with prominent styling.
 */

import React, { memo } from 'react';
import { useTranslation } from '@rentascooter/i18n';
import type { Location } from '@rentascooter/shared';
import { LocationListBase } from './LocationListBase';

export interface LocationHistoryListProps {
  locations: Location[];
  /** When true, shows loading state (e.g. while fetching history) */
  isLoading?: boolean;
  onSelect: (location: Location) => void;
  onScrollStart?: () => void;
  onScrollEnd?: () => void;
  testID?: string;
}

export const LocationHistoryList = memo(function LocationHistoryList({
  locations,
  isLoading = false,
  onSelect,
  onScrollStart,
  onScrollEnd,
  testID = 'location-history-list',
}: LocationHistoryListProps) {
  const { t } = useTranslation();
  const showEmpty = locations.length === 0 && !isLoading;

  return (
    <LocationListBase
      items={locations}
      variant="previous"
      header={{ type: 'static', text: t('search.recent_destinations') }}
      isLoading={isLoading}
      loadingText={t('search.loading_recent')}
      emptyState={
        showEmpty
          ? {
              iconName: 'history',
              title: t('search.no_history_title'),
              message: t('search.no_history_body'),
            }
          : undefined
      }
      onSelect={onSelect}
      onScrollStart={onScrollStart}
      onScrollEnd={onScrollEnd}
      testID={testID}
    />
  );
});
