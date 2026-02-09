import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { legacyColors as colors } from '../../theme/colors';
import { spacing, borderRadius, typography, shadows } from '../../theme/tokens';

export interface LocationServicePromptProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Called when user dismisses the modal */
  onDismiss?: () => void;
  /** Called when user taps the enable button */
  onEnable: () => void;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Enable button text */
  enableButtonText?: string;
  /** Cancel button text */
  cancelButtonText?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * LocationServicePrompt Component
 *
 * A modal dialog shown when device location services (GPS) are disabled.
 * Prompts the user to enable location services in device settings.
 *
 * @example
 * ```tsx
 * <LocationServicePrompt
 *   visible={!isServiceEnabled}
 *   onEnable={openSettings}
 *   onDismiss={() => setShowPrompt(false)}
 * />
 * ```
 *
 * Acceptance Criteria:
 * - AC-LSP-001: Modal displays centered on screen with backdrop
 * - AC-LSP-002: Icon clearly indicates location/GPS
 * - AC-LSP-003: Enable button opens device settings
 * - AC-LSP-004: Cancel button dismisses modal
 * - AC-LSP-005: Accessible with proper labels
 */
function LocationServicePromptComponent({
  visible,
  onDismiss,
  onEnable,
  title = 'Enable Location Services',
  description = 'Location services are turned off. Enable them in your device settings to use map features and find nearby rides.',
  enableButtonText = 'Open Settings',
  cancelButtonText = 'Not Now',
  testID = 'location-service-prompt',
}: LocationServicePromptProps) {
  const insets = useSafeAreaInsets();

  const handleEnable = useCallback(() => {
    onEnable();
  }, [onEnable]);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
      statusBarTranslucent={false}
      testID={testID}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
        />

        <View
          style={[
            styles.container,
            { marginBottom: insets.bottom + spacing.lg },
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="location-outline"
              size={48}
              color={colors.primary.main}
            />
          </View>

          {/* Title */}
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>

          {/* Description */}
          <Text style={styles.description}>{description}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Enable Button */}
            <Pressable
              style={({ pressed }) => [
                styles.enableButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleEnable}
              accessibilityRole="button"
              accessibilityLabel={enableButtonText}
              testID={`${testID}-enable-button`}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={colors.text.inverse}
                style={styles.buttonIcon}
              />
              <Text style={styles.enableButtonText}>{enableButtonText}</Text>
            </Pressable>

            {/* Cancel Button */}
            {onDismiss && (
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.cancelButtonPressed,
                ]}
                onPress={handleDismiss}
                accessibilityRole="button"
                accessibilityLabel={cancelButtonText}
                testID={`${testID}-cancel-button`}
              >
                <Text style={styles.cancelButtonText}>{cancelButtonText}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export const LocationServicePrompt = memo(LocationServicePromptComponent);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.large,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  enableButtonText: {
    ...typography.button,
    color: colors.text.inverse,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
  },
  cancelButtonPressed: {
    backgroundColor: colors.background.secondary,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.text.secondary,
  },
});

export default LocationServicePrompt;
