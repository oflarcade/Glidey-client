import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ViewStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, usePhoneAuth } from '@rentascooter/auth';
import { useTranslation } from '@rentascooter/i18n';
import { Button, Input, Text, Card, TopBar, AppBranding } from '@rentascooter/ui';
import { SENEGAL_COUNTRY } from '@rentascooter/shared';
import { colors, spacing } from '@rentascooter/ui/theme';

interface RegistrationParams {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<RegistrationParams>();
  const { registerClient, isLoading: isRegistering } = useAuth();
  const { sendOTP, isLoading: isSendingOTP } = usePhoneAuth();
  const { t } = useTranslation();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | undefined>();

  const isLoading = isRegistering || isSendingOTP;

  const validatePhone = (): boolean => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (!digits) {
      setPhoneError(t('validation.phone_required') || 'Phone number is required');
      return false;
    }
    if (digits.length < 7) {
      setPhoneError(t('validation.phone_invalid') || 'Please enter a valid phone number');
      return false;
    }
    setPhoneError(undefined);
    return true;
  };

  const handleSendCode = async () => {
    if (!validatePhone()) return;

    const digits = phoneNumber.replace(/\D/g, '');
    const fullPhone = `${SENEGAL_COUNTRY.dialCode}${digits}`;

    // If we have registration params, register first
    if (params.email && params.password && params.firstName && params.lastName) {
      const registerResult = await registerClient({
        email: params.email,
        password: params.password,
        firstName: params.firstName,
        lastName: params.lastName,
        phone: fullPhone,
      });

      if (!registerResult.success) {
        Alert.alert(
          t('auth.registration_failed') || 'Registration Failed',
          registerResult.error || t('errors.unknown_error') || 'Something went wrong'
        );
        return;
      }
    }

    // Send OTP
    const otpResult = await sendOTP({ phone: fullPhone });

    if (otpResult.success) {
      // Navigate to OTP verification screen
      router.push({
        pathname: '/(auth)/verify-sms',
        params: { phone: fullPhone },
      });
    } else {
      Alert.alert(
        t('common.error') || 'Error',
        otpResult.error || t('errors.unknown_error') || 'Failed to send verification code'
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

  return (
    <View style={styles.container}>
      <TopBar
        title={t('auth.phone_verification') || 'Phone Verification'}
        showBackButton
        onBackPress={handleBackPress}
        testID="verify-phone-topbar"
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
                  {t('auth.verify_phone') || 'Verify Phone'}
                </Text>

                <Text variant="body" color="secondary" align="center" style={styles.formSubtitle}>
                  {t('auth.enter_phone_to_verify') || 'Enter your mobile phone number to receive a verification code'}
                </Text>

                {/* Phone input with country code */}
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.flag}>{SENEGAL_COUNTRY.flag}</Text>
                    <Text style={styles.dialCode}>{SENEGAL_COUNTRY.dialCode}</Text>
                  </View>
                  <View style={styles.phoneInputWrapper}>
                    <Input
                      value={phoneNumber}
                      onChangeText={(text) => {
                        setPhoneNumber(text);
                        if (phoneError) setPhoneError(undefined);
                      }}
                      placeholder="77 123 45 67"
                      keyboardType="phone-pad"
                      error={phoneError}
                      autoComplete="tel"
                      textContentType="telephoneNumber"
                      inputContainerStyle={styles.authInputFieldShadow}
                      testID="verify-phone-input"
                    />
                  </View>
                </View>

                <Button
                  title={t('auth.send_code') || 'Send Code'}
                  onPress={handleSendCode}
                  loading={isLoading}
                  fullWidth
                  style={styles.sendButton}
                  testID="verify-phone-send-button"
                />

                {/* Info text */}
                <Text variant="bodySmall" color="tertiary" align="center" style={styles.infoText}>
                  {t('auth.sms_will_be_sent') || 'We will send you an SMS with a verification code'}
                </Text>
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
    marginBottom: spacing.xl,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 6,
    marginRight: spacing.sm,
    minHeight: 52,
  },
  flag: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  dialCode: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  phoneInputWrapper: {
    flex: 1,
  },
  sendButton: {
    marginTop: spacing.md,
  },
  infoText: {
    marginTop: spacing.lg,
  },
  authInputFieldShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  } as ViewStyle,
});
