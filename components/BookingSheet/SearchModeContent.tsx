import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import type { Location, Suggestion } from '@rentascooter/shared';
import { SearchInput, type SearchInputRef } from '../LocationModal/SearchInput';
import { LocationHistoryList } from '../LocationModal/LocationHistoryList';
import { LocationSearchList } from '../LocationModal/LocationSearchList';
import { useAutocompleteLocation, useLocationHistory } from '@/hooks';
import { placeDetail } from '@/services/addressSearchService';

export interface SearchModeContentProps {
  userName: string;
  onConfirmDestination: (loc: Location) => void;
}

export const SearchModeContent = memo(function SearchModeContent({
  userName,
  onConfirmDestination,
}: SearchModeContentProps) {
  const searchInputRef = useRef<SearchInputRef>(null);
  const scrollInProgressRef = useRef(false);
  const scrollEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [retrieveError, setRetrieveError] = useState<string | null>(null);

  const {
    suggestions,
    isLoading: isSearchLoading,
    error: searchError,
  } = useAutocompleteLocation({ query: searchQuery });

  const {
    locations: previousLocations,
    isLoading: isHistoryLoading,
  } = useLocationHistory({ enabled: true });

  useEffect(() => {
    return () => {
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchFocus = useCallback(() => {
    setRetrieveError(null);
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    setIsSearching(text.length > 0);
    if (text.length === 0) {
      setRetrieveError(null);
    }
  }, []);

  const handleScrollStart = useCallback(() => {
    if (scrollEndTimeoutRef.current) {
      clearTimeout(scrollEndTimeoutRef.current);
      scrollEndTimeoutRef.current = undefined;
    }
    scrollInProgressRef.current = true;
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const handleScrollEnd = useCallback(() => {
    scrollEndTimeoutRef.current = setTimeout(() => {
      scrollInProgressRef.current = false;
      scrollEndTimeoutRef.current = undefined;
    }, 280);
  }, []);

  const handleSelectSuggestion = useCallback(
    async (suggestion: Suggestion) => {
      setRetrieveError(null);
      try {
        const resolved = await placeDetail(suggestion.placeId);
        onConfirmDestination(resolved);
      } catch (err) {
        setRetrieveError((err as { message?: string })?.message ?? 'Failed to resolve location');
      }
    },
    [onConfirmDestination]
  );

  const handleSelectHistory = useCallback(
    (loc: Location) => {
      onConfirmDestination(loc);
    },
    [onConfirmDestination]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {userName}</Text>
      </View>

      <SearchInput
        ref={searchInputRef}
        value={searchQuery}
        onChangeText={handleSearchChange}
        onFocus={handleSearchFocus}
        scrollInProgressRef={scrollInProgressRef}
        placeholder="Where to go?"
        autoFocus={false}
        testID="search-mode-input"
      />

      {isSearching ? (
        <LocationSearchList
          mode="suggestion"
          suggestions={suggestions}
          isLoading={isSearchLoading}
          query={searchQuery}
          error={retrieveError ?? searchError}
          onSelect={handleSelectSuggestion}
          onScrollStart={handleScrollStart}
          onScrollEnd={handleScrollEnd}
          testID="search-mode-suggestion-list"
        />
      ) : (
        <LocationHistoryList
          locations={previousLocations}
          isLoading={isHistoryLoading}
          onSelect={handleSelectHistory}
          onScrollStart={handleScrollStart}
          onScrollEnd={handleScrollEnd}
          testID="search-mode-history-list"
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },
});
