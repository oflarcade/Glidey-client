import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import type { CountryCode } from '@rentascooter/shared';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { ListSheet } from '../ListSheet';
import type { CountryCodePickerProps } from './types';

export function CountryCodePicker({
  selectedCountry,
  countries,
  onSelect,
  disabled = false,
  testID,
}: CountryCodePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // If only one country, don't show picker functionality
  const hasMultipleCountries = countries.length > 1;

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (country: CountryCode) => {
    onSelect(country);
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    setModalVisible(false);
    setSearchQuery('');
  };

  const renderCountryItem = ({ item }: { item: CountryCode }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        item.code === selectedCountry.code && styles.countryItemSelected,
      ]}
      onPress={() => handleSelect(item)}
      accessibilityLabel={`Select ${item.name}`}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryDialCode}>{item.dialCode}</Text>
    </TouchableOpacity>
  );

  // Single country display (no picker)
  if (!hasMultipleCountries) {
    return (
      <View
        style={[styles.picker, styles.pickerSingleCountry]}
        testID={testID}
        accessibilityLabel={`Country code: ${selectedCountry.name} ${selectedCountry.dialCode}`}
      >
        <Text style={styles.flag}>{selectedCountry.flag}</Text>
        <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.picker, disabled && styles.pickerDisabled]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        accessibilityLabel={`Country code: ${selectedCountry.name} ${selectedCountry.dialCode}`}
        testID={testID}
      >
        <Text style={styles.flag}>{selectedCountry.flag}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
        <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
      </TouchableOpacity>

      <ListSheet
        visible={modalVisible}
        onClose={handleClose}
        title="Select Country"
        searchSlot={
          <TextInput
            style={styles.searchInput}
            placeholder="Search country..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.text.tertiary}
            autoCorrect={false}
          />
        }
        testID={testID ? `${testID}-sheet` : undefined}
      >
        <FlatList
          data={filteredCountries}
          renderItem={renderCountryItem}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.listContent}
          style={styles.flatList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </ListSheet>
    </>
  );
}

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  pickerSingleCountry: {
    // No interaction needed for single country
  },
  flag: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  dropdownArrow: {
    fontSize: 8,
    color: colors.text.tertiary,
    marginRight: spacing.sm,
  },
  dialCode: {
    ...typography.body,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  searchInput: {
    ...typography.body,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text.primary,
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  countryItemSelected: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  countryName: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  countryDialCode: {
    ...typography.body,
    color: colors.text.tertiary,
  },
});
