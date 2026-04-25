import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { savePushToken, type NotificationPlatform } from './notificationsService';

const NOTIFICATION_STATUS_GRANTED = 'granted' as const;
const EAS_PROJECT_ID_KEY = 'projectId' as const;

function resolvePlatform(): NotificationPlatform | null {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return null;
}

function resolveProjectId(): string | undefined {
  const easConfig = Constants.easConfig;
  if (easConfig && typeof easConfig[EAS_PROJECT_ID_KEY] === 'string') {
    return easConfig[EAS_PROJECT_ID_KEY];
  }
  return undefined;
}

export async function registerPushToken(): Promise<void> {
  const platform = resolvePlatform();
  if (!platform) return;

  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== NOTIFICATION_STATUS_GRANTED) {
    const requestResult = await Notifications.requestPermissionsAsync();
    if (requestResult.status !== NOTIFICATION_STATUS_GRANTED) return;
  }

  const projectId = resolveProjectId();
  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  if (!tokenResult.data) return;
  await savePushToken(tokenResult.data, platform);
}
