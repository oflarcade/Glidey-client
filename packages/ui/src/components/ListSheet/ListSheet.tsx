import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  type ReactNode,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

export interface ListSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Called when the sheet should close (close button or Android back) */
  onClose: () => void;
  /** Optional title in the header (e.g. "Select Country"). Omit for spacer-only header. */
  title?: string | null;
  /** Optional left content in header row (e.g. spacer for right-aligned close only) */
  headerLeft?: ReactNode;
  /** List content (options, FlatList, etc.) */
  children: ReactNode;
  /** Optional slot above list for search input or filters */
  searchSlot?: ReactNode;
  /** Test ID for the modal container */
  testID?: string;
}

/**
 * ListSheet
 *
 * Reusable full-screen sheet for list-based selection (e.g. language picker, country code picker).
 * Uses RN Modal with slide + pageSheet, SafeAreaView, header with close button, optional title/search.
 */
export function ListSheet({
  visible,
  onClose,
  title,
  headerLeft,
  children,
  searchSlot,
  testID,
}: ListSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={false}
      testID={testID}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {headerLeft != null ? headerLeft : null}
          {title != null && title !== '' ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : headerLeft == null ? (
            <View style={styles.titleSpacer} />
          ) : null}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {searchSlot != null ? <View style={styles.searchSlot}>{searchSlot}</View> : null}

        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  titleSpacer: {
    flex: 1,
  },
  title: {
    flex: 1,
    ...typography.h2,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  searchSlot: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  content: {
    flex: 1,
  },
});
