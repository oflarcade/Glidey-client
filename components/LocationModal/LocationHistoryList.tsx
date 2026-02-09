/**
 * LocationHistoryList Component
 * Client App - Location Selection Modal
 *
 * Displays user's previous destinations with prominent styling.
 */

import React, { memo } from 'react';
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
  const showEmpty = locations.length === 0 && !isLoading;

  return (
    <LocationListBase
      items={locations}
      variant="previous"
      header={{ type: 'static', text: 'Recent Destinations' }}
      isLoading={isLoading}
      loadingText="Loading recent destinations..."
      emptyState={
        showEmpty
          ? {
              iconName: 'history',
              title: 'No Previous Destinations',
              message: 'Your recent destinations will appear here',
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
