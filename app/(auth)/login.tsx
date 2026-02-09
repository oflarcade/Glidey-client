import { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@rentascooter/auth';
import { useTranslation } from '@rentascooter/i18n';
import { AppBranding, Input, Button, Text, Card } from '@rentascooter/ui';
import { colors, spacing } from '@rentascooter/ui/theme';
import type { LoginFieldErrors } from '../../types/auth';
import { validateEmail, validateLoginForm } from '../../utils/validation/auth';
import { authSharedStyles } from '@/styles/authSharedStyles';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();
  const { t } = useTranslation();

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginFieldErrors>({});

  const handleSubmit = async () => {
    const { errors: validationErrors, sanitizedValues, isValid } = validateLoginForm({ email, password }, t);

    setErrors(validationErrors);

    if (!isValid) return;

    const result = await login(sanitizedValues);

    if (result.success) {
      router.replace('/(main)');
    } else {
      Alert.alert(
        t('auth.login_failed') || 'Login Failed',
        result.error || t('errors.unknown_error') || 'Something went wrong'
      );
    }
  };

  const handleSignUpPress = () => {
    router.push('/(auth)/register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and App Name */}
        <View style={styles.brandingContainer}>
          <AppBranding variant="client" logoSize="lg" />
        </View>

        {/* Email/Password Login Form */}
        <View style={styles.formContainer}>
          <Card variant="elevated" padding="none" style={styles.loginCard}>
            <View style={styles.cardContent}>
              {/* Login Title inside card */}
              <Text variant="h2" align="center" style={styles.formTitle}>
                {t('auth.login') || 'Login'}
              </Text>

              <Input
                ref={emailInputRef}
                label={t('auth.email') || 'Email'}
                placeholder={t('auth.email_placeholder') || 'Enter your email'}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: validateEmail(text, t) }));
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
                testID="login-email-input"
              />

              <Input
                ref={passwordInputRef}
                label={t('auth.password') || 'Password'}
                placeholder={t('auth.password_placeholder') || 'Enter your password'}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: validateLoginForm({ email: email || '', password: text }, t).errors.password }));
                  }
                }}
                error={errors.password}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                blurOnSubmit={true}
                inputContainerStyle={authSharedStyles.authInputFieldShadow}
                testID="login-password-input"
              />

              <Button
                title={t('auth.login') || 'Login'}
                onPress={handleSubmit}
                loading={isLoading}
                fullWidth
                style={styles.loginButton}
                testID="login-submit-button"
              />

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text variant="body" color="secondary" style={authSharedStyles.bottomText}>
                  {t('auth.dont_have_account') || "Don't have an account?"}{' '}
                </Text>
                <TouchableOpacity onPress={handleSignUpPress} testID="login-signup-link">
                  <View style={authSharedStyles.linkWrapper}>
                    <Text variant="body" style={authSharedStyles.linkText}>
                      {t('auth.signup') || 'Sign Up'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  loginCard: {
    backgroundColor: colors.background.primary,
  },
  cardContent: {
    padding: spacing.lg,
  },
  formTitle: {
    marginBottom: spacing.lg,
    fontWeight: '700',
  },
  loginButton: {
    marginTop: spacing.md,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
