import { create } from 'zustand';
import type { RideState, MatchedDriver, Location } from '../types';

// Valid next states for each current state. Transition to 'idle' is always allowed (reset).
const VALID_TRANSITIONS: Partial<Record<RideState, RideState[]>> = {
  idle: ['searching'],
  searching: ['matched', 'cancelled', 'failed'],
  matched: ['pickup_en_route', 'cancelled'],
  pickup_en_route: ['completed', 'cancelled'],
};

// Journey data captured at booking time — persists until ride store reset so the receipt
// screen can render populated data even when backend history hasn't synced (demo mode).
export interface JourneyData {
  pickup: Location | null;
  destination: Location | null;
  fareTotal: number | null;
  distanceM: number | null;
  discountXof?: number | null;
}

interface RideStoreState {
  rideState: RideState;
  rideId: string | null;
  matchedDriver: MatchedDriver | null;
  journey: JourneyData | null;
}

interface TransitionPayload {
  rideId?: string;
  driver?: MatchedDriver;
}

interface RideStoreActions {
  transition: (next: RideState, payload?: TransitionPayload) => void;
  reset: () => void;
  setJourney: (data: JourneyData) => void;
}

type RideStore = RideStoreState & RideStoreActions;

const INITIAL: RideStoreState = {
  rideState: 'idle',
  rideId: null,
  matchedDriver: null,
  journey: null,
};

export const useRideStore = create<RideStore>()((set, get) => ({
  ...INITIAL,

  transition(next, payload = {}) {
    const current = get().rideState;

    if (next === 'idle') {
      set({ ...INITIAL });
      return;
    }

    const allowed = VALID_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      console.warn(`[useRideStore] invalid transition ${current} → ${next} (ignored)`);
      return;
    }

    set((s) => ({
      rideState: next,
      rideId: payload.rideId ?? s.rideId,
      matchedDriver: payload.driver !== undefined ? payload.driver : s.matchedDriver,
    }));
  },

  reset() {
    set({ ...INITIAL });
  },

  setJourney(data) {
    set({ journey: data });
  },
}));

export const selectRideState = (s: RideStore) => s.rideState;
export const selectRideId = (s: RideStore) => s.rideId;
export const selectMatchedDriver = (s: RideStore) => s.matchedDriver;
