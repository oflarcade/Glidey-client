import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTranslation, type SupportedLocale } from '@rentascooter/i18n';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { ListSheet } from '@rentascooter/ui';

const LOCALE_OPTIONS: { value: SupportedLocale; labelKey: 'common.english' | 'common.french'; code: string }[] = [
  { value: 'en', labelKey: 'common.english', code: 'EN' },
  { value: 'fr', labelKey: 'common.french', code: 'FR' },
];

export interface LanguagePickerProps {
  testID?: string;
  style?: ViewStyle;
}

export function LanguagePicker({ testID, style }: LanguagePickerProps) {
  const { t, locale, setLocale } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const currentOption = useMemo(
    () => LOCALE_OPTIONS.find((o) => o.value === locale) ?? LOCALE_OPTIONS[0],
    [locale]
  );

  const displayLabel = `${t(currentOption.labelKey)} (${currentOption.code})`;

  const handleSelect = async (value: SupportedLocale) => {
    await setLocale(value);
    setModalVisible(false);
  };

  return (
    <>
      <View style={[styles.triggerRow, style]} testID={testID}>
        <Text style={styles.globeIcon} importantForAccessibility="no-hide-descendants">
          🌐
        </Text>
        <TouchableOpacity
          style={styles.trigger}
          onPress={() => setModalVisible(true)}
          accessibilityLabel={displayLabel}
          accessibilityRole="button"
        >
          <Text style={styles.triggerText}>{displayLabel}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      <ListSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={null}
        headerLeft={<View style={styles.headerSpacer} />}
        testID={testID ? `${testID}-sheet` : undefined}
      >
        <View style={styles.optionList}>
          {LOCALE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionItem,
                option.value === locale && styles.optionItemSelected,
              ]}
              onPress={() => handleSelect(option.value)}
              accessibilityLabel={`${t(option.labelKey)} (${option.code})`}
              accessibilityRole="button"
            >
              <Text style={styles.optionText}>
                {t(option.labelKey)} ({option.code})
              </Text>
              {option.value === locale && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ListSheet>
    </>
  );
}

const styles = StyleSheet.create({
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  globeIcon: {
    fontSize: 20,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  triggerText: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 8,
    color: colors.text.tertiary,
  },
  headerSpacer: {
    flex: 1,
  },
  optionList: {
    paddingHorizontal: spacing.lg,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
    marginHorizontal: -spacing.lg,
  },
  optionItemSelected: {
    backgroundColor: colors.background.secondary,
  },
  optionText: {
    ...typography.body,
    color: colors.text.primary,
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary.main,
    fontWeight: '700',
  },
});
