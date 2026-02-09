import { memo, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import {
  SidebarMenu,
  SidebarProfileHeader,
  Icon,
} from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { useAuth, useUser } from '@rentascooter/auth';
import { useTranslation } from '@rentascooter/i18n';
import { useUIStore } from '@rentascooter/shared';
import { useRideHistory } from '@/hooks/useRideHistory';
import { SidebarMenuItem } from './SidebarMenuItem';
import type { MenuItem, ProfileStat } from '@/types/sidebar';

/**
 * Sidebar content component
 *
 * Contains profile header, menu items, and footer.
 * Designed to be rendered at the layout level for cross-screen access.
 */
export const SidebarContent = memo(function SidebarContent({
  testID,
}: {
  testID?: string;
}) {
  const router = useRouter();
  const { logout } = useAuth();
  const { profile } = useUser();
  const { t } = useTranslation();
  const { isSidebarOpen, closeSidebar } = useUIStore();

  /**
   * Get user display name from profile
   */
  const userName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName ||
        profile?.email?.split('@')[0] ||
        t('common.welcome') ||
        'User';

  /**
   * Handle navigation with sidebar close
   *
   * Note: The 150ms setTimeout is intentional - it allows the sidebar close
   * animation to complete before navigation occurs. Without this delay,
   * the navigation would interrupt the animation, causing a jarring UX.
   * This is a common pattern for drawer/sidebar navigation timing.
   */
  const navigateAndClose = useCallback(
    (route: string) => {
      closeSidebar();
      setTimeout(() => {
        router.push(route as any);
      }, 150);
    },
    [router, closeSidebar]
  );

  /**
   * Handle logout with sidebar close
   */
  const handleLogout = useCallback(async () => {
    closeSidebar();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace('/(auth)/login');
  }, [logout, router, closeSidebar]);

  /**
   * Handle profile press - navigate to profile screen
   */
  const handleProfilePress = useCallback(() => {
    navigateAndClose('/(main)/profile');
  }, [navigateAndClose]);

  /**
   * Ride history for sidebar stats (shared cache with rides screen)
   */
  const { rides } = useRideHistory({ limit: 100 });

  const profileStats: ProfileStat[] = useMemo(() => {
    const totalDistanceMeters = rides.reduce(
      (sum, r) => sum + (r.route?.distanceMeters ?? 0),
      0
    );
    const totalPaid = rides.reduce(
      (sum, r) => sum + (r.fare?.total ?? 0),
      0
    );
    const distanceKm = Math.round(totalDistanceMeters / 1000);
    return [
      {
        icon: <Icon name="scooter" size={20} color={colors.icon.default} />,
        value: String(rides.length),
        label: t('sidebar.rides') || 'Rides',
      },
      {
        icon: <Icon name="speedometer" size={20} color={colors.icon.default} />,
        value: `${distanceKm} KM`,
        label: t('sidebar.distance') || 'Distance',
      },
      {
        icon: <Icon name="earnings" size={20} color={colors.icon.default} />,
        value: `${Number(totalPaid).toLocaleString()} XOF`,
        label: t('sidebar.amount_paid') || 'Amount Paid',
      },
    ];
  }, [rides, t]);

  /**
   * Menu items configuration
   */
  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: t('tabs.home') || 'Home',
      icon: 'home',
      onPress: () => closeSidebar(),
    },
    {
      id: 'history',
      label: t('sidebar.history') || 'History',
      icon: 'history',
      onPress: () => navigateAndClose('/(main)/rides'),
    },
    {
      id: 'notifications',
      label: t('profile.notifications') || 'Notifications',
      icon: 'notifications',
      onPress: () => navigateAndClose('/(main)/notifications'),
    },
    // TODO: Re-enable when invite feature is implemented
    // {
    //   id: 'invite',
    //   label: t('sidebar.invite_friends') || 'Invite Friends',
    //   icon: 'share',
    //   onPress: () => navigateAndClose('/(main)/invite'),
    // },
    {
      id: 'settings',
      label: t('common.settings') || 'Settings',
      icon: 'settings',
      onPress: () => navigateAndClose('/(main)/settings'),
    },
  ];

  /**
   * Logout menu item (separate for bottom placement)
   */
  const logoutItem: MenuItem = {
    id: 'logout',
    label: t('common.logout') || 'Logout',
    icon: 'logout',
    onPress: handleLogout,
    isDestructive: true,
  };

  return (
    <SidebarMenu
      isOpen={isSidebarOpen}
      onClose={closeSidebar}
      testID={testID}
    >
      {/* Yellow Profile Header */}
      <SidebarProfileHeader
        name={userName}
        avatarUrl={profile?.profilePicture}
        stats={profileStats}
        onProfilePress={handleProfilePress}
        testID={testID ? `${testID}-header` : undefined}
      />

      {/* White Menu Section */}
      <View style={styles.menuSection}>
        <View style={styles.menuItemsContainer}>
          {menuItems.map((item) => (
            <SidebarMenuItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              onPress={item.onPress}
              isDestructive={item.isDestructive}
              testID={testID ? `${testID}-item-${item.id}` : undefined}
            />
          ))}
        </View>

        {/* Logout at bottom, separated */}
        <View style={styles.logoutContainer}>
          <SidebarMenuItem
            icon={logoutItem.icon}
            label={logoutItem.label}
            onPress={logoutItem.onPress}
            isDestructive={logoutItem.isDestructive}
            testID={testID ? `${testID}-logout` : undefined}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.sidebarFooter}>
        <Text style={styles.versionText}>
          GLIDEY v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </View>
    </SidebarMenu>
  );
});

const styles = StyleSheet.create({
  menuSection: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  menuItemsContainer: {
    flex: 1,
    paddingTop: spacing.md,
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: spacing.md,
  },
  sidebarFooter: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
  },
  versionText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});
