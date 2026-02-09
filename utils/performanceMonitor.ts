/**
 * Performance Monitoring Utilities
 * Client App - Animation Performance Tracking
 *
 * Utilities for monitoring animation performance during development.
 * Helps identify frame drops, slow animations, and performance bottlenecks.
 *
 * Usage:
 * ```typescript
 * const monitor = new AnimationMonitor('camera-animation');
 * monitor.start();
 * await animateToDestination(...);
 * monitor.end();
 * monitor.report();
 * ```
 */

/**
 * Performance metrics for an animation
 */
export interface AnimationMetrics {
  /** Animation name/identifier */
  name: string;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
  /** Duration in milliseconds */
  duration: number;
  /** Average frame time in milliseconds */
  avgFrameTime: number;
  /** Dropped frames count */
  droppedFrames: number;
  /** Target frame rate (default: 60fps) */
  targetFps: number;
}

/**
 * Animation performance monitor
 *
 * Tracks animation performance metrics during development.
 * Only active in __DEV__ mode to avoid production overhead.
 */
export class AnimationMonitor {
  private name: string;
  private startTime: number = 0;
  private endTime: number = 0;
  private frameCount: number = 0;
  private frameStartTime: number = 0;
  private frameTimes: number[] = [];
  private rafId: number | null = null;
  private targetFps: number = 60;
  private targetFrameTime: number = 1000 / 60; // ~16.67ms

  constructor(name: string, targetFps: number = 60) {
    this.name = name;
    this.targetFps = targetFps;
    this.targetFrameTime = 1000 / targetFps;
  }

  /**
   * Start monitoring animation performance
   */
  start(): void {
    if (!__DEV__) return;

    this.startTime = performance.now();
    this.frameCount = 0;
    this.frameTimes = [];
    this.frameStartTime = this.startTime;

    // Start frame monitoring loop
    this.monitorFrame();
  }

  /**
   * Monitor individual frame performance
   */
  private monitorFrame = (): void => {
    if (!__DEV__) return;

    const now = performance.now();
    const frameTime = now - this.frameStartTime;

    this.frameTimes.push(frameTime);
    this.frameCount++;
    this.frameStartTime = now;

    // Continue monitoring
    this.rafId = requestAnimationFrame(this.monitorFrame);
  };

  /**
   * Stop monitoring animation performance
   */
  end(): void {
    if (!__DEV__) return;

    this.endTime = performance.now();

    // Stop frame monitoring
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Calculate performance metrics
   */
  getMetrics(): AnimationMetrics {
    const duration = this.endTime - this.startTime;
    const avgFrameTime =
      this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
    const droppedFrames = this.frameTimes.filter(
      (time) => time > this.targetFrameTime
    ).length;

    return {
      name: this.name,
      startTime: this.startTime,
      endTime: this.endTime,
      duration,
      avgFrameTime,
      droppedFrames,
      targetFps: this.targetFps,
    };
  }

  /**
   * Log performance report to console
   */
  report(): void {
    if (!__DEV__) return;

    const metrics = this.getMetrics();
    const actualFps = 1000 / metrics.avgFrameTime;
    const dropRate = (metrics.droppedFrames / this.frameCount) * 100;

    console.group(`🎬 Animation Performance: ${metrics.name}`);
    console.log(`Duration: ${metrics.duration.toFixed(2)}ms`);
    console.log(`Frames: ${this.frameCount}`);
    console.log(`Avg Frame Time: ${metrics.avgFrameTime.toFixed(2)}ms`);
    console.log(`Actual FPS: ${actualFps.toFixed(1)}`);
    console.log(`Dropped Frames: ${metrics.droppedFrames} (${dropRate.toFixed(1)}%)`);

    if (dropRate > 5) {
      console.warn('⚠️ High frame drop rate detected!');
    } else if (dropRate > 1) {
      console.warn('⚡ Some frames dropped, consider optimization');
    } else {
      console.log('✅ Smooth animation, no issues detected');
    }

    console.groupEnd();
  }

  /**
   * Get detailed frame time distribution
   */
  getFrameTimeDistribution(): {
    min: number;
    max: number;
    median: number;
    p95: number;
    p99: number;
  } {
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      min: sorted[0],
      max: sorted[len - 1],
      median: sorted[Math.floor(len / 2)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
    };
  }
}

/**
 * Simple performance timer for async operations
 *
 * @example
 * ```typescript
 * const timer = new PerformanceTimer('api-call');
 * await fetchData();
 * timer.log();
 * ```
 */
export class PerformanceTimer {
  private name: string;
  private startTime: number;

  constructor(name: string) {
    this.name = name;
    this.startTime = performance.now();
  }

  /**
   * Get elapsed time in milliseconds
   */
  elapsed(): number {
    return performance.now() - this.startTime;
  }

  /**
   * Log elapsed time to console
   */
  log(message?: string): void {
    if (!__DEV__) return;

    const elapsed = this.elapsed();
    console.log(
      `⏱️ ${this.name}: ${elapsed.toFixed(2)}ms${message ? ` - ${message}` : ''}`
    );
  }

  /**
   * Reset timer
   */
  reset(): void {
    this.startTime = performance.now();
  }
}

/**
 * Measure and log execution time of a function
 *
 * @example
 * ```typescript
 * await measurePerformance('camera-animation', async () => {
 *   await animateToDestination(...);
 * });
 * ```
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!__DEV__) {
    return fn();
  }

  const timer = new PerformanceTimer(name);
  try {
    const result = await fn();
    timer.log('completed');
    return result;
  } catch (error) {
    timer.log('failed');
    throw error;
  }
}

/**
 * Monitor camera animation performance
 *
 * Convenience wrapper for monitoring map camera animations.
 *
 * @example
 * ```typescript
 * const monitor = monitorCameraAnimation('destination-select');
 * await animateToDestination(...);
 * monitor.end();
 * monitor.report();
 * ```
 */
export function monitorCameraAnimation(name: string): AnimationMonitor {
  const monitor = new AnimationMonitor(`camera-${name}`, 60);
  monitor.start();
  return monitor;
}

/**
 * Monitor pin animation performance
 *
 * Convenience wrapper for monitoring pin drop animations.
 *
 * @example
 * ```typescript
 * const monitor = monitorPinAnimation('destination-pin');
 * // Pin animation happens automatically
 * setTimeout(() => {
 *   monitor.end();
 *   monitor.report();
 * }, 1000);
 * ```
 */
export function monitorPinAnimation(name: string): AnimationMonitor {
  const monitor = new AnimationMonitor(`pin-${name}`, 60);
  monitor.start();
  return monitor;
}
