/**
 * PhoneVerificationCard Component
 * RentAScooter Design System
 *
 * A card component for OTP phone verification, matching the PhoneLoginCard style.
 * Features OTP input, verify button, and optional resend functionality.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Button } from '../Button';
import { OTPInput } from '../OTPInput/OTPInput';
import type { PhoneVerificationCardProps } from './types';

export function PhoneVerificationCard({
  title = 'Phone Verification',
  subtitle = 'Enter your OTP code here',
  otp,
  onOtpChange,
  onVerify,
  onResend,
  verifyLabel = 'VERIFY NOW',
  resendLabel = 'Resend Code',
  loading = false,
  disabled = false,
  error,
  length = 4,
  secureTextEntry = false,
  resendCountdown = 0,
  autoFocus = true,
  style,
  testID,
}: PhoneVerificationCardProps) {
  const isFormDisabled = disabled || loading;
  const canResend = resendCountdown === 0 && !isFormDisabled;

  // Format countdown as MM:SS
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResend = () => {
    if (canResend && onResend) {
      onResend();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <View style={[styles.card, style]} testID={testID}>
        {/* Header accent bar - matches PhoneLoginCard yellow bar */}
        <View style={styles.headerBar} />

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            <OTPInput
              value={otp}
              onChange={onOtpChange}
              length={length}
              error={error}
              autoFocus={autoFocus}
              disabled={isFormDisabled}
              secureTextEntry={secureTextEntry}
              testID={testID ? `${testID}-otp-input` : undefined}
              accessibilityLabel="Verification code"
            />
          </View>

          {/* Error Message (displayed by OTPInput, but we keep a fallback) */}
          {/* OTPInput handles its own error display */}

          {/* Verify Button */}
          <Button
            title={verifyLabel}
            onPress={onVerify}
            variant="secondary"
            loading={loading}
            disabled={disabled || otp.length < length}
            fullWidth
            style={styles.verifyButton}
            textStyle={styles.verifyButtonText}
            testID={testID ? `${testID}-verify-button` : undefined}
          />

          {/* Resend Link */}
          {onResend && (
            <View style={styles.resendContainer}>
              {resendCountdown > 0 ? (
                <Text style={styles.resendCountdown}>
                  Resend code in {formatCountdown(resendCountdown)}
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={!canResend}
                  hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                  testID={testID ? `${testID}-resend-button` : undefined}
                >
                  <Text style={[styles.resendLink, !canResend && styles.resendLinkDisabled]}>
                    {resendLabel}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  otpContainer: {
    marginBottom: spacing.lg,
  },
  verifyButton: {
    marginTop: spacing.md,
    backgroundColor: '#FECB00',
  },
  verifyButtonText: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resendCountdown: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  resendLink: {
    ...typography.bodySmall,
    color: '#FECB00',
    fontWeight: '600',
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
});
