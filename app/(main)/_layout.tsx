import { Stack } from 'expo-router';
import { SidebarContent } from '@/components/Sidebar';
import { UserProvider } from '@rentascooter/auth';

/**
 * Main Layout for Client App
 *
 * Uses Stack navigation with full-screen map as the main screen.
 * Rides, profile, notifications, and settings screens are presented as modals.
 *
 * The sidebar is rendered at the layout level for cross-screen access,
 * controlled via useUIStore().
 *
 * UserProvider wraps the layout to provide user/profile data to all screens.
 */
export default function MainLayout() {
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
      </Stack>

      {/* Sidebar rendered at layout level for cross-screen access */}
      <SidebarContent testID="client-sidebar-menu" />
    </UserProvider>
  );
}
