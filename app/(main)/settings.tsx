import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { TopBar, Icon, ListSheet } from '@rentascooter/ui';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation, type SupportedLocale } from '@rentascooter/i18n';
import { useAuth } from '@rentascooter/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const STORAGE_KEYS = {
  push: 'glidey:setting:push_notifications',
  email: 'glidey:setting:email_notifications',
  location: 'glidey:setting:location_sharing',
};

interface SettingsItemProps {
  icon: string;
  label: string;
  value?: string;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  isDestructive?: boolean;
}

function SettingsItem({
  icon,
  label,
  value,
  hasToggle,
  toggleValue,
  onToggle,
  onPress,
  isDestructive,
}: SettingsItemProps) {
  const content = (
    <View style={styles.settingsItem}>
      <View style={styles.settingsItemLeft}>
        <Icon
          name={icon as any}
          size="md"
          color={isDestructive ? colors.error : colors.text.primary}
        />
        <Text
          style={[
            styles.settingsItemLabel,
            isDestructive && styles.destructiveLabel,
          ]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.settingsItemRight}>
        {value && <Text style={styles.settingsItemValue}>{value}</Text>}
        {hasToggle && (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: colors.background.tertiary, true: colors.primary.light }}
            thumbColor={toggleValue ? colors.primary.main : colors.background.primary}
          />
        )}
        {!hasToggle && onPress && (
          <Icon name="chevron-right" size="sm" color={colors.text.tertiary} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const { logout } = useAuth();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);
  const [languageSheetVisible, setLanguageSheetVisible] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const [push, email, location] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.push),
        AsyncStorage.getItem(STORAGE_KEYS.email),
        AsyncStorage.getItem(STORAGE_KEYS.location),
      ]);
      if (push !== null) setPushNotifications(push === 'true');
      if (email !== null) setEmailNotifications(email === 'true');
      if (location !== null) setLocationSharing(location === 'true');
    }
    loadSettings();
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handlePushToggle = useCallback((value: boolean) => {
    setPushNotifications(value);
    AsyncStorage.setItem(STORAGE_KEYS.push, String(value));
  }, []);

  const handleEmailToggle = useCallback((value: boolean) => {
    setEmailNotifications(value);
    AsyncStorage.setItem(STORAGE_KEYS.email, String(value));
  }, []);

  const handleLocationToggle = useCallback((value: boolean) => {
    setLocationSharing(value);
    AsyncStorage.setItem(STORAGE_KEYS.location, String(value));
  }, []);

  const handleLanguagePress = useCallback(() => {
    setLanguageSheetVisible(true);
  }, []);

  const handleLanguageSelect = useCallback((selectedLocale: SupportedLocale) => {
    void setLocale(selectedLocale);
    setLanguageSheetVisible(false);
  }, [setLocale]);

  const handlePrivacyPress = useCallback(() => {
    Linking.openURL('https://glidey.sn/privacy');
  }, []);

  const handleHelpPress = useCallback(() => {
    Linking.openURL('https://glidey.sn/help');
  }, []);

  const handleAboutPress = useCallback(() => {
    const appName = Constants.expoConfig?.name ?? 'Glidey';
    const version = Constants.expoConfig?.version ?? '1.0.0';
    Alert.alert(appName, `v${version}`);
  }, []);

  const handleDeleteAccountPress = useCallback(() => {
    Alert.alert(
      t('settings.delete_account'),
      t('settings.delete_account_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => { logout(); },
        },
      ]
    );
  }, [t, logout]);

  const languageLabel = locale === 'fr' ? t('common.french') : t('common.english');

  return (
    <View style={styles.container}>
      <TopBar
        title={t('common.settings') || 'Settings'}
        leftAction={
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Icon name="chevron-left" size="md" color={colors.text.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('settings.notifications') || 'Notifications'}
          </Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon="bell"
              label={t('settings.push_notifications') || 'Push Notifications'}
              hasToggle
              toggleValue={pushNotifications}
              onToggle={handlePushToggle}
            />
            <SettingsItem
              icon="mail"
              label={t('settings.email_notifications') || 'Email Notifications'}
              hasToggle
              toggleValue={emailNotifications}
              onToggle={handleEmailToggle}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('settings.privacy') || 'Privacy'}
          </Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon="location"
              label={t('settings.location_sharing') || 'Location Sharing'}
              hasToggle
              toggleValue={locationSharing}
              onToggle={handleLocationToggle}
            />
            <SettingsItem
              icon="shield"
              label={t('settings.privacy_policy') || 'Privacy Policy'}
              onPress={handlePrivacyPress}
            />
          </View>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('settings.general') || 'General'}
          </Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon="flag"
              label={t('settings.language') || 'Language'}
              value={languageLabel}
              onPress={handleLanguagePress}
            />
            <SettingsItem
              icon="help-circle"
              label={t('settings.help_support') || 'Help & Support'}
              onPress={handleHelpPress}
            />
            <SettingsItem
              icon="info"
              label={t('settings.about') || 'About'}
              onPress={handleAboutPress}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('settings.account') || 'Account'}
          </Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon="trash"
              label={t('settings.delete_account') || 'Delete Account'}
              onPress={handleDeleteAccountPress}
              isDestructive
            />
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            GLIDEY v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </ScrollView>
      <ListSheet
        visible={languageSheetVisible}
        onClose={() => setLanguageSheetVisible(false)}
        title={t('settings.language') || 'Language'}
        testID="settings-language-sheet"
      >
        <View style={styles.languageOptionList}>
          <TouchableOpacity
            style={[
              styles.languageOptionItem,
              locale === 'fr' && styles.languageOptionItemSelected,
            ]}
            onPress={() => handleLanguageSelect('fr')}
            accessibilityRole="button"
            accessibilityLabel={t('common.french')}
          >
            <Text style={styles.languageOptionText}>{t('common.french')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.languageOptionItem,
              locale === 'en' && styles.languageOptionItemSelected,
            ]}
            onPress={() => handleLanguageSelect('en')}
            accessibilityRole="button"
            accessibilityLabel={t('common.english')}
          >
            <Text style={styles.languageOptionText}>{t('common.english')}</Text>
          </TouchableOpacity>
        </View>
      </ListSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  backButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsItemLabel: {
    ...typography.body,
    color: colors.text.primary,
  },
  settingsItemValue: {
    ...typography.body,
    color: colors.text.tertiary,
  },
  destructiveLabel: {
    color: colors.error,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  versionText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  languageOptionList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  languageOptionItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginHorizontal: -spacing.lg,
  },
  languageOptionItemSelected: {
    backgroundColor: colors.background.secondary,
  },
  languageOptionText: {
    ...typography.body,
    color: colors.text.primary,
  },
});
