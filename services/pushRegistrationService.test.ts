const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockGetExpoPushTokenAsync = jest.fn();
const mockSavePushToken = jest.fn();
let mockPlatformOs: 'ios' | 'android' | 'web' = 'ios';
let mockProjectId: string | undefined = 'project-123';

jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatformOs;
    },
  },
}));

jest.mock('expo-constants', () => ({
  get easConfig() {
    return mockProjectId ? { projectId: mockProjectId } : undefined;
  },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  getExpoPushTokenAsync: (...args: unknown[]) => mockGetExpoPushTokenAsync(...args),
}));

jest.mock('./notificationsService', () => ({
  savePushToken: (...args: unknown[]) => mockSavePushToken(...args),
}));

import { registerPushToken } from './pushRegistrationService';

describe('registerPushToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformOs = 'ios';
    mockProjectId = 'project-123';
  });

  it('registers token on granted permission', async () => {
    mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    mockGetExpoPushTokenAsync.mockResolvedValueOnce({ data: 'ExponentPushToken[abc]' });

    await registerPushToken();

    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-123' });
    expect(mockSavePushToken).toHaveBeenCalledWith('ExponentPushToken[abc]', 'ios');
  });

  it('requests permission when initially denied', async () => {
    mockPlatformOs = 'android';
    mockProjectId = undefined;

    mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    mockRequestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    mockGetExpoPushTokenAsync.mockResolvedValueOnce({ data: 'ExponentPushToken[xyz]' });

    await registerPushToken();

    expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockSavePushToken).toHaveBeenCalledWith('ExponentPushToken[xyz]', 'android');
  });

  it('stops when permission remains denied', async () => {
    mockProjectId = undefined;

    mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    mockRequestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    await registerPushToken();

    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(mockSavePushToken).not.toHaveBeenCalled();
  });
});
