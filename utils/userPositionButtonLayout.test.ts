import { getUserPositionButtonLayout } from './userPositionButtonLayout';

describe('getUserPositionButtonLayout', () => {
  const baseInput = {
    safeAreaBottom: 20,
    baseBottomSpacing: 24,
    sheetBottomSpacing: 8,
    sheetVisibleHeight: 460,
  } as const;

  it('positions button above current sheet height in search mode', () => {
    const result = getUserPositionButtonLayout({
      ...baseInput,
      sheetMode: 'search',
      rideState: 'idle',
    });

    expect(result).toEqual({
      bottomOffset: 488,
      isVisible: true,
    });
  });

  it('uses base offset when sheet is dismissed', () => {
    const result = getUserPositionButtonLayout({
      ...baseInput,
      sheetMode: 'search',
      rideState: 'idle',
      sheetVisibleHeight: 0,
    });

    expect(result).toEqual({
      bottomOffset: 44,
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
