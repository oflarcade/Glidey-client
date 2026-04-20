import { useState, useEffect, useRef } from 'react';
import { useRideStore } from '@rentascooter/shared';
import { subscribeToMatching } from '@/services/matchingService';
import type { MatchedDriver } from '@rentascooter/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseMatchingResult {
  activeAttemptIndex: 0 | 1 | 2;
  completedAttempts: number;
  inFallback: boolean;
  matchedDriver: MatchedDriver | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ATTEMPT_MS = 30_000;
const MAX_ATTEMPTS = 3;

// ─── useMatching ──────────────────────────────────────────────────────────────

export function useMatching(rideId: string | null): UseMatchingResult {
  const transition = useRideStore((s) => s.transition);

  const [activeAttemptIndex, setActiveAttemptIndex] = useState<0 | 1 | 2>(0);
  const [completedAttempts, setCompletedAttempts] = useState(0);
  const [inFallback, setInFallback] = useState(false);
  const [matchedDriver, setMatchedDriver] = useState<MatchedDriver | null>(null);

  const resolvedRef = useRef(false);

  useEffect(() => {
    if (!rideId) return;

    resolvedRef.current = false;
    setActiveAttemptIndex(0);
    setCompletedAttempts(0);
    setInFallback(false);
    setMatchedDriver(null);

    // Advance attempt index every 30s; set fallback after 90s with no match
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      const attempt = i;
      timers.push(
        setTimeout(() => {
          if (!resolvedRef.current) {
            setCompletedAttempts(attempt);
            setActiveAttemptIndex(Math.min(attempt, 2) as 0 | 1 | 2);
          }
        }, ATTEMPT_MS * attempt),
      );
    }
    timers.push(
      setTimeout(() => {
        if (!resolvedRef.current) {
          setCompletedAttempts(MAX_ATTEMPTS);
          setInFallback(true);
        }
      }, ATTEMPT_MS * MAX_ATTEMPTS),
    );

    const cleanup = subscribeToMatching(rideId, (event) => {
      if (event.state === 'matched' && event.driver) {
        resolvedRef.current = true;
        setMatchedDriver(event.driver);
        transition('matched', { driver: event.driver });
      } else if (event.state === 'cancelled' || event.state === 'failed') {
        resolvedRef.current = true;
        transition(event.state);
      }
    });

    return () => {
      cleanup();
      timers.forEach(clearTimeout);
    };
  }, [rideId, transition]);

  return { activeAttemptIndex, completedAttempts, inFallback, matchedDriver };
}
