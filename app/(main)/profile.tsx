import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@rentascooter/auth';
import { useTranslation } from '@rentascooter/i18n';
import { Avatar, Card, Badge, Icon, TopBar, type IconName } from '@rentascooter/ui';
import { LanguagePicker } from '@/components/LanguagePicker';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { useCallback } from 'react';

interface ProfileMenuItem {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const { logout } = useAuth();
  const { t } = useTranslation();

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handleLogout = async () => {
    Alert.alert(
      t('common.logout'),
      t('profile.logout_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const menuItems: ProfileMenuItem[] = [
    { icon: 'credit-card', label: t('profile.payment_methods'), onPress: () => {} },
    { icon: 'location', label: t('client.saved_places'), onPress: () => {} },
    { icon: 'notifications', label: t('profile.notifications'), onPress: () => {} },
    { icon: 'help-circle', label: t('profile.help_support'), onPress: () => {} },
    { icon: 'shield', label: t('profile.privacy_policy'), onPress: () => {} },
  ];

  return (
    <View style={styles.container}>
      <TopBar
        title={t('profile.title') || 'Profile'}
        leftAction={
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Icon name="chevron-left" size="md" color={colors.text.primary} />
          </TouchableOpacity>
        }
        style={{ paddingTop: Math.max(insets.top, spacing.sm) }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
      {/* Profile Card - Header and Menu Items */}
      <Card variant="elevated" padding="none" style={styles.profileCard}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Avatar
            source={profile?.profilePicture ? { uri: profile.profilePicture } : null}
            name={`${profile?.firstName || ''} ${profile?.lastName || ''}`}
            size="xlarge"
          />
          <Text style={styles.name}>
            {profile?.firstName} {profile?.lastName}
          </Text>
          <Text style={styles.email}>{profile?.email}</Text>

          {/* Phone Verification Display */}
          {!profile?.phoneVerified ? (
            <Pressable style={styles.verifyBanner}>
              <Badge label={t('profile.phone_not_verified')} variant="warning" />
              <Text style={styles.verifyText}>{t('profile.tap_to_verify')}</Text>
            </Pressable>
          ) : (
            <View style={styles.phoneRow}>
              <Text style={styles.phoneText}>
                {profile?.phone || t('profile.phone_verified_placeholder')}
              </Text>
              <Icon name="edit" size={16} color={colors.text.tertiary} />
            </View>
          )}

          <LanguagePicker />
        </View>

        {/* Menu Items */}
        {menuItems.map((item, index) => (
          <Pressable
            key={item.label}
            style={[
              styles.menuItem,
              index !== menuItems.length - 1 && styles.menuItemBorder,
            ]}
            onPress={item.onPress}
            disabled={item.disabled}
          >
            <View style={styles.menuItemLeft}>
              <Icon
                name={item.icon}
                size={22}
                color={colors.text.secondary}
              />
              <Text style={styles.menuItemLabel}>{item.label}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
          </Pressable>
        ))}

        {/* Logout Button - Inside Card */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color={colors.text.inverse} />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </Pressable>
      </Card>

      {/* App Version */}
      <Text style={styles.version}>{t('profile.version')} 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  backButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  name: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  email: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.warning + '15',
    borderRadius: 8,
  },
  verifyText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  phoneText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemLabel: {
    ...typography.body,
    color: colors.text.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.error,
    borderRadius: 12,
  },
  logoutText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  version: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
