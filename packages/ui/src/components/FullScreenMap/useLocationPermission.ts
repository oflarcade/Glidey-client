import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import type { LocationPermissionStatus } from './types';

interface UseLocationPermissionResult {
  /** Current permission status */
  status: LocationPermissionStatus;
  /** Whether permission is granted */
  isGranted: boolean;
  /** Whether permission check is in progress */
  isLoading: boolean;
  /** Request foreground location permission */
  requestPermission: () => Promise<boolean>;
  /** Error message if permission request failed */
  error: string | null;
}

/**
 * Hook to manage location permissions
 * Handles permission requests and status tracking for expo-location
 */
export function useLocationPermission(): UseLocationPermissionResult {
  const [status, setStatus] = useState<LocationPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check current permission status on mount
  useEffect(() => {
    let mounted = true;

    const checkPermission = async () => {
      try {
        const { status: currentStatus } =
          await Location.getForegroundPermissionsAsync();

        if (!mounted) return;

        switch (currentStatus) {
          case Location.PermissionStatus.GRANTED:
            setStatus('granted');
            break;
          case Location.PermissionStatus.DENIED:
            setStatus('denied');
            break;
          case Location.PermissionStatus.UNDETERMINED:
            setStatus('undetermined');
            break;
          default:
            setStatus('restricted');
        }
      } catch (err) {
        if (!mounted) return;
        setError('Failed to check location permission');
        setStatus('undetermined');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkPermission();

    return () => {
      mounted = false;
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { status: newStatus } =
        await Location.requestForegroundPermissionsAsync();

      switch (newStatus) {
        case Location.PermissionStatus.GRANTED:
          setStatus('granted');
          return true;
        case Location.PermissionStatus.DENIED:
          setStatus('denied');
          setError('Location permission denied');
          return false;
        default:
          setStatus('restricted');
          setError('Location permission restricted');
          return false;
      }
    } catch (err) {
      setError('Failed to request location permission');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    status,
    isGranted: status === 'granted',
    isLoading,
    requestPermission,
    error,
  };
}
