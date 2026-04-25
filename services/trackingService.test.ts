import { subscribeToTracking } from './trackingService';

const mockAuthedFetch = jest.fn();
const mockActivateKeepAwake = jest.fn();
const mockDeactivateKeepAwake = jest.fn();

jest.mock('@rentascooter/api', () => ({
  authedFetch: (...args: unknown[]) => mockAuthedFetch(...args),
  API_BASE_URL: 'https://api.example.com',
}));

jest.mock('expo-keep-awake', () => ({
  activateKeepAwake: (...args: unknown[]) => mockActivateKeepAwake(...args),
  deactivateKeepAwake: (...args: unknown[]) => mockDeactivateKeepAwake(...args),
}));

interface MockSocketInstance {
  onopen: (() => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onerror: (() => void) | null;
  onclose: (() => void) | null;
  close: jest.Mock<void, []>;
}

describe('subscribeToTracking', () => {
  const originalWebSocket = global.WebSocket;
  const originalDemoValue = process.env['EXPO_PUBLIC_USE_DEMO'];
  const sockets: MockSocketInstance[] = [];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    process.env['EXPO_PUBLIC_USE_DEMO'] = 'false';
    sockets.length = 0;

    class MockWebSocket {
      public onopen: (() => void) | null = null;
      public onmessage: ((event: { data: string }) => void) | null = null;
      public onerror: (() => void) | null = null;
      public onclose: (() => void) | null = null;
      public close = jest.fn<void, []>();

      constructor(_url: string) {
        sockets.push(this);
      }
    }

    global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    global.WebSocket = originalWebSocket;
    process.env['EXPO_PUBLIC_USE_DEMO'] = originalDemoValue;
  });

  it('ignores malformed websocket payloads and forwards valid updates', () => {
    const onUpdate = jest.fn();
    const cleanup = subscribeToTracking('ride-1', onUpdate);
    const ws = sockets[0];

    ws.onmessage?.({ data: JSON.stringify({ rideId: 'ride-1' }) });
    expect(onUpdate).not.toHaveBeenCalled();

    ws.onmessage?.({
      data: JSON.stringify({
        payload: {
          rideId: 'ride-1',
          driverLocation: { latitude: 14.6937, longitude: -17.4441 },
          etaSeconds: 120,
          timestamp: 1_717_341_000_000,
        },
      }),
    });

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith({
      rideId: 'ride-1',
      driverLocation: { latitude: 14.6937, longitude: -17.4441 },
      etaSeconds: 120,
      timestamp: 1_717_341_000_000,
    });

    cleanup();
    expect(mockActivateKeepAwake).toHaveBeenCalledWith('glidey-tracking');
    expect(mockDeactivateKeepAwake).toHaveBeenCalledWith('glidey-tracking');
  });

  it('ignores invalid polling payloads after websocket fallback', async () => {
    const onUpdate = jest.fn();
    mockAuthedFetch.mockResolvedValueOnce({ rideId: 'ride-1' });
    const cleanup = subscribeToTracking('ride-1', onUpdate);
    const ws = sockets[0];

    ws.onerror?.();
    await jest.advanceTimersByTimeAsync(5_000);

    expect(mockAuthedFetch).toHaveBeenCalledWith('GET', '/rides/ride-1/position');
    expect(onUpdate).not.toHaveBeenCalled();

    cleanup();
  });

  it('accepts tracking updates nested under data envelope', () => {
    const onUpdate = jest.fn();
    const cleanup = subscribeToTracking('ride-1', onUpdate);
    const ws = sockets[0];

    ws.onmessage?.({
      data: JSON.stringify({
        data: {
          rideId: 'ride-1',
          driverLocation: { latitude: 14.697, longitude: -17.441 },
          etaSeconds: 75,
          timestamp: 1_717_341_050_000,
        },
      }),
    });

    expect(onUpdate).toHaveBeenCalledWith({
      rideId: 'ride-1',
      driverLocation: { latitude: 14.697, longitude: -17.441 },
      etaSeconds: 75,
      timestamp: 1_717_341_050_000,
    });

    cleanup();
  });
});
