import { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePhoneAuth } from '@rentascooter/auth';
import { useTranslation } from '@rentascooter/i18n';
import { Button, Text, Card, TopBar, AppBranding } from '@rentascooter/ui';
import { colors, spacing } from '@rentascooter/ui/theme';

const OTP_LENGTH = 6;

interface VerifySmsParams {
  phone?: string;
}

export default function VerifySmsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<VerifySmsParams>();
  const { verifyOTP, sendOTP, isLoading } = usePhoneAuth();
  const { t } = useTranslation();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<TextInput[]>([]);

  const phone = params.phone || '';

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    // Handle paste - distribute digits across inputs
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, '');
      setOtp(newOtp);

      // Auto-advance to next input
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace - go to previous input if current is empty
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      Alert.alert(
        t('common.error') || 'Error',
        t('auth.enter_complete_code') || 'Please enter the complete verification code'
      );
      return;
    }

    const result = await verifyOTP({ phone, otp: code });

    if (result.success && result.verified) {
      // Success - go to main app
      router.replace('/(main)');
    } else {
      Alert.alert(
        t('common.error') || 'Error',
        result.error || t('auth.otp_invalid') || 'Invalid verification code'
      );
      // Clear OTP and focus first input
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    const result = await sendOTP({ phone });
    if (result.success) {
      setResendTimer(30);
      Alert.alert(
        t('common.success') || 'Success',
        t('auth.code_resent') || 'Verification code sent!'
      );
    } else {
      Alert.alert(
        t('common.error') || 'Error',
        result.error || t('errors.unknown_error') || 'Failed to resend code'
      );
    }
  };

  const handleBackPress = () => {
    // Check if there's navigation history before calling back()
    // This prevents the GO_BACK error when the screen is accessed directly
    if (router.canGoBack()) {
      router.back();
    } else {
      // No history - navigate to login as fallback
      router.replace('/(auth)/login');
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

  // Format phone for display
  const formattedPhone = phone.replace(/(\+\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');

  return (
    <View style={styles.container}>
      <TopBar
        title={t('auth.phone_verification') || 'Phone Verification'}
        showBackButton
        onBackPress={handleBackPress}
        testID="verify-sms-topbar"
      />

      {/* Logo and App Name - Fixed at top, outside KeyboardAvoidingView */}
      <View style={[styles.brandingContainer, { paddingTop: spacing.lg }]}>
        <AppBranding variant="client" logoSize="lg" />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Form Card */}
          <View style={styles.formContainer}>
            <Card variant="elevated" padding="none" style={styles.formCard}>
              {/* Card content */}
              <View style={styles.cardContent}>
                <Text variant="h2" align="center" style={styles.formTitle}>
                  {t('auth.enter_otp') || 'Enter OTP Code'}
                </Text>

                <Text variant="body" color="secondary" align="center" style={styles.formSubtitle}>
                  {t('auth.otp_sent_to') || 'Enter the verification code sent to'}
                </Text>

                <Text variant="body" align="center" style={styles.phoneNumber}>
                  {formattedPhone}
                </Text>

                {/* OTP Input boxes */}
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        if (ref) inputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.otpInput,
                        digit && styles.otpInputFilled,
                      ]}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      keyboardType="number-pad"
                      maxLength={OTP_LENGTH}
                      selectTextOnFocus
                      testID={`verify-sms-otp-${index}`}
                    />
                  ))}
                </View>

                {/* Demo hint */}
                <Text variant="bodySmall" color="tertiary" align="center" style={styles.demoHint}>
                  {t('auth.demo_code') || 'Demo code: 123456'}
                </Text>

                <Button
                  title={t('auth.verify_now') || 'Verify Now'}
                  onPress={handleVerify}
                  loading={isLoading}
                  fullWidth
                  disabled={!isOtpComplete}
                  style={styles.verifyButton}
                  testID="verify-sms-submit-button"
                />

                {/* Resend code */}
                <Pressable
                  style={styles.resendContainer}
                  onPress={handleResend}
                  disabled={resendTimer > 0 || isLoading}
                >
                  <Text
                    variant="body"
                    color={resendTimer > 0 ? 'tertiary' : 'primary'}
                    align="center"
                    style={resendTimer === 0 && styles.resendActive}
                  >
                    {resendTimer > 0
                      ? t('auth.resend_in', { seconds: resendTimer }) || `Resend in ${resendTimer}s`
                      : t('auth.didnt_receive_code') || "Didn't receive code? Resend"}
                  </Text>
                </Pressable>

                {/* Change phone number */}
                <Pressable
                  style={styles.changePhoneContainer}
                  onPress={handleBackPress}
                >
                  <Text variant="bodySmall" color="tertiary" align="center">
                    {t('auth.change_phone_number') || 'Change phone number'}
                  </Text>
                </Pressable>
              </View>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  brandingContainer: {
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  formCard: {
    backgroundColor: colors.background.primary,
  },
  cardContent: {
    padding: spacing.lg,
  },
  formTitle: {
    marginBottom: spacing.lg,
    fontWeight: '700',
  },
  formSubtitle: {
    marginBottom: spacing.xs,
  },
  phoneNumber: {
    fontWeight: '600',
    marginBottom: spacing.xl,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  otpInputFilled: {
    backgroundColor: '#FECB0015',
    borderWidth: 2,
    borderColor: '#FECB00',
  },
  demoHint: {
    fontStyle: 'italic',
    marginBottom: spacing.lg,
  },
  verifyButton: {
    marginTop: spacing.sm,
  },
  resendContainer: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  resendActive: {
    color: '#FECB00',
    fontWeight: '600',
  },
  changePhoneContainer: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
});
