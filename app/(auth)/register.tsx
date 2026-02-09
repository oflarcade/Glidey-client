import { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@rentascooter/i18n';
import { Button, Input, Text, Card, TopBar, AppBranding } from '@rentascooter/ui';
import { colors, spacing } from '@rentascooter/ui/theme';
import type { RegisterFieldErrors } from '../../types/auth';
import { validateRegisterForm } from '../../utils/validation/auth';
import { authSharedStyles } from '@/styles/authSharedStyles';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const firstNameInputRef = useRef<TextInput>(null);
  const lastNameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<RegisterFieldErrors>({});

  const handleContinue = () => {
    const { errors: validationErrors, sanitizedValues, isValid } = validateRegisterForm(
      { firstName, lastName, email, password },
      t
    );

    setErrors(validationErrors);

    if (!isValid) return;

    // Navigate to phone verification with user data
    router.push({
      pathname: '/(auth)/verify-phone',
      params: {
        firstName: sanitizedValues.firstName,
        lastName: sanitizedValues.lastName,
        email: sanitizedValues.email,
        password: sanitizedValues.password,
      },
    });
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
        title={t('auth.sign_up') || 'Sign up'}
        showBackButton
        onBackPress={handleBackPress}
        testID="register-topbar"
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
                {/* Sign Up Title inside card */}
                <Text variant="h2" align="center" style={styles.formTitle}>
                  {t('auth.sign_up') || 'Sign up'}
                </Text>

                {/* Name row */}
                <View style={styles.nameRow}>
                  <View style={styles.nameField}>
                    <Input
                      ref={firstNameInputRef}
                      label={t('auth.first_name') || 'First Name'}
                      placeholder={t('auth.first_name_placeholder') || 'John'}
                      value={firstName}
                      onChangeText={(text) => {
                        setFirstName(text);
                        if (errors.firstName) {
                          setErrors((prev) => ({ ...prev, firstName: undefined }));
                        }
                      }}
                      error={errors.firstName}
                      autoCapitalize="words"
                      autoComplete="given-name"
                      textContentType="givenName"
                      returnKeyType="next"
                      onSubmitEditing={() => lastNameInputRef.current?.focus()}
                      blurOnSubmit={false}
                      inputContainerStyle={authSharedStyles.authInputFieldShadow}
                      testID="register-firstname-input"
                    />
                  </View>
                  <View style={styles.nameField}>
                    <Input
                      ref={lastNameInputRef}
                      label={t('auth.last_name') || 'Last Name'}
                      placeholder={t('auth.last_name_placeholder') || 'Doe'}
                      value={lastName}
                      onChangeText={(text) => {
                        setLastName(text);
                        if (errors.lastName) {
                          setErrors((prev) => ({ ...prev, lastName: undefined }));
                        }
                      }}
                      error={errors.lastName}
                      autoCapitalize="words"
                      autoComplete="family-name"
                      textContentType="familyName"
                      returnKeyType="next"
                      onSubmitEditing={() => emailInputRef.current?.focus()}
                      blurOnSubmit={false}
                      inputContainerStyle={authSharedStyles.authInputFieldShadow}
                      testID="register-lastname-input"
                    />
                  </View>
                </View>

                <Input
                  ref={emailInputRef}
                  label={t('auth.email') || 'Email'}
                  placeholder={t('auth.email_placeholder') || 'Enter your email'}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  blurOnSubmit={false}
                  inputContainerStyle={authSharedStyles.authInputFieldShadow}
                  testID="register-email-input"
                />

                <Input
                  ref={passwordInputRef}
                  label={t('auth.password') || 'Password'}
                  placeholder={t('auth.password_placeholder') || 'Enter your password'}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  error={errors.password}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={handleContinue}
                  blurOnSubmit={true}
                  inputContainerStyle={authSharedStyles.authInputFieldShadow}
                  testID="register-password-input"
                />

                <Button
                  title={t('common.continue') || 'Continue'}
                  onPress={handleContinue}
                  fullWidth
                  style={styles.continueButton}
                  testID="register-continue-button"
                />

                {/* Login Link */}
                <View style={styles.loginContainer}>
                  <Text variant="body" color="secondary" style={authSharedStyles.bottomText}>
                    {t('auth.already_have_account') || 'Already have an account?'}{' '}
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/login')} testID="register-login-link">
                    <View style={authSharedStyles.linkWrapper}>
                      <Text variant="body" style={authSharedStyles.linkText}>
                        {t('auth.sign_in') || 'Sign In'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
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
    paddingTop: spacing.md,
    justifyContent: 'flex-start',
  },
  brandingContainer: {
    alignItems: 'center',
    backgroundColor: colors.background.primary,
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
    marginBottom: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nameField: {
    flex: 1,
  },
  continueButton: {
    marginTop: spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
