type SheetMode = 'idle' | 'search' | 'booking' | 'matching';
type RideState = 'idle' | 'searching' | 'matched' | 'pickup_en_route' | 'completed' | 'cancelled' | 'failed';

export interface UserPositionButtonLayoutInput {
  sheetMode: SheetMode;
  rideState: RideState;
  safeAreaBottom: number;
  baseBottomSpacing: number;
  sheetBottomSpacing?: number;
  sheetVisibleHeight: number;
}

export interface UserPositionButtonLayoutResult {
  bottomOffset: number;
  isVisible: boolean;
}

export function getUserPositionButtonLayout({
  sheetMode,
  rideState,
  safeAreaBottom,
  baseBottomSpacing,
  sheetBottomSpacing,
  sheetVisibleHeight,
}: UserPositionButtonLayoutInput): UserPositionButtonLayoutResult {
  const baseBottomOffset = safeAreaBottom + baseBottomSpacing;
  const sheetFabGap = sheetBottomSpacing ?? baseBottomSpacing;

  // Once a ride request is fired, the pickup is already fixed and the FAB should not be shown.
  if (rideState !== 'idle') {
    return {
      bottomOffset: baseBottomOffset,
      isVisible: false,
    };
  }

  if (sheetMode === 'search') {
    if (sheetVisibleHeight <= 0) {
      return {
        bottomOffset: baseBottomOffset,
        isVisible: true,
      };
    }

    return {
      bottomOffset: safeAreaBottom + sheetFabGap + Math.max(0, sheetVisibleHeight),
      isVisible: true,
    };
  }

  return {
    bottomOffset: baseBottomOffset,
    isVisible: true,
  };
}
