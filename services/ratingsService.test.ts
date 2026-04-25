import { submitRating } from './ratingsService';

const mockAuthedFetch = jest.fn();
const mockIsApiError = jest.fn();

jest.mock('@rentascooter/api', () => ({
  authedFetch: (...args: unknown[]) => mockAuthedFetch(...args),
  isApiError: (...args: unknown[]) => mockIsApiError(...args),
  DEMO_MODE_ERROR: {
    code: 'DEMO_MODE',
    message: 'Demo mode active',
  },
}));

describe('submitRating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits rating payload to ride rating endpoint', async () => {
    mockAuthedFetch.mockResolvedValueOnce(undefined);

    await submitRating({
      rideId: 'ride-123',
      rating: 5,
      comment: 'Great ride',
    });

    expect(mockAuthedFetch).toHaveBeenCalledTimes(1);
    expect(mockAuthedFetch).toHaveBeenCalledWith('POST', '/rides/ride-123/rating', {
      rating: 5,
      comment: 'Great ride',
    });
  });

  it('omits empty comments from payload', async () => {
    mockAuthedFetch.mockResolvedValueOnce(undefined);

    await submitRating({
      rideId: 'ride-123',
      rating: 4,
    });

    expect(mockAuthedFetch).toHaveBeenCalledWith('POST', '/rides/ride-123/rating', {
      rating: 4,
    });
  });

  it('swallows demo mode errors to keep UX non-blocking', async () => {
    const demoError = { code: 'DEMO_MODE' };
    mockAuthedFetch.mockRejectedValueOnce(demoError);
    mockIsApiError.mockReturnValueOnce(true);

    await expect(
      submitRating({
        rideId: 'ride-123',
        rating: 5,
      }),
    ).resolves.toBeUndefined();
  });

  it('rethrows non-demo errors', async () => {
    const networkError = new Error('Network down');
    mockAuthedFetch.mockRejectedValueOnce(networkError);
    mockIsApiError.mockReturnValueOnce(false);

    await expect(
      submitRating({
        rideId: 'ride-123',
        rating: 5,
      }),
    ).rejects.toThrow('Network down');
  });
});
