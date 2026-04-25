import { listNotifications, markNotificationRead, savePushToken } from './notificationsService';

const mockAuthedFetch = jest.fn();

jest.mock('@rentascooter/api', () => ({
  authedFetch: (...args: unknown[]) => mockAuthedFetch(...args),
}));

describe('notificationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listNotifications', () => {
    it('requests notifications with defaults and maps response shape', async () => {
      mockAuthedFetch.mockResolvedValueOnce({
        notifications: [
          {
            id: 'notif-1',
            title: 'Ride update',
            body: 'Your ride is on the way',
            data: { type: 'success' },
            isRead: false,
            readAt: null,
            createdAt: '2026-04-20T10:00:00.000Z',
          },
        ],
      });

      const result = await listNotifications();

      expect(mockAuthedFetch).toHaveBeenCalledWith('GET', '/notifications?limit=20&offset=0&unreadOnly=false');
      expect(result).toEqual([
        {
          id: 'notif-1',
          type: 'success',
          title: 'Ride update',
          message: 'Your ride is on the way',
          timestamp: '2026-04-20T10:00:00.000Z',
          isRead: false,
        },
      ]);
    });

    it('clamps invalid limit and offset values', async () => {
      mockAuthedFetch.mockResolvedValueOnce({ notifications: [] });

      await listNotifications({ limit: 1000, offset: -5, unreadOnly: true });

      expect(mockAuthedFetch).toHaveBeenCalledWith('GET', '/notifications?limit=100&offset=0&unreadOnly=true');
    });

    it('falls back to defaults for non-finite numbers', async () => {
      mockAuthedFetch.mockResolvedValueOnce({ notifications: [] });

      await listNotifications({ limit: Number.NaN, offset: Number.POSITIVE_INFINITY });

      expect(mockAuthedFetch).toHaveBeenCalledWith('GET', '/notifications?limit=20&offset=0&unreadOnly=false');
    });
  });

  describe('markNotificationRead', () => {
    it('marks notification as read and maps payload', async () => {
      mockAuthedFetch.mockResolvedValueOnce({
        notification: {
          id: 'notif-2',
          title: 'System',
          body: 'Maintenance tonight',
          data: null,
          isRead: true,
          readAt: '2026-04-20T10:05:00.000Z',
          createdAt: '2026-04-20T10:00:00.000Z',
        },
      });

      const result = await markNotificationRead('notif-2');

      expect(mockAuthedFetch).toHaveBeenCalledWith('PATCH', '/notifications/notif-2/read');
      expect(result).toEqual({
        id: 'notif-2',
        type: 'info',
        title: 'System',
        message: 'Maintenance tonight',
        timestamp: '2026-04-20T10:00:00.000Z',
        isRead: true,
      });
    });
  });

  describe('savePushToken', () => {
    it('sends device push token payload', async () => {
      mockAuthedFetch.mockResolvedValueOnce(undefined);

      await savePushToken('ExponentPushToken[test]', 'android');

      expect(mockAuthedFetch).toHaveBeenCalledWith('POST', '/notifications/token', {
        token: 'ExponentPushToken[test]',
        platform: 'android',
      });
    });
  });
});
