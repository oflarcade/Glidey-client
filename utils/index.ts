/**
 * Client App Utilities
 *
 * Barrel export for utility functions
 */

export {
  animateToDestination,
  animateToLocation,
  resetCameraToUser,
  calculateDistance,
  ANIMATION_CONFIG,
} from './mapAnimations';

export {
  AnimationMonitor,
  PerformanceTimer,
  measurePerformance,
  monitorCameraAnimation,
  monitorPinAnimation,
} from './performanceMonitor';

export type { AnimationMetrics } from './performanceMonitor';
