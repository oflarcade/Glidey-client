import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Button } from '../Button';
import { CountryCodePicker } from './CountryCodePicker';
import type { PhoneLoginCardProps } from './types';

export function PhoneLoginCard({
  title,
  selectedCountry,
  countries,
  onCountryChange,
  phoneNumber,
  onPhoneNumberChange,
  onSubmit,
  onSignUpPress,
  submitLabel = 'NEXT',
  signUpPromptText = "Don't have an account?",
  signUpLinkText = 'Sign Up',
  loading = false,
  disabled = false,
  error,
  style,
  testID,
}: PhoneLoginCardProps) {
  const isFormDisabled = disabled || loading;

  const handleClear = () => {
    onPhoneNumberChange('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <View style={[styles.card, style]} testID={testID}>
        {/* Header accent bar */}
        <View style={styles.headerBar} />

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            {title ? (
              <Text style={styles.titleText}>{title}</Text>
            ) : (
              <Text style={styles.titleText}>
                <Text style={styles.titleBold}>Login</Text>
                <Text style={styles.titleRegular}> with your{'\n'}phone number</Text>
              </Text>
            )}
          </View>

          {/* Phone Input */}
          <View style={[styles.inputContainer, error && styles.inputContainerError]}>
            {/* Country Code Picker */}
            <CountryCodePicker
              selectedCountry={selectedCountry}
              countries={countries}
              onSelect={onCountryChange}
              disabled={isFormDisabled}
              testID={`${testID}-country-picker`}
            />

            {/* Divider */}
            <View style={styles.divider} />

            {/* Phone Number Input */}
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={onPhoneNumberChange}
              placeholder="77 555 12 34"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="phone-pad"
              editable={!isFormDisabled}
              testID={`${testID}-phone-input`}
            />

            {/* Clear Button */}
            {phoneNumber.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
                disabled={isFormDisabled}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Clear phone number"
              >
                <View style={styles.clearButtonInner}>
                  <Text style={styles.clearButtonText}>✕</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Error Message */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Submit Button */}
          <Button
            title={submitLabel}
            onPress={onSubmit}
            variant="primary"
            loading={loading}
            disabled={disabled}
            fullWidth
            style={styles.submitButton}
          />

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpPrompt}>{signUpPromptText} </Text>
            <TouchableOpacity onPress={onSignUpPress} disabled={isFormDisabled}>
              <Text style={styles.signUpLink}>{signUpLinkText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    width: '100%',
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  headerBar: {
    width: '100%',
    height: 0,
    backgroundColor: '#FECB00',
    

  },
  content: {
    padding: spacing.lg,
  },
  titleContainer: {
    marginBottom: spacing.lg,
  },
  titleText: {
    ...typography.h1,
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  titleBold: {
    ...typography.h1,
    color: colors.text.primary,
    fontWeight: '700',
  },
  titleRegular: {
    ...typography.h1,
    color: colors.text.secondary,
    fontWeight: '400',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    height: 48,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.background.tertiary,
  },
  phoneInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingHorizontal: spacing.sm,
    height: '100%',
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  clearButtonInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 10,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.md,
    backgroundColor: '#FECB00',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  signUpPrompt: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  signUpLink: {
    ...typography.bodySmall,
    color: '#FECB00',
    fontWeight: '600',
  },
});
