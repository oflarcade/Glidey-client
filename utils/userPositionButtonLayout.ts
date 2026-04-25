const SEARCH_SHEET_EXPANDED_HEIGHT = 580 as const;

type SheetMode = 'idle' | 'search' | 'booking' | 'matching';
type RideState = 'idle' | 'searching' | 'matched' | 'pickup_en_route' | 'completed' | 'cancelled' | 'failed';

export interface UserPositionButtonLayoutInput {
  sheetMode: SheetMode;
  rideState: RideState;
  safeAreaBottom: number;
  baseBottomSpacing: number;
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
}: UserPositionButtonLayoutInput): UserPositionButtonLayoutResult {
  const baseBottomOffset = safeAreaBottom + baseBottomSpacing;

  // Once a ride request is fired, the pickup is already fixed and the FAB should not be shown.
  if (rideState !== 'idle') {
    return {
      bottomOffset: baseBottomOffset,
      isVisible: false,
    };
  }

  if (sheetMode === 'search') {
    return {
      bottomOffset: SEARCH_SHEET_EXPANDED_HEIGHT + baseBottomOffset,
      isVisible: true,
    };
  }

  return {
    bottomOffset: baseBottomOffset,
    isVisible: true,
  };
}
