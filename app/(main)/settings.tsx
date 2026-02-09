import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { TopBar, Icon } from '@rentascooter/ui';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from '@rentascooter/i18n';

/**
 * Settings Item Component
 *
 * Renders a single setting row with icon, label, and optional value/toggle.
 */
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

/**
 * Settings Screen
 *
 * Displays app settings and preferences for the client app.
 * Includes notification preferences, language, privacy, and more.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handleLanguagePress = useCallback(() => {
    // TODO: Navigate to language selection screen
    console.log('Language settings pressed');
  }, []);

  const handlePrivacyPress = useCallback(() => {
    // TODO: Navigate to privacy settings screen
    console.log('Privacy settings pressed');
  }, []);

  const handleHelpPress = useCallback(() => {
    // TODO: Navigate to help/support screen
    console.log('Help pressed');
  }, []);

  const handleAboutPress = useCallback(() => {
    // TODO: Navigate to about screen
    console.log('About pressed');
  }, []);

  const handleDeleteAccountPress = useCallback(() => {
    // TODO: Show delete account confirmation dialog
    console.log('Delete account pressed');
  }, []);

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
              onToggle={setPushNotifications}
            />
            <SettingsItem
              icon="mail"
              label={t('settings.email_notifications') || 'Email Notifications'}
              hasToggle
              toggleValue={emailNotifications}
              onToggle={setEmailNotifications}
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
              onToggle={setLocationSharing}
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
              value="Français"
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
          <Text style={styles.versionText}>GLIDEY v1.0.0</Text>
        </View>
      </ScrollView>
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
});
