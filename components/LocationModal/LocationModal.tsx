/**
 * LocationModal Component
 * Client App - Location Selection Modal
 *
 * Bottom sheet modal for selecting pickup and destination locations.
 * Two states:
 * - Minimized: Small bar with "Where to go?" - tap or drag up to expand
 * - Expanded: Full search interface with previous locations
 *
 * @acceptance AC-LM-001: Modal starts minimized, expands on drag up
 * @acceptance AC-LM-002: Search input focuses only when expanded
 * @acceptance AC-LM-003: Previous locations list scrolls smoothly
 * @acceptance AC-LM-004: Typing in search shows results list
 * @acceptance AC-LM-005: Selecting location transitions to selected state
 * @acceptance AC-LM-006: Drag down minimizes (doesn't close) and dismisses keyboard
 * @acceptance AC-LM-007: Modal has smooth height transition
 * @acceptance AC-LM-008: Haptic feedback on location select
 */

import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Keyboard, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button, Icon } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import type { Location, Suggestion } from '@rentascooter/shared';
import { BottomSheet, type BottomSheetRef } from './BottomSheet';
import { SearchInput, type SearchInputRef } from './SearchInput';
import { LocationHistoryList } from './LocationHistoryList';
import { LocationSearchList } from './LocationSearchList';
import { LocationRow } from './LocationRow';
import { ScooterCarousel } from '@/components/ScooterCarousel';
import { useAutocompleteLocation, useLocationHistory } from '@/hooks';
import { saveHistory, placeDetail } from '@/services/addressSearchService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Snap point heights
const MINIMIZED_HEIGHT = 140;
/** Approximate height of fixed Book Now footer (button + paddings) for scroll content padding */
const BOOK_NOW_FOOTER_HEIGHT = 88;

export interface LocationModalProps {
  /** Modal open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Current selected destination (from parent). When null, modal shows search. */
  selectedDestination?: Location | null;
  /** Called when user selects a destination (parent should set state and pass it back) */
  onDestinationSelect: (destination: Location) => void;
  /** Called when user taps X to reset to search (parent should clear destination) */
  onClearDestination?: () => void;
  /** User's current location */
  userLocation?: Location;
  /** User's name for display */
  userName?: string;
  /** Book Now CTA handler */
  onBookNow?: () => void;
  /** Test ID */
  testID?: string;
}

const SELECTED_MODAL_HEIGHT = 440;
/** Minimized trip bar height so user can examine the map */
const TRIP_MINIMIZED_HEIGHT = 180;

export const LocationModal = memo(function LocationModal({
  isOpen,
  onClose,
  selectedDestination: selectedDestinationProp = null,
  onDestinationSelect,
  onClearDestination,
  userLocation,
  userName = 'You',
  onBookNow,
  testID = 'location-modal',
}: LocationModalProps) {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const searchInputRef = useRef<SearchInputRef>(null);
  const scrollInProgressRef = useRef(false);
  const scrollEndTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Use parent's destination so when X clears it, modal resets to search
  const selectedDestination = selectedDestinationProp;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScooterId, setSelectedScooterId] = useState<string | null>('e-scooter');
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [retrieveError, setRetrieveError] = useState<string | null>(null);
  /** When trip is selected: 0 = minimized (examine map), 1 = expanded */
  const [tripSheetIndex, setTripSheetIndex] = useState(1);

  // When destination is cleared (e.g. X clicked), minimize sheet to show search bar
  useEffect(() => {
    if (!selectedDestination) {
      setTripSheetIndex(0);
      bottomSheetRef.current?.minimize();
    }
  }, [selectedDestination]);

  const {
    suggestions,
    isLoading: isSearchLoading,
    error: searchError,
  } = useAutocompleteLocation({ query: searchQuery });

  const {
    locations: previousLocations,
    isLoading: isHistoryLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useLocationHistory({ enabled: isOpen });

  // Layout-driven heights
  const headerHeight = insets.top + 56; // 56px content height defined in MapTopBar
  const availableHeight = Math.max(0, SCREEN_HEIGHT - headerHeight);
  const dynamicExpandedHeight = availableHeight * 0.8;

  // Snap points: [minimized, expanded]. When trip selected, allow minimizing to examine map.
  const snapPoints = useMemo(() => {
    if (selectedDestination) {
      return [TRIP_MINIMIZED_HEIGHT, SELECTED_MODAL_HEIGHT];
    }
    return [MINIMIZED_HEIGHT, dynamicExpandedHeight];
  }, [selectedDestination, dynamicExpandedHeight]);

  // Handle modal open/close
  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  // Handle destination selection (save to history then notify parent)
  const handleSelectDestination = useCallback(
    async (location: Location) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTripSheetIndex(1);
      setSearchQuery('');
      setRetrieveError(null);
      setIsExpanded(false);
      Keyboard.dismiss();
      try {
        await saveHistory(location);
        refetchHistory();
      } catch {
        // Non-blocking: selection still succeeds
      }
      onDestinationSelect(location);
      // Expand trip modal so user sees full content; they can drag down to minimize
      setTimeout(() => bottomSheetRef.current?.expand(), 50);
    },
    [onDestinationSelect, refetchHistory]
  );

  // Handle suggestion tap: retrieve full location then select as destination
  const handleSelectSuggestion = useCallback(
    async (suggestion: Suggestion) => {
      setRetrieveError(null);
      try {
        const resolved = await placeDetail(suggestion.placeId);
        await handleSelectDestination(resolved);
      } catch (err) {
        setRetrieveError((err as { message?: string })?.message ?? 'Failed to resolve location');
      }
    },
    [handleSelectDestination]
  );

  // Start session when user focuses search (new token per focus session)
  const handleSearchFocus = useCallback(() => {
    setRetrieveError(null);
  }, []);

  // Invalidate session when search is cleared so next focus gets new token
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    setIsSearching(text.length > 0);
    if (text.length === 0) {
      setRetrieveError(null);
    }
  }, []);

  // Keep keyboard dismissed while user is scrolling; prevent refocus on touch end
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

  useEffect(() => {
    return () => {
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
    };
  }, []);

  // Handle X (reset to search)
  const handleClearToSearch = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClearDestination?.();
  }, [onClearDestination]);


  // Handle sheet index changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
        setIsExpanded(false);
      } else if (index === 0) {
        // Minimized
        setIsExpanded(false);
        if (selectedDestination) setTripSheetIndex(0);
        Keyboard.dismiss();
      } else if (index === 1) {
        // Expanded
        setIsExpanded(true);
        if (selectedDestination) setTripSheetIndex(1);
        else {
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
      }
    },
    [onClose, selectedDestination]
  );

  // Handle tap on minimized state to expand
  const handleMinimizedTap = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  // Handle Book Now CTA
  const handleBookNow = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onBookNow?.();
  }, [onBookNow]);

  // Handle scooter type selection
  const handleScooterSelect = useCallback((id: string) => {
    setSelectedScooterId(id);
  }, []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      initialSnapIndex={0}
      enablePanDownToClose={false}
      onChange={handleSheetChanges}
      handleIndicatorStyle={styles.indicator}
      backgroundStyle={styles.background}
    >
      <View style={styles.container}>
        {selectedDestination ? (
          tripSheetIndex === 0 ? (
            // Minimized trip bar: examine map, still show CTA to book
            <TouchableOpacity
              style={styles.tripMinimizedContainer}
              onPress={() => bottomSheetRef.current?.expand()}
              activeOpacity={0.9}
              testID={`${testID}-trip-minimized`}
            >
              <View style={styles.tripMinimizedHeader}>
                <Text style={styles.tripMinimizedTitle}>Your Trip</Text>
                <View style={styles.tripHeaderRight}>
                  {onClearDestination && (
                    <Pressable
                      onPress={handleClearToSearch}
                      style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                      hitSlop={12}
                      testID={`${testID}-close-minimized`}
                    >
                      <Icon name="close" size={22} color={colors.icon.default} />
                    </Pressable>
                  )}
                  <Icon name="chevron-up" size={20} color={colors.text.tertiary} />
                </View>
              </View>
              <View style={styles.tripMinimizedRoute}>
                <Text style={styles.tripMinimizedAddress} numberOfLines={1}>
                  {userLocation?.address ?? userName} → {selectedDestination.name ?? selectedDestination.address ?? 'Selected location'}
                </Text>
              </View>
              <Button
                variant="primary"
                title="BOOK NOW"
                onPress={handleBookNow}
                style={styles.bookNowButtonMinimized}
                testID={`${testID}-book-now-minimized`}
              />
            </TouchableOpacity>
          ) : (
            // Expanded trip: scrollable content + fixed BOOK NOW footer (always visible in modal)
            <View style={styles.selectedWrapper}>
              <ScrollView
                style={styles.selectedScroll}
                contentContainerStyle={[
                  styles.selectedScrollContent,
                  { paddingBottom: BOOK_NOW_FOOTER_HEIGHT + spacing.lg },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.selectedContainer}>
                  <View style={styles.selectedHeaderRow}>
                    <Text style={styles.selectedTitle}>Your Trip</Text>
                    {onClearDestination && (
                      <Pressable
                        onPress={handleClearToSearch}
                        style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                        hitSlop={12}
                        testID={`${testID}-close`}
                      >
                        <Icon name="close" size={24} color={colors.icon.default} />
                      </Pressable>
                    )}
                  </View>

                  {userLocation && (
                    <View style={styles.locationRowContainer}>
                      <LocationRow
                        location={{ ...userLocation, name: userName }}
                        variant="selected"
                        testID={`${testID}-current-location`}
                      />
                    </View>
                  )}

                  <View style={styles.divider} />

                  <View style={styles.locationRowContainer}>
                    <LocationRow
                      location={selectedDestination}
                      variant="selected"
                      testID={`${testID}-destination`}
                    />
                  </View>

                  <ScooterCarousel
                    selectedId={selectedScooterId}
                    onSelect={handleScooterSelect}
                    title="Recommended Rides"
                    testID={`${testID}-scooter-carousel`}
                  />

                  <Pressable
                    style={({ pressed }) => [styles.paymentRow, pressed && styles.paymentRowPressed]}
                    onPress={() => {}}
                    testID={`${testID}-payment`}
                  >
                    <Text style={styles.paymentLabel}>Payment</Text>
                    <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
                  </Pressable>
                </View>
              </ScrollView>
              <View style={styles.bookNowFooter}>
                <Button
                  variant="primary"
                  title="BOOK NOW"
                  onPress={handleBookNow}
                  style={styles.bookNowButton}
                  testID={`${testID}-book-now`}
                />
              </View>
            </View>
          )
        ) : isExpanded ? (
          // Expanded state - Full search interface (same header + input as minimized)
          <View style={styles.searchContainer}>
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
              testID={`${testID}-search-input`}
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
                testID={`${testID}-location-search-list`}
              />
            ) : (
              <LocationHistoryList
                locations={previousLocations}
                isLoading={isHistoryLoading}
                onSelect={handleSelectDestination}
                onScrollStart={handleScrollStart}
                onScrollEnd={handleScrollEnd}
                testID={`${testID}-location-history-list`}
              />
            )}
          </View>
        ) : (
          // Minimized state - Same header + SearchInput, tap to expand
          <TouchableOpacity
            style={styles.searchContainer}
            onPress={handleMinimizedTap}
            activeOpacity={0.7}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Welcome, {userName}</Text>
            </View>

            <SearchInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={handleSearchChange}
              onFocus={handleSearchFocus}
              placeholder="Where to go?"
              readOnly
              testID={`${testID}-search-input`}
            />
          </TouchableOpacity>
        )}
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  background: {
    backgroundColor: colors.background.primary,
  },

  indicator: {
    backgroundColor: '#E9ECEF',
  },

  // Search state (minimized + expanded use same layout)
  searchContainer: {
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

  errorContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.semantic.error,
  },

  // Selected state
  selectedContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  selectedHeader: {
    marginBottom: spacing.lg,
  },
  selectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  tripHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectedTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
  },

  locationRowContainer: {
    paddingVertical: spacing.sm,
  },

  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: spacing.sm,
    marginLeft: 48,
  },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: 0,
    marginBottom: spacing.md,
  },
  paymentRowPressed: {
    opacity: 0.7,
  },
  paymentLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  selectedWrapper: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  selectedScroll: {
    flex: 1,
  },
  selectedScrollContent: {
    paddingBottom: spacing.md,
  },
  bookNowFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: colors.background.primary,
  },
  bookNowButton: {
    alignSelf: 'stretch',
    paddingVertical: spacing.md,
  },
  // Minimized trip (examine map)
  tripMinimizedContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  tripMinimizedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  tripMinimizedTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
  },
  tripMinimizedRoute: {
    marginBottom: spacing.md,
  },
  tripMinimizedAddress: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  bookNowButtonMinimized: {
    alignSelf: 'stretch',
    paddingVertical: spacing.sm,
  },
});
