import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { SidebarContent } from '@/components/Sidebar';
import { UserProvider, useAuthStore } from '@rentascooter/auth';
import { ensureClientProfile } from '@/services/userService';
import { useTranslation } from '@rentascooter/i18n';

export default function MainLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bootstrapped = useRef(false);

  // EXPO_PUBLIC_USE_DEMO is build-time constant — no need in deps
  const isDemoMode = process.env.EXPO_PUBLIC_USE_DEMO === 'true';

  useEffect(() => {
    // Demo mode: booking fixtures handle everything; no real profile needed
    if (isDemoMode || !isAuthenticated || !user || bootstrapped.current) return;

    // Priority: stored profile phone → Firebase phoneNumber → EXPO_PUBLIC_TEST_PHONE (NL/DE test override)
    const envPhone = process.env.EXPO_PUBLIC_TEST_PHONE;
    const phone =
      profile?.phone && profile.phone.startsWith('+') && profile.phone.length >= 10
        ? profile.phone
        : user.phoneNumber?.startsWith('+')
          ? user.phoneNumber
          : envPhone && envPhone.startsWith('+') && envPhone.length >= 10
            ? envPhone
            : null;

    if (!phone) return;

    const name = profile
      ? `${profile.firstName} ${profile.lastName}`.trim() || user.displayName || user.email || t('common.user')
      : user.displayName || user.email || t('common.user');

    bootstrapped.current = true;
    ensureClientProfile({
      phone,
      name,
      email: user.email ?? profile?.email ?? undefined,
    }).catch(() => {
      bootstrapped.current = false;
    });
  }, [isAuthenticated, user, profile]);

  return (
    <UserProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="rides"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="profile"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="notifications"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="settings"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="booking"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="pickup"
          options={{ presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="tracking"
          options={{ presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="trip-receipt/[rideId]"
          options={{ headerShown: false }}
        />
      </Stack>

      {/* Sidebar rendered at layout level for cross-screen access */}
      <SidebarContent testID="client-sidebar-menu" />
    </UserProvider>
  );
}
