import { create } from 'zustand';

export type SheetMode = 'idle' | 'search' | 'booking' | 'matching';

interface UIState {
  isSidebarOpen: boolean;
  sheetMode: SheetMode;
}

interface UIActions {
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setSheetMode: (mode: SheetMode) => void;
  resetUI: () => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  isSidebarOpen: false,
  sheetMode: 'idle',
};

export const useUIStore = create<UIStore>()((set) => ({
  ...initialState,

  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSheetMode: (mode) => set({ sheetMode: mode }),

  resetUI: () => set(initialState),
}));

export const selectIsSidebarOpen = (state: UIStore) => state.isSidebarOpen;
export const selectSheetMode = (state: UIStore) => state.sheetMode;
