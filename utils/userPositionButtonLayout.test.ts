import { getUserPositionButtonLayout } from './userPositionButtonLayout';

describe('getUserPositionButtonLayout', () => {
  const baseInput = {
    safeAreaBottom: 20,
    baseBottomSpacing: 24,
  } as const;

  it('keeps button visible above expanded search sheet in idle state', () => {
    const result = getUserPositionButtonLayout({
      ...baseInput,
      sheetMode: 'search',
      rideState: 'idle',
    });

    expect(result).toEqual({
      bottomOffset: 624,
      isVisible: true,
    });
  });

  it('keeps button visible at base offset outside search mode', () => {
    const result = getUserPositionButtonLayout({
      ...baseInput,
      sheetMode: 'booking',
      rideState: 'idle',
    });

    expect(result).toEqual({
      bottomOffset: 44,
      isVisible: true,
    });
  });

  it('hides button once ride request flow starts', () => {
    const searchingResult = getUserPositionButtonLayout({
      ...baseInput,
      sheetMode: 'search',
      rideState: 'searching',
    });

    const matchedResult = getUserPositionButtonLayout({
      ...baseInput,
      sheetMode: 'matching',
      rideState: 'matched',
    });

    expect(searchingResult.isVisible).toBe(false);
    expect(matchedResult.isVisible).toBe(false);
  });
});
