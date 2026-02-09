import { create } from 'zustand';

/**
 * UI State Store
 *
 * Consolidated UI state management for cross-screen access.
 * Manages sidebar, location modal, and bottom sheet visibility.
 *
 * Note: No persistence - UI state should reset on app restart.
 */

/**
 * Active bottom sheet types
 */
export type BottomSheetType = 'none' | 'booking' | 'rideDetails' | 'scooterSelection';

interface UIState {
  // Sidebar state
  isSidebarOpen: boolean;

  // Location modal state
  isLocationModalOpen: boolean;

  // Bottom sheet state
  activeBottomSheet: BottomSheetType;
}

interface UIActions {
  // Sidebar actions
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  // Location modal actions
  openLocationModal: () => void;
  closeLocationModal: () => void;

  // Bottom sheet actions
  setActiveBottomSheet: (sheet: BottomSheetType) => void;

  // Reset all UI state
  resetUI: () => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  isSidebarOpen: false,
  isLocationModalOpen: true, // Open by default for immediate access
  activeBottomSheet: 'none',
};

export const useUIStore = create<UIStore>()((set) => ({
  ...initialState,

  // Sidebar actions
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  // Location modal actions
  openLocationModal: () => set({ isLocationModalOpen: true }),
  closeLocationModal: () => set({ isLocationModalOpen: false }),

  // Bottom sheet actions
  setActiveBottomSheet: (sheet) => set({ activeBottomSheet: sheet }),

  // Reset all UI state
  resetUI: () => set(initialState),
}));

// Selectors for performance optimization
export const selectIsSidebarOpen = (state: UIStore) => state.isSidebarOpen;
export const selectIsLocationModalOpen = (state: UIStore) => state.isLocationModalOpen;
export const selectActiveBottomSheet = (state: UIStore) => state.activeBottomSheet;
